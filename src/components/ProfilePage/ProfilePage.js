import React, { useState } from 'react';
import { User, Shield, Settings } from 'lucide-react';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import PreferencesTab from './PreferencesTab';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:px-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-center sm:text-left px-2 sm:px-0">Account Settings</h1>
        
        <div className="bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden mx-2 sm:mx-0">
          <div className="flex border-b border-gray-700 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-4 font-medium transition-all duration-200 min-h-[44px] sm:min-h-[60px] flex-1 text-center whitespace-nowrap min-w-0 ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 active:bg-gray-600'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-base font-medium truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;