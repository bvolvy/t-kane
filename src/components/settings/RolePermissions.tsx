import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Plus, Edit, Trash, Shield, Mail, Calendar, 
  Eye, FileEdit, Trash2, UserPlus, Crown, Settings,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Select from '../common/Select';
import { OrganizationMember, Permission } from '../../types';
import { generateId } from '../../utils/grillUtils';

const RolePermissions: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { state: authState } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'viewer' as OrganizationMember['role']
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roleDefinitions = {
    owner: {
      name: 'Owner',
      description: 'Full access to all features and settings',
      color: 'bg-red-100 text-red-800',
      icon: Crown,
      permissions: ['all']
    },
    admin: {
      name: 'Administrator',
      description: 'Manage all data and most settings',
      color: 'bg-purple-100 text-purple-800',
      icon: Shield,
      permissions: ['clients', 'grills', 'loans', 'tontine', 'transactions', 'reports']
    },
    manager: {
      name: 'Manager',
      description: 'Manage clients and transactions',
      color: 'bg-blue-100 text-blue-800',
      icon: Users,
      permissions: ['clients', 'transactions', 'reports']
    },
    viewer: {
      name: 'Viewer',
      description: 'View-only access to data',
      color: 'bg-gray-100 text-gray-800',
      icon: Eye,
      permissions: ['view-only']
    }
  };

  const modulePermissions = [
    { module: 'clients', name: 'Client Management', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'grills', name: 'Grill Plans', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'loans', name: 'Loan Management', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'tontine', name: 'Tontine Groups', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'transactions', name: 'Transactions', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'reports', name: 'Reports & Analytics', actions: ['view', 'create'] },
    { module: 'settings', name: 'Organization Settings', actions: ['view', 'edit'] },
  ];

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateInvite = () => {
    const newErrors: Record<string, string> = {};
    if (!inviteData.name.trim()) newErrors.name = 'Name is required';
    if (!inviteData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(inviteData.email)) newErrors.email = 'Invalid email format';
    
    // Check if email already exists
    if (state.organizationMembers.some(m => m.email === inviteData.email)) {
      newErrors.email = 'This email is already invited';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDefaultPermissions = (role: OrganizationMember['role']): Permission[] => {
    switch (role) {
      case 'owner':
        return modulePermissions.map(module => ({
          module: module.module as Permission['module'],
          actions: module.actions as Permission['actions']
        }));
      case 'admin':
        return modulePermissions
          .filter(module => module.module !== 'settings')
          .map(module => ({
            module: module.module as Permission['module'],
            actions: module.actions as Permission['actions']
          }));
      case 'manager':
        return [
          { module: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'transactions', actions: ['view', 'create', 'edit'] },
          { module: 'reports', actions: ['view'] }
        ];
      case 'viewer':
        return modulePermissions.map(module => ({
          module: module.module as Permission['module'],
          actions: ['view']
        }));
      default:
        return [];
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInvite()) return;

    const newMember: OrganizationMember = {
      id: generateId(),
      name: inviteData.name,
      email: inviteData.email,
      role: inviteData.role,
      permissions: getDefaultPermissions(inviteData.role),
      status: 'pending',
      invitedBy: authState.user?.id || '',
      joinedAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_ORGANIZATION_MEMBER', payload: newMember });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Team Member Invited',
        message: `${inviteData.name} has been invited to join your organization`,
        type: 'success',
        date: new Date().toISOString(),
        read: false
      }
    });

    setInviteData({ name: '', email: '', role: 'viewer' });
    setShowInviteForm(false);
  };

  const handleDeleteMember = (memberId: string) => {
    const member = state.organizationMembers.find(m => m.id === memberId);
    if (!member) return;

    if (window.confirm(`Are you sure you want to remove ${member.name} from your organization?`)) {
      dispatch({ type: 'DELETE_ORGANIZATION_MEMBER', payload: memberId });
      
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: crypto.randomUUID(),
          title: 'Team Member Removed',
          message: `${member.name} has been removed from your organization`,
          type: 'warning',
          date: new Date().toISOString(),
          read: false
        }
      });
    }
  };

  const handleUpdateMemberRole = (memberId: string, newRole: OrganizationMember['role']) => {
    const member = state.organizationMembers.find(m => m.id === memberId);
    if (!member) return;

    const updatedMember: OrganizationMember = {
      ...member,
      role: newRole,
      permissions: getDefaultPermissions(newRole)
    };

    dispatch({ type: 'UPDATE_ORGANIZATION_MEMBER', payload: updatedMember });
  };

  const getStatusIcon = (status: OrganizationMember['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const currentUser = authState.user;
  const isOwner = currentUser?.role === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">
            Manage team members and their access levels
          </p>
        </div>
        {isOwner && (
          <Button
            variant="primary"
            leftIcon={<UserPlus size={18} />}
            onClick={() => setShowInviteForm(true)}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Role Definitions */}
      <Card title="Role Definitions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(roleDefinitions).map(([roleKey, role]) => {
            const IconComponent = role.icon;
            return (
              <div key={roleKey} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <IconComponent className="w-5 h-5 text-gray-600 mr-2" />
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${role.color}`}>
                    {role.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Team Members */}
      <Card title="Team Members">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.organizationMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOwner && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as OrganizationMember['role'])}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        roleDefinitions[member.role].color
                      }`}>
                        {roleDefinitions[member.role].name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(member.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {member.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isOwner && member.role !== 'owner' && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove Member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteForm(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-6">
              <Input
                label="Full Name"
                name="name"
                value={inviteData.name}
                onChange={handleInviteChange}
                placeholder="Enter member's full name"
                fullWidth
                error={errors.name}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={inviteData.email}
                onChange={handleInviteChange}
                placeholder="Enter member's email"
                fullWidth
                error={errors.email}
              />

              <Select
                label="Role"
                name="role"
                value={inviteData.role}
                onChange={handleInviteChange}
                options={[
                  { value: 'admin', label: 'Administrator' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'viewer', label: 'Viewer' },
                ]}
                fullWidth
              />

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissions;