import React from 'react';
import { useAppContext } from '../../context/AppContext';

const RoleGuard = ({ 
  children, 
  requiredRole = 'user', 
  fallback = null,
  requirePermission = null 
}) => {
  const { 
    user, 
    isAdmin, 
    isManager, 
    isUser,
    canApproveManagers,
    canApproveUsers,
    canCreateProjects,
    canViewAllProjects,
    canCreateNotepad,
    canShareContent
  } = useAppContext();

  // Check if user has required role
  const hasRole = () => {
    switch (requiredRole) {
      case 'admin':
        return isAdmin();
      case 'manager':
        return isManager();
      case 'user':
        return isUser();
      default:
        return false;
    }
  };

  // Check specific permissions
  const hasPermission = () => {
    if (!requirePermission) return true;
    
    switch (requirePermission) {
      case 'approveManagers':
        return canApproveManagers();
      case 'approveUsers':
        return canApproveUsers();
      case 'createProjects':
        return canCreateProjects();
      case 'viewAllProjects':
        return canViewAllProjects();
      case 'createNotepad':
        return canCreateNotepad();
      case 'shareContent':
        return canShareContent();
      default:
        return false;
    }
  };

  // Show content if user has required role and permission
  if (hasRole() && hasPermission()) {
    return children;
  }

  // Show fallback or nothing
  return fallback;
};

export default RoleGuard;