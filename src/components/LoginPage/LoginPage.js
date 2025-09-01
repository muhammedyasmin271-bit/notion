import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Eye, EyeOff, Loader, Shield, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const LoginPage = () => {
  const { login, loading, error, clearError } = useAppContext();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');


  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLocalError(''); // Clear local error when user types
    setSuccess(''); // Clear success message when user types
    clearError(); // Clear context error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');
    
    // Login only
    if (!formData.username || !formData.password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.username, formData.password);
      navigate('/home');
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-500 relative overflow-hidden ${
      isDarkMode 
        ? 'bg-black' 
        : 'bg-white'
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

      <div className="max-w-lg w-full relative z-10">
        {/* Logo and Title Section */}
        <div className="text-center mb-8">
          <img
            src="/darul-kubra-logo.png"
            alt="Darul Kubra Logo"
            className={`mx-auto h-72 w-72 object-contain mb-8 transition-all duration-300 hover:scale-110 ${
              isDarkMode ? 'mix-blend-screen' : 'mix-blend-multiply'
            }`}
          />
          <h1 className={`text-3xl font-black tracking-tight mb-2 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>DARUL KUBRA WORK SPACE</h1>
          <p className={`text-lg font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Welcome to your digital workspace</p>
        </div>

        {/* Login Form */}
        <div className={`py-10 px-10 rounded-3xl shadow-2xl border-2 transition-all duration-500 backdrop-blur-xl hover:shadow-3xl ${
          isDarkMode 
            ? 'bg-gray-900/90 border-gray-800 shadow-black/50' 
            : 'bg-white/95 border-gray-200 shadow-gray-500/20'
        }`}>
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Welcome Message */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <Shield className={`w-6 h-6 mr-2 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Secure Access</span>
              </div>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Enter your credentials to access your workspace</p>
            </div>

            {(localError || error) && (
              <div className={`border-2 px-4 py-3 rounded-xl text-sm transition-all duration-300 animate-pulse ${
                isDarkMode 
                  ? 'bg-red-900/30 border-red-700 text-red-400' 
                  : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                {localError || error}
              </div>
            )}
            {success && (
              <div className={`border-2 px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-green-900/30 border-green-700 text-green-400' 
                  : 'bg-green-50 border-green-300 text-green-700'
              }`}>
                {success}
              </div>
            )}

            

            <div className="space-y-2">
              <label htmlFor="username" className={`block text-sm font-bold mb-3 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Username
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-500 group-focus-within:text-blue-600'
                }`}>
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base font-medium hover:shadow-lg ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 hover:bg-gray-800' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter your username"
                />
              </div>
            </div>


            <div className="space-y-2">
              <label htmlFor="password" className={`block text-sm font-bold mb-3 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                Password
              </label>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-500 group-focus-within:text-blue-600'
                }`}>
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-14 py-4 border-2 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base font-medium hover:shadow-lg ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-800/50 text-white placeholder-gray-400 hover:bg-gray-800' 
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-200 hover:scale-110 ${
                    isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center items-center py-4 px-6 border-0 text-base font-bold rounded-2xl text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] ${
                  loading 
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className="relative flex items-center">
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 mr-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      Login
                    </>
                  )}
                </span>
                
                <div className="absolute right-4">
                  <Sparkles className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                    loading ? 'animate-pulse' : 'animate-bounce'
                  }`} />
                </div>
              </button>
            </div>
            
            {/* Additional Info */}
            <div className="text-center mt-8">
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                🔒 Secure authentication powered by advanced encryption
              </p>
              <div className="mt-4">
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Need an account?{' '}
                  <a href="/register" className={`font-bold hover:underline transition-colors duration-200 ${
                    isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}>
                    Create Account
                  </a>
                </p>
              </div>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
