import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Shield, Calendar, Save, Eye, EyeOff, CheckCircle, AlertCircle, Edit3, Star, TrendingUp } from 'lucide-react';

const UserProfilePage = () => {
  const { user, setUser, changePassword, apiService } = useAppContext();
  const { isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pointsHistory, setPointsHistory] = useState([]);
  const [pointsHistoryLoading, setPointsHistoryLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    department: user?.department || '',
    phoneNumber: user?.phone || '',
    location: user?.location || ''
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


  // Fetch fresh user data to get updated points when component mounts
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        const freshUserData = await apiService.getCurrentUser();
        if (freshUserData && setUser) {
          // Update the user in context to get latest points
          setUser(freshUserData);
          // Also update localStorage to keep it in sync
          localStorage.setItem('user', JSON.stringify(freshUserData));
        }
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
        // If fetch fails, continue with existing user data
      }
    };

    fetchFreshUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once when component mounts

  // Fetch company info to check if points are enabled
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://notion-l9ti.onrender.com/api/auth/company-status', {
          headers: { 'x-auth-token': token }
        });
        if (response.ok) {
          const data = await response.json();
          setCompanyInfo(data);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };

    // Fetch for all users to check if points are enabled
    if (user) {
      fetchCompanyInfo();
    }
  }, [user]);

  // Fetch points history when points tab is active
  useEffect(() => {
    const fetchPointsHistory = async () => {
      if (activeTab === 'points') {
        setPointsHistoryLoading(true);
        try {
          console.log('Fetching points history...');
          const history = await apiService.get('/users/points/history');
          console.log('Points history received:', history);
          // Ensure history is an array
          if (Array.isArray(history)) {
            setPointsHistory(history);
          } else {
            console.warn('Points history is not an array:', history);
            setPointsHistory([]);
          }
        } catch (error) {
          console.error('Error fetching points history:', error);
          console.error('Error details:', error.response?.data || error.message);
          setPointsHistory([]);
        } finally {
          setPointsHistoryLoading(false);
        }
      }
    };

    if (apiService) {
      fetchPointsHistory();
    }
  }, [activeTab, apiService]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        department: user.department || '',
        phoneNumber: user.phone || '',
        location: user.location || ''
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
      // Map frontend fields to backend fields
      const profileData = {
        name: profileForm.name,
        email: profileForm.email,
        department: profileForm.department,
        phone: profileForm.phoneNumber,
        location: profileForm.location
      };

      // Remove undefined/empty fields
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === undefined || profileData[key] === '') {
          delete profileData[key];
        }
      });

      // Update profile via API
      await apiService.put('/users/profile', profileData);
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
    <div className={`content p-3 sm:p-4 lg:p-6 xl:p-8 font-sans min-h-screen ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-white text-gray-900'
      }`}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center flex-1 min-w-0">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 lg:mr-6 shadow-lg transition-all duration-300 flex-shrink-0 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              }`}>
              <User className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                User Profile
              </h1>
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center ${message.type === 'success'
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
        <div className="flex space-x-1 sm:space-x-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            ...((user?.role === 'user' || user?.role === 'manager') && 
                companyInfo?.pointsEnabled !== false && 
                companyInfo?.status !== 'paused' ? [{ id: 'points', label: 'Points', icon: Star }] : []),
            { id: 'security', label: 'Security', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                    ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white')
                    : (isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                  }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Profile Information
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center justify-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base ${isDarkMode ? 'bg-[#141414] text-white hover:bg-gray-800 border border-white' : 'bg-white text-black hover:bg-gray-100 border border-black'
                  }`}
                  style={isDarkMode ? { backgroundColor: '#141414' } : {}}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              {/* User Avatar */}
              <div className="md:col-span-2 flex justify-center mb-4 sm:mb-6">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-bold shadow-lg ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}>
                    {user?.name || 'Not set'}
                  </div>
                )}
              </div>

              {/* Username */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Username</label>
                <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'
                  }`}>
                  @{user?.username || 'Not set'}
                </div>
                <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Username cannot be changed
                </p>
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}>
                    {user?.email || 'Not set'}
                  </div>
                )}
              </div>



              {/* Department */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    placeholder="e.g., Engineering, Marketing, Sales"
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}>
                    {user?.department || 'Not set'}
                  </div>
                )}
              </div>

              {/* Points Display - Only for users and managers */}
              {(user?.role === 'user' || user?.role === 'manager') && (
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Points</label>
                  <div className={`px-4 py-3 rounded-xl border font-medium flex items-center gap-3 ${
                    (user?.points || 0) >= 0 
                      ? isDarkMode 
                        ? 'bg-green-900/20 border-green-700 text-green-400' 
                        : 'bg-green-50 border-green-300 text-green-700'
                      : isDarkMode 
                        ? 'bg-red-900/20 border-red-700 text-red-400' 
                        : 'bg-red-50 border-red-300 text-red-700'
                  }`}>
                    <Star className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <span className="text-xl font-bold">
                      {user?.points !== undefined && user?.points !== null ? user.points : 0}
                    </span>
                    <span className="text-sm opacity-75 ml-auto">
                      {user?.points >= 0 ? 'Positive' : 'Negative'}
                    </span>
                  </div>
                  <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Earn points by completing projects on time or early
                  </p>
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}>
                    {user?.phone || 'Not set'}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    placeholder="e.g., New York, NY"
                  />
                ) : (
                  <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}>
                    {user?.location || 'Not set'}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Role</label>
                <div className={`px-4 py-3 rounded-xl border font-medium flex items-center ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}>
                  <Shield className="w-4 h-4 mr-2" />
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Team Member'}
                </div>
              </div>

              {/* Account Created */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Account Information</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div>
                        <div className="text-xs text-gray-500">Member Since</div>
                        <div>{formatDate(user?.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-3 rounded-xl border font-medium ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
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
              <div className="flex justify-end mt-6 sm:mt-8">
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className={`flex items-center px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Points Tab */}
        {activeTab === 'points' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className={`text-xl sm:text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Points
            </h2>

            {/* Current Points Display */}
            <div className="mb-8">
              <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Current Points
              </label>
              <div className={`px-6 py-4 rounded-xl border-2 font-medium flex items-center gap-4 ${
                (user?.points || 0) >= 0 
                  ? isDarkMode 
                    ? 'bg-green-900/20 border-green-700 text-green-400' 
                    : 'bg-green-50 border-green-300 text-green-700'
                  : isDarkMode 
                    ? 'bg-red-900/20 border-red-700 text-red-400' 
                    : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                <Star className={`w-8 h-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <span className="text-3xl font-bold">
                  {user?.points !== undefined && user?.points !== null ? user.points : 0}
                </span>
                <span className="text-sm opacity-75 ml-auto">
                  {user?.points >= 0 ? 'Positive' : 'Negative'}
                </span>
              </div>
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Earn points by completing projects on time or early. Points are deducted for late completions.
              </p>
            </div>

            {/* Points History */}
            <div>
              <h3 className={`text-lg sm:text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Points History
              </h3>

              {pointsHistoryLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : pointsHistory.length === 0 ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No points history yet</p>
                  <p className="text-sm mt-2">Complete projects to start earning points!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pointsHistory.map((record) => (
                    <div
                      key={record.id}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        record.reversed
                          ? isDarkMode
                            ? 'bg-gray-800/50 border-gray-700 opacity-60'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                          : isDarkMode
                            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Project Name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              record.points >= 0
                                ? isDarkMode
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-green-100 text-green-700'
                                : isDarkMode
                                  ? 'bg-red-900/30 text-red-400'
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {record.points >= 0 ? (
                                <TrendingUp className="w-5 h-5" />
                              ) : (
                                <TrendingUp className="w-5 h-5 rotate-180" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {record.projectTitle}
                              </h4>
                            </div>
                          </div>
                          
                          {/* Reason for Points */}
                          <div className="ml-12 mb-2">
                            <p className={`text-sm font-medium ${
                              record.reversed 
                                ? isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                : record.points >= 0
                                  ? isDarkMode ? 'text-green-300' : 'text-green-700'
                                  : isDarkMode ? 'text-red-300' : 'text-red-700'
                            }`}>
                              {record.reversed && (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mr-2 ${
                                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  REVERSED
                                </span>
                              )}
                              <span className="font-semibold">Reason: </span>
                              {record.description || 'Project completion'}
                            </p>
                          </div>
                          
                          {/* Dates */}
                          {record.completedDate && (
                            <div className="ml-12">
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Completed: <span className="font-medium">{formatDate(record.completedDate)}</span>
                                {record.dueDate && (
                                  <> • Due: <span className="font-medium">{formatDate(record.dueDate)}</span></>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Points Display */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-2xl font-bold mb-1 ${
                            record.points >= 0
                              ? isDarkMode ? 'text-green-400' : 'text-green-600'
                              : isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {record.points > 0 ? '+' : ''}{record.points}
                          </div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {new Date(record.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Security Settings
            </h2>

            <div className="max-w-full sm:max-w-md">
              <div className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 ${isDarkMode ? 'focus:ring-white/20 focus:border-white' : 'focus:ring-black/20 focus:border-black'} transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className={`w-full py-2.5 sm:py-3 text-sm sm:text-base font-bold ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm sm:text-base">Updating...</span>
                    </div>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserProfilePage;
