import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const SuperAdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAppContext();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Immediate security check - block access before anything renders
  useEffect(() => {
    const verifyAccess = () => {
      // Wait for initial auth check to complete
      if (loading) {
        return;
      }

      // Immediate check - if not authenticated, block immediately
      if (!isAuthenticated) {
        setIsChecking(false);
        setIsAuthorized(false);
        return;
      }

      // Verify token exists in localStorage
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (!storedUser || !storedToken) {
        setIsChecking(false);
        setIsAuthorized(false);
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        
        // Critical check: Must be superadmin role
        const isSuperAdmin = userData.role === 'superadmin' && user?.role === 'superadmin';
        
        if (!isSuperAdmin) {
          setIsChecking(false);
          setIsAuthorized(false);
          return;
        }

        // All checks passed
        setIsAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error('Error verifying super admin access:', error);
        setIsChecking(false);
        setIsAuthorized(false);
      }
    };

    verifyAccess();
  }, [loading, isAuthenticated, user]);

  // Show loading state while checking - don't render children yet
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Block access immediately if not authorized - redirect to super admin login
  // This ensures the super admin page is NEVER visible to unauthorized users
  if (!isAuthenticated || !isAuthorized) {
    return <Navigate to="/xq7m9k2p8n4r6t1w/login" replace />;
  }

  // Final check - if somehow user role doesn't match, redirect
  if (user?.role !== 'superadmin') {
    return <Navigate to="/xq7m9k2p8n4r6t1w/login" replace />;
  }

  // Only render children if all security checks pass
  return children;
};

export default SuperAdminRoute;
