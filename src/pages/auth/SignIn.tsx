import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Lock, Mail } from 'lucide-react';

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
      // Simulate API call to get organization data
      const orgData = localStorage.getItem(`org_${formData.email}`);
      if (!orgData) {
        throw new Error('Organization not found');
      }

      const organization = JSON.parse(orgData);
      const mockUser = {
        id: organization.adminId,
        organizationId: organization.id,
        email: formData.email,
        name: organization.adminName,
        role: 'admin' as const,
        createdAt: organization.createdAt
      };

      // Update auth context with user and organization data
      dispatch({ type: 'SET_USER', payload: mockUser });
      dispatch({ type: 'SET_ORGANIZATION', payload: organization });

      // Store auth token
      localStorage.setItem('authToken', `mock-token-${organization.id}`);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setErrors({
        submit: 'Invalid email or password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pricingData = [
    { day: 1, amount: 5 }, { day: 2, amount: 10 }, { day: 3, amount: 15 }, { day: 4, amount: 20 },
    { day: 5, amount: 25 }, { day: 6, amount: 30 }, { day: 7, amount: 35 }, { day: 8, amount: 40 },
    { day: 9, amount: 45 }, { day: 10, amount: 50 }, { day: 11, amount: 55 }, { day: 12, amount: 60 },
    { day: 13, amount: 65 }, { day: 14, amount: 70 }, { day: 15, amount: 75 }, { day: 16, amount: 80 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
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
                leftIcon={<Mail className="text-gray-400\" size={20} />}
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
                leftIcon={<Lock className="text-gray-400\" size={20} />}
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

              <a
                href="/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Forgot Password?
              </a>
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
              <a
                href="/signup"
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Create Organization
              </a>
            </p>
          </form>
        </div>

        <div className="hidden md:flex flex-col bg-gradient-to-br from-purple-600 to-purple-900 p-12 text-white">
          <h2 className="text-3xl font-bold mb-6">Welcome to T-Kanè</h2>
          <p className="text-purple-100 mb-8">
            Manage your organization's financial operations efficiently and securely.
          </p>
          
          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-4">Daily Contribution Plan</h3>
            <div className="grid grid-cols-4 gap-2 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              {pricingData.map(({ day, amount }) => (
                <div
                  key={day}
                  className={`p-3 rounded-lg text-center ${
                    day <= 4 ? 'bg-pink-400/20' :
                    day <= 8 ? 'bg-orange-400/20' :
                    day <= 12 ? 'bg-yellow-400/20' :
                    'bg-green-400/20'
                  }`}
                >
                  <div className="text-sm font-medium">Day {day}</div>
                  <div className="text-lg font-bold">${amount}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <ul className="space-y-4">
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Secure Multi-Organization Platform
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Complete Financial Management
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Real-time Analytics & Reporting
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;