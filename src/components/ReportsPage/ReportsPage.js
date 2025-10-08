import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FileText, BarChart3, Plus, Grid, LayoutList, Star, TrendingUp, Clock, Eye, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportsPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    // Clear any existing fake reports and only show real submitted reports
    localStorage.removeItem('reports');
    const savedReports = JSON.parse(localStorage.getItem('submittedReports') || '[]');
    setReports(savedReports);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Reports Dashboard
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                  Manage and create professional reports with advanced analytics
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/submit-report')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">


        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-bold text-white">All Reports</h2>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
                <span className="text-gray-300 font-medium">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} total
                </span>
              </div>
              <div className="flex items-center gap-2 p-1 bg-gray-800/50 rounded-lg border border-gray-700">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/30 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-2xl">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-gray-600">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">No reports yet</h3>
            <p className="text-gray-400 mb-8 text-lg max-w-md mx-auto">
              Create your first professional report with our advanced editor
            </p>
            <button
              onClick={() => navigate('/submit-report')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Create Your First Report
            </button>
          </div>
        ) : (
          <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {reports.map((report) => (
              viewMode === 'card' ? (
                <div key={report.id} onClick={() => navigate(`/submit-report?edit=${report.id}`)} className="group bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Published
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-4 group-hover:text-blue-400 transition-colors line-clamp-2">{report.title}</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>By {report.owner || 'Unknown User'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={report.id} onClick={() => navigate(`/submit-report?edit=${report.id}`)} className="group flex items-center justify-between p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{report.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-400">By {report.owner || 'Unknown User'}</span>
                        <span className="text-sm text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    Published
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;