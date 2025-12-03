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
  const navRef = useRef(null);

  // Get companyId from URL path, query params, or localStorage
  // Check path parameter first (e.g., /:companyId/admin/payments)
  const companyIdFromPath = params.companyId;
  const urlParams = new URLSearchParams(location.search);
  const companyIdFromQuery = urlParams.get('company');
  const currentCompanyId = companyIdFromPath || companyIdFromQuery || user?.companyId || localStorage.getItem('currentCompanyId');

  // Check if current path matches
  const isActive = (path) => {
    if (path === '/super-admin') {
      return location.pathname.startsWith('/super-admin');
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
        const token = localStorage.getItem('token');
        if (!token) {
          setLoadingFiles(false);
          return;
        }

        // Fetch documents that belong to the user or are shared with them
        const response = await fetch('http://localhost:9000/api/documents', {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const documents = await response.json();
          const userId = user.id || user._id;
          const userIdString = String(userId);
          
          console.log('Fetched documents:', documents.length);
          console.log('Current user ID:', userIdString);
          
          // Filter to only show files that belong to the user or are shared with them
          // Handle different author formats: object with _id, string ID, or direct match
          const userSpecificFiles = documents
            .filter(doc => {
              // Check if user is the owner
              const authorId = doc.author?._id || doc.author;
              const authorIdString = authorId ? String(authorId) : null;
              const isOwner = authorIdString === userIdString;
              
              // Check if file is shared with user
              const isSharedWith = doc.sharedWith?.some(shared => {
                const sharedUserId = shared.user?._id || shared.user;
                return sharedUserId ? String(sharedUserId) === userIdString : false;
              });
              
              return isOwner || isSharedWith;
            })
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 10)
            .map(doc => {
              const authorId = doc.author?._id || doc.author;
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
          
          console.log('User-specific files:', userSpecificFiles.length);
          setUserFiles(userSpecificFiles);
        } else {
          console.error('Failed to fetch documents:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user files:', error);
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

  // Main navigation items - different for superadmin vs regular users
  const mainNavItems = user?.role === 'superadmin' 
    ? [
        { name: 'Super Admin', icon: Shield, path: '/super-admin' },
      ]
    : [
        { name: 'Projects', icon: LayoutGrid, path: '/projects' },
        { name: 'Documents', icon: Folder, path: '/documents' },
        { name: 'Notepad', icon: FileText, path: '/notepad' },
        { name: 'Meeting Notes', icon: Newspaper, path: '/meeting-notes' },
        { name: 'Reports', icon: BarChart3, path: '/reports' },
        { name: 'MELA AI', icon: Brain, path: '/home' },
        { name: 'Profile', icon: User, path: '/profile' },
        { name: 'User Management', icon: Users, path: '/user-management' },
        { name: 'Admin', icon: Shield, path: '/admin' },
      ].filter(item => {
        // Filter out Admin button for non-admin users
        if (item.path === '/admin' && user?.role !== 'admin') {
          return false;
        }
        // Filter out User Management for regular users (only show to admin and manager)
        if (item.path === '/user-management' && !['admin', 'manager'].includes(user?.role)) {
          return false;
        }
        return true;
      });


  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden sticky left-0 top-0 z-50 mobile-menu-button p-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
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
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} transition-all duration-300 ease-in-out border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} w-64 min-h-screen fixed z-50 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col overflow-hidden`}
      >
        {/* Header Section with Company Logo, Name, and Theme Toggle */}
        <div className={`flex items-center justify-between p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} flex-shrink-0`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Company Logo */}
            <img
              src={company?.branding?.logo || "/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png"}
              alt={`${company?.name || 'Company'} Logo`}
              className="h-12 w-12 object-contain flex-shrink-0"
            />
            {/* Company Name */}
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
              {company?.branding?.companyName || company?.name || 'Company'}
            </h2>
          </div>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded flex-shrink-0 transition-colors`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Main Navigation Section */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const navPath = buildNavPath(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={navPath}
                  onClick={(e) => {
                    handleNavClick(e, item.path);
                    // Ensure the Link navigation happens
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                      : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Files Section */}
          <div className="mt-6">
            <button
              onClick={toggleFiles}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} rounded-lg transition-colors`}
            >
              {expandedFiles ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>My Files</span>
            </button>
            
            {expandedFiles && (
              <div className="ml-4 mt-1 space-y-1">
                {loadingFiles ? (
                  <div className={`px-3 py-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading...
                  </div>
                ) : userFiles.length === 0 ? (
                  <div className={`px-3 py-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No files yet
                  </div>
                ) : (
                  userFiles.map((file) => (
                    <Link
                      key={file.id}
                      to={currentCompanyId ? `/documents?company=${currentCompanyId}&file=${file.id}` : `/documents?file=${file.id}`}
                      onClick={(e) => handleNavClick(e, '/documents')}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} rounded-lg transition-colors`}
                      title={file.name}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="truncate flex-1">{file.name}</span>
                      {file.isShared && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          Shared
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Logout Button at Bottom */}
          <div className={`mt-auto border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-3`}>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode 
                  ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300' 
                  : 'text-red-600 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavBar;