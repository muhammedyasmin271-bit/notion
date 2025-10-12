import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

// Protected Route Component for Manager-only pages
const ManagerRoute = ({ children }) => {
  const { user, isAuthenticated } = useAppContext();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

export default ManagerRoute;
