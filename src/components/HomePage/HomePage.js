import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, FileText, BarChart3, Plus, ArrowRight, CheckCircle, Clock, Folder,
  Users, Calendar, Target, TrendingUp, Activity, Bell, Zap, Brain,
  MessageSquare, Settings, Search, Filter, RefreshCw, Award, Sparkles, AlertCircle, CheckSquare
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const HomePage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    projects: 0, documents: 0, completed: 0, meetings: 0
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [projects, documents, meetings] = await Promise.all([
          fetch('http://localhost:9000/api/projects', { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => []),
          fetch('http://localhost:9000/api/documents', { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => []),
          fetch('http://localhost:9000/api/meetings', { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => [])
        ]);

        setStats({
          projects: projects.length,
          documents: documents.length,
          completed: projects.filter(p => p.status === 'Done').length,
          meetings: meetings.length
        });


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

  const quickActions = [
    { name: 'Create Project', desc: 'Start a new project', icon: Plus, path: '/projects', bg: 'from-blue-500 to-indigo-600' },
    { name: 'How it Works', desc: 'Learn the system', icon: Brain, path: '/how-it-works', bg: 'from-purple-500 to-pink-600' },
    { name: 'Analytics', desc: 'View insights', icon: BarChart3, path: '/reports', bg: 'from-emerald-500 to-teal-600' },
    { name: 'Quick Notes', desc: 'Capture ideas', icon: Zap, path: '/notepad', bg: 'from-orange-500 to-red-600' }
  ];

  return (
    <div className={`min-h-screen transition-all duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${isDarkMode ? 'bg-gradient-to-br from-blue-400/20 to-purple-600/20' : 'bg-gradient-to-br from-blue-300/30 to-purple-500/30'
          } rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 ${isDarkMode ? 'bg-gradient-to-br from-emerald-400/15 to-teal-600/15' : 'bg-gradient-to-br from-emerald-300/25 to-teal-500/25'
          } rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto">

        {/* Status Bar - Simplified for mobile */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
          } shadow-xl`}>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${isDarkMode ? 'bg-green-500/20 border border-green-400/30' : 'bg-green-100 border border-green-200'
              }`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                Online
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Hidden AI Enabled indicator as requested */}
          <div className="hidden">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${isDarkMode ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-purple-100 border border-purple-200'
              }`}>
              <Brain className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                AI Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section - Optimized for mobile with AI Assistant card */}
        <div className="flex flex-col mb-8 relative">
          <div className="mb-6">
            <h1 className={`text-4xl sm:text-5xl font-black mb-3 ${isDarkMode ? 'bg-gradient-to-r from-white via-blue-400 to-purple-400 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
              {getGreeting()},<br />
              <span className="text-3xl sm:text-4xl">{user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              Your productivity dashboard
            </p>
            <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          {/* AI Assistant Card - Desktop version in top right */}
          <button
            onClick={() => window.location.href = '/ai-assistant'}
            className={`hidden sm:block absolute top-0 right-0 p-8 rounded-3xl ${isDarkMode ? 'bg-gradient-to-br from-blue-600/40 to-purple-600/40 border border-blue-500/50 hover:bg-blue-600/50'
                : 'bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-300/50 hover:bg-blue-600/40'
              } backdrop-blur-sm transition-all duration-300 cursor-pointer hover:scale-105 shadow-2xl`}>
            <div className="flex items-center space-x-5">
              <Sparkles className={`w-12 h-12 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'} animate-pulse`} />
              <div className="text-left">
                <div className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  AI Assistant
                </div>
                <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Online
                </div>
              </div>
            </div>
          </button>

          {/* AI Assistant Button - Mobile version */}
          <button
            onClick={() => window.location.href = '/ai-assistant'}
            className={`flex sm:hidden items-center space-x-4 w-full ${isDarkMode ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                : 'bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-300/30'
              } rounded-2xl p-4 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 cursor-pointer`}>
            <Sparkles className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} animate-pulse`} />
            <div className="text-left">
              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                AI Assistant
              </div>
              <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Online
              </div>
            </div>
            <ArrowRight className={`w-5 h-5 ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Stats Dashboard - Responsive grid for mobile */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Projects', value: stats.projects, icon: Target, color: 'blue' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
            { label: 'Documents', value: stats.documents, icon: FileText, color: 'purple' },
            { label: 'Meetings', value: stats.meetings, icon: Calendar, color: 'orange' },
          ].map((stat, index) => (
            <div key={stat.label} className={`group relative overflow-hidden rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
              } p-4 hover:scale-105 transition-all duration-500 shadow-lg hover:shadow-xl`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-${stat.color}-500/20 border border-${stat.color}-400/30`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 animate-pulse`}></div>
              </div>

              <div className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </div>
              <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Improved mobile layout */}
        <div className="mb-8">
          <h2 className={`text-2xl sm:text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Smart Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={action.name}
                onClick={() => window.location.href = action.path}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.bg} p-5 text-white shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02]`}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <action.icon className="w-8 h-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
                    <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:scale-105 transition-transform duration-300">
                    {action.name}
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm group-hover:text-white transition-colors duration-300">
                    {action.desc}
                  </p>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Status - Simplified and hidden as requested */}
        <div className="hidden">
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl ${isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
            } shadow-xl`}>
            <div className="flex items-center">
              <Activity className={`w-5 h-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Updated: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors duration-200`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Refresh
              </span>
            </button>
          </div>
        </div>

        {/* Empty div to maintain layout spacing */}
        <div className="h-4"></div>

      </div>
    </div>
  );
};

export default HomePage;