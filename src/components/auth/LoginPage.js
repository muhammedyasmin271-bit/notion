import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAppContext();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
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
      await login(formData.username.toLowerCase().trim(), formData.password);
      // Login successful, redirect to dashboard
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      // Error is handled by AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-3 sm:p-6 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className={`w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border-2 overflow-hidden ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`px-4 sm:px-8 py-6 sm:py-8 text-center ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className="mx-auto mb-4 sm:mb-6">
            <img 
              src="/darul-kubra-logo.png" 
              alt="Darul Kubra Logo" 
              className="w-20 h-20 sm:w-32 sm:h-32 mx-auto object-contain"
            />
          </div>
          <h1 className={`text-xl sm:text-3xl font-black mb-2 leading-tight ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            DARUL KUBRA WORK SPACE
          </h1>
        </div>

        {/* Form */}
        <div className="px-4 sm:px-8 py-6 sm:py-8">
          {error && (
            <div className={`mb-6 p-4 rounded-xl border-2 flex items-center ${
              isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Username Field */}
            <div>
              <label className={`block text-sm font-bold mb-2 sm:mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username
              </label>
              <div className="relative">
                <User className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 rounded-lg sm:rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.username 
                      ? (isDarkMode ? 'border-red-600 bg-red-900/10' : 'border-red-400 bg-red-50')
                      : (isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500')
                  }`}
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>
              {validationErrors.username && (
                <p className={`mt-2 text-sm font-medium ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {validationErrors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-sm font-bold mb-2 sm:mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border-2 rounded-lg sm:rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                    validationErrors.password 
                      ? (isDarkMode ? 'border-red-600 bg-red-900/10' : 'border-red-400 bg-red-50')
                      : (isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500')
                  }`}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 ${
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`w-full py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[48px] ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {isSubmitting || loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="w-6 h-6 mr-3" />
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className={`font-bold hover:underline transition-colors duration-200 ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
