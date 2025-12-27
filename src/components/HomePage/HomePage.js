import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  Plus,
  ArrowRight,
  CheckCircle,
  Users,
  Calendar,
  Target,
  Zap,
  LayoutGrid,
  MessageSquare,
  Clock,
  Brain,
  BookOpen,
  Sparkles,
  Activity,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { getBackendUrl } from '../../utils/apiConfig';

const HomePage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    projects: 0,
    documents: 0,
    completed: 0,
    meetings: 0
  });
  const [teamStats, setTeamStats] = useState({ managers: 0, users: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const backendUrl = getBackendUrl();

        const [projects, documents, meetings] = await Promise.all([
          fetch(`${backendUrl}/api/projects`, { headers: { 'x-auth-token': token } })
            .then(r => r.json())
            .catch(() => []),
          fetch(`${backendUrl}/api/documents`, { headers: { 'x-auth-token': token } })
            .then(r => r.json())
            .catch(() => []),
          fetch(`${backendUrl}/api/meetings`, { headers: { 'x-auth-token': token } })
            .then(r => r.json())
            .catch(() => [])
        ]);

        setStats({
          projects: projects.length || 0,
          documents: documents.length || 0,
          completed: projects.filter(p => p.status === 'Done').length || 0,
          meetings: meetings.length || 0
        });

        if (user?.role !== 'superadmin') {
        const backendUrl = getBackendUrl();
          const usersRes = await fetch(`${backendUrl}/api/users`, {
            headers: { 'x-auth-token': token }
          }).catch(() => ({ json: () => [] }));
          const users = await usersRes.json();
          setTeamStats({
            managers: users.filter(u => u.role === 'manager').length || 0,
            users: users.filter(u => u.role === 'user').length || 0
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (user) fetchStats();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = user?.role === 'superadmin'
    ? [
        { label: 'Projects', value: stats.projects, icon: Target, color: '#3B82F6', bg: '#EFF6FF' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
        { label: 'Documents', value: stats.documents, icon: FileText, color: '#8B5CF6', bg: '#F5F3FF' },
        { label: 'Meetings', value: stats.meetings, icon: Calendar, color: '#F59E0B', bg: '#FFFBEB' }
      ]
    : [
        { label: 'Projects', value: stats.projects, icon: Target, color: '#3B82F6', bg: '#EFF6FF' },
        { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
        { label: 'Managers', value: teamStats.managers, icon: Users, color: '#8B5CF6', bg: '#F5F3FF' },
        { label: 'Team Members', value: teamStats.users, icon: Users, color: '#F59E0B', bg: '#FFFBEB' }
      ];

  const quickActions = [
    { name: 'Projects', icon: LayoutGrid, path: '/projects', color: '#3B82F6' },
    { name: 'Documents', icon: FileText, path: '/documents', color: '#8B5CF6' },
    { name: 'Meeting Notes', icon: MessageSquare, path: '/meeting-notes', color: '#10B981' },
    { name: 'Notepad', icon: Zap, path: '/notepad', color: '#F59E0B' },
    { name: 'Reports', icon: BarChart3, path: '/reports', color: '#6366F1' },
    { name: 'Create Project', icon: Plus, path: '/projects', color: '#14B8A6' }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-white text-gray-900'}`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      {/* Top Navigation Bar */}
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-900'} text-white`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold truncate">{getGreeting()}, {user?.name || 'User'}</h1>
                <p className="text-xs text-gray-400">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex-shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <span className="text-xs sm:text-sm font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* MELA AI & App Guide - Hero Section */}
        <div className="mb-6 sm:mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* MELA AI */}
            <Link
              to="/ai-assistant"
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 sm:p-8 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <Brain className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium opacity-90">AI Assistant</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3">MELA AI</h2>
                <p className="text-indigo-100 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  Intelligent productivity assistant with full workspace access. Get insights, navigate pages, and optimize your workflow with AI-powered assistance.
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  <span>Start Chatting</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </Link>

            {/* App Guide */}
            <Link
              to="/how-it-works"
              className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 p-5 sm:p-8 text-white shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <BookOpen className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium opacity-90">Documentation</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3">App Guide</h2>
                <p className="text-blue-100 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  Complete platform guide covering all features, workflows, and productivity tips. Master the system and maximize your efficiency.
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Overview</h3>
            <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} rounded-lg sm:rounded-xl border-2 p-4 sm:p-6`}
                style={{ borderLeftColor: stat.color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div 
                    className="p-2 sm:p-2.5 rounded-lg"
                    style={{ backgroundColor: stat.bg }}
                  >
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className={`text-2xl sm:text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Jump to your most used features</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.path}
                className={`group ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} border-2 rounded-lg sm:rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all`}
              >
                <div 
                  className="p-2.5 sm:p-3 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: action.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold mb-0.5 text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{action.name}</h4>
                </div>
                <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
