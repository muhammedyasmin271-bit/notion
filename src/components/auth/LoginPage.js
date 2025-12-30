import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getBackendUrl, getApiUrl } from '../../utils/apiConfig';
import { useTheme } from '../../context/ThemeContext';
import { User, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

const LoginPage = ({ isSuperAdmin = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, error, isAuthenticated } = useAppContext();
  const { isDarkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const companyId = searchParams.get('company');
  const redirectTo = searchParams.get('redirect');
  const isSuperAdminLogin = isSuperAdmin || searchParams.get('superadmin') !== null;

  useEffect(() => {
    // If already authenticated and no company parameter, redirect based on role
    if (isAuthenticated && !companyId) {
      // Only redirect if this is NOT the regular login page (i.e., it's a super admin login page)
      // For regular login page, let users see the login form even if already logged in
      if (isSuperAdminLogin) {
        // For super admin login page, redirect super admins to dashboard
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.role === 'superadmin') {
              navigate('/xq7m9k2p8n4r6t1w/dashboard');
              return;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      } else {
        // For regular login page, redirect non-superadmin users to projects
        // But don't redirect super admins - let them see the login page
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.role !== 'superadmin') {
              const targetCompanyId = userData.companyId || 'melanote';
              navigate(`/${targetCompanyId}/projects`);
              return;
            }
            // If super admin, don't redirect - let them see the login page
          } catch (e) {
            // If can't parse, redirect to super admin login for safety
            navigate('/xq7m9k2p8n4r6t1w/login');
            return;
          }
        } else {
          navigate('/xq7m9k2p8n4r6t1w/login');
          return;
        }
      }
    }
    
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId, isSuperAdminLogin, isAuthenticated, navigate]);

  const fetchCompanyData = async () => {
    setLoadingCompany(true);
    try {
      const res = await fetch(getApiUrl(`/api/auth/company/${companyId}`));
      if (res.ok) {
        const data = await res.json();
        setCompanyData(data);
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const success = await login(formData.username, formData.password, companyId);
      if (success) {
        // Role is checked in the AppContext/login method, but we can do a secondary check here
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          if (isSuperAdminLogin) {
            if (userData.role === 'superadmin') {
              navigate('/xq7m9k2p8n4r6t1w/dashboard');
            } else {
              // Not a superadmin, but tried to login via superadmin page
              const targetCompanyId = companyId || userData.companyId || 'melanote';
              navigate(`/${targetCompanyId}/projects`);
            }
          } else if (redirectTo) {
            navigate(redirectTo);
          } else {
            // For regular login, check if user is superadmin first
            if (userData.role === 'superadmin') {
              navigate('/xq7m9k2p8n4r6t1w/dashboard');
            } else {
              // For regular users, use company-specific URL
              const targetCompanyId = companyId || userData.companyId || 'melanote';
              navigate(`/${targetCompanyId}/projects`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'bg-[#141414]' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isSuperAdminLogin ? 'Super Admin Login' : (companyData?.branding?.companyName || companyData?.name || 'Company Login')}
          </h1>

          <div className="flex justify-center my-4">
            {companyId && !isSuperAdminLogin ? (
              companyData?.branding?.logo ? (
                <img
                  src={
                    companyData.branding.logo.startsWith('data:') ||
                    companyData.branding.logo.startsWith('http') ||
                    companyData.branding.logo.startsWith('/ChatGPT') ||
                    companyData.branding.logo.startsWith('/uploads')
                      ? companyData.branding.logo
                      : `${getBackendUrl()}${companyData.branding.logo}`
                  }
                  alt={`${companyData?.branding?.companyName || companyData?.name || 'Company'} Logo`}
                  className="h-16 object-contain"
                  onError={(e) => {
                    // Fallback to default logo if image fails to load
                    e.target.src = "/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png";
                  }}
                />
              ) : loadingCompany ? (
                <div className="h-16 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <img
                  src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png"
                  alt="Mela Note Logo"
                  className="h-16 object-contain"
                />
              )
            ) : (
              <img
                src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png"
                alt="Mela Note Logo"
                className="h-16 object-contain"
              />
            )}
          </div>

          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isSuperAdminLogin ? 'Enter your administrative credentials' : 'darul kubra Sign in to your account to continue'}
          </p>
        </div>

        {(error || validationErrors.auth) && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error || validationErrors.auth}</p>
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200 outline-none ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-700 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                } ${validationErrors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                  placeholder="Enter your username"
                />
              </div>
              {validationErrors.username && (
              <p className="mt-1.5 text-xs text-red-500 font-medium ml-1">{validationErrors.username}</p>
              )}
            </div>

            <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-2.5 rounded-xl border transition-all duration-200 outline-none ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-700 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10' 
                    : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                } ${validationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-gray-100 ${isDarkMode ? 'text-gray-500 hover:bg-gray-700' : 'text-gray-400'}`}
                >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {validationErrors.password && (
              <p className="mt-1.5 text-xs text-red-500 font-medium ml-1">{validationErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
            disabled={loading || isSubmitting}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] ${
              loading || isSubmitting 
                ? 'bg-indigo-400 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
              }`}
            >
            {(loading || isSubmitting) ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Sign In'}
            </button>
          </form>

          {!isSuperAdminLogin && (
          <p className={`mt-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Don't have an account?{' '}
                <Link
              to={companyId ? `/register?company=${companyId}` : "/register"} 
              className="font-bold text-indigo-600 hover:text-indigo-500 underline decoration-indigo-500/30 underline-offset-4"
                >
              Sign up
                </Link>
              </p>
          )}
      </div>
    </div>
  );
};

export default LoginPage;
