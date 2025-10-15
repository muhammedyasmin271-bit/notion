import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const SuperAdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'superadmin') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default SuperAdminRoute;
