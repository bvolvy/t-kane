import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, Key, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';

const SecuritySettings: React.FC = () => {
  const { dispatch } = useAppContext();
  const { state: authState, dispatch: authDispatch } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/\d/.test(password)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setError(`Password requirements not met: ${passwordErrors.join(', ')}`);
      return;
    }

    if (!authState.organization || !authState.user) {
      setError('User authentication data not available');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate password validation and update
      // In a real app, this would make an API call to verify current password and update
      
      // Get stored organization data
      const orgKey = `org_${authState.user.email}`;
      const orgData = localStorage.getItem(orgKey);
      
      if (!orgData) {
        throw new Error('Organization data not found');
      }

      const organization = JSON.parse(orgData);
      
      // Update organization data with new password hash (simulated)
      const updatedOrganization = {
        ...organization,
        passwordLastChanged: new Date().toISOString(),
        securityVersion: (organization.securityVersion || 0) + 1
      };

      // Save updated organization data
      localStorage.setItem(orgKey, JSON.stringify(updatedOrganization));

      // Update auth context
      authDispatch({ type: 'SET_ORGANIZATION', payload: updatedOrganization });

      // Add security notification
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: crypto.randomUUID(),
          title: 'Password Updated',
          message: 'Your password has been changed successfully. If this wasn\'t you, please contact support immediately.',
          type: 'success',
          date: new Date().toISOString(),
          read: false,
          category: 'security',
          priority: 'high'
        }
      });

      setSuccess('Password updated successfully! You will need to sign in again on other devices.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError('Failed to update password. Please verify your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = formData.newPassword ? validatePassword(formData.newPassword) : [];
  const strengthScore = Math.max(0, 5 - passwordStrength.length);
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-green-400', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Security & Privacy</h2>
          <p className="text-gray-600 mt-1">
            Manage your account security for {authState.organization?.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-medium text-gray-700">{authState.user?.email}</p>
        </div>
      </div>

      <Card>
        <div className="space-y-6">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                fullWidth
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                fullWidth
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {formData.newPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Password Strength</span>
                  <span className={`text-sm font-medium ${
                    strengthScore >= 4 ? 'text-green-600' : 
                    strengthScore >= 2 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {strengthLabels[strengthScore]}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strengthScore]}`}
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                  />
                </div>
                {passwordStrength.length > 0 && (
                  <div className="text-sm text-red-600">
                    <p>Missing requirements:</p>
                    <ul className="list-disc list-inside ml-2">
                      {passwordStrength.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
              disabled={isLoading}
            />

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            <Button
              variant="primary"
              type="submit"
              leftIcon={<Key size={18} />}
              isFullWidth
              disabled={isLoading || passwordStrength.length > 0}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <Lock className="w-5 h-5 text-gray-600 mr-3 mt-1" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Password Requirements</h4>
                  <ul className="mt-2 text-sm text-gray-500 space-y-1">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Minimum 8 characters
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      At least one uppercase letter
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      At least one number
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      At least one special character
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start p-4 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-600 mr-3 mt-1" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Security Best Practices</h4>
                  <ul className="mt-2 text-sm text-gray-500 space-y-1">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Use a unique password
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Don't share your credentials
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Change password regularly
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Sign out on shared devices
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SecuritySettings;