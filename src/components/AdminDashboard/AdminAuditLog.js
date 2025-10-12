import React, { useState, useEffect } from 'react';
import {
    FileText, Calendar, Clock, Search, Filter,
    Eye, EyeOff, CheckCircle, XCircle, AlertTriangle,
    User, Settings, Database, Shield, Download
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const AdminAuditLog = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAppContext();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [dateRange, setDateRange] = useState('last30days');

    // Mock audit log data
    const mockLogs = [
        {
            id: 1,
            user: 'John Doe',
            action: 'Created new project',
            resource: 'Project Alpha',
            type: 'project',
            timestamp: '2023-05-15T14:30:00Z',
            ip: '192.168.1.100',
            status: 'success'
        },
        {
            id: 2,
            user: 'Jane Smith',
            action: 'Deleted document',
            resource: 'Financial Report Q1',
            type: 'document',
            timestamp: '2023-05-15T13:45:00Z',
            ip: '192.168.1.101',
            status: 'success'
        },
        {
            id: 3,
            user: 'Mike Johnson',
            action: 'Failed login attempt',
            resource: 'Login',
            type: 'security',
            timestamp: '2023-05-15T12:20:00Z',
            ip: '192.168.1.102',
            status: 'failed'
        },
        {
            id: 4,
            user: 'Sarah Wilson',
            action: 'Updated user role',
            resource: 'User: Alex Brown',
            type: 'user',
            timestamp: '2023-05-15T11:15:00Z',
            ip: '192.168.1.103',
            status: 'success'
        },
        {
            id: 5,
            user: 'Admin User',
            action: 'Changed system settings',
            resource: 'Email configuration',
            type: 'system',
            timestamp: '2023-05-15T10:30:00Z',
            ip: '192.168.1.104',
            status: 'success'
        },
        {
            id: 6,
            user: 'Robert Davis',
            action: 'Created meeting',
            resource: 'Team Sync Q2',
            type: 'meeting',
            timestamp: '2023-05-15T09:45:00Z',
            ip: '192.168.1.105',
            status: 'success'
        },
        {
            id: 7,
            user: 'Lisa Miller',
            action: 'Accessed restricted file',
            resource: 'Confidential Data',
            type: 'security',
            timestamp: '2023-05-15T08:20:00Z',
            ip: '192.168.1.106',
            status: 'denied'
        }
    ];

    useEffect(() => {
        setLogs(mockLogs);
        setFilteredLogs(mockLogs);
    }, []);

    useEffect(() => {
        let result = logs;

        // Apply search filter
        if (searchTerm) {
            result = result.filter(log =>
                log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.resource.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            result = result.filter(log => log.type === filterType);
        }

        // Apply user filter
        if (filterUser !== 'all') {
            result = result.filter(log => log.user === filterUser);
        }

        setFilteredLogs(result);
    }, [searchTerm, filterType, filterUser, logs]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'project': return <FileText className="w-4 h-4" />;
            case 'document': return <FileText className="w-4 h-4" />;
            case 'user': return <User className="w-4 h-4" />;
            case 'meeting': return <Calendar className="w-4 h-4" />;
            case 'security': return <Shield className="w-4 h-4" />;
            case 'system': return <Settings className="w-4 h-4" />;
            default: return <Database className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'denied': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const exportLogs = (format) => {
        alert(`Exporting audit logs in ${format} format...`);
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
                            <FileText className="w-8 h-8 mr-3 text-blue-500" />
                            <h1 className="text-3xl font-bold">Audit Log</h1>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Track all system activities and user actions
                        </p>
                    </div>

                    <div className={`rounded-2xl shadow-lg p-6 mb-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`pl-10 pr-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    />
                                </div>

                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                >
                                    <option value="all">All Types</option>
                                    <option value="project">Projects</option>
                                    <option value="document">Documents</option>
                                    <option value="user">Users</option>
                                    <option value="meeting">Meetings</option>
                                    <option value="security">Security</option>
                                    <option value="system">System</option>
                                </select>

                                <select
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                    className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                >
                                    <option value="all">All Users</option>
                                    <option value="John Doe">John Doe</option>
                                    <option value="Jane Smith">Jane Smith</option>
                                    <option value="Mike Johnson">Mike Johnson</option>
                                    <option value="Sarah Wilson">Sarah Wilson</option>
                                    <option value="Admin User">Admin User</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                >
                                    <option value="last7days">Last 7 Days</option>
                                    <option value="last30days">Last 30 Days</option>
                                    <option value="last90days">Last 90 Days</option>
                                </select>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => exportLogs('csv')}
                                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={() => exportLogs('pdf')}
                                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <th className="text-left py-3 px-4">Timestamp</th>
                                        <th className="text-left py-3 px-4">User</th>
                                        <th className="text-left py-3 px-4">Action</th>
                                        <th className="text-left py-3 px-4">Resource</th>
                                        <th className="text-left py-3 px-4">Type</th>
                                        <th className="text-left py-3 px-4">IP Address</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium">{log.user}</td>
                                            <td className="py-3 px-4">{log.action}</td>
                                            <td className="py-3 px-4">{log.resource}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <div className={`p-1 rounded mr-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                        {getTypeIcon(log.type)}
                                                    </div>
                                                    <span className="capitalize">{log.type}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-sm">{log.ip}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredLogs.length === 0 && (
                            <div className="text-center py-12">
                                <FileText className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                                <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Try adjusting your filters or search terms
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Activities</p>
                                    <p className="text-3xl font-bold mt-2">1,248</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Security Events</p>
                                    <p className="text-3xl font-bold mt-2">24</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <Shield className="w-8 h-8 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Failed Attempts</p>
                                    <p className="text-3xl font-bold mt-2">7</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-xl">
                                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
};

export default AdminAuditLog;