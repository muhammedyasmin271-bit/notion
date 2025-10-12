import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Clock, CheckCircle, Mail, ArrowLeft } from 'lucide-react';

const PendingApprovalPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center p-3 sm:p-6 transition-all duration-500 relative overflow-hidden ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-blue-500' : 'bg-blue-400'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          isDarkMode ? 'bg-purple-500' : 'bg-purple-400'
        }`}></div>
      </div>

      <div className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border-2 overflow-hidden relative z-10 transition-all duration-500 backdrop-blur-xl ${
        isDarkMode ? 'bg-gray-900/90 border-gray-800 shadow-black/50' : 'bg-white/95 border-gray-200 shadow-gray-500/20'
      }`}>
        {/* Header */}
        <div className="px-4 sm:px-10 py-6 sm:py-10 text-center">
          <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center mb-4 sm:mb-6 ${
            isDarkMode ? 'bg-yellow-900/20 border-2 border-yellow-700' : 'bg-yellow-100 border-2 border-yellow-300'
          }`}>
            <Clock className={`w-8 h-8 sm:w-12 sm:h-12 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
          </div>
          
          <h1 className={`text-2xl sm:text-4xl font-black mb-3 sm:mb-4 leading-tight ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Registration Submitted!
          </h1>
          
          <p className={`text-base sm:text-xl font-medium mb-6 sm:mb-8 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your account is pending manager approval
          </p>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-10 py-6 sm:py-8">
          <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-8 border-2 mb-6 sm:mb-8 ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDarkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-100 border border-green-300'
                }`}>
                  <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Registration Complete
                  </h3>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Your registration has been successfully submitted with all required information and files.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDarkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-100 border border-yellow-300'
                }`}>
                  <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Awaiting Manager Approval
                  </h3>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    An existing manager will review and approve your registration. This process typically takes 1-2 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-100 border border-blue-300'
                }`}>
                  <Mail className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    You'll Be Notified
                  </h3>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Once approved, you'll be able to log in and access all features of the workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 ${
            isDarkMode ? 'bg-blue-900/10 border-blue-800' : 'bg-blue-50 border-blue-200'
          }`}>
            <h3 className={`text-base sm:text-lg font-bold mb-2 ${
              isDarkMode ? 'text-blue-300' : 'text-blue-800'
            }`}>
              What happens next?
            </h3>
            <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-700'
            }`}>
              An existing manager will review your registration. If approved, your account will be activated and you can start using the workspace immediately.
            </p>
            <div className={`text-xs ${
              isDarkMode ? 'text-blue-500' : 'text-blue-600'
            }`}>
              💡 Tip: Make sure to check your email for approval notifications
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-6 sm:mt-8 text-center">
            <Link
              to="/login"
              className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 min-h-[44px] ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;