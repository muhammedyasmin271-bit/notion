import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { UserPlus, LogIn, Users, Shield, Database, CheckCircle } from 'lucide-react';

const WelcomePage = () => {
  const { isDarkMode } = useTheme();

  const features = [
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together with your team members on projects, documents, and meetings'
    },
    {
      icon: Database,
      title: 'Secure Database',
      description: 'Your information is safely stored in our database with proper authentication'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Different access levels for team members and managers'
    },
    {
      icon: CheckCircle,
      title: 'Easy Management',
      description: 'Simple user management and profile customization'
    }
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="max-w-4xl w-full">
        {/* Main Welcome Card */}
        <div className={`rounded-3xl shadow-2xl border-2 overflow-hidden mb-8 ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`px-8 py-12 text-center ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="mx-auto mb-6">
              <img 
                src="/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png" 
                alt="Mela Note Logo" 
                className={`w-24 h-24 mx-auto object-contain transition-all duration-300 ${
                  isDarkMode ? 'filter brightness-0 invert' : ''
                }`}
              />
            </div>
            <h1 className={`text-5xl font-black mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to Our Platform
            </h1>
            <p className={`text-xl mb-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Join our team and start collaborating on projects, documents, and meetings
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <UserPlus className="w-6 h-6 mr-3" />
                Create Account
              </Link>
              <Link
                to="/login"
                className={`flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border-2 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' 
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <LogIn className="w-6 h-6 mr-3" />
                Sign In
              </Link>
            </div>
          </div>

          {/* How to Join Section */}
          <div className="px-8 py-12">
            <h2 className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              How to Join
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Create Account
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Click "Create Account" and fill in your details including name, username, and password
                </p>
              </div>
              
              <div className="text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                }`}>
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Database Storage
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Your information is securely stored in our database with encrypted passwords
                </p>
              </div>
              
              <div className="text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Start Collaborating
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Login with your username and password to access all platform features
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <h2 className={`text-3xl font-bold text-center mb-8 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Platform Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                        isDarkMode ? 'bg-white' : 'bg-black'
                      }`}>
                        <Icon className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold mb-2 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className={`text-center p-6 rounded-2xl ${
          isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600'
        }`}>
          <p className="text-sm">
            🔒 Your data is secure • 👥 Team collaboration made easy • 🚀 Get started in minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
