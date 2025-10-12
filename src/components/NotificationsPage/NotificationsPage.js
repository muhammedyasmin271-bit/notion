import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Clock, AlertCircle, MessageCircle, Star, CheckCircle, Archive, Trash2, MoreVertical, User, Calendar, Flag, Settings, Download, Upload, Eye, EyeOff, Pin, Zap, TrendingUp, BarChart3, Activity, Shield, Globe, Smartphone, Mail, Slack, Github, Twitter } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getUserNotifications, getUnreadCount, markAsRead } from '../../utils/notifications';
import { useTheme } from '../../context/ThemeContext';

const NotificationsPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
        const userNotifications = await getUserNotifications(user.id);
        setNotifications(userNotifications);
        const count = await getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading notifications:', error);
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
      return true; // Show all notifications since we removed filters
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
  }, [notifications, sortBy, sortOrder, pinnedNotifications, archivedNotifications]);

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
    <div
      className={`content p-4 lg:p-6 font-sans min-h-screen relative ${isDarkMode ? 'bg-black/60 text-white backdrop-blur-sm' : 'bg-white/60 text-gray-900 backdrop-blur-sm'
        }`}
      style={{
        backgroundImage: "url('/documents-bg.jpg')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Simplified Header without settings button */}
      <div className="mb-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mr-4 sm:mr-6 shadow-lg relative ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            <Bell className={`w-6 h-6 sm:w-8 sm:h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
          <div>
            <h1 className={`text-2xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications</h1>
            <p className={`text-sm sm:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your notifications</p>
          </div>
        </div>
      </div>

      {/* Compact Statistics - Improved for mobile */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`p-3 sm:p-4 rounded-xl shadow-md border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
              <div>
                <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{unreadCount}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unread</p>
              </div>
            </div>
            <div className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${unreadCount > 10 ? (isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700') : (isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')}`}>
              {unreadCount > 10 ? '⚠️' : '✅'}
            </div>
          </div>
        </div>
        <div className={`p-3 sm:p-4 rounded-xl shadow-md border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Bell className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{notifications.length}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</p>
              </div>
            </div>
            <div className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
              📊 {pinnedNotifications.length}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel - Keep the functionality but remove the button to access it */}
      {showSettings && (
        <div className={`mb-6 p-4 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Notification Preferences</h3>
            <button
              onClick={() => setShowSettings(false)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <EyeOff className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Mail className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Email</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.email}
                onChange={(e) => setNotificationPreferences(prev => ({ ...prev, email: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Smartphone className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Push</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.push}
                onChange={(e) => setNotificationPreferences(prev => ({ ...prev, push: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Slack className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Slack</span>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.slack}
                onChange={(e) => setNotificationPreferences(prev => ({ ...prev, slack: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>📱</span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Auto-Refresh</span>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Container */}
      <div className={`rounded-xl shadow-lg border overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {recentNotifications.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Bell className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
            <h3 className={`text-lg sm:text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>You're all caught up!</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No new notifications at the moment
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
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
                        className={`transition-all duration-200 hover:scale-[1.01] cursor-pointer ${isDarkMode ? 'hover:bg-gray-900/40' : 'hover:bg-gray-50'
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
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                              }`}>
                              {React.cloneElement(getNotificationIcon(notification.type), {
                                className: `w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`
                              })}
                              {!notification.read && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm font-semibold mb-1 ${isDarkMode ? (!notification.read ? 'text-white' : 'text-gray-300') : (!notification.read ? 'text-gray-900' : 'text-gray-700')
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
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-200 text-black border-gray-300'
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
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${notification.read
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
                                className={`p-1 rounded hover:scale-110 transition-transform ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                  }`}
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              className={`p-1 rounded hover:scale-110 transition-transform ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
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
            </div>

            {/* Mobile Card View - Enhanced for better mobile experience */}
            <div className="lg:hidden">
              {/* Mobile Header with Select All */}
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.length === recentNotifications.length && recentNotifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 h-4 w-4"
                    />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Select All
                    </span>
                  </div>
                  {selectedNotifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkMarkAsRead}
                        className={`px-3 py-1 text-xs font-medium rounded ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                      >
                        Mark Read
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Cards - Improved for better touch interaction */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentNotifications.map((notification) => {
                  const priority = getNotificationPriority(notification.type, notification.title);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                        } ${!notification.read ? 'border-l-4 border-blue-500 bg-blue-50/20 dark:bg-blue-900/20' : ''} ${getPriorityColor(priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0 h-5 w-5"
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center relative ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                }`}>
                                {React.cloneElement(getNotificationIcon(notification.type), {
                                  className: `w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`
                                })}
                                {!notification.read && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`text-sm font-semibold mb-1 ${isDarkMode ? (!notification.read ? 'text-white' : 'text-gray-300') : (!notification.read ? 'text-gray-900' : 'text-gray-700')
                                  }`}>
                                  {notification.title}
                                  {priority === 'high' && <span className="ml-2 text-red-500 text-xs font-bold">URGENT</span>}
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                                  {notification.message}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-xs whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatTime(notification.createdAt)}
                              </span>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                                    className={`p-1.5 rounded-full hover:scale-110 transition-transform ${isDarkMode ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' : 'text-blue-600 hover:text-blue-800 hover:bg-gray-200'
                                      }`}
                                    title="Mark as read"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  className={`p-1.5 rounded-full hover:scale-110 transition-transform ${isDarkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                    }`}
                                  title="More options"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-200 text-black border-gray-300'
                                }`}>
                                {notification.type}
                              </span>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${notification.read
                                ? (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                                : (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800')
                                }`}>
                                {notification.read ? 'Read' : 'Unread'}
                              </span>
                            </div>

                            {notification.fromUserName && (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {notification.fromUserName.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-xs max-w-[80px] truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {notification.fromUserName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;