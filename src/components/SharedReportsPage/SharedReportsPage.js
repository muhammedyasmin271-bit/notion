import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Users, Calendar, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const SharedReportsPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [searchParams] = useSearchParams();
  
  // Get companyId from query params or user context
  const companyId = searchParams.get('company') || user?.companyId || localStorage.getItem('currentCompanyId');
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

        const response = await fetch('https://melaback.vercel.app/api/reports/shared/with-me', {
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-gray-50 text-gray-900'}`}
        style={isDarkMode ? { backgroundColor: '#141414' } : {}}
      >
        <div className="text-center">
          <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading shared reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-gray-50 text-gray-900'}`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={() => {
              const backUrl = companyId ? `/reports?company=${companyId}` : '/reports';
              navigate(backUrl);
            }}
            className={`p-3 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Shared Reports
            </h1>
            <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Reports that have been shared with you by team members
            </p>
          </div>
        </div>

        {sharedReports.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border ${isDarkMode ? 'bg-gray-800/30 backdrop-blur-sm border-gray-700/50' : 'bg-white/80 backdrop-blur-sm border-gray-200/50'}`}>
            <div className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center border ${isDarkMode ? 'bg-white/20 border-gray-600' : 'bg-black/10 border-gray-300'}`}>
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
                className={`group flex items-center justify-between p-6 rounded-xl border transition-all duration-200 cursor-pointer ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50 hover:border-white/30 hover:bg-gray-800/50' : 'bg-white/80 border-gray-200/50 hover:border-black/30 hover:bg-white/90'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-white/20 border-white/30' : 'bg-black/20 border-black/30'}`}>
                    <FileText className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold transition-colors ${isDarkMode ? 'text-white group-hover:text-gray-300' : 'text-gray-900 group-hover:text-gray-700'}`}>
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
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${isDarkMode ? 'bg-white/20 text-white border-white/30' : 'bg-black/20 text-black border-black/30'}`}>
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