import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, Mail, Shield, Calendar, Edit2, Key, Lock, Globe, Camera } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';

const AdminProfile: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { adminProfile } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: adminProfile.name,
    email: adminProfile.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: adminProfile.avatar || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrors({
        ...errors,
        name: !formData.name.trim() ? 'Name is required' : '',
        email: !formData.email.trim() ? 'Email is required' : ''
      });
      return;
    }

    dispatch({
      type: 'UPDATE_ADMIN_PROFILE',
      payload: { 
        ...adminProfile, 
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar
      }
    });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully',
        type: 'success',
        date: new Date().toISOString(),
        read: false
      }
    });

    setIsEditing(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    // Here you would typically handle password change with your backend
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Password Updated',
        message: 'Your password has been changed successfully',
        type: 'success',
        date: new Date().toISOString(),
        read: false
      }
    });

    setIsChangingPassword(false);
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit2 size={16} />}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {isEditing ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-purple-600" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer hover:bg-purple-700 transition-colors">
                    <Camera size={16} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Upload a new profile photo</p>
                  <p className="text-xs text-gray-400">JPG, PNG or GIF (max. 2MB)</p>
                </div>
              </div>

              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                fullWidth
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                fullWidth
              />
              <div className="flex justify-end">
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{adminProfile.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{adminProfile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">{adminProfile.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium">
                    {adminProfile.lastLogin ? new Date(adminProfile.lastLogin).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isChangingPassword ? (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Cancel
                </Button>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={errors.currentPassword}
                  fullWidth
                />
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={errors.newPassword}
                  fullWidth
                />
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  fullWidth
                />
                <div className="flex justify-end">
                  <Button variant="primary" type="submit">
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <Button
                variant="secondary"
                leftIcon={<Key size={16} />}
                onClick={() => setIsChangingPassword(true)}
              >
                Change Password
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {adminProfile.avatar ? (
                <img src={adminProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-purple-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{adminProfile.name}</h3>
            <p className="text-gray-500 mb-4">{adminProfile.role}</p>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Lock size={16} />
                  <span>System Administrator</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Globe size={16} />
                  <span>Full System Access</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;