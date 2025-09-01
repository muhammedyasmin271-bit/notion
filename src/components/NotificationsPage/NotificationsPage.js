import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Clock, AlertCircle, MessageCircle, Star, CheckCircle, RefreshCw, Filter, Search, Archive, Trash2, MoreVertical, User, Calendar, Flag, Settings, Download, Upload, Eye, EyeOff, Pin, Zap, TrendingUp, BarChart3, Activity, Shield, Globe, Smartphone, Mail, Slack, Github, Twitter } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getUserNotifications, getUnreadCount, markAsRead } from '../../utils/notifications';
import { useTheme } from '../../context/ThemeContext';

const NotificationsPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showActions, setShowActions] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // table, card, compact
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pinnedNotifications, setPinnedNotifications] = useState([]);
  const [archivedNotifications, setArchivedNotifications] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    push: true,
    slack: false,
    sms: false
  });
  const [analytics, setAnalytics] = useState({
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    avgResponseTime: '2.5h',
    mostActiveType: 'meeting'
  });

  const loadNotifications = async () => {
    if (user?.id) {
      try {
        setLoading(true);
        const userNotifications = await getUserNotifications(user.id);
        setNotifications(userNotifications);
        const count = await getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadNotifications();
    calculateAnalytics();
  }, [user?.id]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const calculateAnalytics = () => {
    const today = new Date();
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const todayCount = notifications.filter(n => new Date(n.createdAt) >= today).length;
    const weekCount = notifications.filter(n => new Date(n.createdAt) >= week).length;
    const monthCount = notifications.filter(n => new Date(n.createdAt) >= month).length;
    
    const typeCounts = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {});
    const mostActiveType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, 'meeting');
    
    setAnalytics({
      todayCount,
      weekCount,
      monthCount,
      avgResponseTime: '2.5h',
      mostActiveType
    });
  };

  useEffect(() => {
    const handleNotificationsUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('notifications-updated', handleNotificationsUpdate);
    return () => window.removeEventListener('notifications-updated', handleNotificationsUpdate);
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      // Skip archived notifications
      if (archivedNotifications.includes(notification.id)) return false;
      
      const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (notification.fromUserName && notification.fromUserName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || notification.type === filterType;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'read' && notification.read) ||
                           (filterStatus === 'unread' && !notification.read);
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort notifications
    filtered.sort((a, b) => {
      // Pinned notifications always come first
      const aPinned = pinnedNotifications.includes(a.id);
      const bPinned = pinnedNotifications.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'priority':
          const aPriority = getNotificationPriority(a.type, a.title);
          const bPriority = getNotificationPriority(b.type, b.title);
          const priorityValues = { high: 3, medium: 2, low: 1 };
          comparison = priorityValues[bPriority] - priorityValues[aPriority];
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'sender':
          comparison = (a.fromUserName || '').localeCompare(b.fromUserName || '');
          break;
        case 'smart':
          comparison = calculateNotificationScore(b) - calculateNotificationScore(a);
          break;
        default:
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered.slice(0, 100); // Show up to 100 notifications
  }, [notifications, searchQuery, filterType, filterStatus, sortBy, sortOrder, pinnedNotifications, archivedNotifications]);

  const recentNotifications = filteredAndSortedNotifications;

  const handleSelectAll = () => {
    if (selectedNotifications.length === recentNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(recentNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const handleBulkMarkAsRead = async () => {
    try {
      for (const id of selectedNotifications) {
        await markAsRead(id);
      }
      setSelectedNotifications([]);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Move to archived instead of permanent delete
      setArchivedNotifications(prev => [...prev, ...selectedNotifications]);
      setSelectedNotifications([]);
      await loadNotifications();
    } catch (error) {
      console.error('Error archiving notifications:', error);
    }
  };

  const handlePinNotification = (id) => {
    setPinnedNotifications(prev => 
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    );
  };

  const handleExportNotifications = () => {
    const exportData = notifications.map(n => ({
      title: n.title,
      message: n.message,
      type: n.type,
      from: n.fromUserName,
      date: new Date(n.createdAt).toISOString(),
      read: n.read
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleSmartSort = () => {
    // AI-powered smart sorting based on user behavior
    const smartSorted = [...notifications].sort((a, b) => {
      const aScore = calculateNotificationScore(a);
      const bScore = calculateNotificationScore(b);
      return bScore - aScore;
    });
    setNotifications(smartSorted);
  };

  const calculateNotificationScore = (notification) => {
    let score = 0;
    
    // Priority scoring
    const priority = getNotificationPriority(notification.type, notification.title);
    if (priority === 'high') score += 100;
    else if (priority === 'medium') score += 50;
    
    // Recency scoring
    const age = Date.now() - new Date(notification.createdAt).getTime();
    const ageHours = age / (1000 * 60 * 60);
    score += Math.max(0, 50 - ageHours); // Newer = higher score
    
    // Type importance
    const typeScores = { meeting: 30, system: 25, project: 20, goal: 15, chat: 10, user: 5 };
    score += typeScores[notification.type] || 0;
    
    // Unread bonus
    if (!notification.read) score += 25;
    
    return score;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting': return <Clock className="w-5 h-5" />;
      case 'chat': return <MessageCircle className="w-5 h-5" />;
      case 'project': return <Star className="w-5 h-5" />;
      case 'goal': return <CheckCircle className="w-5 h-5" />;
      case 'user': return <User className="w-5 h-5" />;
      case 'system': return <Flag className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getNotificationPriority = (type, title) => {
    if (title.toLowerCase().includes('urgent') || title.toLowerCase().includes('critical')) return 'high';
    if (type === 'meeting' || type === 'system') return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return isDarkMode ? 'border-red-500 bg-red-500/10' : 'border-red-400 bg-red-50';
      case 'medium': return isDarkMode ? 'border-yellow-500 bg-yellow-500/10' : 'border-yellow-400 bg-yellow-50';
      default: return '';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`content p-4 lg:p-6 font-sans min-h-screen ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg relative ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <Bell className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications</h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your notifications and stay informed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark Read
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
            <button
              onClick={loadNotifications}
              disabled={loading}
              className={`flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Advanced Search and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80 text-sm border ${
                  isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Types</option>
              <option value="meeting">Meetings</option>
              <option value="chat">Messages</option>
              <option value="project">Projects</option>
              <option value="goal">Goals</option>
              <option value="user">Users</option>
              <option value="system">System</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {recentNotifications.length} of {notifications.length} notifications
            </span>
          </div>
        </div>
      </div>

      {/* Professional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{unreadCount}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unread Notifications</p>
              <div className={`text-xs mt-1 ${unreadCount > 10 ? 'text-red-500' : 'text-green-500'}`}>
                {unreadCount > 10 ? '⚠️ Needs Attention' : '✅ Under Control'}
              </div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
              <AlertCircle className={`h-8 w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{notifications.length}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Notifications</p>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                📊 {pinnedNotifications.length} pinned • {analytics.todayCount} today
              </div>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <Bell className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`mb-8 p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Notification Preferences</h3>
            <button
              onClick={() => setShowSettings(false)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <EyeOff className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Email</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.email}
                onChange={(e) => setNotificationPreferences(prev => ({ ...prev, email: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Push</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.push}
                onChange={(e) => setNotificationPreferences(prev => ({ ...prev, push: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Slack className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Slack</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.slack}
                onChange={(e) => setNotificationPreferences(prev => ({ ...prev, slack: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>📱</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Auto-Refresh</span>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Professional Notifications Table */}
      <div className={`rounded-xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          {recentNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No notifications found</h3>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-900 border-b border-gray-700 text-gray-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <input
                      type="checkbox"
                      checked={selectedNotifications.length === recentNotifications.length && recentNotifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <Bell className="h-4 w-4 mr-2" />
                      Notification
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <Flag className="h-4 w-4 mr-2" />
                      Type
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      From
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Time
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-transparent divide-gray-800' : 'bg-white divide-gray-100'} divide-y`}>
                {recentNotifications.map((notification, index) => {
                  const priority = getNotificationPriority(notification.type, notification.title);
                  return (
                    <tr
                      key={notification.id}
                      className={`transition-all duration-200 hover:scale-[1.01] cursor-pointer ${
                        isDarkMode ? 'hover:bg-gray-900/40' : 'hover:bg-gray-50'
                      } ${!notification.read ? 'border-l-4 border-blue-500' : ''} ${getPriorityColor(priority)}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={() => !notification.read && handleMarkAsRead(notification.id)}>
                        <div className="flex items-center gap-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative ${
                            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                          }`}>
                            {React.cloneElement(getNotificationIcon(notification.type), { 
                              className: `w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}` 
                            })}
                            {!notification.read && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-semibold mb-1 ${
                              isDarkMode ? (!notification.read ? 'text-white' : 'text-gray-300') : (!notification.read ? 'text-gray-900' : 'text-gray-700')
                            }`}>
                              {notification.title}
                              {priority === 'high' && <span className="ml-2 text-red-500 text-xs font-bold">URGENT</span>}
                            </div>
                            <p className={`text-sm max-w-md truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                          isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-200 text-black border-gray-300'
                        }`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {notification.fromUserName ? (
                            <>
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                                {notification.fromUserName.charAt(0).toUpperCase()}
                              </div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {notification.fromUserName}
                              </div>
                            </>
                          ) : (
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>System</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatTime(notification.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          notification.read 
                            ? (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                            : (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800')
                        }`}>
                          {notification.read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                              className={`p-1 rounded hover:scale-110 transition-transform ${
                                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                              }`}
                              title="Mark as read"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className={`p-1 rounded hover:scale-110 transition-transform ${
                              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                            }`}
                            title="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;