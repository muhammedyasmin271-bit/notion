import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'success', 'info'
  isDarkMode = false,
  showCancel = true
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-500" />,
          button: 'bg-red-600 hover:bg-red-700 text-white',
          lightBg: 'bg-red-50'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          button: 'bg-green-600 hover:bg-green-700 text-white',
          lightBg: 'bg-green-50'
        };
      case 'info':
        return {
          icon: <Info className="h-6 w-6 text-blue-500" />,
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          lightBg: 'bg-blue-50'
        };
      case 'warning':
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          lightBg: 'bg-yellow-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-200 ${
          isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900'
        }`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : styles.lightBg}`}>
              {styles.icon}
            </div>
            <button 
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            {message}
          </p>
          
          <div className="flex gap-3 justify-end">
            {showCancel && (
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

