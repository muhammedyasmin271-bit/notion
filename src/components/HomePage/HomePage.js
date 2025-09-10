import React, { useState, useEffect } from 'react';
import {
  Home as HomeIcon,
  LayoutGrid as ProjectsIcon,
  Target as GoalsIcon,
  Target,
  Folder as DocumentsIcon,
  FileText as MeetingNotesIcon,
  FileText as NotepadIcon,
  FileText,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Crown,
  User as UserIcon,
  Calendar,
  Activity,
  Zap,
  Star,
  ArrowRight,
  Plus,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { initializeWebPush } from '../../utils/webPush';

const HomePage = () => {
  const { setCurrentPage, user, users } = useAppContext();
  const { isDarkMode } = useTheme();
  
  const handlePageNavigation = (page) => {
    const pageRoutes = {
      'projects': '/projects',
      'goals': '/goals', 
      'documents': '/documents',
      'meeting-notes': '/meeting-notes',
      'notepad': '/notepad',
      'users': '/users'
    };
    
    const route = pageRoutes[page] || `/${page}`;
    window.location.href = route;
  };

  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalDocuments: 0,
    totalMeetings: 0,
  });

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const goals = JSON.parse(localStorage.getItem('goals') || '[]');
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const meetingNotes = JSON.parse(localStorage.getItem('meetingNotes') || '[]');

    setStats({
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.status === 'Done').length,
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.status === 'Done').length,
      totalDocuments: documents.length,
      totalMeetings: meetingNotes.length,
    });

    initializeWebPush();
  }, []);

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const managers = users.filter(u => u.role === 'manager');
  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <div
      className={`content p-6 lg:p-8 font-sans min-h-screen relative ${
        isDarkMode ? 'bg-black/60 text-white backdrop-blur-sm' : 'bg-white/60 text-black backdrop-blur-sm'
      }`}
      style={{
        backgroundImage: "url('/documents-bg.jpg')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Professional Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg transition-all duration-300 ${
              isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <HomeIcon className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div className="space-y-2">
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Welcome back, {user?.name || 'User'}
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Here's your workspace overview for today
              </p>
            </div>
          </div>
          
          {/* Professional Stats */}
          <div className="flex gap-6">
            {[
              { value: stats.totalProjects, label: 'Active Projects', icon: ProjectsIcon, page: 'projects' },
              { value: stats.totalGoals, label: 'Team Goals', icon: GoalsIcon, page: 'goals' },
              { value: stats.totalDocuments, label: 'Documents', icon: DocumentsIcon, page: 'documents' }
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                onClick={() => handlePageNavigation(stat.page)}
                className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg cursor-pointer hover:scale-105 ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <stat.icon className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-xl shadow-sm border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Projects</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalProjects}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gray-700' 
                  : 'bg-gray-100'
              }`}>
                <ProjectsIcon className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
            </div>
            <div className="mt-2">
              <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  style={{ width: `${getProgressPercentage(stats.completedProjects, stats.totalProjects)}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {getProgressPercentage(stats.completedProjects, stats.totalProjects)}% complete
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl shadow-sm border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Goals</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalGoals}</p>
              </div>
              <div 
                onClick={() => handlePageNavigation('goals')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${
                  isDarkMode 
                    ? 'bg-gray-700' 
                    : 'bg-gray-100'
                }`}
              >
                <GoalsIcon className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
            </div>
            <div className="mt-2">
              <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  style={{ width: `${getProgressPercentage(stats.completedGoals, stats.totalGoals)}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {getProgressPercentage(stats.completedGoals, stats.totalGoals)}% achieved
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-xl shadow-sm border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Documents</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalDocuments}</p>
              </div>
              <div 
                onClick={() => handlePageNavigation('documents')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${
                  isDarkMode 
                    ? 'bg-gray-700' 
                    : 'bg-gray-100'
                }`}
              >
                <DocumentsIcon className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
            </div>
            <div className="mt-2">
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                All file types supported
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-xl shadow-sm border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Meetings</p>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalMeetings}</p>
              </div>
              <div 
                onClick={() => handlePageNavigation('meeting-notes')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${
                  isDarkMode 
                    ? 'bg-gray-700' 
                    : 'bg-gray-100'
                }`}
              >
                <MeetingNotesIcon className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
            </div>
            <div className="mt-2">
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Meeting summaries
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => handlePageNavigation('projects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            <button
              onClick={() => handlePageNavigation('goals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Target className="w-4 h-4" />
              Add Goal
            </button>
            <button
              onClick={() => handlePageNavigation('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              View Reports
            </button>
            <button
              onClick={() => handlePageNavigation('notepad')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Create Note
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Projects Overview */}
          <div 
            onClick={() => handlePageNavigation('projects')}
            className={`lg:col-span-2 p-8 rounded-2xl shadow-lg border cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
              isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Project Overview
              </h3>
              <ArrowRight className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {stats.totalProjects}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Projects
                </div>
              </div>
              <div>
                <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {stats.completedProjects}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completed
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Progress
                </span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getProgressPercentage(stats.completedProjects, stats.totalProjects)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                  style={{ width: `${getProgressPercentage(stats.completedProjects, stats.totalProjects)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Team Summary */}
          <div className={`p-8 rounded-2xl shadow-lg border ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Team Summary
            </h3>
            <div className="space-y-4">
              <div 
                onClick={() => handlePageNavigation('users')}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <Crown className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    </div>
                    <div>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Managers
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Team Leaders
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {managers.length}
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <UserIcon className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    </div>
                    <div>
                      <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Members
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Contributors
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {regularUsers.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => handlePageNavigation('notepad')}
            className={`p-6 rounded-2xl shadow-lg border cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
              isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  ∞
                </div>
                <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Personal Notes
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your personal workspace
                </div>
              </div>
              <NotepadIcon className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>

          <div 
            onClick={() => handlePageNavigation('users')}
            className={`p-6 rounded-2xl shadow-lg border cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
              isDarkMode ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {managers.length + regularUsers.length}
                </div>
                <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Team Members
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your team
                </div>
              </div>
              <Users className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;