import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  LayoutGrid as ProjectsIcon,
  Folder as DocumentsIcon,
  Newspaper as MeetingNotesIcon,
  FileText as NotepadIcon,
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
  Shield,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { getUnreadCount, markAllNotificationsRead } from '../../utils/notifications';

const NavBar = () => {
  const { user, logout } = useAppContext();
  const { navbarBgColor, buttonColors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

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
    if (path === '/user-management') return 'user-management';
    if (path === '/admin') return 'admin';
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target) && !event.target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const navItems = [
    { name: 'Home', icon: HomeIcon, page: 'home', path: '/home', description: 'Dashboard overview' },
    { name: 'Projects', icon: ProjectsIcon, page: 'projects', path: '/projects', description: 'Project management' },
    { name: 'Documents', icon: DocumentsIcon, page: 'documents', path: '/documents', description: 'Document hub' },
    { name: 'Notepad', icon: NotepadIcon, page: 'notepad', path: '/notepad', description: 'Personal notes & ideas' },
    { name: 'Meeting Notes', icon: MeetingNotesIcon, page: 'meetingNotes', path: '/meeting-notes', description: 'Meeting summaries' },
    { name: 'Reports', icon: ReportsIcon, page: 'reports', path: '/reports', description: 'Analytics & insights' },
    { name: 'Profile', icon: ProfileIcon, page: 'profile', path: '/profile', description: 'User profile & settings' },
    { name: 'User Management', icon: UsersIcon, page: 'user-management', path: '/user-management', description: 'User management' },
    { name: 'Admin', icon: Shield, page: 'admin', path: '/admin', description: 'Admin dashboard' },
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
    // Filter by search query only
    return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
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
        className="lg:hidden sticky left-0 top-0 z-50 mobile-menu-button"
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
      <nav ref={navRef} className={`${navbarBgColor} text-white transition-all duration-300 ease-in-out shadow-2xl border-r border-blue-800/30 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 min-h-screen ${isCollapsed ? 'lg:p-2' : 'p-3 lg:p-4'} fixed z-50 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col backdrop-blur-sm bg-gradient-to-b from-blue-900/95 to-indigo-900/95 overflow-hidden`}>
        <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'justify-between'} mb-6 lg:mb-6 mb-8 flex-shrink-0`}>
          <div className={`flex items-center ${isCollapsed ? 'lg:hidden' : ''}`}>
            <div className="relative">
              <img
                src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png"
                alt="Mela Note Logo"
                className="h-10 w-10 lg:h-12 lg:w-12 mr-3 object-contain filter brightness-0 invert"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">MELA NOTE</h1>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110 backdrop-blur-sm bg-white/10"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={20} />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-white/20 rounded-xl transition-all duration-200 bg-white/10 backdrop-blur-sm"
            title="Close menu"
          >
            <X size={22} />
          </button>
        </div>



        <div 
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
          onWheel={(e) => {
            const target = e.currentTarget;
            const atTop = target.scrollTop === 0;
            const atBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
            
            // Only allow scrolling within the navbar if not at boundaries
            if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
              return; // Allow default behavior if at boundaries
            }
            
            e.stopPropagation();
            e.preventDefault();
            target.scrollTop += e.deltaY;
          }}
        >
        <ul className="space-y-1.5 lg:space-y-2 pb-24">
          {/* Notifications Bell */}
          <li>
            <Link
              to="/notifications"
              onClick={() => {
                if (user?.id) markAllNotificationsRead(user.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center ${isCollapsed ? 'lg:justify-center' : ''} w-full px-3 py-3 lg:px-4 lg:py-2 text-sm font-medium rounded-xl lg:rounded-lg transition-all duration-200 group relative transform ${currentPage === 'notifications'
                ? `${buttonColors} text-white shadow-lg border scale-105`
                : `hover:bg-white/15 active:${buttonColors.split(' ')[0]} active:scale-95 active:shadow-lg backdrop-blur-sm`
                }`}
              title={isCollapsed ? 'Notifications' : ''}
            >
              <div className="relative">
                <Bell className={isCollapsed ? '' : 'mr-3'} size={20} />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className={isCollapsed ? 'lg:hidden' : ''}>Notifications</span>
              {unreadCount > 0 && (
                <span className={`ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-0.5 shadow-lg ${isCollapsed ? 'lg:hidden' : ''}`}>{unreadCount}</span>
              )}
              {isCollapsed && unreadCount > 0 && (
                <span className="hidden lg:block absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-1.5 py-0.5 shadow-lg">{unreadCount}</span>
              )}
            </Link>
          </li>
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'lg:justify-center' : ''} w-full px-3 py-3 lg:px-4 lg:py-2 text-sm font-medium rounded-xl lg:rounded-lg transition-all duration-200 group transform ${currentPage === item.page
                  ? `${buttonColors} text-white shadow-lg border scale-105 bg-gradient-to-r from-blue-600 to-indigo-600`
                  : `hover:bg-white/15 active:${buttonColors.split(' ')[0]} active:scale-95 active:shadow-lg backdrop-blur-sm hover:shadow-md`
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className={`${isCollapsed ? '' : 'mr-3'} ${currentPage === item.page ? 'text-white' : 'text-blue-200'}`} size={20} />
                <div className={`flex-1 text-left ${isCollapsed ? 'lg:hidden' : ''}`}>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <span className={`text-xs mt-0.5 transition-opacity duration-200 ${currentPage === item.page
                        ? 'text-blue-100 opacity-90'
                        : 'text-blue-300 opacity-60 group-hover:opacity-80'
                        }`}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}

          <li className="pt-4 border-t border-white/20">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isCollapsed ? 'lg:justify-center' : ''} w-full px-3 py-3 lg:px-4 lg:py-2 text-sm font-medium rounded-xl lg:rounded-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`}
              title={isCollapsed ? 'Logout' : ''}
            >
              <LogOut className={isCollapsed ? '' : 'mr-3'} size={20} />
              <span className={isCollapsed ? 'lg:hidden' : ''}>Logout</span>
            </button>
          </li>
        </ul>
        </div>

        <div className={`absolute bottom-4 ${isCollapsed ? 'lg:left-2 lg:right-2' : 'left-3 right-3 lg:left-4 lg:right-4'} flex-shrink-0`}>
          <div className={`bg-gradient-to-r from-white/20 to-blue-500/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl ${isCollapsed ? 'lg:flex lg:justify-center lg:p-2' : ''}`}>
            <div className={`flex items-center ${isCollapsed ? 'lg:flex-col lg:space-x-0' : 'space-x-3'}`}>
              <div className="relative" title={isCollapsed ? `${user?.name} (${user?.role})` : ''}>
                <div className="w-10 h-10 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">{user?.name?.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-blue-200 capitalize font-medium">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;