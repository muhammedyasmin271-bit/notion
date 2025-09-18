import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

// Protected Route Component for Admin-only pages
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAppContext();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

export default AdminRoute;