import React, { useState } from 'react';
import { User, Shield, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import PreferencesTab from './PreferencesTab';
import ThemeToggle from '../common/ThemeToggle';

const SettingsPage = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <ThemeToggle />
        </div>
        
        <div className={`rounded-lg overflow-hidden border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`flex border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-6 sm:py-4 text-sm sm:text-base font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-base">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="p-6">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;