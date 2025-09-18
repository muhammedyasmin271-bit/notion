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
  Sparkles,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { initializeWebPush } from '../../utils/webPush';

const HomePage = () => {
  const { setCurrentPage, user, users } = useAppContext();
  const { isDarkMode } = useTheme();
  const [showInstructions, setShowInstructions] = useState(false);
  
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

    // Apply same access control as ProjectsPage
    const filteredProjects = projects.filter(project => {
      const isAssignedToUser = project.forPerson && project.forPerson.toLowerCase().includes(user?.name?.toLowerCase() || '');
      const isOwner = project.ownerUid === user?.id || project.ownerName === user?.name;
      const isAssigned = project.forPerson && project.forPerson.trim() !== '';
      
      return isAssigned ? 
        (user?.role === 'manager' || isAssignedToUser) : 
        isOwner;
    });

    setStats({
      totalProjects: filteredProjects.length,
      completedProjects: filteredProjects.filter(p => p.status === 'Done').length,
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.status === 'Done').length,
      totalDocuments: documents.length,
      totalMeetings: meetingNotes.length,
    });

    initializeWebPush();
  }, [user]);

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const managers = users.filter(u => u.role === 'manager');
  const regularUsers = users.filter(u => u.role === 'user');

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-pulse delay-1000 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 animate-spin ${
          isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-600' : 'bg-gradient-to-r from-gray-200 to-gray-400'
        }`} style={{ animationDuration: '20s' }}></div>
      </div>
      
      <div className="relative z-10 p-6 lg:p-8 font-sans">
      {/* Hero Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-900'
          }`}>
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r ${
            isDarkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'
          } bg-clip-text text-transparent`}>
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className={`text-xl md:text-2xl mb-8 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your productivity hub awaits
          </p>
          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { label: 'Active Projects', icon: ProjectsIcon, page: 'projects', gradient: 'from-gray-800 to-black' },
              { label: 'Team Goals', icon: GoalsIcon, page: 'goals', gradient: 'from-gray-700 to-gray-900' },
              { label: 'Documents', icon: DocumentsIcon, page: 'documents', gradient: 'from-gray-600 to-gray-800' }
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                onClick={() => handlePageNavigation(stat.page)}
                className={`group relative overflow-hidden rounded-2xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-white/50'
                } shadow-xl`}
                style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)'
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className="relative z-10 text-center">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'New Project', icon: Plus, page: 'projects', gradient: 'from-gray-800 to-black' },
              { label: 'Add Goal', icon: Target, page: 'goals', gradient: 'from-gray-700 to-gray-900' },
              { label: 'View Reports', icon: BarChart3, page: 'reports', gradient: 'from-gray-600 to-gray-800' },
              { label: 'Create Note', icon: FileText, page: 'notepad', gradient: 'from-gray-500 to-gray-700' }
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => handlePageNavigation(action.page)}
                className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-r ${action.gradient}`}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-3">
                  <action.icon className="w-5 h-5" />
                  {action.label}
                </div>
              </button>
            ))}
          </div>
        </div>



        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
          {/* Projects Card */}
          <div 
            onClick={() => handlePageNavigation('projects')}
            className={`group relative overflow-hidden p-8 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-white/50'
            } shadow-xl`}
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)'
            }}
          >
            <div className="absolute inset-0 bg-gray-800 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gray-800 shadow-lg">
                  <ProjectsIcon className="w-8 h-8 text-white" />
                </div>
                <ArrowRight className={`w-6 h-6 transition-transform group-hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Projects
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.totalProjects}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.completedProjects}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Done</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Progress</span>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {getProgressPercentage(stats.completedProjects, stats.totalProjects)}%
                  </span>
                </div>
                <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-3 rounded-full bg-gray-800 transition-all duration-1000"
                    style={{ width: `${getProgressPercentage(stats.completedProjects, stats.totalProjects)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Card */}
          <div 
            onClick={() => handlePageNavigation('goals')}
            className={`group relative overflow-hidden p-8 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-white/50'
            } shadow-xl`}
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'
            }}
          >
            <div className="absolute inset-0 bg-gray-700 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gray-700 shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <ArrowRight className={`w-6 h-6 transition-transform group-hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Goals
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.totalGoals}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.completedGoals}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Achieved</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Progress</span>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {getProgressPercentage(stats.completedGoals, stats.totalGoals)}%
                  </span>
                </div>
                <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-3 rounded-full bg-gray-700 transition-all duration-1000"
                    style={{ width: `${getProgressPercentage(stats.completedGoals, stats.totalGoals)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Card */}
          <div 
            onClick={() => setShowInstructions(true)}
            className={`group relative overflow-hidden p-8 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-white/50'
            } shadow-xl`}
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
            }}
          >
            <div className="absolute inset-0 bg-gray-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gray-600 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <ArrowRight className={`w-6 h-6 transition-transform group-hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How to Use
              </h3>
              <div className="space-y-3 text-sm">
                <div className={`flex items-start gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isDarkMode ? 'bg-green-400' : 'bg-green-500'}`}></div>
                  <span><strong>Projects:</strong> Create and manage team projects with status tracking</span>
                </div>
                <div className={`flex items-start gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                  <span><strong>Goals:</strong> Set and track personal and team objectives</span>
                </div>
                <div className={`flex items-start gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                  <span><strong>Documents:</strong> Upload and organize all file types</span>
                </div>
                <div className={`flex items-start gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isDarkMode ? 'bg-orange-400' : 'bg-orange-500'}`}></div>
                  <span><strong>Notepad:</strong> Write and format notes with markdown support</span>
                </div>
                <div className={`flex items-start gap-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isDarkMode ? 'bg-pink-400' : 'bg-pink-500'}`}></div>
                  <span><strong>Reports:</strong> View analytics and team performance metrics</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            onClick={() => handlePageNavigation('notepad')}
            className={`group relative overflow-hidden p-8 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-white/50'
            } shadow-xl`}
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 179, 8, 0.05) 100%)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg">
                  <NotepadIcon className="w-8 h-8 text-white" />
                </div>
                <ArrowRight className={`w-6 h-6 transition-transform group-hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Personal Notes
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your creative workspace for ideas and thoughts
              </p>
            </div>
          </div>

          <div 
            onClick={() => handlePageNavigation('documents')}
            className={`group relative overflow-hidden p-8 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
              isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-white/50'
            } shadow-xl`}
            style={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 shadow-lg">
                  <DocumentsIcon className="w-8 h-8 text-white" />
                </div>
                <ArrowRight className={`w-6 h-6 transition-transform group-hover:translate-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Documents
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage all your files and resources in one place
              </p>
              <div className="mt-4">
                <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalDocuments}
                </span>
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>files stored</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instructions Modal - Full Screen */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className={`w-full h-full overflow-y-auto ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className="p-8 max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-green-500 to-blue-500 shadow-2xl">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-5xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Complete User Guide
                    </h1>
                    <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Master every feature of your productivity workspace
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className={`p-4 rounded-2xl text-2xl font-bold transition-all duration-300 hover:scale-110 ${
                    isDarkMode ? 'hover:bg-gray-800 text-gray-400 bg-gray-800/50' : 'hover:bg-gray-100 text-gray-600 bg-gray-100/50'
                  }`}
                >
                  ✕
                </button>
              </div>
              
              {/* Main Features Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                {/* Projects Section */}
                <div className={`p-8 rounded-3xl border-2 ${
                  isDarkMode ? 'bg-gray-800/30 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                      <ProjectsIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Projects Management</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>📋 Creating Projects</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Click "New Project" button on homepage or projects page</li>
                        <li>• Fill in project title, description, and objectives</li>
                        <li>• Set initial status: To Do, In Progress, or Done</li>
                        <li>• Add project deadline and priority level</li>
                        <li>• Assign team members and roles</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>⚡ Managing Projects</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Update status as work progresses</li>
                        <li>• Edit project details anytime</li>
                        <li>• Add comments and progress notes</li>
                        <li>• Track time spent on tasks</li>
                        <li>• Set milestones and checkpoints</li>
                        <li>• Archive or delete completed projects</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>📊 Tracking Progress</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Visual progress bars show completion</li>
                        <li>• Color-coded status indicators</li>
                        <li>• Filter projects by status or team member</li>
                        <li>• Export project reports</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Goals Section */}
                <div className={`p-8 rounded-3xl border-2 ${
                  isDarkMode ? 'bg-gray-800/30 border-purple-500/30' : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Goals & Objectives</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>🎯 Setting Goals</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Define clear, measurable objectives</li>
                        <li>• Set SMART goals (Specific, Measurable, Achievable)</li>
                        <li>• Add detailed action plans and steps</li>
                        <li>• Set target completion dates</li>
                        <li>• Assign priority levels (High, Medium, Low)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>📝 Goal Management</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Add detailed notes and progress updates</li>
                        <li>• Break down goals into smaller tasks</li>
                        <li>• Link goals to related projects</li>
                        <li>• Set reminders and notifications</li>
                        <li>• Track completion percentage</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>📈 Progress Tracking</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Visual progress indicators</li>
                        <li>• Achievement badges and milestones</li>
                        <li>• Goal completion analytics</li>
                        <li>• Performance insights and trends</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className={`p-8 rounded-3xl border-2 ${
                  isDarkMode ? 'bg-gray-800/30 border-green-500/30' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                      <DocumentsIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Document Management</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>📁 File Upload</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Drag & drop files directly onto the page</li>
                        <li>• Support for all file types: PDF, DOC, XLS, PPT, Images, Videos</li>
                        <li>• Bulk upload multiple files at once</li>
                        <li>• Automatic file type detection and icons</li>
                        <li>• File size validation and compression</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>🗂️ Organization</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Create custom folders and categories</li>
                        <li>• Tag files with keywords for easy search</li>
                        <li>• Sort by name, date, size, or type</li>
                        <li>• Advanced search and filtering options</li>
                        <li>• Favorite important documents</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>🔗 Sharing & Access</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Share files with team members</li>
                        <li>• Set permission levels (view, edit, download)</li>
                        <li>• Generate shareable links</li>
                        <li>• Version control and history tracking</li>
                        <li>• Download files in original format</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Notepad Section */}
                <div className={`p-8 rounded-3xl border-2 ${
                  isDarkMode ? 'bg-gray-800/30 border-orange-500/30' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg">
                      <NotepadIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Advanced Notepad</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>✍️ Writing & Formatting</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Rich text editor with markdown support</li>
                        <li>• Headings (H1, H2, H3), bold, italic, underline</li>
                        <li>• Bullet points, numbered lists, checklists</li>
                        <li>• Code blocks with syntax highlighting</li>
                        <li>• Tables, quotes, and dividers</li>
                        <li>• Custom fonts and text sizing</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>🔧 Advanced Features</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Auto-save every few seconds</li>
                        <li>• Block-based editing (like Notion)</li>
                        <li>• Slash commands for quick formatting</li>
                        <li>• Drag and drop to reorder content</li>
                        <li>• Document templates and snippets</li>
                        <li>• Real-time collaboration</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>💾 Export & Sharing</h4>
                      <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                        <li>• Export as PDF, Word, or Markdown</li>
                        <li>• Share notes with team members</li>
                        <li>• Print with custom formatting</li>
                        <li>• Save to different categories</li>
                        <li>• Version history and backups</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {/* Reports & Analytics */}
                <div className={`p-6 rounded-2xl ${
                  isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reports & Analytics</h3>
                  </div>
                  <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>• Team performance dashboards</li>
                    <li>• Project completion analytics</li>
                    <li>• Goal achievement tracking</li>
                    <li>• Time tracking and productivity metrics</li>
                    <li>• Export data in multiple formats</li>
                    <li>• Custom date range filtering</li>
                  </ul>
                </div>

                {/* Meeting Notes */}
                <div className={`p-6 rounded-2xl ${
                  isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Meeting Notes</h3>
                  </div>
                  <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>• Create structured meeting notes</li>
                    <li>• Add attendees and agenda items</li>
                    <li>• Track action items and decisions</li>
                    <li>• Link to related projects and goals</li>
                    <li>• Share notes with participants</li>
                    <li>• Template-based note creation</li>
                  </ul>
                </div>

                {/* Team Management */}
                <div className={`p-6 rounded-2xl ${
                  isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Team Management</h3>
                  </div>
                  <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>• Manage team members and roles</li>
                    <li>• Set permissions and access levels</li>
                    <li>• View team activity and contributions</li>
                    <li>• Send notifications and updates</li>
                    <li>• Track individual performance</li>
                    <li>• Organize teams by departments</li>
                  </ul>
                </div>
              </div>

              {/* Pro Tips Section */}
              <div className={`p-8 rounded-3xl border-2 border-dashed mb-12 ${
                isDarkMode ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-yellow-400 bg-yellow-50'
              }`}>
                <div className="flex items-center gap-4 mb-6">
                  <Lightbulb className={`w-8 h-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Pro Tips & Best Practices</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                    <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>🚀 Quick Navigation</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Use keyboard shortcuts: Ctrl+N for new items, Ctrl+S to save, Ctrl+F to search across all content.
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                    <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>📊 Data Organization</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Use consistent naming conventions and tags. Create templates for recurring project types.
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                    <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>🔄 Regular Backups</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Export your data regularly. Use the bulk export feature in Settings to backup all content.
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                    <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>👥 Team Collaboration</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Set clear project ownership, use @mentions in comments, and establish regular check-in schedules.
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                    <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>📈 Performance Tracking</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Review weekly reports, set realistic deadlines, and celebrate completed milestones.
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                    <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>🎯 Goal Setting</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Break large goals into smaller tasks, set SMART objectives, and link goals to specific projects.
                    </p>
                  </div>
                </div>
              </div>

              {/* Getting Started Section */}
              <div className={`p-8 rounded-3xl ${
                isDarkMode ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
              }`}>
                <h2 className={`text-3xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎯 Quick Start Checklist
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>First Steps</h3>
                    <div className="space-y-3">
                      {[
                        'Create your first project',
                        'Set up 2-3 initial goals',
                        'Upload important documents',
                        'Write your first note',
                        'Invite team members'
                      ].map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDarkMode ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {index + 1}
                          </div>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Advanced Setup</h3>
                    <div className="space-y-3">
                      {[
                        'Customize your dashboard',
                        'Set up notification preferences',
                        'Create project templates',
                        'Configure team permissions',
                        'Explore reporting features'
                      ].map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDarkMode ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {index + 6}
                          </div>
                          <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default HomePage;