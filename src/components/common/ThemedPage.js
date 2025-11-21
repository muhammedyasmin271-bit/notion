import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemedPage = ({ children, className = '', gradient = true }) => {
  const { isDarkMode } = useTheme();

  const baseClasses = `min-h-screen transition-all duration-300 ${
    isDarkMode ? 'text-white' : 'text-gray-900'
  }`;

  const backgroundClasses = gradient
    ? isDarkMode
      ? 'bg-black'
      : 'bg-white'
    : isDarkMode
      ? 'bg-black'
      : 'bg-white';

  return (
    <div className={`${baseClasses} ${backgroundClasses} ${className}`}>
      {children}
    </div>
  );
};

export default ThemedPage;