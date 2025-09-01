import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Shield, Calendar, Settings, Save, Eye, EyeOff, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';

const UserProfilePage = () => {
  const { user, updateUserPreferences, changePassword, apiService } = useAppContext();
  const { isDarkMode } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: user?.preferences?.theme || 'auto',
    notifications: {
      email: user?.preferences?.notifications?.email || true,
      push: user?.preferences?.notifications?.push || true
    }
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || ''
      });
      setPreferences({
        theme: user.preferences?.theme || 'auto',
        notifications: {
          email: user.preferences?.notifications?.email || true,
          push: user.preferences?.notifications?.push || true
        }
      });
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // Update profile via API
      await apiService.put('/auth/profile', profileForm);
      setIsEditing(false);
      showMessage('success', 'Profile updated successfully');
    } catch (error) {
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully');
    } catch (error) {
      showMessage('error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    try {
      await updateUserPreferences(preferences);
      showMessage('success', 'Preferences updated successfully');
    } catch (error) {
      showMessage('error', error.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`content p-6 lg:p-8 font-sans min-h-screen ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg transition-all duration-300 ${
              isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <User className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                User Profile
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center ${
            message.type === 'success'
              ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700')
              : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'preferences', label: 'Preferences', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                    : (isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`rounded-2xl shadow-lg border ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Profile Information
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                  isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Avatar */}
              <div className="md:col-span-2 flex justify-center mb-6">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg ${
                  isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                }`}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border font-medium ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}>
                    {user?.name || 'Not set'}
                  </div>
                )}
              </div>

              {/* Username */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Username</label>
                <div className={`px-4 py-3 rounded-xl border font-medium ${
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'
                }`}>
                  @{user?.username || 'Not set'}
                </div>
                <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Username cannot be changed
                </p>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border font-medium ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}>
                    {user?.email || 'Not set'}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Role</label>
                <div className={`px-4 py-3 rounded-xl border font-medium flex items-center ${
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}>
                  <Shield className="w-4 h-4 mr-2" />
                  {user?.role === 'manager' ? 'Manager' : 'Team Member'}
                </div>
              </div>

              {/* Account Created */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Account Information</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`px-4 py-3 rounded-xl border font-medium ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Member Since</div>
                        <div>{formatDate(user?.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl border font-medium ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Last Login</div>
                        <div>{formatDate(user?.lastLogin)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="flex items-center px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Security Settings
            </h2>

            <div className="max-w-md">
              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="w-full py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="p-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Preferences
            </h2>

            <div className="max-w-md space-y-6">
              {/* Theme Selection */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="auto">🌓 Auto (System)</option>
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                </select>
              </div>

              {/* Notification Preferences */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Notifications</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.email}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, email: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className={`ml-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      📧 Email Notifications
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.push}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, push: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className={`ml-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      🔔 Push Notifications
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={handlePreferencesUpdate}
                disabled={loading}
                className="w-full py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="w-5 h-5 mr-2" />
                    Save Preferences
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
