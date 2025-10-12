import React, { useState } from 'react';
import {
    Database, Download, Upload, Trash2, RefreshCw,
    FileText, Image, Video, Music, Archive,
    Search, Filter, Settings, Shield, AlertTriangle,
    CheckCircle, XCircle, Clock, Eye, EyeOff
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const AdminDataManagement = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'overview', label: 'Data Overview', icon: Database },
        { id: 'backup', label: 'Backup & Restore', icon: Archive },
        { id: 'cleanup', label: 'Data Cleanup', icon: Trash2 },
        { id: 'import-export', label: 'Import/Export', icon: Download }
    ];

    // Mock data
    const dataStats = {
        totalSize: '2.4 GB',
        totalFiles: 1248,
        documents: 842,
        images: 267,
        videos: 89,
        audio: 50
    };

    const backupHistory = [
        { id: 1, date: '2023-05-15', size: '1.2 GB', status: 'completed' },
        { id: 2, date: '2023-05-01', size: '1.1 GB', status: 'completed' },
        { id: 3, date: '2023-04-15', size: '1.0 GB', status: 'completed' },
        { id: 4, date: '2023-04-01', size: '0.9 GB', status: 'failed' }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Data Size</p>
                            <p className="text-3xl font-bold mt-2">{dataStats.totalSize}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Database className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Files</p>
                            <p className="text-3xl font-bold mt-2">{dataStats.totalFiles}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <FileText className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Backup</p>
                            <p className="text-lg font-bold mt-2">2023-05-15</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1.2 GB</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Archive className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4">File Type Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="font-bold">{dataStats.documents}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Documents</p>
                    </div>

                    <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <Image className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="font-bold">{dataStats.images}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Images</p>
                    </div>

                    <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <Video className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <p className="font-bold">{dataStats.videos}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Videos</p>
                    </div>

                    <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <Music className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="font-bold">{dataStats.audio}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Audio</p>
                    </div>

                    <div className={`p-4 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <Archive className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="font-bold">156</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Archives</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">Storage Usage</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Documents</span>
                                <span>1.2 GB (50%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Images</span>
                                <span>0.6 GB (25%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Videos</span>
                                <span>0.4 GB (17%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '17%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Other</span>
                                <span>0.2 GB (8%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-gray-600 h-2 rounded-full" style={{ width: '8%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                <div>
                                    <p className="font-medium">Backup completed successfully</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>2 hours ago</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 text-blue-500 mr-3" />
                                <div>
                                    <p className="font-medium">New document uploaded</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>5 hours ago</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3" />
                                <div>
                                    <p className="font-medium">Storage usage at 85%</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1 day ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBackup = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Backup Management</h3>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Create Backup
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Auto Backup</p>
                        <p className="text-lg font-bold">Daily at 2:00 AM</p>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Retention Period</p>
                        <p className="text-lg font-bold">30 Days</p>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Storage Location</p>
                        <p className="text-lg font-bold">Cloud Storage</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <th className="text-left py-3 px-4">Date</th>
                                <th className="text-left py-3 px-4">Size</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backupHistory.map((backup) => (
                                <tr key={backup.id} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <td className="py-3 px-4">{backup.date}</td>
                                    <td className="py-3 px-4">{backup.size}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {backup.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex space-x-2">
                                            <button className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderCleanup = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xl font-bold mb-6">Data Cleanup</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold">Temporary Files</h4>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>247 files, 125 MB</p>
                            </div>
                            <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Clean
                            </button>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold">Old Backups</h4>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>12 files, 842 MB</p>
                            </div>
                            <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Clean
                            </button>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold">Duplicate Files</h4>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>63 files, 42 MB</p>
                            </div>
                            <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Clean
                            </button>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold">Trash</h4>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>89 files, 67 MB</p>
                            </div>
                            <button className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Empty
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xl font-bold mb-4">Custom Cleanup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">File Age</label>
                        <select className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                            <option>Older than 30 days</option>
                            <option>Older than 90 days</option>
                            <option>Older than 180 days</option>
                            <option>Older than 1 year</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">File Type</label>
                        <select className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                            <option>All Types</option>
                            <option>Documents</option>
                            <option>Images</option>
                            <option>Videos</option>
                            <option>Audio</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Run Cleanup
                    </button>
                </div>
            </div>
        </div>
    );

    const renderImportExport = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-xl font-bold mb-4">Export Data</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Export Format</label>
                            <select className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                                <option>JSON</option>
                                <option>CSV</option>
                                <option>Excel</option>
                                <option>PDF</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Data to Export</label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" className="rounded" defaultChecked />
                                    <span className="ml-2">Users</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" className="rounded" defaultChecked />
                                    <span className="ml-2">Projects</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" className="rounded" />
                                    <span className="ml-2">Documents</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" className="rounded" />
                                    <span className="ml-2">Meetings</span>
                                </label>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                        </button>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-xl font-bold mb-4">Import Data</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Import File</label>
                            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Drag and drop files here</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>or click to browse</p>
                                <input type="file" className="hidden" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Import Options</label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input type="checkbox" className="rounded" defaultChecked />
                                    <span className="ml-2">Overwrite existing data</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="checkbox" className="rounded" />
                                    <span className="ml-2">Send notifications</span>
                                </label>
                            </div>
                        </div>

                        <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'backup':
                return renderBackup();
            case 'cleanup':
                return renderCleanup();
            case 'import-export':
                return renderImportExport();
            default:
                return renderOverview();
        }
    };

    return (
        <RoleGuard requiredRole="admin" fallback={
            <div className="p-8 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
        }>
            <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <Database className="w-8 h-8 mr-3 text-blue-500" />
                            <h1 className="text-3xl font-bold">Data Management</h1>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Manage system data, backups, and cleanup operations
                        </p>
                    </div>

                    <div className={`rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex flex-col md:flex-row">
                            {/* Sidebar */}
                            <div className={`md:w-64 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="p-6">
                                    <h2 className="text-lg font-bold mb-6">Data Management</h2>
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

export default AdminDataManagement;