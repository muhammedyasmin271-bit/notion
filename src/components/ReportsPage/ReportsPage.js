import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { FileText, BarChart3, Plus, Calendar, Users, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [sharedReports, setSharedReports] = useState([]);
  const [adminSharedReports, setAdminSharedReports] = useState([]);

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

  const renderReportCard = (report, reportType = 'my-report') => {
    const reportId = report._id || report.id;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Properly extract owner name
    let ownerName = 'Unknown User';
    
    // If it's the user's own report, use their name
    if (reportType === 'my-report' && currentUser.name) {
      ownerName = currentUser.name;
    } else if (report.owner) {
      if (typeof report.owner === 'string') {
        // If owner is a string, check if it's an ID (long hex string) or a name
        // IDs are typically 24 characters (MongoDB ObjectId) or longer
        if (report.owner.length > 20) {
          // It's likely an ID, check if it matches current user
          if (currentUser.id === report.owner || currentUser._id === report.owner) {
            ownerName = currentUser.name || currentUser.username || 'You';
          } else {
            ownerName = 'Unknown User';
          }
        } else {
          ownerName = report.owner;
        }
      } else if (report.owner.name) {
        ownerName = report.owner.name;
      } else if (report.owner.username) {
        ownerName = report.owner.username;
      } else if (report.owner._id) {
        // Check if owner ID matches current user
        if (currentUser.id === report.owner._id || currentUser._id === report.owner._id) {
          ownerName = currentUser.name || currentUser.username || 'You';
        } else {
          ownerName = 'Unknown User';
        }
      } else {
        ownerName = 'Unknown User';
      }
    }
    
    // Don't show "Unknown User" if we can determine it's the current user
    if (ownerName === 'Unknown User' && reportType === 'my-report' && currentUser.name) {
      ownerName = currentUser.name;
    }
    
    const createdAt = report.createdAt;
    const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }) : 'N/A';
    const isOwnReport = reportType === 'my-report';

    // Determine badge label and color based on report type
    const getTypeBadge = () => {
      if (isDarkMode) {
        switch (reportType) {
          case 'my-report':
            return { label: 'My Report', bgColor: 'bg-blue-900/30', textColor: 'text-blue-300' };
          case 'shared-with-me':
            return { label: 'Shared with Me', bgColor: 'bg-purple-900/30', textColor: 'text-purple-300' };
          case 'shared':
            return { label: 'Shared', bgColor: 'bg-orange-900/30', textColor: 'text-orange-300' };
          default:
            return { label: 'Report', bgColor: 'bg-gray-800', textColor: 'text-gray-300' };
        }
      } else {
        switch (reportType) {
          case 'my-report':
            return { label: 'My Report', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
          case 'shared-with-me':
            return { label: 'Shared with Me', bgColor: 'bg-purple-100', textColor: 'text-purple-800' };
          case 'shared':
            return { label: 'Shared', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
          default:
            return { label: 'Report', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
        }
      }
    };

    const typeBadge = getTypeBadge();

    return (
      <div 
        key={reportId} 
        onClick={() => {
          const companyId = user?.companyId || 'melanote';
          navigate(`/${companyId}/submit-report?edit=${reportId}`);
        }}
        className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-4 sm:p-5 hover:shadow-md transition-all duration-200 cursor-pointer relative group`}
      >
        {/* ID Header with Type Badge */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              ID: #{String(reportId).slice(-5)}
            </span>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge.bgColor} ${typeBadge.textColor}`}>
              {typeBadge.label}
            </span>
          </div>
          <ExternalLink className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
        </div>

        {/* Report Title */}
        <div className="mb-3 sm:mb-4">
          <p className={`text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Title:</p>
          <h3 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
            {report.title || 'Untitled Report'}
          </h3>
        </div>

        {/* Due Date */}
        <div className="mb-2 sm:mb-3">
          <p className={`text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created Date:</p>
          <div className="inline-flex items-center">
            <Calendar className={`w-3 h-3 mr-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`} />
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Assignee/Owner */}
        <div className="mb-2 sm:mb-3">
          <p className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Owner:</p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                {ownerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className={`text-xs sm:text-sm font-medium truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              {ownerName}
            </span>
          </div>
        </div>

        {/* Shared With Info */}
        {report.sharedWith && report.sharedWith.length > 0 && (
          <div className="mb-2 sm:mb-3">
            <p className={`text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shared With:</p>
            <div className="flex items-center gap-1 flex-wrap">
              {report.sharedWith.slice(0, 3).map((user, idx) => (
                <div key={idx} className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              ))}
              {report.sharedWith.length > 3 && (
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  +{report.sharedWith.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status and Actions */}
        <div className={`flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
            report.status === 'Published' || !report.status
              ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
              : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
          }`}>
            {report.status || 'Published'}
          </span>
          <div className="flex items-center gap-1 sm:gap-2">
            {isOwnReport && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteReport(reportId, e);
                }}
                className={`p-1 sm:p-1.5 rounded-lg text-red-500 transition-all ${isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                title="Delete report"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Refresh action - can be implemented later
              }}
              className={`p-1 sm:p-1.5 rounded-lg text-gray-500 transition-all ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Combine all reports into one array with type labels
  const getAllReports = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUser.id || currentUser._id;
    const allReports = [];

    // Add my reports
    reports.forEach(report => {
      allReports.push({ ...report, reportType: 'my-report' });
    });

    // Add shared with me reports (excluding duplicates that are already in my reports)
    const myReportIds = new Set(reports.map(r => r._id || r.id));
    sharedReports.forEach(report => {
      if (!myReportIds.has(report._id || report.id)) {
        allReports.push({ ...report, reportType: 'shared-with-me' });
      }
    });

    // Add all shared reports for admin (excluding duplicates)
    if (currentUser.role === 'admin' && adminSharedReports.length > 0) {
      const existingReportIds = new Set(allReports.map(r => r._id || r.id));
      adminSharedReports.forEach(report => {
        const reportId = report._id || report.id;
        if (!existingReportIds.has(reportId)) {
          // Check if this report belongs to the admin
          const isAdminReport = report.owner?._id === currentUserId || report.owner?._id === currentUser._id || report.owner === currentUserId;
          // Check if it's already in shared with me
          const isInSharedWithMe = sharedReports.some(r => (r._id || r.id) === reportId);
          
          if (!isAdminReport && !isInSharedWithMe) {
            allReports.push({ ...report, reportType: 'shared' });
          }
        }
      });
    }

    return allReports;
  };

  const allReports = getAllReports();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Reports Dashboard
              </h1>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${isDarkMode ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-200 text-gray-700'}`}>
                {allReports.length}
              </span>
            </div>
            <button
              onClick={() => {
                const companyId = user?.companyId || localStorage.getItem('currentCompanyId') || 'melanote';
                navigate(`/${companyId}/submit-report`);
              }}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } shadow-sm`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Report</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* All Reports in One Grid */}
        {allReports.length === 0 ? (
          <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-xl shadow-sm border text-center py-8 sm:py-12 px-4`}>
            <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}>
              <FileText className={`w-6 h-6 sm:w-8 sm:h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-base sm:text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No reports yet
            </h3>
            <p className={`mb-4 text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create your first professional report
            </p>
            <button
              onClick={() => {
                const companyId = user?.companyId || localStorage.getItem('currentCompanyId') || 'melanote';
                navigate(`/${companyId}/submit-report`);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Create Your First Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {allReports.map(report => renderReportCard(report, report.reportType))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;