import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Lock, Mail } from 'lucide-react';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!validateForm()) return;

    // TODO: Implement actual authentication
    navigate('/dashboard');
  };

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
                leftIcon={<Mail className="text-gray-400" size={20} />}
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
                leftIcon={<Lock className="text-gray-400" size={20} />}
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

            <Button variant="primary" type="submit" isFullWidth>
              Sign In
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

        <div className="hidden md:block bg-gradient-to-br from-purple-600 to-purple-900 p-12 text-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Welcome to T-Kanè</h2>
          <p className="text-purple-100 mb-8">
            Manage your organization's financial operations efficiently and securely.
          </p>
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
  );
};

export default SignIn;