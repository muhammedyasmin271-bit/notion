import React, { useState, useEffect } from 'react';
import {
    BarChart3, PieChart, LineChart, TrendingUp,
    Users, FileText, Calendar, MessageSquare,
    Download, Filter, Search, Eye, EyeOff,
    CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const AdminReports = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('last30days');
    const [reports, setReports] = useState([]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'user-activity', label: 'User Activity', icon: Users },
        { id: 'project-metrics', label: 'Project Metrics', icon: FileText },
        { id: 'meeting-insights', label: 'Meeting Insights', icon: Calendar }
    ];

    // Mock data for reports
    const userActivityData = [
        { date: '2023-05-01', activeUsers: 45, newUsers: 5 },
        { date: '2023-05-02', activeUsers: 52, newUsers: 3 },
        { date: '2023-05-03', activeUsers: 48, newUsers: 7 },
        { date: '2023-05-04', activeUsers: 61, newUsers: 4 },
        { date: '2023-05-05', activeUsers: 55, newUsers: 6 },
        { date: '2023-05-06', activeUsers: 47, newUsers: 2 },
        { date: '2023-05-07', activeUsers: 58, newUsers: 8 }
    ];

    const projectMetricsData = [
        { status: 'Completed', count: 24, color: 'bg-green-500' },
        { status: 'In Progress', count: 32, color: 'bg-blue-500' },
        { status: 'Pending', count: 12, color: 'bg-yellow-500' },
        { status: 'On Hold', count: 8, color: 'bg-red-500' }
    ];

    const meetingInsightsData = [
        { type: 'Team Meetings', count: 42, duration: '2.5 hrs' },
        { type: 'Client Calls', count: 18, duration: '4.2 hrs' },
        { type: 'Brainstorming', count: 12, duration: '3.1 hrs' },
        { type: 'Reviews', count: 28, duration: '1.8 hrs' }
    ];

    const exportReport = (format) => {
        alert(`Exporting report in ${format} format...`);
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                            <p className="text-3xl font-bold mt-2">1,248</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Projects</p>
                            <p className="text-3xl font-bold mt-2">86</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <FileText className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Meetings</p>
                            <p className="text-3xl font-bold mt-2">142</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Calendar className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Messages</p>
                            <p className="text-3xl font-bold mt-2">3,421</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <MessageSquare className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="text-lg font-bold mb-4">User Activity Trend</h3>
                    <div className="h-64 flex items-end space-x-2">
                        {userActivityData.map((data, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div className="flex items-end justify-center w-full h-48">
                                    <div
                                        className="w-3/4 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                                        style={{ height: `${(data.activeUsers / 70) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs mt-2">{data.date.split('-')[2]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className="text-lg font-bold mb-4">Project Status Distribution</h3>
                    <div className="flex items-center justify-center h-64">
                        <div className="relative w-48 h-48">
                            <div className="absolute inset-0 rounded-full border-8 border-green-500"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-blue-500 transform -rotate-45"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-yellow-500 transform rotate-45"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-red-500 transform rotate-90"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold">86</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {projectMetricsData.map((item, index) => (
                            <div key={index} className="flex items-center">
                                <div className={`w-4 h-4 ${item.color} rounded mr-2`}></div>
                                <span className="text-sm">{item.status} ({item.count})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUserActivity = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-bold mb-4">User Activity Details</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <th className="text-left py-3 px-4">User</th>
                                <th className="text-left py-3 px-4">Last Active</th>
                                <th className="text-left py-3 px-4">Projects</th>
                                <th className="text-left py-3 px-4">Meetings</th>
                                <th className="text-left py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((item) => (
                                <tr key={item} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                                U
                                            </div>
                                            <div>
                                                <div className="font-medium">User {item}</div>
                                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>@user{item}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">2 hours ago</td>
                                    <td className="py-3 px-4">3</td>
                                    <td className="py-3 px-4">2</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderProjectMetrics = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-bold mb-4">Project Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projectMetricsData.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{item.status}</span>
                                <span className="text-2xl font-bold">{item.count}</span>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${item.color}`}
                                    style={{ width: `${(item.count / 50) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderMeetingInsights = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className="text-lg font-bold mb-4">Meeting Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {meetingInsightsData.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{item.type}</span>
                                <span className="text-2xl font-bold">{item.count}</span>
                            </div>
                            <div className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Total duration: {item.duration}
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
            case 'user-activity':
                return renderUserActivity();
            case 'project-metrics':
                return renderProjectMetrics();
            case 'meeting-insights':
                return renderMeetingInsights();
            default:
                return renderOverview();
        }
    };

    return (
        <RoleGuard requiredRole="admin" fallback={
            <div className="p-8 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
        }>
            <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <BarChart3 className="w-8 h-8 mr-3 text-blue-500" />
                            <h1 className="text-3xl font-bold">Admin Reports</h1>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Comprehensive analytics and insights for system administrators
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                                ? 'bg-blue-600 text-white'
                                                : `${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                            >
                                <option value="last7days">Last 7 Days</option>
                                <option value="last30days">Last 30 Days</option>
                                <option value="last90days">Last 90 Days</option>
                                <option value="yearToDate">Year to Date</option>
                            </select>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    className={`pl-10 pr-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => exportReport('pdf')}
                                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    PDF
                                </button>
                                <button
                                    onClick={() => exportReport('csv')}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </RoleGuard>
    );
};

export default AdminReports;