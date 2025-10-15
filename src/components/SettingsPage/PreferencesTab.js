import React, { useState, useEffect } from 'react';
import { Save, Bell, Volume2, Mail, Send, MessageSquare, Moon, BarChart3 } from 'lucide-react';
import axios from 'axios';

const PreferencesTab = () => {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    soundEnabled: true,
    pushNotifications: false,
    smsNotifications: false
  });

  const [quietHours, setQuietHours] = useState({
    enabled: true,
    start: '22:00',
    end: '08:00'
  });

  const [smsUsage, setSmsUsage] = useState({
    sent: 0,
    limit: 10,
    remaining: 10,
    resetsIn: 0
  });

  const [editor, setEditor] = useState({
    fontSize: '14',
    fontFamily: 'Inter',
    autoSaveInterval: '30',
    markdownShortcuts: true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testSmsLoading, setTestSmsLoading] = useState(false);

  // Load current user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:9000/api/users/profile', {
          headers: { 'x-auth-token': token }
        });
        
        if (response.data.preferences?.notifications) {
          setNotifications(prev => ({
            ...prev,
            emailNotifications: response.data.preferences.notifications.email !== false,
            pushNotifications: response.data.preferences.notifications.push !== false,
            smsNotifications: response.data.preferences.notifications.sms === true
          }));
        }

        if (response.data.preferences?.quietHours) {
          setQuietHours(response.data.preferences.quietHours);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Load SMS usage statistics
  useEffect(() => {
    const loadSMSUsage = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:9000/api/notifications/sms-usage', {
          headers: { 'x-auth-token': token }
        });
        setSmsUsage(response.data);
      } catch (error) {
        console.error('Error loading SMS usage:', error);
      }
    };
    
    if (notifications.smsNotifications) {
      loadSMSUsage();
      // Refresh every 30 seconds
      const interval = setInterval(loadSMSUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [notifications.smsNotifications]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Save email notification preference
      await axios.patch('http://localhost:9000/api/notifications/email-settings', 
        { emailNotifications: notifications.emailNotifications },
        { headers: { 'x-auth-token': token } }
      );
      
      // Save SMS notification preference
      await axios.patch('http://localhost:9000/api/notifications/sms-settings', 
        { smsNotifications: notifications.smsNotifications },
        { headers: { 'x-auth-token': token } }
      );

      // Save quiet hours settings
      await axios.patch('http://localhost:9000/api/notifications/quiet-hours',
        quietHours,
        { headers: { 'x-auth-token': token } }
      );
      
      setMessage('Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:9000/api/notifications/test-email', 
        {},
        { headers: { 'x-auth-token': token } }
      );
      
      setMessage(`Test email sent to ${response.data.email}!`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage(error.response?.data?.message || 'Failed to send test email. Make sure you have an email configured.');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleTestSms = async () => {
    setTestSmsLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:9000/api/notifications/test-sms', 
        {},
        { headers: { 'x-auth-token': token } }
      );
      
      setMessage(`Test SMS sent to ${response.data.phone}!`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setMessage(error.response?.data?.message || 'Failed to send test SMS. Make sure you have a phone number configured.');
    } finally {
      setTestSmsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        
        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('Failed') || message.includes('error') 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-green-500/20 text-green-400'
          }`}>
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Notifications
              </h3>
              <button
                onClick={handleTestEmail}
                disabled={testEmailLoading || !notifications.emailNotifications}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-3 h-3" />
                {testEmailLoading ? 'Sending...' : 'Test Email'}
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Enable email notifications for tasks, meetings, and updates</span>
              </label>
              <p className="text-xs text-gray-400 ml-7">
                Make sure you have an email configured in your profile to receive email notifications
              </p>
            </div>
          </div>
          
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Notifications
              </h3>
              <button
                onClick={handleTestSms}
                disabled={testSmsLoading || !notifications.smsNotifications}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Send className="w-3 h-3" />
                {testSmsLoading ? 'Sending...' : 'Test SMS'}
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notifications.smsNotifications}
                  onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Enable SMS notifications for urgent tasks and meetings</span>
              </label>
              <p className="text-xs text-gray-400 ml-7">
                Make sure you have a phone number configured in your profile to receive SMS notifications
              </p>
              
              {notifications.smsNotifications && (
                <div className="mt-3 p-3 bg-gray-600/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      SMS Usage (Last Hour)
                    </span>
                    <span className="text-xs text-gray-400">
                      {smsUsage.sent}/{smsUsage.limit} sent
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        smsUsage.sent >= smsUsage.limit ? 'bg-red-500' : 
                        smsUsage.sent >= smsUsage.limit * 0.8 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((smsUsage.sent / smsUsage.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {smsUsage.remaining} SMS remaining
                    {smsUsage.resetsIn > 0 && ` • Resets in ${smsUsage.resetsIn} min`}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Quiet Hours (SMS)
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={quietHours.enabled}
                  onChange={(e) => setQuietHours({...quietHours, enabled: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Enable quiet hours (no SMS during this time)</span>
              </label>
              
              {quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 ml-7">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={quietHours.start}
                      onChange={(e) => setQuietHours({...quietHours, start: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">End Time</label>
                    <input
                      type="time"
                      value={quietHours.end}
                      onChange={(e) => setQuietHours({...quietHours, end: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-400 ml-7">
                SMS notifications won't be sent during quiet hours
              </p>
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
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
};

export default PreferencesTab;