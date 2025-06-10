import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Plus, Edit, Trash, Shield, Mail, Calendar, 
  Eye, FileEdit, Trash2, UserPlus, Crown, Settings,
  CheckCircle, XCircle, Clock, Copy, Send, UserCheck
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer' as OrganizationMember['role']
  });
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'viewer' as OrganizationMember['role']
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inviteLink, setInviteLink] = useState<string>('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);

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

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCreate = () => {
    const newErrors: Record<string, string> = {};
    if (!createData.name.trim()) newErrors.name = 'Name is required';
    if (!createData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(createData.email)) newErrors.email = 'Invalid email format';
    if (!createData.password) newErrors.password = 'Password is required';
    if (createData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (createData.password !== createData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Check if email already exists
    if (state.organizationMembers.some(m => m.email === createData.email)) {
      newErrors.email = 'This email is already in use';
    }

    // Check if admin email is being used
    if (createData.email === authState.user?.email) {
      newErrors.email = 'Cannot use admin email for team member';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const generateInviteLink = (memberId: string): string => {
    const baseUrl = window.location.origin;
    const token = btoa(JSON.stringify({
      memberId,
      organizationId: authState.organization?.id,
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    }));
    return `${baseUrl}/join?token=${token}`;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreate()) return;

    const newMember: OrganizationMember = {
      id: generateId(),
      name: createData.name,
      email: createData.email,
      role: createData.role,
      permissions: getDefaultPermissions(createData.role),
      status: 'active',
      invitedBy: authState.user?.id || '',
      joinedAt: new Date().toISOString()
    };

    // Create user account directly
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      organizationId: authState.organization?.id,
      email: createData.email,
      name: createData.name,
      role: createData.role,
      createdAt: new Date().toISOString()
    };

    // Store user credentials
    const userKey = `user_${createData.email}`;
    localStorage.setItem(userKey, JSON.stringify({
      ...user,
      passwordHash: btoa(createData.password) // Simple encoding for demo
    }));

    dispatch({ type: 'ADD_ORGANIZATION_MEMBER', payload: newMember });

    // Show created credentials
    setCreatedCredentials({
      email: createData.email,
      password: createData.password,
      name: createData.name
    });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Team Member Created',
        message: `${createData.name} has been added to your organization with direct access`,
        type: 'success',
        date: new Date().toISOString(),
        read: false
      }
    });

    setCreateData({ name: '', email: '', password: '', confirmPassword: '', role: 'viewer' });
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

    // Generate invite link
    const link = generateInviteLink(newMember.id);
    setInviteLink(link);

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
  };

  const handleDeleteMember = (memberId: string) => {
    const member = state.organizationMembers.find(m => m.id === memberId);
    if (!member) return;

    if (window.confirm(`Are you sure you want to remove ${member.name} from your organization?`)) {
      // Also remove user credentials if they exist
      const userKey = `user_${member.email}`;
      localStorage.removeItem(userKey);

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

  const handleCustomPermissions = (member: OrganizationMember) => {
    setEditingMember(member);
    setShowPermissionModal(true);
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    
    const credentialsText = `Login Credentials for ${authState.organization?.name}
Email: ${createdCredentials.email}
Password: ${createdCredentials.password}
Login URL: ${window.location.origin}/signin`;

    navigator.clipboard.writeText(credentialsText);
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Credentials Copied',
        message: 'Login credentials have been copied to clipboard',
        type: 'success',
        date: new Date().toISOString(),
        read: false
      }
    });
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Link Copied',
        message: 'Invite link has been copied to clipboard',
        type: 'success',
        date: new Date().toISOString(),
        read: false
      }
    });
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
  const isOwner = currentUser?.role === 'owner' || authState.organization?.adminId === currentUser?.id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">
            Manage team members and their access levels for {authState.organization?.name}
          </p>
        </div>
        {isOwner && (
          <div className="flex gap-3">
            <Button
              variant="secondary"
              leftIcon={<Send size={18} />}
              onClick={() => setShowInviteForm(true)}
            >
              Send Invite
            </Button>
            <Button
              variant="primary"
              leftIcon={<UserPlus size={18} />}
              onClick={() => setShowCreateForm(true)}
            >
              Create Member
            </Button>
          </div>
        )}
      </div>

      {/* Role Definitions */}
      <Card title="Role Definitions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(roleDefinitions).map(([roleKey, role]) => {
            const IconComponent = role.icon;
            return (
              <div key={roleKey} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center mb-3">
                  <IconComponent className="w-5 h-5 text-gray-600 mr-2" />
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${role.color}`}>
                    {role.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                <div className="text-xs text-gray-500">
                  <p className="font-medium mb-1">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm, index) => (
                      <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="text-gray-400">+{role.permissions.length - 3} more</span>
                    )}
                  </div>
                </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Current Admin/Owner */}
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-medium">
                        {authState.user?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {authState.user?.name} (You)
                      </div>
                      <div className="text-sm text-gray-500">{authState.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Owner
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="ml-2 text-sm text-gray-900">Active</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {authState.organization?.createdAt ? 
                    new Date(authState.organization.createdAt).toLocaleDateString() : 
                    'N/A'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Full Access
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <span className="text-gray-400">Owner</span>
                </td>
              </tr>

              {/* Team Members */}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleCustomPermissions(member)}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                      {member.permissions.length} modules
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {member.status === 'pending' && (
                        <button
                          onClick={() => {
                            const link = generateInviteLink(member.id);
                            setInviteLink(link);
                            copyInviteLink();
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Copy Invite Link"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                      {isOwner && member.role !== 'owner' && (
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove Member"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Member Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create Team Member</h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCreatedCredentials(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            {!createdCredentials ? (
              <form onSubmit={handleCreateSubmit} className="p-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={createData.name}
                  onChange={handleCreateChange}
                  placeholder="Enter member's full name"
                  fullWidth
                  error={errors.name}
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={createData.email}
                  onChange={handleCreateChange}
                  placeholder="Enter member's email"
                  fullWidth
                  error={errors.email}
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={createData.password}
                  onChange={handleCreateChange}
                  placeholder="Create password for member"
                  fullWidth
                  error={errors.password}
                />

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={createData.confirmPassword}
                  onChange={handleCreateChange}
                  placeholder="Confirm password"
                  fullWidth
                  error={errors.confirmPassword}
                />

                <Select
                  label="Role"
                  name="role"
                  value={createData.role}
                  onChange={handleCreateChange}
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
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Create Member
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <div className="text-center mb-6">
                  <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Member Created Successfully!</h3>
                  <p className="text-gray-600">Share these credentials with {createdCredentials.name}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Login Credentials</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{createdCredentials.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Password:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">
                        {createdCredentials.password}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Login URL:</span>
                      <span className="font-medium text-purple-600">{window.location.origin}/signin</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Save these credentials securely. The password cannot be recovered later.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreatedCredentials(null);
                    }}
                  >
                    Done
                  </Button>
                  <Button
                    variant="primary"
                    leftIcon={<Copy size={16} />}
                    onClick={copyCredentials}
                  >
                    Copy Credentials
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Send Invitation</h2>
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteLink('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            {!inviteLink ? (
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
            ) : (
              <div className="p-6">
                <div className="text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Invitation Created!</h3>
                  <p className="text-gray-600">Share this link with {inviteData.name}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white text-sm"
                    />
                    <Button
                      variant="primary"
                      onClick={copyInviteLink}
                      className="rounded-l-none"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This link expires in 7 days
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteLink('');
                    }}
                  >
                    Done
                  </Button>
                  <Button
                    variant="primary"
                    leftIcon={<Send size={16} />}
                    onClick={() => {
                      window.open(`mailto:${inviteData.email}?subject=Invitation to join ${authState.organization?.name}&body=You've been invited to join our organization. Click this link to get started: ${inviteLink}`);
                    }}
                  >
                    Send Email
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && editingMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Permissions for {editingMember.name}
              </h2>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setEditingMember(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {modulePermissions.map((module) => {
                  const memberPermission = editingMember.permissions.find(p => p.module === module.module);
                  return (
                    <div key={module.module} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">{module.name}</h4>
                        <span className="text-sm text-gray-500">
                          {memberPermission?.actions.length || 0} of {module.actions.length} permissions
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {module.actions.map((action) => (
                          <label key={action} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={memberPermission?.actions.includes(action as any) || false}
                              onChange={(e) => {
                                // Handle permission change
                                const updatedPermissions = editingMember.permissions.map(p => {
                                  if (p.module === module.module) {
                                    const actions = e.target.checked
                                      ? [...p.actions, action as any]
                                      : p.actions.filter(a => a !== action);
                                    return { ...p, actions };
                                  }
                                  return p;
                                });

                                if (!memberPermission && e.target.checked) {
                                  updatedPermissions.push({
                                    module: module.module as Permission['module'],
                                    actions: [action as any]
                                  });
                                }

                                const updatedMember = {
                                  ...editingMember,
                                  permissions: updatedPermissions.filter(p => p.actions.length > 0)
                                };

                                setEditingMember(updatedMember);
                              }}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPermissionModal(false);
                    setEditingMember(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (editingMember) {
                      dispatch({ type: 'UPDATE_ORGANIZATION_MEMBER', payload: editingMember });
                      setShowPermissionModal(false);
                      setEditingMember(null);
                    }
                  }}
                >
                  Save Permissions
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissions;