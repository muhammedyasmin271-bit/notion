import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemedPage = ({ children, className = '', gradient = true }) => {
  const { isDarkMode } = useTheme();

  const baseClasses = `min-h-screen transition-all duration-300 ${
    isDarkMode ? 'text-white' : 'text-gray-900'
  }`;

  const backgroundClasses = gradient
    ? isDarkMode
      ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black'
      : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    : isDarkMode
      ? 'bg-black'
      : 'bg-gray-50';

  return (
    <div className={`${baseClasses} ${backgroundClasses} ${className}`}>
      {children}
    </div>
  );
};

export default ThemedPage;