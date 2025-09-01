import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Lock, UserPlus, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAppContext();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setValidationErrors({});
    
    try {
      const response = await register({
        name: formData.name.trim(),
        username: formData.username.toLowerCase().trim(),
        password: formData.password,
        role: formData.role
      });
      
      // Always redirect to pending approval for new registrations
      navigate('/pending-approval');
    } catch (err) {
      console.error('Registration error:', err);
      // Error is handled by AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-500 relative overflow-hidden ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-blue-500' : 'bg-blue-400'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 ${
          isDarkMode ? 'bg-indigo-500' : 'bg-indigo-400'
        }`}></div>
      </div>

      <div className={`w-full max-w-lg rounded-3xl shadow-2xl border-2 overflow-hidden relative z-10 transition-all duration-500 backdrop-blur-xl ${
        isDarkMode ? 'bg-gray-900/90 border-gray-800 shadow-black/50' : 'bg-white/95 border-gray-200 shadow-gray-500/20'
      }`}>
        {/* Header */}
        <div className="px-10 py-10 text-center">
          <img 
            src="/darul-kubra-logo.png" 
            alt="Darul Kubra Logo" 
            className={`w-48 h-48 mx-auto object-contain mb-6 transition-all duration-300 hover:scale-110 ${
              isDarkMode ? 'mix-blend-screen' : 'mix-blend-multiply'
            }`}
          />
          <h1 className={`text-3xl font-black mb-2 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            DARUL KUBRA WORK SPACE
          </h1>
          <p className={`text-lg font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Create your account to get started
          </p>
        </div>

        {/* Form */}
        <div className="px-10 py-8">
          {error && (
            <div className={`mb-6 p-4 rounded-xl border-2 flex items-center ${
              isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Full Name *
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.name 
                      ? (isDarkMode ? 'border-red-600 bg-red-900/10' : 'border-red-400 bg-red-50')
                      : (isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500')
                  }`}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
              </div>
              {validationErrors.name && (
                <p className={`mt-2 text-sm font-medium ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username *
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.username 
                      ? (isDarkMode ? 'border-red-600 bg-red-900/10' : 'border-red-400 bg-red-50')
                      : (isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500')
                  }`}
                  placeholder="Choose a username"
                  disabled={isSubmitting}
                />
              </div>
              {validationErrors.username && (
                <p className={`mt-2 text-sm font-medium ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {validationErrors.username}
                </p>
              )}
              <p className={`mt-2 text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Letters, numbers, and underscores only. Minimum 3 characters.
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password *
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.password 
                      ? (isDarkMode ? 'border-red-600 bg-red-900/10' : 'border-red-400 bg-red-50')
                      : (isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500')
                  }`}
                  placeholder="Create a password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className={`mt-2 text-sm font-medium ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.confirmPassword 
                      ? (isDarkMode ? 'border-red-600 bg-red-900/10' : 'border-red-400 bg-red-50')
                      : (isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500')
                  }`}
                  placeholder="Confirm your password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <p className={`mt-2 text-sm font-medium ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className={`block text-sm font-bold mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-4 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled={isSubmitting}
              >
                <option value="user">👤 Team Member</option>
                <option value="manager">👨‍💼 Manager</option>
              </select>
              <p className={`mt-2 text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Note: Manager registrations require approval from existing managers.
              </p>
            </div>




            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`w-full py-4 text-lg font-bold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {isSubmitting || loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Create Account
                </div>
              )}
            </button>
          </form>

          {/* Additional Info & Login Link */}
          <div className="mt-8 text-center space-y-4">
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              📋 Your registration will be reviewed by a manager for approval
            </p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              🔒 Your data is protected with enterprise-grade security
            </p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Already have an account?{' '}
              <Link
                to="/login"
                className={`font-bold hover:underline transition-colors duration-200 ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Login Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
