import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Folder,
  FileText,
  Newspaper,
  BarChart3,
  User,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  LogOut,
  Brain,
  Settings,
  MoreVertical,
  Circle,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const NavBar = () => {
  const { user, logout, company } = useAppContext();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [userFiles, setUserFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navRef = useRef(null);

  // Get companyId from URL path, query params, or localStorage
  // Check path parameter first (e.g., /:companyId/admin/payments)
  const companyIdFromPath = params.companyId;
  const urlParams = new URLSearchParams(location.search);
  const companyIdFromQuery = urlParams.get('company');
  const currentCompanyId = companyIdFromPath || companyIdFromQuery || user?.companyId || localStorage.getItem('currentCompanyId');

  // Check if current path matches
  const isActive = (path) => {
    if (path === '/xq7m9k2p8n4r6t1w') {
      return location.pathname.startsWith('/xq7m9k2p8n4r6t1w');
    }
    
    // For admin routes, check both query param and path-based formats
    if (path === '/admin' || path.startsWith('/admin')) {
      const pathBasedAdmin = currentCompanyId ? `/${currentCompanyId}/admin` : null;
      if (pathBasedAdmin && location.pathname.startsWith(pathBasedAdmin)) {
        return true;
      }
    }
    
    // Check exact path match or path starts with the route
    const exactMatch = location.pathname === path;
    const startsWith = location.pathname.startsWith(path + '/');
    
    // Also check if it's a path-based route with company ID
    if (currentCompanyId && path !== '/admin') {
      const pathBased = `/${currentCompanyId}${path}`;
      if (location.pathname === pathBased || location.pathname.startsWith(pathBased + '/')) {
        return true;
      }
    }
    
    return exactMatch || startsWith;
  };

  // Track desktop mode
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set body class for sidebar state (for content margin)
  useEffect(() => {
    const body = document.body;
    // Sidebar is always expanded on desktop (w-64 = 16rem)
    // On mobile, it overlays so no margin needed
    if (isDesktop) {
      body.classList.add('sidebar-expanded');
      body.classList.remove('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-expanded');
      body.classList.remove('sidebar-collapsed');
    }
  }, [isDesktop]);

  // Fetch user-specific files
  useEffect(() => {
    const fetchUserFiles = async () => {
      if (!user) return;
      
      setLoadingFiles(true);
      try {
        // Use the API service instead of hardcoded URL
        const apiService = (await import('../../services/api')).default;
        const documents = await apiService.get('/documents');
        
        // const userId = user.id || user._id;
        // const userIdString = String(userId);
        
        // console.log('Fetched documents:', documents.length);
        // console.log('Current user ID:', userIdString);
        // console.log('Sample document:', documents[0]);
        
        const userId = user.id || user._id;
        const userIdString = String(userId);
        
        // The API already filters documents based on visibility, so show all returned documents
        // Just exclude deleted ones and map to the format we need
        const userSpecificFiles = (documents || [])
          .filter(doc => !doc.deleted) // Only exclude deleted documents
          .sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0);
            const dateB = new Date(b.updatedAt || b.createdAt || 0);
            return dateB - dateA;
          })
          .slice(0, 10)
          .map(doc => {
            // Determine if user is owner
            const authorId = doc.author?._id || doc.author?.id || doc.author;
            const authorIdString = authorId ? String(authorId) : null;
            const isOwner = authorIdString === userIdString;
            
            return {
              id: doc._id || doc.id,
              name: doc.title || 'Untitled',
              type: doc.type || 'document',
              isOwner: isOwner,
              isShared: !isOwner,
              updatedAt: doc.updatedAt || doc.createdAt
            };
          });
        
        console.log('User-specific files after filtering:', userSpecificFiles.length);
        setUserFiles(userSpecificFiles);
      } catch (error) {
        console.error('Error fetching user files:', error);
        console.error('Error details:', error.response || error.message);
        setUserFiles([]); // Set empty array on error
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchUserFiles();
  }, [user]);

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

  const toggleFiles = () => {
    setExpandedFiles(prev => !prev);
  };

  const handleLogout = () => {
    try {
      logout();
      if (user?.role === 'superadmin') {
        navigate('/login');
      } else if (currentCompanyId) {
        navigate(`/login?company=${currentCompanyId}`);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Helper function to build navigation path with company ID
  const buildNavPath = (path) => {
    if (!currentCompanyId) return path;
    
    // For admin routes, use path-based format (/:companyId/admin)
    if (path === '/admin' || path.startsWith('/admin')) {
      const adminPath = path === '/admin' ? '' : path.replace('/admin', '');
      return `/${currentCompanyId}/admin${adminPath}`;
    }
    
    // For other routes, use query parameter format
    return `${path}?company=${currentCompanyId}`;
  };

  const handleNavClick = (e, path) => {
    setIsMobileMenuOpen(false);
    const targetPath = buildNavPath(path);
    navigate(targetPath, { replace: false });
  };

  // Organize navigation items into categories
  const navigationCategories = user?.role === 'superadmin' 
    ? [
        {
          title: 'ADMINISTRATION',
          items: [
            { name: 'Super Admin', icon: Shield, path: '/xq7m9k2p8n4r6t1w' },
          ]
        }
      ]
    : [
        {
          title: 'WORKSPACE',
          items: [
            { name: 'Projects', icon: LayoutGrid, path: '/projects' },
            { name: 'Documents', icon: Folder, path: '/documents' },
            { name: 'Notepad', icon: FileText, path: '/notepad' },
            { name: 'Meeting Notes', icon: Newspaper, path: '/meeting-notes' },
            { name: 'Reports', icon: BarChart3, path: '/reports' },
          ]
        },
        {
          title: 'TOOLS',
          items: [
            { name: 'MELA AI', icon: Brain, path: '/home' },
          ]
        },
        {
          title: 'MANAGEMENT',
          items: [
            ...(user?.role === 'admin' ? [{ name: 'Admin', icon: Shield, path: '/admin' }] : []),
            ...(['admin', 'manager'].includes(user?.role) ? [{ name: 'User Management', icon: Users, path: '/user-management' }] : []),
            { name: 'Profile', icon: User, path: '/profile' },
          ]
        }
      ];


  return (
    <>
      {/* Mobile Menu Button - visible on all pages for mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed left-3 top-3 z-50 p-2.5 rounded-lg transition-all duration-200 shadow-md ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'} flex items-center justify-center`}
        title="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden mobile-sidebar-overlay fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        ref={navRef}
        className={`${isDarkMode ? 'bg-[#141414]' : 'bg-white'} transition-all duration-300 ease-in-out border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} w-64 min-h-screen fixed z-50 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col overflow-hidden`}
        style={isDarkMode ? { backgroundColor: '#141414' } : {}}
      >
        {/* Header Section with Logo and Company Name */}
        <div className={`${isDarkMode ? 'bg-[#141414]' : 'bg-white'} flex-shrink-0 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
          style={isDarkMode ? { backgroundColor: '#141414' } : {}}
        >
          {/* Logo, Company Name, and Theme Toggle */}
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={
                  company?.branding?.logo 
                    ? (company.branding.logo.startsWith('data:') || 
                        company.branding.logo.startsWith('http') || 
                        company.branding.logo.startsWith('/ChatGPT') ||
                        company.branding.logo.startsWith('/uploads'))
                        ? company.branding.logo 
                        : `${(process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL !== 'undefined') ? process.env.REACT_APP_BACKEND_URL : 'https://notion-l9ti.onrender.com'}${company.branding.logo}`
                    : "/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png"
                }
                alt={`${company?.name || 'Company'} Logo`}
                className={`h-8 w-8 object-contain flex-shrink-0 ${isDarkMode ? 'filter invert' : ''}`}
                onError={(e) => {
                  // Fallback to default logo if image fails to load
                  e.target.src = "/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png";
                }}
              />
              <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                {company?.branding?.companyName || company?.name || 'Untitled UI'}
              </h2>
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Main Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {navigationCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-6">
              {/* Category Title */}
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {category.title}
              </div>
              
              {/* Category Items */}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const navPath = buildNavPath(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={navPath}
                      onClick={(e) => {
                        handleNavClick(e, item.path);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? isDarkMode 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                          : isDarkMode 
                            ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

        </div>

        {/* Bottom Section - Logout and User Profile */}
        <div className={`flex-shrink-0 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} p-3 space-y-1`}>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              isDarkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          {/* User Profile Section */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-opacity-50 transition-colors">
            {/* Avatar */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              {user?.name ? (
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.name || 'User'}
              </div>
              <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.email || user?.username || 'user@example.com'}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;