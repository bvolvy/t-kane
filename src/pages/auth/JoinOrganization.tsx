import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Shield, CheckCircle, XCircle, Users } from 'lucide-react';

const JoinOrganization: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [isValidInvite, setIsValidInvite] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      const decoded = JSON.parse(atob(token));
      
      // Check if token is expired
      if (decoded.expires < Date.now()) {
        setErrors({ token: 'This invitation link has expired' });
        return;
      }

      // Get organization data
      const orgData = localStorage.getItem(`appState_${decoded.organizationId}`);
      if (!orgData) {
        setErrors({ token: 'Invalid invitation link' });
        return;
      }

      const appState = JSON.parse(orgData);
      const member = appState.organizationMembers?.find((m: any) => m.id === decoded.memberId);
      
      if (!member) {
        setErrors({ token: 'Invitation not found' });
        return;
      }

      if (member.status === 'active') {
        setErrors({ token: 'This invitation has already been used' });
        return;
      }

      // Get organization info
      const orgKeys = Object.keys(localStorage).filter(key => key.startsWith('org_'));
      let organizationInfo = null;
      
      for (const key of orgKeys) {
        const org = JSON.parse(localStorage.getItem(key) || '{}');
        if (org.id === decoded.organizationId) {
          organizationInfo = org;
          break;
        }
      }

      if (!organizationInfo) {
        setErrors({ token: 'Organization not found' });
        return;
      }

      setInviteData({
        ...decoded,
        member,
        organization: organizationInfo
      });
      setIsValidInvite(true);
    } catch (error) {
      setErrors({ token: 'Invalid invitation link' });
    }
  }, [searchParams, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !inviteData) return;

    setIsLoading(true);
    try {
      // Create user account
      const userId = crypto.randomUUID();
      const user = {
        id: userId,
        organizationId: inviteData.organizationId,
        email: inviteData.member.email,
        name: inviteData.member.name,
        role: inviteData.member.role,
        createdAt: new Date().toISOString()
      };

      // Update member status to active
      const appStateKey = `appState_${inviteData.organizationId}`;
      const appState = JSON.parse(localStorage.getItem(appStateKey) || '{}');
      
      if (appState.organizationMembers) {
        appState.organizationMembers = appState.organizationMembers.map((m: any) =>
          m.id === inviteData.memberId
            ? { ...m, status: 'active', lastLogin: new Date().toISOString() }
            : m
        );
        localStorage.setItem(appStateKey, JSON.stringify(appState));
      }

      // Store user credentials
      const userKey = `user_${inviteData.member.email}`;
      localStorage.setItem(userKey, JSON.stringify({
        ...user,
        passwordHash: btoa(formData.password) // Simple encoding for demo
      }));

      // Set auth context
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_ORGANIZATION', payload: inviteData.organization });

      // Store auth token
      localStorage.setItem('authToken', `token-${userId}`);

      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: 'Failed to join organization. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (errors.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{errors.token}</p>
          <Button variant="primary" onClick={() => navigate('/signin')} isFullWidth>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidInvite || !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Organization</h1>
            <p className="text-gray-600">
              You've been invited to join <strong>{inviteData.organization.name}</strong> as a{' '}
              <strong>{inviteData.member.role}</strong>.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Invitation Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Organization:</span>
                <span className="font-medium">{inviteData.organization.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Your Role:</span>
                <span className="font-medium capitalize">{inviteData.member.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{inviteData.member.email}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Create Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
              fullWidth
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              fullWidth
              disabled={isLoading}
            />

            {errors.submit && (
              <p className="text-sm text-red-600 text-center">{errors.submit}</p>
            )}

            <Button 
              variant="primary" 
              type="submit" 
              isFullWidth 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Joining Organization...
                </div>
              ) : (
                'Join Organization'
              )}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>

        <div className="hidden md:flex flex-col bg-gradient-to-br from-purple-600 to-purple-900 p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-white to-purple-100 rounded-3xl shadow-2xl flex items-center justify-center">
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6 text-center">Welcome to the Team!</h2>
          <p className="text-purple-100 mb-8 text-center leading-relaxed">
            You're about to join {inviteData.organization.name} and gain access to powerful 
            financial management tools.
          </p>

          <div className="mt-8 space-y-6">
            <div className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure Access</h3>
                <p className="text-purple-100 text-sm">Role-based permissions and security</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Team Collaboration</h3>
                <p className="text-purple-100 text-sm">Work together efficiently</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinOrganization;