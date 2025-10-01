import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getMeetings } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Zap,
  ArrowUp,
  ArrowDown,
  Upload,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileText,
  Timer,
  DollarSign,
  Award,
  Lightbulb,
  Target,
  PieChart as PieChartIcon,
  Server,
  Cpu,
  Database,
  Network,
  Globe,
  Smartphone,
  Plus,
  GripVertical
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const ReportsPage = () => {
  const { isDarkMode } = useTheme();
  const { user, users } = useAppContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('project-intelligence');
  const [dateRange, setDateRange] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [workerReport, setWorkerReport] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [workerReports, setWorkerReports] = useState([]);
  const [showLineButtons, setShowLineButtons] = useState(false);
  const [reportData, setReportData] = useState({
    projects: [],
    goals: [],
    documents: [],
    meetings: [],
    users: []
  });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadReportData();
    loadWorkerReports();
    
    // Check for URL parameters to pre-fill project report
    const urlParams = new URLSearchParams(location.search);
    const projectTitle = urlParams.get('title');
    if (projectTitle) {
      setReportTitle(`Project Report: ${decodeURIComponent(projectTitle)}`);
    }
  }, [dateRange, location.search]);

  const loadWorkerReports = () => {
    const reports = JSON.parse(localStorage.getItem('workerReports') || '[]');
    setWorkerReports(reports);
  };

  const submitWorkerReport = () => {
    if (!workerReport.trim() || !reportTitle.trim()) return;
    
    const report = {
      id: Date.now(),
      title: reportTitle.trim(),
      content: workerReport.trim(),
      author: user?.name || 'Anonymous',
      role: user?.role || 'user',
      createdAt: new Date().toISOString(),
      wordCount: workerReport.trim().split(/\s+/).filter(word => word.length > 0).length,
      status: 'submitted',
      projectId: null, // Could be linked to specific project
      priority: 'medium'
    };
    
    const updated = [...workerReports, report];
    setWorkerReports(updated);
    localStorage.setItem('workerReports', JSON.stringify(updated));
    setWorkerReport('');
    setReportTitle('');
    
    // Show success message (you could add a toast notification here)
    console.log('Report submitted successfully');
  };

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load data from API and localStorage with better error handling
      const [meetingsData] = await Promise.all([
        getMeetings().catch((err) => {
          console.warn('Failed to load meetings:', err);
          return [];
        })
      ]);
      
      const projects = JSON.parse(localStorage.getItem('projects') || '[]');
      const goals = JSON.parse(localStorage.getItem('goals') || '[]');
      const documents = JSON.parse(localStorage.getItem('documents') || '[]');
      
      setReportData({
        projects,
        goals,
        documents,
        meetings: meetingsData,
        users
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMetrics = () => {
    const { projects, goals, documents, meetings } = reportData;
    
    // Filter projects based on user role
    let filteredProjects = projects;
    let filteredGoals = goals;
    
    if (user?.role === 'user') {
      // Regular users see only their assigned projects
      filteredProjects = projects.filter(p => p.assignee === user?.name || p.assignedTo === user?.name);
      filteredGoals = goals.filter(g => g.assignee === user?.name || g.assignedTo === user?.name);
    } else if (user?.role === 'manager') {
      // Managers see projects assigned to their team members
      const teamMembers = users.filter(u => u.manager === user?.name || u.reportsTo === user?.name);
      const teamMemberNames = teamMembers.map(member => member.name);
      filteredProjects = projects.filter(p => teamMemberNames.includes(p.assignee) || teamMemberNames.includes(p.assignedTo) || p.assignee === user?.name);
      filteredGoals = goals.filter(g => teamMemberNames.includes(g.assignee) || teamMemberNames.includes(g.assignedTo) || g.assignee === user?.name);
    }
    // Admin/CEO see all projects (no filtering)
    
    const totalProjects = filteredProjects.length;
    const completedProjects = filteredProjects.filter(p => p.status === 'Done' || p.status === 'Completed').length;
    const inProgressProjects = filteredProjects.filter(p => p.status === 'In progress' || p.status === 'Active').length;
    const overdueProjects = filteredProjects.filter(p => {
      if (!p.dueDate) return false;
      return new Date(p.dueDate) < new Date() && p.status !== 'Done' && p.status !== 'Completed';
    }).length;
    
    const totalGoals = filteredGoals.length;
    const completedGoals = filteredGoals.filter(g => g.status === 'Done' || g.status === 'Completed').length;
    
    const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    
    // Calculate average project duration
    const completedProjectsWithDates = filteredProjects.filter(p => 
      p.status === 'Done' && p.createdAt && p.completedAt
    );
    const avgProjectDuration = completedProjectsWithDates.length > 0 
      ? completedProjectsWithDates.reduce((sum, p) => {
          const start = new Date(p.createdAt);
          const end = new Date(p.completedAt);
          return sum + (end - start) / (1000 * 60 * 60 * 24); // days
        }, 0) / completedProjectsWithDates.length
      : 0;
    
    // Calculate productivity score based on role
    let productivityScore = 0;
    if (user?.role === 'admin' || user?.role === 'ceo') {
      productivityScore = totalProjects > 0 
        ? Math.min(100, (projectCompletionRate + goalCompletionRate) / 2 + (totalProjects * 1.5))
        : 0;
    } else if (user?.role === 'manager') {
      productivityScore = totalProjects > 0 
        ? Math.min(100, (projectCompletionRate + goalCompletionRate) / 2 + (totalProjects * 2))
        : 0;
    } else {
      productivityScore = totalProjects > 0 
        ? Math.min(100, (projectCompletionRate + goalCompletionRate) / 2 + (totalProjects * 3))
        : 0;
    }
    
    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      overdueProjects,
      totalGoals,
      completedGoals,
      totalDocuments: documents.length,
      totalMeetings: meetings.length,
      projectCompletionRate,
      goalCompletionRate,
      avgProjectDuration: Math.round(avgProjectDuration),
      productivityScore: Math.round(productivityScore),
      activeUsers: users.filter(u => u.status === 'active').length,
      totalUsers: users.length,
      filteredProjects,
      filteredGoals
    };
  };

  const metrics = getMetrics();

  const exportReport = (format = 'json') => {
    const reportContent = {
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || 'Unknown User',
      dateRange: `Last ${dateRange} days`,
      metrics,
      data: reportData,
      summary: {
        totalProjects: metrics.totalProjects,
        completedProjects: metrics.completedProjects,
        projectCompletionRate: `${Math.round(metrics.projectCompletionRate)}%`,
        totalGoals: metrics.totalGoals,
        completedGoals: metrics.completedGoals,
        goalCompletionRate: `${Math.round(metrics.goalCompletionRate)}%`,
        productivityScore: `${metrics.productivityScore}%`,
        activeUsers: metrics.activeUsers,
        totalUsers: metrics.totalUsers
      }
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Create CSV format
      const csvContent = [
        ['Metric', 'Value'],
        ['Total Projects', metrics.totalProjects],
        ['Completed Projects', metrics.completedProjects],
        ['Project Completion Rate', `${Math.round(metrics.projectCompletionRate)}%`],
        ['Total Goals', metrics.totalGoals],
        ['Completed Goals', metrics.completedGoals],
        ['Goal Completion Rate', `${Math.round(metrics.goalCompletionRate)}%`],
        ['Productivity Score', `${metrics.productivityScore}%`],
        ['Active Users', metrics.activeUsers],
        ['Total Users', metrics.totalUsers],
        ['Total Documents', metrics.totalDocuments],
        ['Total Meetings', metrics.totalMeetings],
        ['Average Project Duration', `${metrics.avgProjectDuration} days`],
        ['Overdue Projects', metrics.overdueProjects]
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Loading report data...
        </span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Professional Header */}
      <div className={`sticky top-0 z-10 border-b backdrop-blur-sm shadow-lg ${
        isDarkMode ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 border-gray-800' : 'bg-gradient-to-r from-white via-gray-50 to-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className={`p-3 sm:p-4 rounded-2xl shadow-lg bg-gradient-to-br from-blue-600 to-purple-600`}>
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Enterprise Analytics Suite
                </h1>
                <p className={`text-sm sm:text-base lg:text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hidden sm:block`}>
                  Advanced business intelligence and predictive analytics platform
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Status and Last Updated */}
              <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} order-3 sm:order-1`}>
                {lastUpdated && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    <span className="truncate">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{error}</span>
                  </div>
                )}
              </div>

              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} order-2`}>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-0 font-semibold focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
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
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 text-sm sm:text-base ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
              
              {/* Export Button */}
              <div className="relative order-1 sm:order-3">
                <button
                  onClick={() => exportReport('json')}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Export Report</span>
                  <span className="sm:hidden">Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Enhanced Tab Navigation */}
        <div className={`flex flex-col sm:flex-row gap-2 p-2 rounded-2xl mb-6 sm:mb-10 shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            {[
              ...(user?.role === 'admin' || user?.role === 'ceo' ? [] : [
                { id: 'submit-report', label: '📝 Submit Report', icon: Upload, shortLabel: '📝 Submit' }
              ]),
              ...(user?.role === 'admin' || user?.role === 'ceo' ? [
                { id: 'worker-reports', label: '📊 Reports', icon: FileText, shortLabel: '📊 Reports' }
              ] : user?.role === 'manager' ? [
                { id: 'worker-reports', label: 'Reports', icon: FileText, shortLabel: 'Reports' }
              ] : [
                { id: 'worker-reports', label: 'Reports', icon: FileText, shortLabel: 'Reports' }
              ])
            ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800 hover:scale-102' : 'text-gray-600 hover:text-black hover:bg-gray-100 hover:scale-102'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>



        {false && activeTab === 'projects' && (
          <div className="space-y-8">
            {/* Project Management KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Project Velocity"
                value={`${Math.round(metrics.projectCompletionRate)}%`}
                change={15}
                icon={Zap}
                color="bg-blue-600"
                subtitle="Completion rate"
              />
              <MetricCard
                title="On-Time Delivery"
                value="87%"
                change={5}
                icon={Timer}
                color="bg-green-600"
                subtitle="Projects delivered on time"
              />
              <MetricCard
                title="Budget Utilization"
                value="92%"
                change={-3}
                icon={DollarSign}
                color="bg-purple-600"
                subtitle="Budget efficiency"
              />
              <MetricCard
                title="Risk Projects"
                value={Math.max(0, metrics.totalProjects - metrics.completedProjects - metrics.inProgressProjects)}
                change={-12}
                icon={AlertTriangle}
                color="bg-red-600"
                subtitle="Projects at risk"
              />
            </div>

            {/* Project Timeline & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Project Status Distribution
                </h3>
                <div className="space-y-4">
                  {[
                    { status: 'Completed', count: metrics.completedProjects, color: 'bg-green-600', percentage: metrics.projectCompletionRate },
                    { status: 'In Progress', count: metrics.inProgressProjects, color: 'bg-blue-600', percentage: (metrics.inProgressProjects / metrics.totalProjects) * 100 || 0 },
                    { status: 'Planning', count: Math.max(0, metrics.totalProjects - metrics.completedProjects - metrics.inProgressProjects), color: 'bg-yellow-600', percentage: ((metrics.totalProjects - metrics.completedProjects - metrics.inProgressProjects) / metrics.totalProjects) * 100 || 0 },
                    { status: 'On Hold', count: 0, color: 'bg-gray-600', percentage: 0 }
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
                          {item.count} ({Math.round(item.percentage)}%)
                        </span>
                        <div className={`w-32 h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${item.percentage}%` }}
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
                  Project Health Metrics
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Schedule Performance</span>
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>95%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-2 rounded-full bg-green-600" style={{ width: '95%' }} />
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cost Performance</span>
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>92%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quality Index</span>
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>88%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-2 rounded-full bg-purple-600" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Timeline */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Project Timeline & Milestones
              </h3>
              <div className="space-y-4">
                {reportData.projects.slice(0, 5).map((project, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Briefcase className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{project.title}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'Done' ? 'bg-green-100 text-green-800' :
                        project.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Due: {project.dueDate || 'Not set'}</span>
                      <span>•</span>
                      <span>Priority: {project.priority || 'Medium'}</span>
                      <span>•</span>
                      <span>Assignee: {project.assignee || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {false && activeTab === 'productivity' && (
          <div className="space-y-8">
            {/* Advanced Performance KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <MetricCard
                title="Velocity Index"
                value={`${Math.round(metrics.projectCompletionRate * 1.2)}%`}
                change={18}
                icon={Zap}
                color="bg-gradient-to-r from-blue-600 to-cyan-600"
                subtitle="Sprint velocity"
              />
              <MetricCard
                title="Quality Score"
                value="94.2"
                change={7}
                icon={Award}
                color="bg-gradient-to-r from-green-600 to-emerald-600"
                subtitle="Code quality index"
              />
              <MetricCard
                title="Efficiency Rate"
                value="87%"
                change={12}
                icon={TrendingUp}
                color="bg-gradient-to-r from-purple-600 to-pink-600"
                subtitle="Resource efficiency"
              />
              <MetricCard
                title="Innovation Index"
                value="76"
                change={-2}
                icon={Lightbulb}
                color="bg-gradient-to-r from-orange-600 to-red-600"
                subtitle="Innovation metrics"
              />
              <MetricCard
                title="Satisfaction"
                value="4.8/5"
                change={5}
                icon={CheckCircle2}
                color="bg-gradient-to-r from-indigo-600 to-blue-600"
                subtitle="Team satisfaction"
              />
            </div>

            {/* Performance Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Performance Trends
                </h3>
                <div className="space-y-4">
                  {[
                    { metric: 'Sprint Completion', current: 94, target: 90, trend: 'up' },
                    { metric: 'Bug Resolution Time', current: 2.3, target: 3.0, trend: 'down', unit: 'days' },
                    { metric: 'Code Coverage', current: 87, target: 85, trend: 'up' },
                    { metric: 'Deployment Frequency', current: 12, target: 10, trend: 'up', unit: '/week' }
                  ].map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                            {item.current}{item.unit || '%'}
                          </span>
                          {item.trend === 'up' ? <ArrowUp className="w-4 h-4 text-green-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                      <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-2 rounded-full ${item.trend === 'up' ? 'bg-green-600' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, (item.current / (item.target * 1.2)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Productivity Insights
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {metrics.completedProjects + metrics.completedGoals}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Deliverables
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {Math.round((metrics.projectCompletionRate + metrics.goalCompletionRate) / 2)}%
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Success Rate
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {metrics.totalDocuments + metrics.totalMeetings}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Content Assets
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
                    <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      2.4x
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Productivity Gain
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {false && activeTab === 'financial' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Revenue Growth"
                value="$2.4M"
                change={23}
                icon={DollarSign}
                color="bg-green-600"
                subtitle="Quarterly revenue"
              />
              <MetricCard
                title="Cost Efficiency"
                value="92%"
                change={8}
                icon={TrendingUp}
                color="bg-blue-600"
                subtitle="Budget utilization"
              />
              <MetricCard
                title="ROI"
                value="340%"
                change={15}
                icon={Target}
                color="bg-purple-600"
                subtitle="Return on investment"
              />
              <MetricCard
                title="Profit Margin"
                value="28%"
                change={-2}
                icon={PieChartIcon}
                color="bg-orange-600"
                subtitle="Net profit margin"
              />
            </div>
          </div>
        )}

        {false && activeTab === 'technology' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="System Uptime"
                value="99.9%"
                change={0.1}
                icon={Server}
                color="bg-green-600"
                subtitle="Infrastructure reliability"
              />
              <MetricCard
                title="Performance Score"
                value="94"
                change={5}
                icon={Cpu}
                color="bg-blue-600"
                subtitle="Application performance"
              />
              <MetricCard
                title="Security Index"
                value="A+"
                change={12}
                icon={Shield}
                color="bg-purple-600"
                subtitle="Security posture"
              />
              <MetricCard
                title="Tech Debt"
                value="12%"
                change={-8}
                icon={AlertTriangle}
                color="bg-orange-600"
                subtitle="Technical debt ratio"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Infrastructure Health
                </h3>
                <div className="space-y-4">
                  {[
                    { service: 'Database Performance', status: 98, icon: Database },
                    { service: 'API Response Time', status: 95, icon: Network },
                    { service: 'CDN Performance', status: 99, icon: Globe },
                    { service: 'Mobile Performance', status: 92, icon: Smartphone }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{item.service}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${item.status > 95 ? 'text-green-500' : item.status > 90 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {item.status}%
                        </span>
                        <div className={`w-20 h-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2 rounded-full ${item.status > 95 ? 'bg-green-600' : item.status > 90 ? 'bg-yellow-600' : 'bg-red-600'}`}
                            style={{ width: `${item.status}%` }}
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
                  Technology Stack
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { tech: 'React', version: '18.2', status: 'Latest' },
                    { tech: 'Node.js', version: '20.x', status: 'Latest' },
                    { tech: 'MongoDB', version: '7.0', status: 'Latest' },
                    { tech: 'Docker', version: '24.x', status: 'Latest' }
                  ].map((item, index) => (
                    <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.tech}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>v{item.version}</div>
                      <div className="text-xs text-green-500 font-medium">{item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Report Tab - For Managers and Regular Users */}
        {activeTab === 'submit-report' && (user?.role === 'manager' || user?.role === 'user') && (
          <div className="space-y-8">
            <div className="mb-6">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📝 Submit Report
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.role === 'manager' 
                  ? 'Create and submit detailed management reports for executive review and strategic planning'
                  : 'Create and submit detailed project reports for your manager review and tracking'
                }
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
                    placeholder={user?.role === 'manager' 
                      ? "e.g., Monthly Management Report - Q1 2024 Performance Review"
                      : "e.g., Weekly Project Status Report - Marketing Campaign"
                    }
                    className={`w-full p-4 rounded-lg border font-medium ${isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {user?.role === 'manager' ? 'Management Report Details' : 'Project Report Details'}
                  </label>
                  <div 
                    className="relative group"
                    onMouseEnter={() => setShowLineButtons(true)}
                    onMouseLeave={() => setShowLineButtons(false)}
                  >
                    {/* Line numbers and buttons */}
                    <div className="absolute left-0 top-0 z-10">
                      {workerReport.split('\n').map((line, index) => (
                        <div key={index} className="flex items-center h-6">
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 mr-1">
                            <button
                              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 transition-all duration-200 flex items-center justify-center w-5 h-5"
                              onClick={() => {
                                const lines = workerReport.split('\n');
                                const newLines = [...lines];
                                newLines.splice(index + 1, 0, '');
                                setWorkerReport(newLines.join('\n'));
                              }}
                            >
                              <Plus className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-200 flex items-center justify-center w-5 h-5"
                              onClick={() => {
                                // Menu functionality for this line
                                console.log(`Menu clicked for line ${index + 1}`);
                              }}
                            >
                              <GripVertical className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className={`w-full rounded-lg p-6 font-mono text-sm border transition-all duration-200 ${isDarkMode ? 'bg-gray-800/80 text-gray-100 border-gray-700 hover:border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'}`}>
                      <textarea
                        name="report-content"
                        value={workerReport}
                        onChange={(e) => setWorkerReport(e.target.value)}
                        placeholder={user?.role === 'manager' 
                          ? "Write your detailed management report here...\n\nInclude:\n• Strategic initiatives and progress\n• Team performance metrics\n• Budget and resource allocation\n• Challenges and solutions\n• Future planning and recommendations\n• Stakeholder communications"
                          : "Write your detailed project report here...\n\nInclude:\n• Project progress and milestones achieved\n• Current status and completion percentage\n• Challenges encountered and solutions\n• Team collaboration and performance\n• Budget and resource utilization\n• Next steps and upcoming deliverables\n• Recommendations for improvement"
                        }
                        rows={16}
                        className="w-full bg-transparent outline-none resize-none font-mono leading-relaxed pl-12 pr-6"
                        style={{ lineHeight: '1.6' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className={`border-t backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} p-4 rounded-lg shadow-lg`}>
                  <div className="flex items-center justify-between">
                    {/* Report Metadata */}
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        <span>{workerReport.trim().split(/\s+/).filter(w => w.length > 0).length} words • {workerReport.length} characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        <span>Report will be saved automatically</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setWorkerReport('');
                          setReportTitle('');
                        }}
                        disabled={!workerReport.trim() && !reportTitle.trim()}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          !workerReport.trim() && !reportTitle.trim()
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : isDarkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        Clear
                      </button>
                      
                      <button
                        onClick={submitWorkerReport}
                        disabled={!workerReport.trim() || !reportTitle.trim()}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                          !workerReport.trim() || !reportTitle.trim()
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : isDarkMode 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } shadow-lg`}
                      >
                        <Upload className="w-4 h-4" />
                        {user?.role === 'manager' ? 'Submit Management Report' : 'Submit Project Report'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Submissions */}
            {workerReports.filter(r => r.author === user?.name).length > 0 && (
              <div className="mt-8">
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Your Recent {user?.role === 'manager' ? 'Management' : 'Project'} Reports
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

        {/* Worker Reports Tab */}
        {activeTab === 'worker-reports' && (
          <div className="space-y-8">
            {user?.role === 'admin' || user?.role === 'ceo' ? (
              // Admin/CEO View - See all reports from managers and users
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Reports ({workerReports.length})
                  </h3>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    All reports submitted by managers and team members
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {workerReports.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No reports submitted yet</p>
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
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                report.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {report.role}
                              </span>
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
            ) : user?.role === 'manager' ? (
              // Manager View - See all worker reports
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Reports ({workerReports.filter(r => r.role === 'user').length})
                  </h3>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    All project reports submitted by team members
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {workerReports.filter(r => r.role === 'user').length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No team reports submitted yet</p>
                    </div>
                  ) : (
                    workerReports.filter(r => r.role === 'user').map((report) => (
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
                    Submit Project Report
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create and submit detailed project reports for management review and tracking
                  </p>
                </div>

                <div className={`p-8 rounded-xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Project Report Title
                      </label>
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="e.g., Weekly Project Status Report - Marketing Campaign"
                        className={`w-full p-4 rounded-lg border font-medium ${isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Project Report Details
                      </label>
                      <div 
                        className="relative group"
                        onMouseEnter={() => setShowLineButtons(true)}
                        onMouseLeave={() => setShowLineButtons(false)}
                      >
                        {/* Line numbers and buttons */}
                        <div className="absolute left-0 top-0 z-10">
                          {workerReport.split('\n').map((line, index) => (
                            <div key={index} className="flex items-center h-6">
                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 mr-1">
                                <button
                                  className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 transition-all duration-200 flex items-center justify-center w-5 h-5"
                                  onClick={() => {
                                    const lines = workerReport.split('\n');
                                    const newLines = [...lines];
                                    newLines.splice(index + 1, 0, '');
                                    setWorkerReport(newLines.join('\n'));
                                  }}
                                >
                                  <Plus className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                </button>
                                <button
                                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 transition-all duration-200 flex items-center justify-center w-5 h-5"
                                  onClick={() => {
                                    // Menu functionality for this line
                                    console.log(`Menu clicked for line ${index + 1}`);
                                  }}
                                >
                                  <GripVertical className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className={`w-full rounded-lg p-6 font-mono text-sm border transition-all duration-200 ${isDarkMode ? 'bg-gray-800/80 text-gray-100 border-gray-700 hover:border-gray-600' : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300'}`}>
                          <textarea
                            name="worker-report-content"
                            value={workerReport}
                            onChange={(e) => setWorkerReport(e.target.value)}
                            placeholder="Write your detailed project report here...\n\nInclude:\n• Project progress and milestones achieved\n• Current status and completion percentage\n• Challenges encountered and solutions\n• Team collaboration and performance\n• Budget and resource utilization\n• Next steps and upcoming deliverables\n• Recommendations for improvement"
                            rows={16}
                            className="w-full bg-transparent outline-none resize-none font-mono leading-relaxed pl-12 pr-6"
                            style={{ lineHeight: '1.6' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className={`border-t backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} p-4 rounded-lg shadow-lg`}>
                      <div className="flex items-center justify-between">
                        {/* Report Metadata */}
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            <span>{workerReport.trim().split(/\s+/).filter(w => w.length > 0).length} words • {workerReport.length} characters</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            <span>Report will be saved automatically</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setWorkerReport('');
                              setReportTitle('');
                            }}
                            disabled={!workerReport.trim() && !reportTitle.trim()}
                            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              !workerReport.trim() && !reportTitle.trim()
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : isDarkMode 
                                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            Clear
                          </button>
                          
                          <button
                            onClick={submitWorkerReport}
                            disabled={!workerReport.trim() || !reportTitle.trim()}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                              !workerReport.trim() || !reportTitle.trim()
                                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                : isDarkMode 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } shadow-lg`}
                          >
                            <Upload className="w-4 h-4" />
                            Submit Project Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Submissions */}
                {workerReports.filter(r => r.author === user?.name).length > 0 && (
                  <div className="mt-8">
                    <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Your Recent Project Reports
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
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;