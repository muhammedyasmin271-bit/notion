import React, { useState, useEffect } from 'react';
import {
    Shield, Settings, Users, Database, Bell,
    Mail, Key, Palette, Globe, Lock,
    Trash2, Download, Upload, RefreshCw,
    AlertTriangle, CheckCircle, XCircle,
    User, Crown, Eye, EyeOff
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const AdminSettings = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        general: {
            siteName: 'Notion App',
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12-hour'
        },
        security: {
            passwordMinLength: 8,
            twoFactorAuth: false,
            sessionTimeout: 30,
            failedLoginAttempts: 5
        },
        notifications: {
            emailEnabled: true,
            pushEnabled: true,
            dailyDigest: true,
            weeklyReport: true
        },
        appearance: {
            theme: 'system',
            primaryColor: '#3b82f6',
            fontFamily: 'Inter'
        }
    });

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette }
    ];

    const handleSaveSettings = async () => {
        try {
            // In a real app, this would save to the server
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    };

    const renderGeneralSettings = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Site Name</label>
                <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, siteName: e.target.value }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                    value={settings.general.timezone}
                    onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, timezone: e.target.value }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                    value={settings.general.dateFormat}
                    onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, dateFormat: e.target.value }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Time Format</label>
                <select
                    value={settings.general.timeFormat}
                    onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, timeFormat: e.target.value }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                    <option value="12-hour">12-hour</option>
                    <option value="24-hour">24-hour</option>
                </select>
            </div>
        </div>
    );

    const renderSecuritySettings = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Minimum Password Length</label>
                <input
                    type="number"
                    min="6"
                    max="128"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, passwordMinLength: parseInt(e.target.value) }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Require 2FA for all users
                    </p>
                </div>
                <button
                    onClick={() => setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactorAuth: !settings.security.twoFactorAuth }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.security.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.security.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input
                    type="number"
                    min="1"
                    max="1440"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Failed Login Attempts</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.security.failedLoginAttempts}
                    onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, failedLoginAttempts: parseInt(e.target.value) }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
            </div>
        </div>
    );

    const renderNotificationSettings = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Send email notifications
                    </p>
                </div>
                <button
                    onClick={() => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailEnabled: !settings.notifications.emailEnabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.notifications.emailEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.notifications.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Send push notifications
                    </p>
                </div>
                <button
                    onClick={() => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, pushEnabled: !settings.notifications.pushEnabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.notifications.pushEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.notifications.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Daily Digest</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Send daily summary emails
                    </p>
                </div>
                <button
                    onClick={() => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, dailyDigest: !settings.notifications.dailyDigest }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.notifications.dailyDigest ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.notifications.dailyDigest ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">Weekly Reports</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Send weekly activity reports
                    </p>
                </div>
                <button
                    onClick={() => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, weeklyReport: !settings.notifications.weeklyReport }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.notifications.weeklyReport ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.notifications.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>
        </div>
    );

    const renderAppearanceSettings = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                    value={settings.appearance.theme}
                    onChange={(e) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, theme: e.target.value }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <div className="flex space-x-2">
                    {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'].map((color) => (
                        <button
                            key={color}
                            onClick={() => setSettings({
                                ...settings,
                                appearance: { ...settings.appearance, primaryColor: color }
                            })}
                            className={`w-8 h-8 rounded-full ${settings.appearance.primaryColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Font Family</label>
                <select
                    value={settings.appearance.fontFamily}
                    onChange={(e) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, fontFamily: e.target.value }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                </select>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralSettings();
            case 'security':
                return renderSecuritySettings();
            case 'notifications':
                return renderNotificationSettings();
            case 'appearance':
                return renderAppearanceSettings();
            default:
                return renderGeneralSettings();
        }
    };

    return (
        <RoleGuard requiredRole="admin" fallback={
            <div className="p-8 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
        }>
            <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <Shield className="w-8 h-8 mr-3 text-blue-500" />
                            <h1 className="text-3xl font-bold">Admin Settings</h1>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Manage system-wide settings and configurations
                        </p>
                    </div>

                    <div className={`rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex flex-col md:flex-row">
                            {/* Sidebar */}
                            <div className={`md:w-64 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="p-6">
                                    <h2 className="text-lg font-bold mb-6">Settings</h2>
                                    <nav className="space-y-2">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <Icon className="w-5 h-5 mr-3" />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-bold">
                                        {tabs.find(tab => tab.id === activeTab)?.label}
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {renderContent()}
                                    <div className="flex justify-end mt-8">
                                        <button
                                            onClick={handleSaveSettings}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </RoleGuard>
    );
};

export default AdminSettings;