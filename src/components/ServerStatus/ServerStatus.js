import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Server, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ServerStatus = () => {
  const { isDarkMode } = useTheme();
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      setStatus('checking');
      const response = await fetch('http://localhost:5000/api/health');
      
      if (response.ok) {
        const data = await response.json();
        setStatus('online');
        setError(null);
        console.log('Server status:', data);
      } else {
        setStatus('error');
        setError(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      setStatus('offline');
      setError(error.message);
      console.error('Server connection failed:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Server className="w-4 h-4 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Server Online';
      case 'offline':
        return 'Server Offline';
      case 'error':
        return 'Server Error';
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'offline':
        return 'text-red-400';
      case 'error':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } shadow-lg z-50`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        <button
          onClick={checkServerStatus}
          className={`ml-2 px-2 py-1 text-xs rounded ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Refresh
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-400 max-w-xs">
          {error}
        </div>
      )}
      {status === 'offline' && (
        <div className="mt-2 text-xs text-gray-400 max-w-xs">
          Make sure the backend server is running on port 5000
        </div>
      )}
    </div>
  );
};

export default ServerStatus;