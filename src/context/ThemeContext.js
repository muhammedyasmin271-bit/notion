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
    // Default to light mode (white background) for black and white theme
    return false;
  });

  const [navbarBgColor, setNavbarBgColor] = useState(() => {
    // Check localStorage for saved navbar color preference
    const savedNavbarColor = localStorage.getItem('navbarBgColor');
    return savedNavbarColor || 'bg-white border-black';
  });

  // Map navbar colors to button colors - Black and White only
  const getButtonColors = (navbarColor) => {
    const colorMap = {
      'bg-white border-black': 'bg-black hover:bg-gray-900 active:bg-gray-800 border-black text-white',
      'bg-black border-white': 'bg-white hover:bg-gray-100 active:bg-gray-200 border-white text-black'
    };
    return colorMap[navbarColor] || colorMap['bg-white border-black'];
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
