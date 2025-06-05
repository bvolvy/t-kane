import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Building2, Mail, User, Lock } from 'lucide-react';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationEmail: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
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

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.organizationName) newErrors.organizationName = 'Organization name is required';
    if (!formData.organizationEmail) newErrors.organizationEmail = 'Organization email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.adminName) newErrors.adminName = 'Admin name is required';
    if (!formData.adminEmail) newErrors.adminEmail = 'Admin email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    const organizationId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Create organization data
    const organizationData = {
      id: organizationId,
      name: formData.organizationName,
      email: formData.organizationEmail,
      adminId,
      adminName: formData.adminName,
      adminEmail: formData.adminEmail,
      createdAt,
      settings: {
        theme: {
          primaryColor: '#8B5CF6',
          secondaryColor: '#4F46E5'
        },
        features: {
          loans: true,
          tontine: true,
          reports: true
        }
      }
    };

    // Store organization data
    localStorage.setItem(`org_${formData.adminEmail}`, JSON.stringify(organizationData));

    // Initialize organization's data storage
    localStorage.setItem(`appState_${organizationId}`, JSON.stringify({
      clients: [],
      grills: [],
      tontineGroups: [],
      adminProfile: {
        name: formData.adminName,
        email: formData.adminEmail,
        role: 'System Administrator',
        lastLogin: new Date().toISOString()
      },
      notifications: []
    }));

    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Organization</h1>
            <p className="text-gray-600">
              {step === 1 
                ? 'Enter your organization details to get started'
                : 'Set up your admin account'}
            </p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Organization</span>
                </div>
                <div className="flex-1 mx-4 h-0.5 bg-gray-200">
                  <div className={`h-full ${
                    step > 1 ? 'bg-purple-600' : 'bg-gray-200'
                  }`} style={{ width: step > 1 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Admin</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <Input
                  label="Organization Name"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder="Enter organization name"
                  error={errors.organizationName}
                  fullWidth
                  leftIcon={<Building2 className="text-gray-400\" size={20} />}
                />

                <Input
                  label="Organization Email"
                  name="organizationEmail"
                  type="email"
                  value={formData.organizationEmail}
                  onChange={handleChange}
                  placeholder="Enter organization email"
                  error={errors.organizationEmail}
                  fullWidth
                  leftIcon={<Mail className="text-gray-400\" size={20} />}
                />

                <Button variant="primary" type="button" onClick={handleNext} isFullWidth>
                  Next
                </Button>
              </>
            ) : (
              <>
                <Input
                  label="Admin Name"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="Enter admin name"
                  error={errors.adminName}
                  fullWidth
                  leftIcon={<User className="text-gray-400\" size={20} />}
                />

                <Input
                  label="Admin Email"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="Enter admin email"
                  error={errors.adminEmail}
                  fullWidth
                  leftIcon={<Mail className="text-gray-400\" size={20} />}
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  error={errors.password}
                  fullWidth
                  leftIcon={<Lock className="text-gray-400\" size={20} />}
                />

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  error={errors.confirmPassword}
                  fullWidth
                  leftIcon={<Lock className="text-gray-400\" size={20} />}
                />

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="/terms" className="text-purple-600 hover:text-purple-800">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-purple-600 hover:text-purple-800">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                )}

                <div className="flex space-x-4">
                  <Button 
                    variant="secondary" 
                    type="button" 
                    onClick={() => setStep(1)}
                    isFullWidth
                  >
                    Back
                  </Button>
                  <Button variant="primary" type="submit" isFullWidth>
                    Create Organization
                  </Button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a
                href="/signin"
                className="text-purple-600 hover:text-purple-800 font-medium"
              >
                Sign In
              </a>
            </p>
          </form>
        </div>

        <div className="hidden md:flex flex-col bg-gradient-to-br from-purple-600 to-purple-900 p-12 text-white">
          <h2 className="text-3xl font-bold mb-6">Join T-Kanè Today</h2>
          <p className="text-purple-100 mb-8">
            Create your organization's workspace and start managing your financial operations efficiently.
          </p>

          <div className="mt-8">
            <ul className="space-y-4">
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Dedicated Organization Workspace
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Multi-User Access Control
              </li>
              <li className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Secure Data Management
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;