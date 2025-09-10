import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  LayoutGrid as ProjectsIcon,
  Target as GoalsIcon,
  Folder as DocumentsIcon,
  Settings as SettingsIcon,
  Newspaper as MeetingNotesIcon,
  FileText as NotepadIcon,
  Trash as TrashIcon,
  LogOut,
  ChevronDown,
  Search,
  Filter,
  Users,
  Menu,
  X,
  Bell,
  UsersIcon,
  User as ProfileIcon,
  BarChart3 as ReportsIcon,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getUnreadCount, markAllNotificationsRead } from '../../utils/notifications';

const NavBar = () => {
  const { user, logout } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync body class with sidebar state so pages can adjust layout instantly
  useEffect(() => {
    const body = document.body;
    if (isCollapsed) {
      body.classList.add('sidebar-collapsed');
      body.classList.remove('sidebar-expanded');
    } else {
      body.classList.add('sidebar-expanded');
      body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/meeting-notes') return 'meetingNotes';
    return path.substring(1); // Remove leading slash
  };

  const currentPage = getCurrentPage();

  useEffect(() => {
    const update = () => {
      setUnreadCount(user?.id ? getUnreadCount(user.id) : 0);
    };
    update();
    window.addEventListener('notifications-updated', update);
    return () => window.removeEventListener('notifications-updated', update);
  }, [user?.id]);

  const navItems = [
    { name: 'Home', icon: HomeIcon, page: 'home', path: '/home', description: 'Dashboard overview' },
    { name: 'Projects', icon: ProjectsIcon, page: 'projects', path: '/projects', description: 'Project management' },
    { name: 'Goals', icon: GoalsIcon, page: 'goals', path: '/goals', description: 'Goal tracking' },
    { name: 'Documents', icon: DocumentsIcon, page: 'documents', path: '/documents', description: 'Document hub' },
    { name: 'Notepad', icon: NotepadIcon, page: 'notepad', path: '/notepad', description: 'Personal notes & ideas' },
    { name: 'Meeting Notes', icon: MeetingNotesIcon, page: 'meetingNotes', path: '/meeting-notes', description: 'Meeting summaries' },
    { name: 'Reports', icon: ReportsIcon, page: 'reports', path: '/reports', description: 'Analytics & insights' },
    { name: 'Trash', icon: TrashIcon, page: 'trash', path: '/trash', description: 'Deleted items' },
    { name: 'Profile', icon: ProfileIcon, page: 'profile', path: '/profile', description: 'User profile & settings' },
    { name: 'Users', icon: UsersIcon, page: 'users', path: '/users', description: 'User management' },
    { name: 'Settings', icon: SettingsIcon, page: 'settings', path: '/settings', description: 'App configuration' },
  ];

  const handleLogout = () => {
    console.log('Logout button clicked');
    try {
      logout();
      navigate('/login');
      console.log('Logout function called successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const filteredNavItems = navItems.filter(item => {
    // Filter by search query
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role-based filtering - Users page only visible to managers
    if (item.page === 'users') {
      return matchesSearch && user?.role === 'manager';
    }
    
    return matchesSearch;
  });

  const handleNavClick = (path) => {
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden mobile-menu-button"
        title="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden mobile-sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`bg-gradient-to-b from-slate-900 via-indigo-900 to-purple-900 text-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
        } min-h-screen p-4 fixed z-50 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div className="flex items-center">
              <img
                src="/darul-kubra-logo-removebg-preview.png"
                alt="Darul Kubra Logo"
                className="h-8 w-8 mr-2 object-contain"
              />
              <h1 className="text-xl font-bold">DARUL KUBRA</h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/10 rounded-md transition-colors duration-200"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>



        <ul className="space-y-2 mb-17">
          {/* Notifications Bell */}
          <li>
            <Link
              to="/notifications"
              onClick={() => {
                if (user?.id) markAllNotificationsRead(user.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 group relative transform ${currentPage === 'notifications'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-500/50 border border-indigo-400 scale-105'
                : 'hover:bg-white/10 active:bg-indigo-600 active:scale-95 active:shadow-lg active:shadow-indigo-500/50'
                }`}
            >
              <Bell className={`${isCollapsed ? 'mx-auto' : 'mr-3'}`} size={20} />
              {!isCollapsed && <span>Notifications</span>}
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
              )}
            </Link>
          </li>
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 group transform ${currentPage === item.page
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-500/50 border border-indigo-400 scale-105'
                  : 'hover:bg-white/10 active:bg-indigo-600 active:scale-95 active:shadow-lg active:shadow-indigo-500/50'
                  }`}
                title={isCollapsed ? item.name : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className={`${isCollapsed ? 'mx-auto' : 'mr-3'}`} size={20} />
                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.description && (
                        <span className={`text-xs transition-opacity duration-200 ${currentPage === item.page
                          ? 'text-indigo-200 opacity-100'
                          : 'text-indigo-200 opacity-0 group-hover:opacity-100'
                          }`}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </li>
          ))}

          <li className="pt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-all duration-200 shadow-sm hover:shadow-md"
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className={`${isCollapsed ? 'mx-auto' : 'mr-3'}`} size={20} />
              {!isCollapsed && 'Logout'}
            </button>
          </li>
        </ul>

        {!isCollapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">{user?.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-indigo-200 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default NavBar;
