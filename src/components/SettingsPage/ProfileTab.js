import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const ProfileTab = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    jobTitle: '',
    department: '',
    phoneNumber: ''
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
            jobTitle: userData.jobTitle || '',
            department: userData.department || '',
            phoneNumber: userData.phone || ''
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
      console.log('Saving profile data:', {
        name: profile.name,
        email: profile.email,
        department: profile.department,
        phone: profile.phoneNumber
      });
      
      const response = await fetch('http://localhost:9000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          department: profile.department,
          phone: profile.phoneNumber
        })
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile updated:', data);
        alert('Profile updated successfully!');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }));
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
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
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Basic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
          <input
            type="text"
            value={profile.jobTitle}
            onChange={(e) => setProfile({...profile, jobTitle: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your job title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
          <input
            type="text"
            value={profile.department}
            onChange={(e) => setProfile({...profile, department: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your department"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={profile.phoneNumber}
            onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your phone number"
          />
        </div>
      </div>
      
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

export default ProfileTab;