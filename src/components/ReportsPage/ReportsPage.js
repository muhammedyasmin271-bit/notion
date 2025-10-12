import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FileText, BarChart3, Plus, Grid, LayoutList, Star, TrendingUp, Clock, Eye, CheckCircle, Calendar, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [sharedReports, setSharedReports] = useState([]);
  const [activeTab, setActiveTab] = useState('my-reports');
  const [adminSharedReports, setAdminSharedReports] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        // Fetch my reports
        const myReportsResponse = await fetch('http://localhost:9000/api/reports', {
          headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
        });
        if (myReportsResponse.ok) {
          const data = await myReportsResponse.json();
          setReports(data.reports || []);
        }

        // Fetch shared reports
        const sharedReportsResponse = await fetch('http://localhost:9000/api/reports/shared/with-me', {
          headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
        });
        if (sharedReportsResponse.ok) {
          const data = await sharedReportsResponse.json();
          if (currentUser.role === 'admin') {
            // For admins: separate reports shared WITH admin vs ALL shared reports
            const reportsSharedWithAdmin = data.reports.filter(report => 
              report.sharedWith.some(user => user._id === currentUser.id)
            );
            const allSharedReports = data.reports;
            
            setSharedReports(reportsSharedWithAdmin);
            setAdminSharedReports(allSharedReports);
          } else {
            setSharedReports(data.reports || []);
            setAdminSharedReports([]);
          }
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };
    
    fetchReports();
  }, []);

  const handleDeleteReport = async (reportId, event) => {
    event.stopPropagation(); // Prevent navigation when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:9000/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Remove the report from the local state
        setReports(prevReports => prevReports.filter(report => report._id !== reportId));
        alert('Report deleted successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete report: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <div className={`backdrop-blur-sm border-b shadow-2xl ${
        isDarkMode 
          ? 'bg-gray-900/50 border-gray-700/50' 
          : 'bg-white/50 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <BarChart3 className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Reports Dashboard
                </h1>
                <p className={`mt-1 sm:mt-2 text-sm sm:text-lg ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Manage and create professional reports
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/submit-report')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sm:inline">New Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">


        {/* Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto overflow-x-auto">
            <div className={`flex rounded-lg p-1 border min-w-max ${
              isDarkMode 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-gray-100 border-gray-200'
            }`}>
              <button
                onClick={() => setActiveTab('my-reports')}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                  activeTab === 'my-reports' 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">My Reports ({reports.length})</span>
                <span className="sm:hidden">Mine ({reports.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('shared-reports')}
                className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                  activeTab === 'shared-reports' 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <span className="hidden sm:inline">Shared with Me ({sharedReports.length})</span>
                <span className="sm:hidden">Shared ({sharedReports.length})</span>
              </button>
              {JSON.parse(localStorage.getItem('user') || '{}').role === 'admin' && (
                <button
                  onClick={() => setActiveTab('shared')}
                  className={`px-3 sm:px-4 py-2 rounded-md font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                    activeTab === 'shared' 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">Shared ({adminSharedReports.length})</span>
                  <span className="sm:hidden">All ({adminSharedReports.length})</span>
                </button>
              )}
            </div>
          </div>
          <div className={`hidden sm:flex items-center gap-2 p-1 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-100 border-gray-200'
          }`}>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'card' 
                  ? 'bg-blue-600 text-white' 
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(activeTab === 'my-reports' ? reports : activeTab === 'shared' ? adminSharedReports : sharedReports).length === 0 ? (
          <div className={`text-center py-12 sm:py-20 backdrop-blur-sm rounded-2xl sm:rounded-3xl border shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/30 border-gray-700/50' 
              : 'bg-white/50 border-gray-200/50'
          }`}>
            <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center border ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <FileText className={`w-8 h-8 sm:w-12 sm:h-12 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
            <h3 className={`text-xl sm:text-2xl font-bold mb-3 px-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {activeTab === 'my-reports' ? 'No reports yet' : activeTab === 'shared' ? 'No shared reports' : 'No shared reports'}
            </h3>
            <p className={`mb-6 sm:mb-8 text-base sm:text-lg max-w-md mx-auto px-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {activeTab === 'my-reports' 
                ? 'Create your first professional report with our advanced editor'
                : activeTab === 'shared'
                  ? 'No shared reports found. When team members share reports, they will appear here'
                  : 'When team members share reports with you, they will appear here'
              }
            </p>
            <button
              onClick={() => navigate('/submit-report')}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Create Your First Report
            </button>
          </div>
        ) : (
          <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-3 sm:space-y-4'}>
            {(activeTab === 'my-reports' ? reports : activeTab === 'shared' ? adminSharedReports : sharedReports).map((report) => {
              const reportId = report._id || report.id;
              const ownerName = report.owner?.name || report.owner || 'Unknown User';
              const createdAt = report.createdAt || report.createdAt;
              
              return viewMode === 'card' ? (
                <div key={reportId} className={`group rounded-xl sm:rounded-2xl p-4 sm:p-6 border hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700/50' 
                    : 'bg-white border-gray-200 hover:shadow-blue-500/5'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {activeTab === 'my-reports' && (
                        <button
                          onClick={(e) => handleDeleteReport(reportId, e)}
                          className="p-1 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {(activeTab === 'shared-reports' || activeTab === 'shared') && (
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Shared
                        </div>
                      )}
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        {report.status || 'Published'}
                      </div>
                    </div>
                  </div>
                  <div onClick={() => navigate(`/submit-report?edit=${reportId}`)} className="cursor-pointer">
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 group-hover:text-blue-400 transition-colors line-clamp-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{report.title}</h3>
                  <div className={`space-y-2 text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>By {ownerName}</span>
                    </div>
                    {report.sharedWith && report.sharedWith.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Shared with {report.sharedWith.length} user(s)</span>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              ) : (
                <div key={reportId} onClick={() => navigate(`/submit-report?edit=${reportId}`)} className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border hover:border-blue-500/30 transition-all duration-200 cursor-pointer gap-3 sm:gap-4 ${
                  isDarkMode 
                    ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30 flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base sm:text-lg font-semibold group-hover:text-blue-400 transition-colors truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{report.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                        <span className={`text-xs sm:text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>By {ownerName}</span>
                        <span className={`text-xs sm:text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>{new Date(createdAt).toLocaleDateString()}</span>
                        {report.sharedWith && report.sharedWith.length > 0 && (
                          <span className="text-xs sm:text-sm text-blue-400">Shared with {report.sharedWith.length}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {activeTab === 'my-reports' && (
                      <button
                        onClick={(e) => handleDeleteReport(reportId, e)}
                        className="p-1 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {(activeTab === 'shared-reports' || activeTab === 'shared') && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">
                        Shared
                      </div>
                    )}
                    <div className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
                      {report.status || 'Published'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;