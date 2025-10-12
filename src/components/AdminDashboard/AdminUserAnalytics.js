import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, BarChart, PieChart, LineChart,
    Calendar, Clock, MapPin, Smartphone,
    Monitor, Chrome, Globe, Globe2, Database,
    Download, Filter, Search
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const AdminUserAnalytics = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('last30days');

    const tabs = [
        { id: 'overview', label: 'User Overview', icon: Users },
        { id: 'engagement', label: 'Engagement Metrics', icon: TrendingUp },
        { id: 'demographics', label: 'User Demographics', icon: PieChart },
        { id: 'technology', label: 'Technology', icon: Smartphone }
    ];

    // Mock analytics data
    const userGrowthData = [
        { month: 'Jan', users: 120 },
        { month: 'Feb', users: 180 },
        { month: 'Mar', users: 240 },
        { month: 'Apr', users: 320 },
        { month: 'May', users: 420 },
        { month: 'Jun', users: 510 }
    ];

    const engagementData = [
        { metric: 'Daily Active Users', value: 342, change: 12.5 },
        { metric: 'Weekly Active Users', value: 567, change: 8.3 },
        { metric: 'Monthly Active Users', value: 823, change: 5.7 },
        { metric: 'Session Duration', value: '12m 34s', change: 3.2 }
    ];

    const demographicsData = [
        { category: 'Age 18-25', percentage: 25, color: 'bg-blue-500' },
        { category: 'Age 26-35', percentage: 35, color: 'bg-green-500' },
        { category: 'Age 36-45', percentage: 20, color: 'bg-yellow-500' },
        { category: 'Age 46-55', percentage: 15, color: 'bg-purple-500' },
        { category: 'Age 55+', percentage: 5, color: 'bg-red-500' }
    ];

    const technologyData = [
        { platform: 'Desktop', percentage: 65, color: 'bg-blue-500', icon: Monitor },
        { platform: 'Mobile', percentage: 30, color: 'bg-green-500', icon: Smartphone },
        { platform: 'Tablet', percentage: 5, color: 'bg-yellow-500', icon: Database }
    ];

    const browserData = [
        { browser: 'Chrome', percentage: 55, color: 'bg-blue-500', icon: Chrome },
        { browser: 'Firefox', percentage: 20, color: 'bg-orange-500', icon: Globe },
        { browser: 'Safari', percentage: 15, color: 'bg-gray-500', icon: Globe2 },
        { browser: 'Edge', percentage: 7, color: 'bg-blue-700', icon: Monitor },
        { browser: 'Other', percentage: 3, color: 'bg-gray-300', icon: Monitor }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Users</p>
                            <p className="text-3xl font-bold mt-2">823</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>New Users</p>
                            <p className="text-3xl font-bold mt-2">92</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-xl">
                            <Users className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Retention Rate</p>
                            <p className="text-3xl font-bold mt-2">78%</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <BarChart className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">User Growth</h3>
                    <div className="h-64 flex items-end space-x-2 justify-center">
                        {userGrowthData.map((data, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="w-12 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                                    style={{ height: `${(data.users / 600) * 100}%` }}
                                ></div>
                                <span className="text-xs mt-2">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">User Distribution by Role</h3>
                    <div className="flex items-center justify-center h-64">
                        <div className="relative w-48 h-48">
                            <div className="absolute inset-0 rounded-full border-8 border-blue-500"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-purple-500 transform -rotate-45"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-green-500 transform rotate-45"></div>
                            <div className="absolute inset-0 rounded-full border-8 border-red-500 transform rotate-90"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold">1,248</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                            <span className="text-sm">Users (892)</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                            <span className="text-sm">Managers (248)</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                            <span className="text-sm">Admins (18)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEngagement = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-6">Engagement Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {engagementData.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.metric}</p>
                            <div className="flex items-baseline mt-2">
                                <span className="text-2xl font-bold">{item.value}</span>
                                <span className="ml-2 text-sm text-green-500">+{item.change}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">Daily Active Users Trend</h3>
                    <div className="h-64 flex items-end space-x-1">
                        {[120, 150, 180, 140, 200, 190, 220, 210, 240, 230, 260, 250, 280, 270].map((value, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                                    style={{ height: `${(value / 300) * 100}%` }}
                                ></div>
                                <span className="text-xs mt-1">{index + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">Feature Usage</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Projects</span>
                                <span>85%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Documents</span>
                                <span>72%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Meetings</span>
                                <span>68%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Reports</span>
                                <span>54%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '54%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDemographics = () => (
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-6">Age Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-center">
                        <div className="relative w-64 h-64">
                            <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'inset(0 75% 0 0)' }}></div>
                            <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{ clipPath: 'inset(0 40% 0 25%)' }}></div>
                            <div className="absolute inset-0 rounded-full border-8 border-yellow-500" style={{ clipPath: 'inset(0 20% 0 60%)' }}></div>
                            <div className="absolute inset-0 rounded-full border-8 border-purple-500" style={{ clipPath: 'inset(0 5% 0 80%)' }}></div>
                            <div className="absolute inset-0 rounded-full border-8 border-red-500" style={{ clipPath: 'inset(0 0 0 95%)' }}></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {demographicsData.map((item, index) => (
                            <div key={index} className="flex items-center">
                                <div className={`w-4 h-4 ${item.color} rounded mr-3`}></div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span>{item.category}</span>
                                        <span>{item.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">Geographic Distribution</h3>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 text-blue-500 mr-3" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span>North America</span>
                                    <span>42%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 text-green-500 mr-3" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span>Europe</span>
                                    <span>28%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 text-purple-500 mr-3" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span>Asia</span>
                                    <span>18%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 text-yellow-500 mr-3" />
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <span>Other</span>
                                    <span>12%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-4">User Activity by Time</h3>
                    <div className="h-48 flex items-end space-x-1">
                        {[30, 45, 60, 80, 120, 150, 180, 200, 180, 150, 120, 80, 60, 45, 30, 25, 20, 15, 10, 5, 8, 12, 18, 25].map((value, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                                    style={{ height: `${(value / 200) * 100}%` }}
                                ></div>
                                <span className="text-xs mt-1">{index}:00</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTechnology = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-6">Device Platform</h3>
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative w-48 h-48">
                            <div className="absolute inset-0 rounded-full border-8 border-blue-500" style={{ clipPath: 'inset(0 35% 0 0)' }}></div>
                            <div className="absolute inset-0 rounded-full border-8 border-green-500" style={{ clipPath: 'inset(0 5% 0 65%)' }}></div>
                            <div className="absolute inset-0 rounded-full border-8 border-yellow-500" style={{ clipPath: 'inset(0 0 0 95%)' }}></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {technologyData.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="flex items-center">
                                    <Icon className="w-5 h-5 mr-3" style={{ color: item.color.replace('bg-', '').replace('-500', '') }} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span>{item.platform}</span>
                                            <span>{item.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-lg font-bold mb-6">Browser Usage</h3>
                    <div className="space-y-4">
                        {browserData.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="flex items-center">
                                    <Icon className="w-5 h-5 mr-3" style={{ color: item.color.replace('bg-', '').replace('-500', '') }} />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span>{item.browser}</span>
                                            <span>{item.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4">Operating System</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <Monitor className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold">Windows</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>52% of users</p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                <Monitor className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-bold">macOS</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>28% of users</p>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                <Smartphone className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-bold">Mobile</p>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>20% of users</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'engagement':
                return renderEngagement();
            case 'demographics':
                return renderDemographics();
            case 'technology':
                return renderTechnology();
            default:
                return renderOverview();
        }
    };

    return (
        <RoleGuard requiredRole="admin" fallback={
            <div className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-gray-600">You need admin privileges to access this page.</p>
            </div>
        }>
            <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <div className="flex items-center mb-4">
                            <Users className="w-8 h-8 mr-3 text-blue-500" />
                            <h1 className="text-3xl font-bold">User Analytics</h1>
                        </div>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Detailed insights into user behavior and engagement
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
                                    placeholder="Search analytics..."
                                    className={`pl-10 pr-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                                />
                            </div>

                            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </button>
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </RoleGuard>
    );
};

export default AdminUserAnalytics;