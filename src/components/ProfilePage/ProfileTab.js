import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const ProfileTab = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:9000/api/users/profile', {
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
      const response = await fetch('http://localhost:9000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Profile updated successfully!');
        // Update localStorage user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to update profile'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-6 sm:py-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">Basic Information</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300 mb-3">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300 mb-3">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your email"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300 mb-3">Phone</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({...profile, phone: e.target.value})}
            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your phone number"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300 mb-3">Department</label>
          <input
            type="text"
            value={profile.department}
            onChange={(e) => setProfile({...profile, department: e.target.value})}
            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your department"
          />
        </div>
        
        <div className="lg:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-300 mb-3">Location</label>
          <input
            type="text"
            value={profile.location}
            onChange={(e) => setProfile({...profile, location: e.target.value})}
            className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-500"
            placeholder="Enter your location"
          />
        </div>
      </div>
      
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-medium text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;