import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, Mail, Shield, Calendar, Edit2 } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const AdminProfile: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { adminProfile } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: adminProfile.name,
    email: adminProfile.email,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_ADMIN_PROFILE',
      payload: { ...adminProfile, ...formData }
    });
    setIsEditing(false);
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
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
        </Card>

        <Card>
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{adminProfile.name}</h3>
            <p className="text-gray-500 mb-4">{adminProfile.role}</p>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-500">System Administrator</p>
              <p className="text-sm text-gray-500">Access Level: Full Control</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;