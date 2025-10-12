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
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Email Notifications</h3>
            <div className="space-y-2">
              {[
                { key: 'emailMentions', label: 'When someone mentions me' },
                { key: 'emailAssignments', label: 'When I\'m assigned to a task' },
                { key: 'emailDeadlines', label: 'Deadline reminders' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              In-App Notifications
            </h3>
            <div className="space-y-2">
              {[
                { key: 'inAppNotifications', label: 'Show in-app notifications' },
                { key: 'soundEnabled', label: 'Play notification sounds' },
                { key: 'pushNotifications', label: 'Browser push notifications' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Editor Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Default Font Size</label>
            <select
              value={editor.fontSize}
              onChange={(e) => setEditor({...editor, fontSize: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
            <select
              value={editor.fontFamily}
              onChange={(e) => setEditor({...editor, fontFamily: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Arial">Arial</option>
              <option value="Monaco">Monaco</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Auto-save Interval (seconds)</label>
            <select
              value={editor.autoSaveInterval}
              onChange={(e) => setEditor({...editor, autoSaveInterval: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="120">2 minutes</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editor.markdownShortcuts}
                onChange={(e) => setEditor({...editor, markdownShortcuts: e.target.checked})}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm">Enable Markdown shortcuts</span>
            </label>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        Save Preferences
      </button>
    </div>
  );
};

export default PreferencesTab;