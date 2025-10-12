import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Calendar, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SharedReportsPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [sharedReports, setSharedReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch('http://localhost:9000/api/reports/shared/with-me', {
          method: 'GET',
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📤 Fetched shared reports:', data.reports?.length || 0);
          setSharedReports(data.reports || []);
        } else {
          console.error('Failed to fetch shared reports:', response.status);
        }
      } catch (error) {
        console.error('Error fetching shared reports:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedReports();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading shared reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={() => navigate('/reports')}
            className={`p-3 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
              Shared Reports
            </h1>
            <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Reports that have been shared with you by team members
            </p>
          </div>
        </div>

        {sharedReports.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border ${isDarkMode ? 'bg-gray-800/30 backdrop-blur-sm border-gray-700/50' : 'bg-white/80 backdrop-blur-sm border-gray-200/50'}`}>
            <div className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center border ${isDarkMode ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-gray-600' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-gray-300'}`}>
              <Users className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No shared reports</h3>
            <p className={`text-lg max-w-md mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              When team members share reports with you, they will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedReports.map((report) => (
              <div
                key={report._id}
                onClick={() => navigate(`/submit-report?edit=${report._id}`)}
                className={`group flex items-center justify-between p-6 rounded-xl border transition-all duration-200 cursor-pointer ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800/50' : 'bg-white/80 border-gray-200/50 hover:border-blue-500/30 hover:bg-white/90'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold group-hover:text-blue-400 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        By {report.owner?.name || 'Unknown User'}
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Shared
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    {report.status || 'Published'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedReportsPage;