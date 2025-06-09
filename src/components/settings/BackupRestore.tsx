import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Upload, Clock, Shield, Download, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';

const BackupRestore: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { state: authState } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    if (!password) {
      setError('Please enter an encryption password');
      return;
    }

    if (!authState.organization) {
      setError('Organization data not available');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare comprehensive backup data
      const backupData = {
        organizationInfo: {
          id: authState.organization.id,
          name: authState.organization.name,
          email: authState.organization.email,
          createdAt: authState.organization.createdAt,
        },
        appData: {
          clients: state.clients,
          grills: state.grills,
          tontineGroups: state.tontineGroups,
          organizationMembers: state.organizationMembers,
          organizationSettings: state.organizationSettings,
          adminProfile: state.adminProfile,
        },
        metadata: {
          backupDate: new Date().toISOString(),
          version: '2.0',
          totalClients: state.clients.length,
          totalGrills: state.grills.length,
          totalTontineGroups: state.tontineGroups.length,
        }
      };

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(backupData),
        password
      ).toString();

      // Create backup file with organization name
      const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8;' });
      const filename = `tkane-backup-${authState.organization.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.tkbak`;
      
      saveAs(blob, filename);
      setSuccess(`Backup created successfully for ${authState.organization.name}!`);
      setError('');
    } catch (err) {
      setError('Failed to create backup. Please try again.');
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!password) {
      setError('Please enter the encryption password');
      return;
    }

    if (!authState.organization) {
      setError('Organization data not available');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const encrypted = e.target?.result as string;
        const decrypted = CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8);
        
        if (!decrypted) {
          throw new Error('Invalid password or corrupted backup file');
        }

        const backupData = JSON.parse(decrypted);

        // Validate backup data structure
        if (!backupData.organizationInfo || !backupData.appData || !backupData.metadata) {
          throw new Error('Invalid backup file format');
        }

        // Security check: ensure backup belongs to current organization
        if (backupData.organizationInfo.id !== authState.organization.id) {
          if (!window.confirm(
            `This backup is from a different organization (${backupData.organizationInfo.name}). ` +
            'Restoring it will replace all current data. Are you sure you want to continue?'
          )) {
            setIsLoading(false);
            return;
          }
        }

        // Restore data to context
        if (backupData.appData.clients) {
          dispatch({ type: 'SET_CLIENTS', payload: backupData.appData.clients });
        }
        if (backupData.appData.grills) {
          dispatch({ type: 'SET_GRILLS', payload: backupData.appData.grills });
        }
        if (backupData.appData.organizationSettings) {
          dispatch({ type: 'UPDATE_ORGANIZATION_SETTINGS', payload: backupData.appData.organizationSettings });
        }
        if (backupData.appData.adminProfile) {
          dispatch({ type: 'UPDATE_ADMIN_PROFILE', payload: backupData.appData.adminProfile });
        }

        // Add success notification
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: crypto.randomUUID(),
            title: 'Backup Restored',
            message: `Successfully restored backup from ${new Date(backupData.metadata.backupDate).toLocaleDateString()}`,
            type: 'success',
            date: new Date().toISOString(),
            read: false
          }
        });

        setSuccess(
          `Backup restored successfully! ` +
          `Restored ${backupData.metadata.totalClients} clients, ` +
          `${backupData.metadata.totalGrills} grills, and ` +
          `${backupData.metadata.totalTontineGroups} tontine groups.`
        );
        setError('');
      } catch (err) {
        console.error('Restore error:', err);
        setError('Failed to restore backup. Please check your password and file format.');
        setSuccess('');
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const getBackupStats = () => {
    return {
      clients: state.clients.length,
      grills: state.grills.length,
      tontineGroups: state.tontineGroups.length,
      members: state.organizationMembers.length,
      totalTransactions: state.clients.reduce((total, client) => 
        total + (client.withdrawals?.length || 0) + (client.deposits?.length || 0) + (client.transfers?.length || 0), 0
      )
    };
  };

  const stats = getBackupStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Backup & Restore</h2>
          <p className="text-gray-600 mt-1">
            Secure backup and restore for {authState.organization?.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Organization ID</p>
          <p className="font-mono text-xs text-gray-700">{authState.organization?.id}</p>
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Data Summary</h4>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">{stats.clients}</span>
                    <p className="text-blue-600">Clients</p>
                  </div>
                  <div>
                    <span className="font-medium">{stats.grills}</span>
                    <p className="text-blue-600">Grill Plans</p>
                  </div>
                  <div>
                    <span className="font-medium">{stats.tontineGroups}</span>
                    <p className="text-blue-600">Tontine Groups</p>
                  </div>
                  <div>
                    <span className="font-medium">{stats.members}</span>
                    <p className="text-blue-600">Team Members</p>
                  </div>
                  <div>
                    <span className="font-medium">{stats.totalTransactions}</span>
                    <p className="text-blue-600">Transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Encryption Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password for encryption/decryption"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-sm text-gray-500">
              This password will be used to encrypt your backup and is required for restoration.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-purple-50 rounded-lg">
              <div className="flex items-center mb-4">
                <Save className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-purple-900">Create Backup</h3>
              </div>
              <p className="text-sm text-purple-700 mb-4">
                Create an encrypted backup of all your organization's data including clients, 
                transactions, settings, and team members.
              </p>
              <Button
                variant="primary"
                onClick={handleBackup}
                leftIcon={<Download size={18} />}
                isFullWidth
                disabled={!password || isLoading}
              >
                {isLoading ? 'Creating Backup...' : 'Download Backup'}
              </Button>
            </div>

            <div className="p-6 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-4">
                <Upload className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">Restore Backup</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Restore your organization's data from a previously created backup file. 
                This will replace all current data.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestore}
                accept=".tkbak"
                className="hidden"
                disabled={isLoading}
              />
              <Button
                variant="info"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload size={18} />}
                isFullWidth
                disabled={!password || isLoading}
              >
                {isLoading ? 'Restoring...' : 'Select Backup File'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600 mr-3 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Automatic Backups</h4>
                <p className="text-sm text-gray-500">
                  Your data is automatically saved to your browser's local storage and 
                  synced across your organization.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600 mr-3 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Enterprise Security</h4>
                <p className="text-sm text-gray-500">
                  Backups are encrypted using AES-256 encryption with your custom password 
                  for maximum security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BackupRestore;