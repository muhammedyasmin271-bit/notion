import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SuperAdminLogin = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://melaback.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.user.role === 'superadmin') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/xq7m9k2p8n4r6t1w');
      } else {
        setError('Invalid credentials or insufficient permissions');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800' : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-100'} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 shadow-xl mb-4`}>
            <Shield size={32} className="text-white" />
          </div>
          <h1 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Super Admin Access
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Restricted area - Authentication required
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${isDarkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'} flex items-center gap-3`}>
            <AlertCircle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={20} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Username
            </label>
            <div className="relative">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 text-base font-medium ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-red-700/50' : 'focus:ring-red-400/50'} transition-all`}
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 text-base font-medium ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-red-600' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-red-700/50' : 'focus:ring-red-400/50'} transition-all`}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'} text-white disabled:opacity-50`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : (
              <>
                <Shield size={20} />
                Access Super Admin
              </>
            )}
          </button>
        </form>

        {/* Back to Landing */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'} transition-colors`}
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;