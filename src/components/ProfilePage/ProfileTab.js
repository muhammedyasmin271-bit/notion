import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';
import { useTheme } from '../../context/ThemeContext';

const ProfileTab = () => {
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    onConfirm: null,
    showCancel: false
  });

  // Helper function to show confirmation dialog
  const showConfirmation = (title, message, type = 'info', confirmText = 'OK', onConfirm = null, showCancel = false) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      onConfirm,
      showCancel
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/users/profile`, {
          headers: { 'x-auth-token': token }
        });
        if (response.ok) {
          const userData = await response.json();
          setProfile({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            department: userData.department || '',
            location: userData.location || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const data = await response.json();
        showConfirmation('Success', 'Profile updated successfully!', 'success');
        // Update localStorage user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
      } else {
        const errorData = await response.json();
        showConfirmation('Update Failed', `Error: ${errorData.message || 'Failed to update profile'}`, 'danger');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showConfirmation('Save Failed', 'Failed to save profile. Please try again.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-6 sm:py-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-center sm:text-left">Basic Information</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your email"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Phone</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({...profile, phone: e.target.value})}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your phone number"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Department</label>
          <input
            type="text"
            value={profile.department}
            onChange={(e) => setProfile({...profile, department: e.target.value})}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your department"
          />
        </div>
        
        <div className="lg:col-span-2 space-y-2">
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Location</label>
          <input
            type="text"
            value={profile.location}
            onChange={(e) => setProfile({...profile, location: e.target.value})}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your location"
          />
        </div>
      </div>
      
      <div className="pt-3 sm:pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText={confirmationModal.confirmText}
        showCancel={confirmationModal.showCancel}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default ProfileTab;