import React, { useState, useEffect } from 'react';
import { Settings, User, Lock, Eye, EyeOff, Save, X, CheckCircle, Bell, BellOff, Moon, Sun, ArrowLeft, Shield, Key, Palette, Smartphone } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import webPushService from '../../utils/webPush';

const SettingsPage = () => {
  const { user, setUser, setUsers } = useAppContext();
  const { isDarkMode, toggleTheme, navbarBgColor, updateNavbarBgColor } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pushStatus, setPushStatus] = useState('not-supported');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isLoadingPush, setIsLoadingPush] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleBackToHome = () => {
    window.location.href = '/home';
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    
    const currentStoredPassword = getCurrentPassword();
    if (passwordData.currentPassword !== currentStoredPassword) {
      setMessage({ type: 'error', text: 'Current password is incorrect' });
      return;
    }

    if (passwordData.newPassword.length < 4) {
      setMessage({ type: 'error', text: 'New password must be at least 4 characters long' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = storedUsers.map(u => 
      u.id === user.id ? { ...u, password: passwordData.newPassword } : u
    );
    
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    const updatedUser = { ...user, password: passwordData.newPassword };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    setMessage({ type: 'success', text: 'Password updated successfully!' });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage({ type: '', text: '' });
  };

  const getCurrentPassword = () => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = storedUsers.find(u => u.id === user.id);
    return currentUser ? currentUser.password : '';
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    setMessage({ 
      type: 'success', 
      text: `Switched to ${!isDarkMode ? 'dark' : 'light'} mode successfully!` 
    });
    
    setTimeout(() => {
      window.dispatchEvent(new Event('theme-changed'));
    }, 100);
  };

  useEffect(() => {
    const initializePush = async () => {
      if (webPushService.isSupported) {
        await webPushService.initialize();
        const status = webPushService.getSubscriptionStatus();
        setPushStatus(status);
        setIsPushEnabled(webPushService.isNotificationsEnabled());
      }
    };

    initializePush();
  }, []);

  const handlePushToggle = async () => {
    setIsLoadingPush(true);
    try {
      if (isPushEnabled) {
        await webPushService.unsubscribeFromPush();
        setIsPushEnabled(false);
        setPushStatus('not-subscribed');
        setMessage({ type: 'success', text: 'Push notifications disabled successfully!' });
      } else {
        const permissionGranted = await webPushService.requestPermission();
        if (permissionGranted) {
          const subscribed = await webPushService.subscribeToPush();
          if (subscribed) {
            setIsPushEnabled(true);
            setPushStatus('subscribed');
            setMessage({ type: 'success', text: 'Push notifications enabled successfully!' });
          } else {
            setMessage({ type: 'error', text: 'Failed to subscribe to push notifications' });
          }
        } else {
          setMessage({ type: 'error', text: 'Permission denied for push notifications' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update push notification settings' });
    } finally {
      setIsLoadingPush(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await webPushService.sendTestNotification(
        'Test Notification',
        'This is a test push notification from your workspace!'
      );
      setMessage({ type: 'success', text: 'Test notification sent successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test notification' });
    }
  };

  return (
    <div className={`content p-8 lg:p-12 min-h-screen ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Professional Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBackToHome}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-6 transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'bg-gray-900 border border-gray-800 hover:bg-gray-800' : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </button>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Settings
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your account and preferences
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl ${
            isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-200'
          }`}>
            <Settings className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          </div>
        </div>

        {/* Success/Error Messages */}
        {message.text && (
          <div className={`mb-8 p-4 rounded-2xl border-2 ${
            message.type === 'success' 
              ? (isDarkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-200 text-green-700')
              : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-3" />
              ) : (
                <X className="h-5 w-5 mr-3" />
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Section */}
        <div className={`p-6 rounded-xl shadow-sm border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <User className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Profile Information
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Full Name
              </label>
              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-black'
              }`}>
                {user?.name}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-black'
              }`}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className={`p-8 rounded-2xl shadow-lg border-2 ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Shield className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Security Settings
              </h2>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                  isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Change Password
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Password
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ••••••••••••
                    </p>
                  </div>
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className={`w-full px-4 py-4 pr-12 border-2 rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-black placeholder-gray-500'
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    ) : (
                      <Eye className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="4"
                    className={`w-full px-4 py-4 pr-12 border-2 rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-black placeholder-gray-500'
                    }`}
                    placeholder="Enter new password (min 4 characters)"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    ) : (
                      <Eye className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className={`w-full px-4 py-4 pr-12 border-2 rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-black placeholder-gray-500'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    ) : (
                      <Eye className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Appearance Section */}
        <div className={`p-6 rounded-xl shadow-sm border ${
          isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Palette className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Appearance
            </h2>
          </div>
          
          <div className="space-y-4">
            {/* Theme Mode */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isDarkMode ? (
                    <Moon className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  ) : (
                    <Sun className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  )}
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Theme Mode
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isDarkMode ? 'Dark mode is active' : 'Light mode is active'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDarkModeToggle}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full transition-transform duration-300 ${
                      isDarkMode ? 'translate-x-9 bg-black' : 'translate-x-1 bg-white'
                    }`}
                  >
                    <span className="flex h-full w-full items-center justify-center">
                      {isDarkMode ? (
                        <Moon className="h-3 w-3 text-white" />
                      ) : (
                        <Sun className="h-3 w-3 text-black" />
                      )}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Navbar Background Color */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded ${navbarBgColor}`}></div>
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Navbar Background
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Customize your navigation bar color
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Default Blue', class: 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900' },
                  { name: 'Dark Gray', class: 'bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800' },
                  { name: 'Dark', class: 'bg-gradient-to-br from-gray-900 via-slate-800 to-black' }
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      updateNavbarBgColor(color.class);
                      setMessage({ type: 'success', text: `Navbar color changed to ${color.name}!` });
                    }}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      navbarBgColor === color.class
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : (isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
                    }`}
                    title={color.name}
                  >
                    <div className={`w-full h-8 rounded ${color.class}`}></div>
                    <p className={`text-xs mt-2 font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {color.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        {webPushService.isSupported && (
          <div className={`p-6 rounded-xl shadow-sm border ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Smartphone className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Notifications
              </h2>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bell className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Push Notifications
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isPushEnabled ? 'Notifications are enabled' : 'Enable to receive notifications'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isPushEnabled && (
                    <button
                      onClick={handleTestNotification}
                      disabled={isLoadingPush}
                      className={`px-3 py-2 rounded-lg font-medium border transition-all duration-200 hover:scale-105 ${
                        isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Test
                    </button>
                  )}
                  <button
                    onClick={handlePushToggle}
                    disabled={isLoadingPush}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
                      isPushEnabled
                        ? (isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-200')
                        : (isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800')
                    }`}
                  >
                    {isLoadingPush ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : isPushEnabled ? (
                      <BellOff className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    {isPushEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;