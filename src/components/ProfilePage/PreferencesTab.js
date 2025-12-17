import React, { useState } from 'react';
import { Save, Bell, Volume2 } from 'lucide-react';

const PreferencesTab = () => {
  const [notifications, setNotifications] = useState({
    emailMentions: true,
    emailAssignments: true,
    emailDeadlines: false,
    inAppNotifications: true,
    soundEnabled: true,
    pushNotifications: false
  });

  const [editor, setEditor] = useState({
    fontSize: '14',
    fontFamily: 'Inter',
    autoSaveInterval: '30',
    markdownShortcuts: true
  });

  const handleSave = () => {
    console.log('Saving preferences:', { notifications, editor });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          Notifications
        </h2>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-600/50">
            <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Email Notifications</h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: 'emailMentions', label: 'When someone mentions me' },
                { key: 'emailAssignments', label: 'When I\'m assigned to a task' },
                { key: 'emailDeadlines', label: 'Deadline reminders' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-4 cursor-pointer p-2 rounded-lg hover:bg-gray-600/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-base select-none">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-600/50">
            <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2 sm:gap-3">
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
              In-App Notifications
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: 'inAppNotifications', label: 'Show in-app notifications' },
                { key: 'soundEnabled', label: 'Play notification sounds' },
                { key: 'pushNotifications', label: 'Browser push notifications' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-4 cursor-pointer p-2 rounded-lg hover:bg-gray-600/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                    className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-base select-none">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 text-center sm:text-left">Editor Settings</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Default Font Size</label>
            <select
              value={editor.fontSize}
              onChange={(e) => setEditor({...editor, fontSize: e.target.value})}
              className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500 cursor-pointer"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
            </select>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Font Family</label>
            <select
              value={editor.fontFamily}
              onChange={(e) => setEditor({...editor, fontFamily: e.target.value})}
              className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500 cursor-pointer"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Arial">Arial</option>
              <option value="Monaco">Monaco</option>
            </select>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Auto-save Interval</label>
            <select
              value={editor.autoSaveInterval}
              onChange={(e) => setEditor({...editor, autoSaveInterval: e.target.value})}
              className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-gray-700 border border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base transition-all duration-200 hover:border-gray-500 cursor-pointer"
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="120">2 minutes</option>
            </select>
          </div>
          
          <div className="flex items-center justify-center lg:justify-start">
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl hover:bg-gray-700/30 transition-colors">
              <input
                type="checkbox"
                checked={editor.markdownShortcuts}
                onChange={(e) => setEditor({...editor, markdownShortcuts: e.target.checked})}
                className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-base select-none">Enable Markdown shortcuts</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="pt-3 sm:pt-4">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default PreferencesTab;