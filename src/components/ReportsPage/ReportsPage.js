import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Zap,
  Award,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  Upload
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const ReportsPage = () => {
  const { isDarkMode } = useTheme();
  const { user, users } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [workerReport, setWorkerReport] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [workerReports, setWorkerReports] = useState([]);
  const [reportData, setReportData] = useState({
    projects: [],
    goals: [],
    documents: [],
    meetings: [],
    users: []
  });

  useEffect(() => {
    loadReportData();
    loadWorkerReports();
  }, [dateRange]);

  const loadWorkerReports = () => {
    const reports = JSON.parse(localStorage.getItem('workerReports') || '[]');
    setWorkerReports(reports);
  };

  const submitWorkerReport = () => {
    if (!workerReport.trim() || !reportTitle.trim()) return;
    
    const report = {
      id: Date.now(),
      title: reportTitle,
      content: workerReport,
      author: user?.name || 'Anonymous',
      role: user?.role || 'user',
      createdAt: new Date().toISOString(),
      wordCount: workerReport.trim().split(/\s+/).length,
      status: 'submitted'
    };
    
    const updated = [...workerReports, report];
    setWorkerReports(updated);
    localStorage.setItem('workerReports', JSON.stringify(updated));
    setWorkerReport('');
    setReportTitle('');
  };

  const loadReportData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const goals = JSON.parse(localStorage.getItem('goals') || '[]');
      const documents = JSON.parse(localStorage.getItem('documents') || '[]');
      const meetings = JSON.parse(localStorage.getItem('meetingNotes') || '[]');
      
      setReportData({
        projects,
        goals,
        documents,
        meetings,
        users
      });
      setIsLoading(false);
    }, 1000);
  };

  const getMetrics = () => {
    const { projects, goals, documents, meetings } = reportData;
    
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Done').length;
    const inProgressProjects = projects.filter(p => p.status === 'In progress').length;
    
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'Done').length;
    
    const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    
    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      totalGoals,
      completedGoals,
      totalDocuments: documents.length,
      totalMeetings: meetings.length,
      projectCompletionRate,
      goalCompletionRate,
      activeUsers: users.filter(u => u.status === 'active').length,
      totalUsers: users.length
    };
  };

  const metrics = getMetrics();

  const exportReport = () => {
    const reportContent = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      metrics,
      data: reportData
    };
    
    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${
      isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${
            change > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {title}
      </div>
      {subtitle && (
        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const ProgressChart = ({ title, data, color }) => (
    <div className={`p-6 rounded-xl border ${
      isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.label}
              </span>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {item.value}%
              </span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Professional Header */}
      <div className={`sticky top-0 z-10 border-b backdrop-blur-sm shadow-lg ${
        isDarkMode ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 border-gray-800' : 'bg-gradient-to-r from-white via-gray-50 to-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl shadow-lg bg-gradient-to-br from-blue-600 to-purple-600`}>
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Professional Analytics
                </h1>
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enterprise-grade insights and performance metrics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-3 p-2 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={`px-4 py-3 rounded-lg border-0 font-semibold focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white text-gray-900'
                  }`}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                
                <button
                  onClick={loadReportData}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Content */}
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Enhanced Tab Navigation */}
        <div className={`flex space-x-2 p-2 rounded-2xl mb-10 shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'projects', label: 'Projects', icon: Target },
            { id: 'team', label: 'Team Performance', icon: Users },
            { id: 'productivity', label: 'Productivity', icon: TrendingUp },
            { id: 'worker-reports', label: user?.role === 'manager' ? 'Worker Reports' : 'Submit Report', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-102' : 'text-gray-600 hover:text-black hover:bg-gray-100 hover:scale-102'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Projects"
                value={metrics.totalProjects}
                change={12}
                icon={Target}
                color="bg-blue-600"
                subtitle={`${metrics.completedProjects} completed`}
              />
              <MetricCard
                title="Active Goals"
                value={metrics.totalGoals}
                change={8}
                icon={Award}
                color="bg-green-600"
                subtitle={`${metrics.completedGoals} achieved`}
              />
              <MetricCard
                title="Documents"
                value={metrics.totalDocuments}
                change={-3}
                icon={FileText}
                color="bg-purple-600"
                subtitle="All file types"
              />
              <MetricCard
                title="Team Members"
                value={metrics.totalUsers}
                change={5}
                icon={Users}
                color="bg-orange-600"
                subtitle={`${metrics.activeUsers} active`}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProgressChart
                title="Project Completion Rate"
                data={[
                  { label: 'Completed Projects', value: metrics.projectCompletionRate },
                  { label: 'In Progress', value: (metrics.inProgressProjects / metrics.totalProjects) * 100 || 0 },
                  { label: 'Not Started', value: ((metrics.totalProjects - metrics.completedProjects - metrics.inProgressProjects) / metrics.totalProjects) * 100 || 0 }
                ]}
                color="bg-blue-600"
              />
              
              <ProgressChart
                title="Goal Achievement Rate"
                data={[
                  { label: 'Achieved Goals', value: metrics.goalCompletionRate },
                  { label: 'In Progress', value: 100 - metrics.goalCompletionRate }
                ]}
                color="bg-green-600"
              />
            </div>

            {/* Activity Summary */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Activity Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {metrics.totalMeetings}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Meeting Notes Created
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {Math.round(metrics.projectCompletionRate)}%
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Average Completion Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {metrics.activeUsers}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Active Team Members
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className={`lg:col-span-2 p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Project Status Distribution
                </h3>
                <div className="space-y-4">
                  {[
                    { status: 'Done', count: metrics.completedProjects, color: 'bg-green-600' },
                    { status: 'In Progress', count: metrics.inProgressProjects, color: 'bg-blue-600' },
                    { status: 'Not Started', count: metrics.totalProjects - metrics.completedProjects - metrics.inProgressProjects, color: 'bg-gray-600' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${item.color}`} />
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.count}
                        </span>
                        <div className={`w-32 h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${metrics.totalProjects > 0 ? (item.count / metrics.totalProjects) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Project Insights
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {Math.round(metrics.projectCompletionRate)}%
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Completion Rate
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {metrics.inProgressProjects}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Active Projects
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Performance Tab */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Total Members"
                value={metrics.totalUsers}
                icon={Users}
                color="bg-blue-600"
                subtitle="Team size"
              />
              <MetricCard
                title="Active Members"
                value={metrics.activeUsers}
                icon={Activity}
                color="bg-green-600"
                subtitle="Currently active"
              />
              <MetricCard
                title="Managers"
                value={users.filter(u => u.role === 'manager').length}
                icon={Award}
                color="bg-purple-600"
                subtitle="Leadership team"
              />
            </div>

            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Team Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    By Role
                  </h4>
                  <div className="space-y-3">
                    {[
                      { role: 'Managers', count: users.filter(u => u.role === 'manager').length, color: 'bg-purple-600' },
                      { role: 'Users', count: users.filter(u => u.role === 'user').length, color: 'bg-blue-600' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${item.color}`} />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {item.role}
                          </span>
                        </div>
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Productivity Tab */}
        {activeTab === 'productivity' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Completion Rate"
                value={`${Math.round(metrics.projectCompletionRate)}%`}
                icon={CheckCircle}
                color="bg-green-600"
                subtitle="Projects completed"
              />
              <MetricCard
                title="Goal Achievement"
                value={`${Math.round(metrics.goalCompletionRate)}%`}
                icon={Target}
                color="bg-blue-600"
                subtitle="Goals achieved"
              />
              <MetricCard
                title="Documents Created"
                value={metrics.totalDocuments}
                icon={FileText}
                color="bg-purple-600"
                subtitle="Total documents"
              />
              <MetricCard
                title="Meeting Notes"
                value={metrics.totalMeetings}
                icon={Calendar}
                color="bg-orange-600"
                subtitle="Notes created"
              />
            </div>

            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Productivity Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {metrics.completedProjects + metrics.completedGoals}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Completions
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Math.round((metrics.projectCompletionRate + metrics.goalCompletionRate) / 2)}%
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Average Success Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {metrics.totalDocuments + metrics.totalMeetings}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Content Created
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Worker Reports Tab */}
        {activeTab === 'worker-reports' && (
          <div className="space-y-8">
            {user?.role === 'manager' ? (
              // Manager View - See all worker reports
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Worker Reports ({workerReports.length})
                  </h3>
                </div>
                
                <div className="grid gap-6">
                  {workerReports.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No worker reports submitted yet</p>
                    </div>
                  ) : (
                    workerReports.map((report) => (
                      <div key={report.id} className={`p-6 rounded-xl border ${
                        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {report.title}
                            </h4>
                            <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span>By {report.author}</span>
                              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                              <span>{report.wordCount} words</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                          <div className={`whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {report.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              // Worker View - Submit reports
              <div>
                <div className="mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Submit Professional Report
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create and submit detailed reports for management review
                  </p>
                </div>

                <div className={`p-8 rounded-xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Report Title
                      </label>
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="Enter a descriptive title for your report"
                        className={`w-full p-4 rounded-lg border font-medium ${isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Report Content
                      </label>
                      <textarea
                        value={workerReport}
                        onChange={(e) => setWorkerReport(e.target.value)}
                        placeholder="Write your detailed professional report here...\n\nInclude:\n• Key accomplishments\n• Challenges faced\n• Solutions implemented\n• Recommendations\n• Next steps"
                        rows={16}
                        className={`w-full p-6 rounded-lg border resize-none leading-relaxed ${isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '16px', lineHeight: '1.6' }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {workerReport.trim().split(/\s+/).filter(w => w.length > 0).length} words • {workerReport.length} characters
                      </div>
                      
                      <button
                        onClick={submitWorkerReport}
                        disabled={!workerReport.trim() || !reportTitle.trim()}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                          !workerReport.trim() || !reportTitle.trim()
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Submit Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Submissions */}
                {workerReports.filter(r => r.author === user?.name).length > 0 && (
                  <div className="mt-8">
                    <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Your Recent Reports
                    </h4>
                    <div className="space-y-4">
                      {workerReports.filter(r => r.author === user?.name).slice(-3).reverse().map((report) => (
                        <div key={report.id} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{report.title}</h5>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(report.createdAt).toLocaleDateString()} • {report.wordCount} words
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              report.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;