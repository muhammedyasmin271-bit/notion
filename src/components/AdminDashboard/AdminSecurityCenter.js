import React, { useState } from 'react';
import {
    Shield, Key, Lock, Unlock, Eye, EyeOff,
    AlertTriangle, CheckCircle, XCircle, RefreshCw,
    User, Users, Settings, Database, Network,
    Bell, Mail, Phone, MapPin, Clock
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const AdminSecurityCenter = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [showPassword, setShowPassword] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Security Overview', icon: Shield },
        { id: 'password-policy', label: 'Password Policy', icon: Key },
        { id: 'user-access', label: 'User Access', icon: User },
        { id: 'alerts', label: 'Security Alerts', icon: AlertTriangle }
    ];

    // Mock security data
    const securityOverview = {
        overallScore: 87,
        vulnerabilities: 3,
        threatsBlocked: 1248,
        lastScan: '2023-05-15T14:30:00Z'
    };

    const passwordPolicy = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 90,
        historyCount: 5
    };

    const securityAlerts = [
        {
            id: 1,
            type: 'failed-login',
            severity: 'high',
            user: 'john.doe@example.com',
            ip: '192.168.1.100',
            timestamp: '2023-05-15T14:30:00Z',
            location: 'New York, NY',
            status: 'resolved'
        },
        {
            id: 2,
            type: 'suspicious-activity',
            severity: 'medium',
            user: 'jane.smith@example.com',
            ip: '192.168.1.101',
            timestamp: '2023-05-15T13:45:00Z',
            location: 'Los Angeles, CA',
            status: 'investigating'
        },
        {
            id: 3,
            type: 'unauthorized-access',
            severity: 'critical',
            user: 'mike.johnson@example.com',
            ip: '192.168.1.102',
            timestamp: '2023-05-15T12:20:00Z',
            location: 'Chicago, IL',
            status: 'open'
        }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Security Score</h3>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Run Security Scan
                    </button>
                </div>

                <div className="flex items-center justify-center">
                    <div className="relative">
                        <div className="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-4xl font-bold">{securityOverview.overallScore}</span>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Security Score</p>
                            </div>
                        </div>
                        <div
                            className="absolute top-0 left-0 w-48 h-48 rounded-full border-8 border-green-500 clip-path-half"
                            style={{
                                clipPath: `inset(0 ${100 - securityOverview.overallScore}% 0 0)`
                            }}
                        ></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center">
                            <AlertTriangle className="w-8 h-8 text-yellow-500 mr-3" />
                            <div>
                                <p className="text-2xl font-bold">{securityOverview.vulnerabilities}</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vulnerabilities</p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center">
                            <Shield className="w-8 h-8 text-green-500 mr-3" />
                            <div>
                                <p className="text-2xl font-bold">{securityOverview.threatsBlocked}</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Threats Blocked</p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center">
                            <Clock className="w-8 h-8 text-blue-500 mr-3" />
                            <div>
                                <p className="text-lg font-bold">
                                    {new Date(securityOverview.lastScan).toLocaleDateString()}
                                </p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Scan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-xl font-bold mb-4">Recent Security Alerts</h3>
                    <div className="space-y-4">
                        {securityAlerts.slice(0, 3).map(alert => (
                            <div key={alert.id} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {alert.severity === 'critical' && <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />}
                                        {alert.severity === 'high' && <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />}
                                        {alert.severity === 'medium' && <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />}
                                        <span className="font-medium">{alert.user}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${alert.status === 'open' ? 'bg-red-100 text-red-800' :
                                            alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {alert.status}
                                    </span>
                                </div>
                                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {new Date(alert.timestamp).toLocaleString()} • {alert.location}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-xl font-bold mb-4">Security Recommendations</h3>
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium">Enable Two-Factor Authentication</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Add an extra layer of security to all user accounts
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium">Update Password Policy</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Strengthen password requirements for better security
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-start">
                                <Shield className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium">Review User Permissions</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Ensure users have appropriate access levels
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPasswordPolicy = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xl font-bold mb-6">Password Policy Configuration</h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Minimum Password Length</label>
                        <input
                            type="number"
                            min="6"
                            max="128"
                            defaultValue={passwordPolicy.minLength}
                            className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={passwordPolicy.requireUppercase}
                                    className="rounded"
                                />
                                <span className="ml-2">Require Uppercase Letters</span>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={passwordPolicy.requireLowercase}
                                    className="rounded"
                                />
                                <span className="ml-2">Require Lowercase Letters</span>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={passwordPolicy.requireNumbers}
                                    className="rounded"
                                />
                                <span className="ml-2">Require Numbers</span>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    defaultChecked={passwordPolicy.requireSpecialChars}
                                    className="rounded"
                                />
                                <span className="ml-2">Require Special Characters</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Password Expiration (Days)</label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                defaultValue={passwordPolicy.expirationDays}
                                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Password History Count</label>
                            <input
                                type="number"
                                min="1"
                                max="24"
                                defaultValue={passwordPolicy.historyCount}
                                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Save Policy
                    </button>
                </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xl font-bold mb-4">Password Strength Requirements</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span>Very Weak</span>
                        <div className="w-32 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-500">0-20%</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span>Weak</span>
                        <div className="w-32 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-500">21-40%</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span>Medium</span>
                        <div className="w-32 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-yellow-500">41-60%</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span>Strong</span>
                        <div className="w-32 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-500">61-80%</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span>Very Strong</span>
                        <div className="w-32 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-500">81-100%</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUserAccess = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xl font-bold mb-6">User Access Management</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <th className="text-left py-3 px-4">User</th>
                                <th className="text-left py-3 px-4">Role</th>
                                <th className="text-left py-3 px-4">Last Login</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map(item => (
                                <tr key={item} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                                U
                                            </div>
                                            <div>
                                                <div className="font-medium">User {item}</div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>user{item}@example.com</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">User</span>
                                    </td>
                                    <td className="py-3 px-4">2 hours ago</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex space-x-2">
                                            <button className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                                                <Lock className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-xl font-bold mb-4">Role-Based Access Control</h3>
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Admin</span>
                                <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">5 users</span>
                            </div>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Full system access and administrative privileges
                            </p>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Manager</span>
                                <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">12 users</span>
                            </div>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Manage projects and team members
                            </p>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">User</span>
                                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">145 users</span>
                            </div>
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Standard user access to projects and documents
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-xl font-bold mb-4">Access Logs</h3>
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                <div>
                                    <p className="font-medium">User 3 accessed Project Alpha</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>2 minutes ago</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                <div>
                                    <p className="font-medium">Manager 1 updated meeting notes</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>15 minutes ago</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3" />
                                <div>
                                    <p className="font-medium">Failed login attempt</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1 hour ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAlerts = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Security Alerts</h3>
                    <div className="flex space-x-3">
                        <select className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                            <option>All Alerts</option>
                            <option>Open</option>
                            <option>Investigating</option>
                            <option>Resolved</option>
                        </select>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {securityAlerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {alert.severity === 'critical' && <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />}
                                    {alert.severity === 'high' && <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />}
                                    {alert.severity === 'medium' && <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />}
                                    <div>
                                        <p className="font-medium">
                                            {alert.type === 'failed-login' && 'Failed Login Attempt'}
                                            {alert.type === 'suspicious-activity' && 'Suspicious Activity'}
                                            {alert.type === 'unauthorized-access' && 'Unauthorized Access'}
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            User: {alert.user}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${alert.status === 'open' ? 'bg-red-100 text-red-800' :
                                            alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>
                                        {alert.status}
                                    </span>
                                    <button className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="flex items-center">
                                    <Network className="w-4 h-4 mr-2 text-gray-500" />
                                    <span className="text-sm">{alert.ip}</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                                    <span className="text-sm">{alert.location}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                    <span className="text-sm">
                                        {new Date(alert.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-4">
                                <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                                    Ignore
                                </button>
                                <button className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                                    Investigate
                                </button>
                                <button className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                    Resolve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'password-policy':
                return renderPasswordPolicy();
            case 'user-access':
                return renderUserAccess();
            case 'alerts':
                return renderAlerts();
            default:
                return renderOverview();
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
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <Shield className="w-8 h-8 mr-3 text-blue-500" />
                            <h1 className="text-3xl font-bold">Security Center</h1>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Monitor and manage system security settings
                        </p>
                    </div>

                    <div className={`rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex flex-col md:flex-row">
                            {/* Sidebar */}
                            <div className={`md:w-64 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="p-6">
                                    <h2 className="text-lg font-bold mb-6">Security</h2>
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
                                <div className="p-6">
                                    {renderContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
};

export default AdminSecurityCenter;