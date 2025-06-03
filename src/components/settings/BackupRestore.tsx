import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Save, Upload, Clock, Shield, Download } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';

const BackupRestore: React.FC = () => {
  const { state } = useAppContext();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    try {
      if (!password) {
        setError('Please enter an encryption password');
        return;
      }

      // Prepare data for backup
      const backupData = {
        clients: state.clients,
        grills: state.grills,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(backupData),
        password
      ).toString();

      // Create backup file
      const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
      const filename = `tkane-backup-${new Date().toISOString().slice(0, 10)}.bwatbackup`;
      
      saveAs(blob, filename);
      setSuccess('Backup created successfully!');
      setError('');
    } catch (err) {
      setError('Failed to create backup. Please try again.');
      setSuccess('');
    }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!password) {
      setError('Please enter the encryption password');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const encrypted = e.target?.result as string;
        const decrypted = CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8);
        const backupData = JSON.parse(decrypted);

        // Validate backup data
        if (!backupData.clients || !backupData.grills || !backupData.timestamp) {
          throw new Error('Invalid backup file format');
        }

        // Dispatch restore actions
        window.localStorage.setItem('clients', JSON.stringify(backupData.clients));
        window.localStorage.setItem('grills', JSON.stringify(backupData.grills));

        setSuccess('Backup restored successfully! Please refresh the page.');
        setError('');
      } catch (err) {
        setError('Failed to restore backup. Please check your password and file.');
        setSuccess('');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Backup & Restore</h2>

      <Card>
        <div className="space-y-6">
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
            />
            <p className="mt-1 text-sm text-gray-500">
              This password will be used to encrypt your backup and is required for restoration.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
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
                Create an encrypted backup of your data that you can restore later.
              </p>
              <Button
                variant="primary"
                onClick={handleBackup}
                leftIcon={<Download size={18} />}
                isFullWidth
              >
                Download Backup
              </Button>
            </div>

            <div className="p-6 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-4">
                <Upload className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">Restore Backup</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Restore your data from a previously created backup file.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestore}
                accept=".bwatbackup"
                className="hidden"
              />
              <Button
                variant="info"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload size={18} />}
                isFullWidth
              >
                Select Backup File
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600 mr-3 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Automatic Backups</h4>
                <p className="text-sm text-gray-500">
                  Your data is automatically saved to your browser's local storage.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600 mr-3 mt-1" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Secure Encryption</h4>
                <p className="text-sm text-gray-500">
                  Backups are encrypted using AES-256 encryption for maximum security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BackupRestore