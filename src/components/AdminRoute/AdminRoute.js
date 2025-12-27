import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

// Protected Route Component for Admin-only pages
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAppContext();
  
  // Show loading while authentication is being initialized
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/xq7m9k2p8n4r6t1w/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    const targetCompanyId = user?.companyId || 'melanote';
    return <Navigate to={`/${targetCompanyId}/projects`} replace />;
  }
  
  return children;
};

export default AdminRoute;