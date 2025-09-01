import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return apiService.isAuthenticated();
  });
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        if (apiService.isAuthenticated()) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        setError('Failed to authenticate user');
        setIsAuthenticated(false);
        apiService.setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await apiService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        await handleLogout();
      }
    }, 6 * 60 * 60 * 1000); // Refresh every 6 hours

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      setError(error.message || 'Login failed');
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      // Support multipart registration with files
      if (typeof FormData !== 'undefined' && userData instanceof FormData) {
        response = await apiService.upload('/auth/register', userData);
      } else {
        response = await apiService.register(userData);
      }
      // Only authenticate if approved
      const isApproved = response?.user?.status === 'approved';
      if (isApproved) {
        if (response?.token) apiService.setAuthToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Ensure no auth until approved
        apiService.setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      return response;
    } catch (error) {
      setError(error.message || 'Registration failed');
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('AppContext logout called');
    setLoading(true);
    try {
      await apiService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      // Clear any cached data
      localStorage.removeItem('recentUsers');
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if server logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      apiService.setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const updateUserPreferences = async (preferences) => {
    try {
      const updatedUser = await apiService.updatePreferences(preferences);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      setError(error.message || 'Failed to update preferences');
      throw error;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiService.changePassword(currentPassword, newPassword);
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      setError(error.message || 'Failed to change password');
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue = {
    user,
    setUser,
    users,
    setUsers,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUserPreferences,
    changePassword,
    clearError,
    apiService, // Expose API service for other components
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
