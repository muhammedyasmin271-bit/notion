import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  CheckSquare, 
  MessageSquare, 
  Target, 
  FileText, 
  Menu,
  X,
  Home,
  FolderOpen
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const NavigationPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Only show on project detail pages
  const isProjectDetailPage = location.pathname.match(/^\/projects\/[^/]+$/) || location.pathname === '/projects/new';
  
  if (!isProjectDetailPage) {
    return null;
  }

  const navItems = [
    { path: '/projects', icon: FolderOpen, label: 'Projects', color: 'text-purple-500' },
    { path: projectId ? `/projects/${projectId}/tasks` : '/projects', icon: CheckSquare, label: 'Tasks', color: 'text-green-500' },
    { path: '/comments', icon: MessageSquare, label: 'Comments', color: 'text-orange-500' },
    { path: '/goals', icon: Target, label: 'Goals', color: 'text-red-500' },
    { path: '/reports', icon: FileText, label: 'Reports', color: 'text-indigo-500' }
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed top-20 right-4 z-[60] w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isDarkMode 
            ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
            : 'bg-white hover:bg-gray-50 border border-gray-200'
        } backdrop-blur-sm`}
      >
        {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
        isExpanded ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}>
        <div className={`w-64 rounded-2xl shadow-2xl border backdrop-blur-xl ${
          isDarkMode 
            ? 'bg-gray-900/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/50'
        }`}>
          <div className="p-4">
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Quick Navigation
            </h3>
            
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsExpanded(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? isDarkMode
                          ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400'
                          : 'bg-blue-50 border border-blue-200 text-blue-600'
                        : isDarkMode
                          ? 'hover:bg-gray-800/60 text-gray-300 hover:text-gray-100'
                          : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-colors ${
                      active ? item.color : ''
                    }`} />
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-current opacity-60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default NavigationPanel;