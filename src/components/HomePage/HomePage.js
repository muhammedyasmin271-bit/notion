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
  const [recentActivity, setRecentActivity] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [projects, documents, meetings] = await Promise.all([
          fetch('http://localhost:5000/api/projects', { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => []),
          fetch('http://localhost:5000/api/documents', { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => []),
          fetch('http://localhost:5000/api/meetings', { headers: { 'x-auth-token': token } }).then(r => r.json()).catch(() => [])
        ]);

        setStats({
          projects: projects.length,
          documents: documents.length,
          completed: projects.filter(p => p.status === 'Done').length,
          meetings: meetings.length
        });

        setRecentActivity([
          { id: 1, type: 'project', message: 'Project "Website Redesign" updated', time: '2 hours ago', icon: Target, priority: 'high' },
          { id: 2, type: 'meeting', message: 'Team standup completed', time: '4 hours ago', icon: Calendar, priority: 'medium' },
          { id: 3, type: 'document', message: 'Client feedback received', time: '1 day ago', icon: FileText, priority: 'low' },
          { id: 4, type: 'notification', message: 'New task assigned', time: '2 days ago', icon: Bell, priority: 'high' }
        ]);
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
    <div className={`min-h-screen transition-all duration-1000 ${
      isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${
          isDarkMode ? 'bg-gradient-to-br from-blue-400/20 to-purple-600/20' : 'bg-gradient-to-br from-blue-300/30 to-purple-500/30'
        } rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 ${
          isDarkMode ? 'bg-gradient-to-br from-emerald-400/15 to-teal-600/15' : 'bg-gradient-to-br from-emerald-300/25 to-teal-500/25'
        } rounded-full blur-3xl animate-pulse`} style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
        
        {/* Status Bar */}
        <div className={`flex items-center justify-between mb-8 p-4 rounded-2xl ${
          isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
        } shadow-xl`}>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isDarkMode ? 'bg-green-500/20 border border-green-400/30' : 'bg-green-100 border border-green-200'
            }`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                System Online
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isDarkMode ? 'bg-purple-500/20 border border-purple-400/30' : 'bg-purple-100 border border-purple-200'
            }`}>
              <Brain className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                AI Enabled
              </span>
            </div>

          </div>
        </div>

        {/* Hero Section */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className={`text-6xl font-black mb-4 ${
              isDarkMode ? 'bg-gradient-to-r from-white via-blue-400 to-purple-400 bg-clip-text text-transparent'
                         : 'bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent'
            }`}>
              {getGreeting()},<br />
              <span className="text-5xl">{user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className={`text-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
              Here's your productivity dashboard
            </p>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/ai-assistant'}
            className={`hidden lg:flex flex-col items-center space-y-4 ${
            isDarkMode ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                       : 'bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-300/30'
          } rounded-2xl p-6 backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer`}>
            <Sparkles className={`w-12 h-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} animate-pulse`} />
            <div className="text-center">
              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                AI Assistant
              </div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Online
              </div>
            </div>
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-6 mb-12">
          {[
            { label: 'Projects', value: stats.projects, icon: Target, color: 'blue' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
            { label: 'Documents', value: stats.documents, icon: FileText, color: 'purple' },
            { label: 'Meetings', value: stats.meetings, icon: Calendar, color: 'orange' },


          ].map((stat, index) => (
            <div key={stat.label} className={`group relative overflow-hidden rounded-3xl ${
              isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
            } p-6 hover:scale-105 transition-all duration-500 shadow-xl hover:shadow-2xl`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/20 border border-${stat.color}-400/30`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 animate-pulse`}></div>
              </div>
              
              <div className={`text-3xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </div>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          
          {/* Quick Actions */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Smart Actions
              </h2>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                isDarkMode ? 'bg-blue-500/20 border border-blue-400/30' : 'bg-blue-100 border border-blue-200'
              }`}>
                <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  AI Enhanced
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <button
                  key={action.name}
                  onClick={() => window.location.href = action.path}
                  className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${action.bg} p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-700 hover:scale-105`}
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <action.icon className="w-10 h-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
                      <ArrowRight className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:scale-105 transition-transform duration-300">
                      {action.name}
                    </h3>
                    <p className="text-white/80 text-sm group-hover:text-white transition-colors duration-300">
                      {action.desc}
                    </p>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Activity Feed
              </h2>
              <RefreshCw className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-spin`} />
            </div>
            
            <div className={`space-y-4 rounded-3xl ${
              isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
            } p-6 shadow-xl`}>
              {recentActivity.map((activity) => (
                <div key={activity.id} className={`flex items-center space-x-4 p-4 rounded-2xl ${
                  isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-50/50'
                } transition-all duration-300 group hover:scale-[1.02]`}>
                  <div className={`relative p-3 rounded-xl ${
                    activity.type === 'project' ? 'bg-blue-500/20 border border-blue-400/30' :
                    activity.type === 'meeting' ? 'bg-orange-500/20 border border-orange-400/30' :
                    activity.type === 'document' ? 'bg-purple-500/20 border border-purple-400/30' :
                    'bg-red-500/20 border border-red-400/30'
                  }`}>
                    <activity.icon className={`w-5 h-5 ${
                      activity.type === 'project' ? 'text-blue-400' :
                      activity.type === 'meeting' ? 'text-orange-400' :
                      activity.type === 'document' ? 'text-purple-400' :
                      'text-red-400'
                    }`} />
                    
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      activity.priority === 'high' ? 'bg-red-500 animate-pulse' :
                      activity.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    } group-hover:text-blue-400 transition-colors duration-300`}>
                      {activity.message}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center space-x-4 px-6 py-4 rounded-2xl ${
            isDarkMode ? 'bg-white/5 border border-white/10 backdrop-blur-sm' : 'bg-white/70 border border-white/20 backdrop-blur-sm'
          } shadow-xl`}>
            <Activity className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Last updated: {currentTime.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-6">

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;