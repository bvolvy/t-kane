import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Lock, Mail, Coins, TrendingUp, Shield, Sparkles } from 'lucide-react';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    setIsLoading(true);
    try {
      // Check for organization owner login
      const orgData = localStorage.getItem(`org_${formData.email}`);
      if (orgData) {
        const organization = JSON.parse(orgData);
        const mockUser = {
          id: organization.adminId,
          organizationId: organization.id,
          email: formData.email,
          name: organization.adminName,
          role: 'owner' as const,
          createdAt: organization.createdAt
        };

        dispatch({ type: 'SET_USER', payload: mockUser });
        dispatch({ type: 'SET_ORGANIZATION', payload: organization });
        localStorage.setItem('authToken', `mock-token-${organization.id}`);
        navigate('/dashboard');
        return;
      }

      // Check for team member login
      const userKey = `user_${formData.email}`;
      const userData = localStorage.getItem(userKey);
      if (userData) {
        const user = JSON.parse(userData);
        
        // Verify password (simple check for demo)
        if (btoa(formData.password) !== user.passwordHash) {
          throw new Error('Invalid password');
        }

        // Get organization data
        const orgKeys = Object.keys(localStorage).filter(key => key.startsWith('org_'));
        let organization = null;
        
        for (const key of orgKeys) {
          const org = JSON.parse(localStorage.getItem(key) || '{}');
          if (org.id === user.organizationId) {
            organization = org;
            break;
          }
        }

        if (!organization) {
          throw new Error('Organization not found');
        }

        // Update last login
        const appStateKey = `appState_${user.organizationId}`;
        const appState = JSON.parse(localStorage.getItem(appStateKey) || '{}');
        if (appState.organizationMembers) {
          appState.organizationMembers = appState.organizationMembers.map((m: any) =>
            m.email === formData.email
              ? { ...m, lastLogin: new Date().toISOString() }
              : m
          );
          localStorage.setItem(appStateKey, JSON.stringify(appState));
        }

        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_ORGANIZATION', payload: organization });
        localStorage.setItem('authToken', `token-${user.id}`);
        navigate('/dashboard');
        return;
      }

      throw new Error('Invalid email or password');
    } catch (error) {
      setErrors({
        submit: 'Invalid email or password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-600">Welcome! Please sign in to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                error={errors.email}
                fullWidth
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                error={errors.password}
                fullWidth
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>

              <button
                type="button"
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Forgot Password?
              </button>
            </div>

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
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Create Organization
              </button>
            </p>
          </form>
        </div>

        <div className="hidden md:flex flex-col bg-gradient-to-br from-purple-600 to-purple-900 p-12 text-white relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Beautiful Logo using cash.png */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              {/* Main logo container with gradient background */}
              <div className="w-20 h-20 bg-gradient-to-br from-white to-purple-100 rounded-3xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                {/* Cash image */}
                <img 
                  src="/cash.png" 
                  alt="T-Kanè Logo" 
                  className="w-300 h-300 object-contain"
                />
                {/* Floating sparkles */}
                <Sparkles className="w-4 h-4 text-purple-200 absolute -top-2 -right-2 animate-pulse" />
                <TrendingUp className="w-4 h-4 text-purple-200 absolute -bottom-2 -left-2 animate-pulse delay-300" />
              </div>
              
              {/* Floating elements around logo */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full shadow-lg animate-bounce delay-100"></div>
              <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-green-400 rounded-full shadow-lg animate-bounce delay-500"></div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6 text-center">Welcome to T-Kanè</h2>
          <p className="text-purple-100 mb-8 text-center leading-relaxed">
            Manage your T-Kanè's financial operations efficiently and securely with our comprehensive platform.
          </p>

          <div className="mt-8 space-y-6">
            <div className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure Mini-Banking System</h3>
                <p className="text-purple-100 text-sm">Enterprise-grade security for your data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;