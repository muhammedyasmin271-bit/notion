import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Default to dark mode or check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [navbarBgColor, setNavbarBgColor] = useState(() => {
    // Check localStorage for saved navbar color preference
    const savedNavbarColor = localStorage.getItem('navbarBgColor');
    return savedNavbarColor || 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900';
  });

  // Map navbar colors to button colors
  const getButtonColors = (navbarColor) => {
    const colorMap = {
      'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900': 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-blue-500/50 border-blue-400',
      'bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800': 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 shadow-gray-600/50 border-gray-500',
      'bg-gradient-to-br from-gray-900 via-slate-800 to-black': 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700 shadow-gray-500/50 border-gray-400'
    };
    return colorMap[navbarColor] || colorMap['bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900'];
  };

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      root.setAttribute('data-theme', 'light');
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
    
    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    // Save navbar color preference to localStorage
    localStorage.setItem('navbarBgColor', navbarBgColor);
  }, [navbarBgColor]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const updateNavbarBgColor = (color) => {
    setNavbarBgColor(color);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light',
    navbarBgColor,
    updateNavbarBgColor,
    buttonColors: getButtonColors(navbarBgColor)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
