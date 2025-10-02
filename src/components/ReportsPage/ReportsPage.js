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
  GripVertical,
  Minus
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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [tableData, setTableData] = useState({});
  const [selectedImages, setSelectedImages] = useState({});
  const [reportData, setReportData] = useState({
    projects: [],
    goals: [],
    documents: [],
    meetings: [],
    users: []
  });
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

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
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user?.role === 'manager' ? 'Management Report Details' : 'Project Report Details'}
                    </label>
                    <div className="relative dropdown-container">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === 'templates' ? null : 'templates')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all duration-200 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
                      >
                        📋 Templates
                        <svg className={`w-4 h-4 transition-transform ${activeDropdown === 'templates' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {activeDropdown === 'templates' && (
                        <div className={`absolute right-0 top-12 z-50 w-80 rounded-xl shadow-2xl border backdrop-blur-sm overflow-hidden ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                          <div className="py-2">
                            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                              Report Templates
                            </div>
                            <div className="py-1 max-h-80 overflow-y-auto">
                              {[
                                {
                                  name: 'Weekly Status Report',
                                  icon: '📅',
                                  category: user?.role === 'manager' ? 'Management' : 'Status',
                                  description: 'Regular progress updates and planning',
                                  color: 'bg-blue-500',
                                  template: '# Weekly Status Report\n\n**Date:** {currentDate}\n**Author:** \n**Department:** \n**Week:** Week of {currentDate}\n**Status:** Draft/Review/Final\n\n---\n\n## 📊 Executive Summary\n\n\n## 🏆 Key Accomplishments\n• **Achievement 1:** Description | Impact: High/Med/Low | Status: Complete\n• **Achievement 2:** Description | Impact: High/Med/Low | Status: Complete\n• **Achievement 3:** Description | Impact: High/Med/Low | Status: Complete\n• **Achievement 4:** Description | Impact: High/Med/Low | Status: Complete\n\n## 📈 Current Progress\n• **Project/Task 1:** Progress: 85% | Timeline: On Track/Delayed | Notes: \n• **Project/Task 2:** Progress: 70% | Timeline: On Track/Delayed | Notes: \n• **Project/Task 3:** Progress: 95% | Timeline: On Track/Delayed | Notes: \n• **Project/Task 4:** Progress: 60% | Timeline: On Track/Delayed | Notes: \n\n## 🚨 Challenges & Issues\n• **Issue 1:** Severity: High/Med/Low | Impact: | Resolution Plan: | Owner: \n• **Issue 2:** Severity: High/Med/Low | Impact: | Resolution Plan: | Owner: \n• **Issue 3:** Severity: High/Med/Low | Impact: | Resolution Plan: | Owner: \n\n## 📅 Metrics & KPIs\n• **Productivity:** Target: 85% | Actual: % | Variance: % | Trend: 📈/📉\n• **Quality Score:** Target: 90% | Actual: % | Variance: % | Trend: 📈/📉\n• **Timeline Adherence:** Target: 95% | Actual: % | Variance: % | Trend: 📈/📉\n• **Budget Utilization:** Target: 80% | Actual: % | Variance: % | Trend: 📈/📉\n\n## 📋 Action Items\n- [ ] **Priority High:** Task description | Owner: | Due Date: | Status: Not Started\n- [ ] **Priority High:** Task description | Owner: | Due Date: | Status: Not Started\n- [ ] **Priority Medium:** Task description | Owner: | Due Date: | Status: Not Started\n- [ ] **Priority Medium:** Task description | Owner: | Due Date: | Status: Not Started\n- [ ] **Priority Low:** Task description | Owner: | Due Date: | Status: Not Started\n\n## 🎯 Next Week Goals\n### Primary Objectives\n1. **Goal 1:** Success Criteria: | Resources Needed: | Timeline: \n2. **Goal 2:** Success Criteria: | Resources Needed: | Timeline: \n3. **Goal 3:** Success Criteria: | Resources Needed: | Timeline: \n\n### Secondary Objectives\n1. **Goal 1:** Success Criteria: | Resources Needed: | Timeline: \n2. **Goal 2:** Success Criteria: | Resources Needed: | Timeline: \n\n## 🔮 Risks & Dependencies\n• **Risk 1:** Probability: High/Med/Low | Impact: High/Med/Low | Mitigation: | Owner: \n• **Risk 2:** Probability: High/Med/Low | Impact: High/Med/Low | Mitigation: | Owner: \n• **Dependency 1:** Type: Internal/External | Status: | Impact if delayed: | Contingency: \n\n---\n\n**Report Status:** Draft/Review/Approved\n**Next Review:** \n**Distribution:** \n\n*Report created on {currentDate}*'
                                },
                                {
                                  name: user?.role === 'manager' ? 'Performance Review' : 'Project Milestone Report',
                                  icon: '🏆',
                                  category: user?.role === 'manager' ? 'Management' : 'Project',
                                  description: user?.role === 'manager' ? 'Team performance evaluation' : 'Project milestone tracking and status',
                                  color: 'bg-green-500',
                                  template: user?.role === 'manager' ? '# Performance Review Report\n\n**Date:** {currentDate}\n**Manager:** \n**Review Period:** \n**Team/Individual:** \n**Review Type:** Quarterly/Annual/Mid-Year\n\n---\n\n## 📊 Performance Summary\n**Overall Rating:** Exceeds/Meets/Below Expectations\n**Previous Rating:** \n**Improvement:** +/-% from last review\n\n## 🏆 Key Achievements\n• **Achievement 1:** Impact: High/Med/Low | Recognition: | Value Added: $\n• **Achievement 2:** Impact: High/Med/Low | Recognition: | Value Added: $\n• **Achievement 3:** Impact: High/Med/Low | Recognition: | Value Added: $\n• **Achievement 4:** Impact: High/Med/Low | Recognition: | Value Added: $\n\n## 📈 Performance Metrics\n• **Goal Achievement:** Target: 90% | Actual: % | Rating: 1-5 | Comments: \n• **Quality of Work:** Target: 85% | Actual: % | Rating: 1-5 | Comments: \n• **Collaboration:** Target: 80% | Actual: % | Rating: 1-5 | Comments: \n• **Innovation:** Target: 75% | Actual: % | Rating: 1-5 | Comments: \n• **Leadership:** Target: 70% | Actual: % | Rating: 1-5 | Comments: \n\n## 📉 Areas for Improvement\n• **Area 1:** Current Level: | Target Level: | Development Plan: | Timeline: \n• **Area 2:** Current Level: | Target Level: | Development Plan: | Timeline: \n• **Area 3:** Current Level: | Target Level: | Development Plan: | Timeline: \n\n## 📋 Action Items\n- [ ] **Development:** Action: | Owner: | Due Date: | Success Measure: \n- [ ] **Training:** Action: | Owner: | Due Date: | Success Measure: \n- [ ] **Process:** Action: | Owner: | Due Date: | Success Measure: \n- [ ] **Goals:** Action: | Owner: | Due Date: | Success Measure: \n\n## 🎯 Development Goals\n### Short-term (3 months)\n1. **Goal 1:** Objective: | Success Criteria: | Resources: | Support Needed: \n2. **Goal 2:** Objective: | Success Criteria: | Resources: | Support Needed: \n\n### Long-term (6-12 months)\n1. **Goal 1:** Objective: | Success Criteria: | Resources: | Support Needed: \n2. **Goal 2:** Objective: | Success Criteria: | Resources: | Support Needed: \n\n## 💼 Career Development\n**Current Role:** \n**Career Aspirations:** \n**Recommended Path:** \n**Skills to Develop:** \n**Timeline:** \n\n---\n\n**Review Status:** Draft/Complete\n**Employee Acknowledgment:** \n**Next Review Date:** \n\n*Review completed on {currentDate}*' : '# Project Milestone Report\n\n**Date:** {currentDate}\n**Author:** \n**Project:** \n**Milestone:** \n**Due Date:** \n**Status:** On Track/At Risk/Delayed\n\n---\n\n## 🎯 Milestone Summary\n**Completion:** %\n**Timeline:** On Schedule/Ahead/Behind\n**Budget:** On Budget/Under/Over\n**Quality:** Excellent/Good/Fair/Poor\n\n## ✅ Completed Tasks\n• **Task 1:** Completion Date: | Quality: Excellent/Good/Fair | Effort: hours | Notes: \n• **Task 2:** Completion Date: | Quality: Excellent/Good/Fair | Effort: hours | Notes: \n• **Task 3:** Completion Date: | Quality: Excellent/Good/Fair | Effort: hours | Notes: \n• **Task 4:** Completion Date: | Quality: Excellent/Good/Fair | Effort: hours | Notes: \n\n## 🔄 Current Status\n• **In Progress 1:** Progress: % | Expected Completion: | Blockers: | Owner: \n• **In Progress 2:** Progress: % | Expected Completion: | Blockers: | Owner: \n• **In Progress 3:** Progress: % | Expected Completion: | Blockers: | Owner: \n\n## 📋 Remaining Work\n• **Task 1:** Priority: High/Med/Low | Effort: hours | Dependencies: | Owner: \n• **Task 2:** Priority: High/Med/Low | Effort: hours | Dependencies: | Owner: \n• **Task 3:** Priority: High/Med/Low | Effort: hours | Dependencies: | Owner: \n• **Task 4:** Priority: High/Med/Low | Effort: hours | Dependencies: | Owner: \n\n## 📈 Progress Metrics\n• **Tasks Completed:** Target: | Actual: | Variance: | Percentage: %\n• **Budget Spent:** Target: $ | Actual: $ | Variance: $ | Percentage: %\n• **Time Elapsed:** Target: days | Actual: days | Variance: days | Percentage: %\n• **Quality Score:** Target: % | Actual: % | Variance: % | Rating: /10\n\n## 📋 Action Items\n- [ ] **Critical:** Action: | Owner: | Due Date: | Impact: High\n- [ ] **High:** Action: | Owner: | Due Date: | Impact: High\n- [ ] **Medium:** Action: | Owner: | Due Date: | Impact: Medium\n- [ ] **Low:** Action: | Owner: | Due Date: | Impact: Low\n\n## 🎯 Next Milestone\n**Milestone Name:** \n**Target Date:** \n**Key Deliverables:** \n**Success Criteria:** \n**Resources Required:** \n**Potential Risks:** \n\n## 🚨 Risks & Issues\n• **Risk 1:** Probability: % | Impact: High/Med/Low | Mitigation: | Owner: \n• **Issue 1:** Severity: High/Med/Low | Impact: | Resolution: | ETA: \n\n---\n\n**Milestone Status:** Complete/In Progress/At Risk\n**Stakeholder Approval:** \n**Next Review:** \n\n*Report created on {currentDate}*'
                                },
                                {
                                  name: user?.role === 'manager' ? 'Budget Analysis' : 'Bug Report & Testing',
                                  icon: user?.role === 'manager' ? '💰' : '🐛',
                                  category: user?.role === 'manager' ? 'Financial' : 'Technical',
                                  description: user?.role === 'manager' ? 'Financial performance analysis' : 'Quality assurance and issue tracking',
                                  color: user?.role === 'manager' ? 'bg-purple-500' : 'bg-red-500',
                                  template: user?.role === 'manager' ? '# Budget Analysis Report\n\n**Date:** {currentDate}\n**Manager:** \n**Department:** \n**Period:** \n**Fiscal Year:** \n**Report Type:** Monthly/Quarterly/Annual\n\n---\n\n## 💰 Financial Summary\n**Total Budget:** $\n**Spent to Date:** $\n**Remaining:** $\n**Utilization:** %\n**Variance:** +/-$\n**Status:** On Track/Over/Under\n\n## 📈 Budget Performance\n• **Revenue:** Budgeted: $ | Actual: $ | Variance: $ | %: | Status: ✅/❌\n• **Personnel:** Budgeted: $ | Actual: $ | Variance: $ | %: | Status: ✅/❌\n• **Operations:** Budgeted: $ | Actual: $ | Variance: $ | %: | Status: ✅/❌\n• **Technology:** Budgeted: $ | Actual: $ | Variance: $ | %: | Status: ✅/❌\n• **Marketing:** Budgeted: $ | Actual: $ | Variance: $ | %: | Status: ✅/❌\n\n## 📉 Expense Analysis\n• **Fixed Costs:** Amount: $ | % of Budget: | Trend: 📈/📉 | Notes: \n• **Variable Costs:** Amount: $ | % of Budget: | Trend: 📈/📉 | Notes: \n• **One-time Costs:** Amount: $ | % of Budget: | Trend: 📈/📉 | Notes: \n• **Unexpected Costs:** Amount: $ | % of Budget: | Trend: 📈/📉 | Notes: \n\n## 🚨 Variances & Issues\n• **Variance 1:** Amount: $ | Reason: | Impact: High/Med/Low | Action: | Owner: \n• **Variance 2:** Amount: $ | Reason: | Impact: High/Med/Low | Action: | Owner: \n• **Variance 3:** Amount: $ | Reason: | Impact: High/Med/Low | Action: | Owner: \n\n## 📈 Financial KPIs\n• **ROI:** Target: % | Actual: % | Variance: % | Trend: 📈/📉\n• **Cost per Unit:** Target: $ | Actual: $ | Variance: $ | Trend: 📈/📉\n• **Profit Margin:** Target: % | Actual: % | Variance: % | Trend: 📈/📉\n• **Cash Flow:** Target: $ | Actual: $ | Variance: $ | Trend: 📈/📉\n\n## 📋 Action Items\n- [ ] **Cost Control:** Action: | Owner: | Due Date: | Expected Savings: $\n- [ ] **Revenue:** Action: | Owner: | Due Date: | Expected Revenue: $\n- [ ] **Process:** Action: | Owner: | Due Date: | Expected Impact: \n- [ ] **Review:** Action: | Owner: | Due Date: | Expected Outcome: \n\n## 💡 Recommendations\n### Cost Optimization\n1. **Recommendation 1:** Potential Savings: $ | Implementation Cost: $ | Timeline: | ROI: \n2. **Recommendation 2:** Potential Savings: $ | Implementation Cost: $ | Timeline: | ROI: \n\n### Revenue Enhancement\n1. **Opportunity 1:** Potential Revenue: $ | Investment Required: $ | Timeline: | ROI: \n2. **Opportunity 2:** Potential Revenue: $ | Investment Required: $ | Timeline: | ROI: \n\n## 🔮 Forecast\n**Next Quarter:** Budget: $ | Projected Spend: $ | Variance: $ | Confidence: %\n**Year End:** Budget: $ | Projected Spend: $ | Variance: $ | Confidence: %\n\n---\n\n**Report Status:** Draft/Review/Approved\n**Finance Review:** \n**Management Approval:** \n\n*Analysis completed on {currentDate}*' : '# Bug Report & Testing\n\n**Date:** {currentDate}\n**Reporter:** \n**Project:** \n**Priority:** Critical/High/Medium/Low\n**Severity:** Blocker/Major/Minor/Trivial\n**Status:** Open/In Progress/Resolved/Closed\n**Assigned To:** \n\n---\n\n## 🐛 Issue Summary\n**Bug ID:** BUG-{currentDate}-\n**Title:** \n**Environment:** Production/Staging/Development\n**Browser/Platform:** \n**Version:** \n**Reproducible:** Always/Sometimes/Rarely\n\n## 📝 Bug Details\n• **Description:** What happened: \n• **Expected Result:** What should happen: \n• **Actual Result:** What actually happened: \n• **Impact:** User experience impact: High/Med/Low\n• **Frequency:** How often it occurs: \n• **Workaround:** Temporary solution: \n\n## 🔍 Steps to Reproduce\n1. **Step 1:** Action: | Expected: | Actual: \n2. **Step 2:** Action: | Expected: | Actual: \n3. **Step 3:** Action: | Expected: | Actual: \n4. **Step 4:** Action: | Expected: | Actual: \n\n## 🧪 Testing Results\n• **Test Case 1:** Status: Pass/Fail | Notes: | Tester: \n• **Test Case 2:** Status: Pass/Fail | Notes: | Tester: \n• **Test Case 3:** Status: Pass/Fail | Notes: | Tester: \n• **Regression Test:** Status: Pass/Fail | Notes: | Tester: \n\n## 🔧 Resolution Status\n• **Root Cause:** Technical reason: \n• **Fix Applied:** Code changes: \n• **Testing Done:** Verification steps: \n• **Deployment:** Release version: | Date: \n• **Verification:** Confirmed by: | Date: \n\n## 📈 Quality Metrics\n• **Time to Detect:** hours from introduction\n• **Time to Report:** hours from detection\n• **Time to Fix:** hours from report\n• **Time to Deploy:** hours from fix\n• **Customer Impact:** Number of users affected: \n\n## 📋 Action Items\n- [ ] **Fix:** Implement solution | Owner: | Due Date: | Priority: High\n- [ ] **Test:** Verify fix works | Owner: | Due Date: | Priority: High\n- [ ] **Deploy:** Release to production | Owner: | Due Date: | Priority: High\n- [ ] **Monitor:** Watch for recurrence | Owner: | Due Date: | Priority: Medium\n- [ ] **Document:** Update knowledge base | Owner: | Due Date: | Priority: Low\n\n## 🔄 Next Steps\n### Immediate (24 hours)\n1. **Action 1:** Description: | Owner: | Status: \n2. **Action 2:** Description: | Owner: | Status: \n\n### Short-term (1 week)\n1. **Action 1:** Description: | Owner: | Status: \n2. **Action 2:** Description: | Owner: | Status: \n\n## 📊 Related Information\n**Related Bugs:** \n**Related Features:** \n**Dependencies:** \n**Documentation:** \n**Screenshots:** Attached/Not Available\n**Logs:** Attached/Not Available\n\n---\n\n**Bug Status:** Open/Fixed/Verified/Closed\n**QA Approval:** \n**Release Notes:** \n\n*Report created on {currentDate}*'
                                },
                                {
                                  name: user?.role === 'manager' ? 'Strategic Planning' : 'Feature Development',
                                  icon: user?.role === 'manager' ? '🎯' : '⚡',
                                  category: user?.role === 'manager' ? 'Strategic' : 'Development',
                                  description: user?.role === 'manager' ? 'Strategic initiatives and planning' : 'Feature development and technical progress',
                                  color: user?.role === 'manager' ? 'bg-indigo-500' : 'bg-yellow-500',
                                  template: user?.role === 'manager' ? '# Strategic Planning Report\n\n**Date:** {currentDate}\n**Manager:** \n**Department:** \n**Planning Period:** \n**Review Cycle:** Quarterly/Annual\n**Stakeholders:** \n\n---\n\n## 🎯 Strategic Overview\n**Vision:** \n**Mission:** \n**Core Values:** \n**Strategic Theme:** \n**Planning Horizon:** 1 Year/3 Years/5 Years\n\n## 🚀 Key Initiatives\n• **Initiative 1:** Objective: | Budget: $ | Timeline: | Owner: | Status: \n• **Initiative 2:** Objective: | Budget: $ | Timeline: | Owner: | Status: \n• **Initiative 3:** Objective: | Budget: $ | Timeline: | Owner: | Status: \n• **Initiative 4:** Objective: | Budget: $ | Timeline: | Owner: | Status: \n\n## 📈 Progress Update\n• **Goal 1:** Target: | Actual: | Progress: % | Status: On Track/At Risk/Behind\n• **Goal 2:** Target: | Actual: | Progress: % | Status: On Track/At Risk/Behind\n• **Goal 3:** Target: | Actual: | Progress: % | Status: On Track/At Risk/Behind\n• **Goal 4:** Target: | Actual: | Progress: % | Status: On Track/At Risk/Behind\n\n## 🚨 Challenges & Risks\n• **Challenge 1:** Impact: High/Med/Low | Probability: % | Mitigation: | Owner: \n• **Challenge 2:** Impact: High/Med/Low | Probability: % | Mitigation: | Owner: \n• **Risk 1:** Impact: High/Med/Low | Probability: % | Mitigation: | Owner: \n• **Risk 2:** Impact: High/Med/Low | Probability: % | Mitigation: | Owner: \n\n## 📉 Market Analysis\n**Market Size:** $\n**Growth Rate:** %\n**Competition:** \n**Opportunities:** \n**Threats:** \n**Market Position:** Leader/Challenger/Follower/Niche\n\n## 💼 Resource Planning\n**Budget Required:** $\n**Personnel Needed:** FTE\n**Technology Investment:** $\n**Training Budget:** $\n**External Resources:** $\n\n## 📋 Action Items\n- [ ] **Strategic:** Action: | Owner: | Due Date: | Impact: High/Med/Low\n- [ ] **Operational:** Action: | Owner: | Due Date: | Impact: High/Med/Low\n- [ ] **Financial:** Action: | Owner: | Due Date: | Impact: High/Med/Low\n- [ ] **HR:** Action: | Owner: | Due Date: | Impact: High/Med/Low\n\n## 🔮 Future Planning\n### Next Quarter\n**Priority 1:** Objective: | Success Metrics: | Resources: \n**Priority 2:** Objective: | Success Metrics: | Resources: \n**Priority 3:** Objective: | Success Metrics: | Resources: \n\n### Next Year\n**Strategic Goal 1:** Vision: | Milestones: | Investment: $\n**Strategic Goal 2:** Vision: | Milestones: | Investment: $\n\n## 📈 Success Metrics\n**KPI 1:** Current: | Target: | Timeline: | Owner: \n**KPI 2:** Current: | Target: | Timeline: | Owner: \n**KPI 3:** Current: | Target: | Timeline: | Owner: \n**KPI 4:** Current: | Target: | Timeline: | Owner: \n\n---\n\n**Plan Status:** Draft/Review/Approved\n**Board Approval:** \n**Next Review:** \n\n*Strategic plan updated on {currentDate}*' : '# Feature Development Report\n\n**Date:** {currentDate}\n**Developer:** \n**Feature:** \n**Sprint:** \n**Epic:** \n**Release Version:** \n**Status:** Planning/Development/Testing/Complete\n\n---\n\n## ⚡ Development Summary\n**Feature Type:** New/Enhancement/Bug Fix\n**Complexity:** Low/Medium/High/Epic\n**Effort Estimate:** Story Points/Hours\n**Actual Effort:** Story Points/Hours\n**Completion:** %\n\n## ✅ Completed Features\n• **Feature 1:** Description: | Effort: hours | Quality: Excellent/Good/Fair | Status: Complete\n• **Feature 2:** Description: | Effort: hours | Quality: Excellent/Good/Fair | Status: Complete\n• **Feature 3:** Description: | Effort: hours | Quality: Excellent/Good/Fair | Status: Complete\n• **Feature 4:** Description: | Effort: hours | Quality: Excellent/Good/Fair | Status: Complete\n\n## 🔧 Technical Progress\n• **Backend API:** Progress: % | Endpoints: /total | Tests: Pass/Fail | Performance: ms\n• **Frontend UI:** Progress: % | Components: /total | Tests: Pass/Fail | Responsive: Yes/No\n• **Database:** Progress: % | Tables: /total | Migrations: Complete/Pending | Performance: Good/Fair\n• **Integration:** Progress: % | Services: /total | Tests: Pass/Fail | Status: Working/Issues\n\n## 🚧 Challenges & Blockers\n• **Technical Blocker 1:** Issue: | Impact: High/Med/Low | Resolution: | ETA: | Owner: \n• **Technical Blocker 2:** Issue: | Impact: High/Med/Low | Resolution: | ETA: | Owner: \n• **Dependency 1:** Waiting for: | Impact: High/Med/Low | ETA: | Workaround: \n• **Resource Issue:** Need: | Impact: High/Med/Low | Request Status: | Alternative: \n\n## 🧪 Testing Status\n• **Unit Tests:** Written: /total | Passing: /total | Coverage: % | Status: ✅/❌\n• **Integration Tests:** Written: /total | Passing: /total | Coverage: % | Status: ✅/❌\n• **E2E Tests:** Written: /total | Passing: /total | Coverage: % | Status: ✅/❌\n• **Performance Tests:** Load: ms | Stress: users | Memory: MB | Status: ✅/❌\n\n## 📈 Code Quality\n**Code Review:** Completed/Pending | Reviewer: | Issues: | Status: Approved/Changes Requested\n**Static Analysis:** Bugs: | Vulnerabilities: | Code Smells: | Coverage: %\n**Documentation:** API Docs: Complete/Partial | Code Comments: % | README: Updated/Needs Update\n\n## 📋 Action Items\n- [ ] **Development:** Task: | Owner: | Due Date: | Priority: High/Med/Low\n- [ ] **Testing:** Task: | Owner: | Due Date: | Priority: High/Med/Low\n- [ ] **Review:** Task: | Owner: | Due Date: | Priority: High/Med/Low\n- [ ] **Documentation:** Task: | Owner: | Due Date: | Priority: High/Med/Low\n- [ ] **Deployment:** Task: | Owner: | Due Date: | Priority: High/Med/Low\n\n## 🎯 Next Sprint Goals\n### Primary Objectives\n1. **Feature 1:** Description: | Effort: points | Priority: High | Dependencies: \n2. **Feature 2:** Description: | Effort: points | Priority: High | Dependencies: \n3. **Feature 3:** Description: | Effort: points | Priority: Medium | Dependencies: \n\n### Technical Debt\n1. **Refactor 1:** Description: | Effort: points | Impact: High/Med/Low | Priority: \n2. **Optimization 1:** Description: | Effort: points | Impact: High/Med/Low | Priority: \n\n## 🚀 Release Planning\n**Target Release:** Version | Date: | Features: \n**Dependencies:** External: | Internal: | Blockers: \n**Risk Assessment:** High/Medium/Low | Mitigation: \n**Rollback Plan:** Strategy: | Effort: | Timeline: \n\n---\n\n**Development Status:** On Track/At Risk/Delayed\n**Code Review:** Approved/Pending\n**Ready for Release:** Yes/No\n\n*Report created on {currentDate}*'
                                },
                                {
                                  name: 'Meeting Notes',
                                  icon: '📝',
                                  category: 'Communication',
                                  description: 'Structured meeting documentation',
                                  color: 'bg-teal-500',
                                  template: '# Meeting Notes\n\n**Date:** {currentDate}\n**Meeting Type:** Team/Project/Review/Planning\n**Duration:** minutes\n**Location:** Office/Remote/Hybrid\n**Facilitator:** \n**Note Taker:** \n\n---\n\n## 👥 Attendees\n**Present:**\n• Name 1 - Role\n• Name 2 - Role\n• Name 3 - Role\n\n**Absent:**\n• Name 1 - Role (Reason)\n• Name 2 - Role (Reason)\n\n## 🎯 Agenda & Discussion\n### Topic 1: \n**Presenter:** \n**Duration:** minutes\n**Key Points:**\n• Point 1\n• Point 2\n• Point 3\n**Decisions:** \n**Action Items:** \n\n### Topic 2: \n**Presenter:** \n**Duration:** minutes\n**Key Points:**\n• Point 1\n• Point 2\n• Point 3\n**Decisions:** \n**Action Items:** \n\n## 📋 Action Items\n- [ ] **Action 1:** Owner: | Due Date: | Priority: High/Med/Low | Status: Not Started\n- [ ] **Action 2:** Owner: | Due Date: | Priority: High/Med/Low | Status: Not Started\n- [ ] **Action 3:** Owner: | Due Date: | Priority: High/Med/Low | Status: Not Started\n\n## 📈 Decisions Made\n1. **Decision 1:** Impact: High/Med/Low | Owner: | Implementation: \n2. **Decision 2:** Impact: High/Med/Low | Owner: | Implementation: \n\n## 🔄 Follow-up\n**Next Meeting:** Date: | Time: | Location: \n**Preparation Required:** \n**Materials Needed:** \n\n---\n\n**Meeting Status:** Complete\n**Notes Distribution:** \n**Next Review:** \n\n*Notes recorded on {currentDate}*'
                                },
                                {
                                  name: 'Incident Report',
                                  icon: '🚨',
                                  category: 'Operations',
                                  description: 'System incident documentation and analysis',
                                  color: 'bg-orange-500',
                                  template: '# Incident Report\n\n**Date:** {currentDate}\n**Incident ID:** INC-{currentDate}-\n**Reporter:** \n**Severity:** Critical/High/Medium/Low\n**Status:** Open/Investigating/Resolved/Closed\n**Assigned To:** \n\n---\n\n## 🚨 Incident Summary\n**Title:** \n**Start Time:** \n**End Time:** \n**Duration:** hours/minutes\n**Impact:** High/Medium/Low\n**Affected Systems:** \n**Users Affected:** \n\n## 📝 Incident Details\n**Description:** What happened:\n**Root Cause:** Technical reason:\n**Trigger:** What caused it:\n**Detection:** How was it discovered:\n**Escalation:** Who was notified:\n\n## 🔧 Resolution Steps\n1. **Step 1:** Action taken: | Time: | Result: | Owner: \n2. **Step 2:** Action taken: | Time: | Result: | Owner: \n3. **Step 3:** Action taken: | Time: | Result: | Owner: \n4. **Step 4:** Action taken: | Time: | Result: | Owner: \n\n## 📈 Impact Analysis\n**Business Impact:** Revenue/Operations/Reputation\n**Customer Impact:** Number affected: | Complaints: | Compensation: $\n**System Impact:** Downtime: minutes | Performance: % degradation\n**Data Impact:** Loss: Yes/No | Corruption: Yes/No | Recovery: Complete/Partial\n\n## 📋 Action Items\n- [ ] **Immediate:** Fix applied | Owner: | Due Date: | Status: Complete\n- [ ] **Short-term:** Monitoring | Owner: | Due Date: | Status: In Progress\n- [ ] **Long-term:** Prevention | Owner: | Due Date: | Status: Planned\n\n## 🔍 Lessons Learned\n**What Went Well:** \n**What Could Be Improved:** \n**Prevention Measures:** \n**Process Changes:** \n\n---\n\n**Incident Status:** Resolved/Closed\n**Post-Mortem:** Scheduled/Complete\n**Documentation:** Updated/Pending\n\n*Report created on {currentDate}*'
                                }
                              ].map((template, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const currentDate = new Date().toLocaleDateString();
                                    const populatedTemplate = template.template
                                      .replace(/\{currentDate\}/g, currentDate);
                                    
                                    setWorkerReport(populatedTemplate);
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-start px-3 py-2 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}
                                >
                                  <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg text-lg ${template.color} text-white`}>
                                    {template.icon}
                                  </div>
                                  <div className="text-left flex-1">
                                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{template.name}</div>
                                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {template.category} • {template.description}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                    <div className="p-6 space-y-1 min-h-[600px]">
                      {workerReport.split('\n').map((line, index) => (
                        <div key={index} className="group flex items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors duration-150">
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1 py-1">
                            <div className="relative">
                              <button 
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                                onClick={() => setActiveDropdown(activeDropdown === `plus-${index}` ? null : `plus-${index}`)}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              {activeDropdown === `plus-${index}` && (
                                <div className={`absolute left-8 top-0 z-50 w-72 max-h-80 rounded-xl shadow-2xl border backdrop-blur-sm overflow-hidden ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                                  <div className="py-3">
                                    <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                                      Basic Blocks
                                    </div>
                                    <div className="py-1 max-h-64 overflow-y-auto">
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, ''); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>📝</div>
                                        <span className="font-medium">Text</span>
                                      </button>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '# '); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>#</div>
                                        <span className="font-medium">Heading 1</span>
                                      </button>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '## '); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>#</div>
                                        <span className="font-medium">Heading 2</span>
                                      </button>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '### '); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>#</div>
                                        <span className="font-medium">Heading 3</span>
                                      </button>
                                      <div className={`border-t my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '• '); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>•</div>
                                        <span className="font-medium">Bullet List</span>
                                      </button>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '1. '); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>1.</div>
                                        <span className="font-medium">Numbered List</span>
                                      </button>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '☐ '); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>☐</div>
                                        <span className="font-medium">To-Do List</span>
                                      </button>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '> '); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>"</div>
                                        <span className="font-medium">Quote</span>
                                      </button>
                                      <div className={`border-t my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '---'); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>—</div>
                                        <span className="font-medium">Divider</span>
                                      </button>
                                      <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, '| Header | Column |'); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                        <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>⊞</div>
                                        <span className="font-medium">Table</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button 
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                                onClick={() => setActiveDropdown(activeDropdown === `grip-${index}` ? null : `grip-${index}`)}
                              >
                                <GripVertical className="w-3 h-3" />
                              </button>
                              {activeDropdown === `grip-${index}` && (
                                <div className={`absolute z-50 mt-1 w-40 rounded-md shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                  <div className="py-1">
                                    <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index + 1, 0, ''); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>➕ Add Line Below</button>
                                    <button onClick={() => { const lines = workerReport.split('\n'); lines.splice(index, 0, ''); setWorkerReport(lines.join('\n')); setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⬆️ Add Line Above</button>
                                    <button onClick={() => { const lines = workerReport.split('\n'); if (index > 0) { const line = lines[index]; lines.splice(index, 1); lines.splice(index - 1, 0, line); setWorkerReport(lines.join('\n')); } setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⬆️ Move Up</button>
                                    <button onClick={() => { const lines = workerReport.split('\n'); if (index < lines.length - 1) { const line = lines[index]; lines.splice(index, 1); lines.splice(index + 1, 0, line); setWorkerReport(lines.join('\n')); } setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⬇️ Move Down</button>
                                    <button onClick={() => { const lines = workerReport.split('\n'); if (lines.length > 1) { lines.splice(index, 1); setWorkerReport(lines.join('\n')); } setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500`}>🗑️ Delete Line</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 py-1">
                            {line === '---' ? (
                              <div className={`w-full h-px my-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                            ) : line.startsWith('|') && line.endsWith('|') ? (
                              (() => {
                                const tableId = `table-${index}`;
                                const table = tableData[tableId] || { rows: 2, cols: 1, data: [['Header'], ['Cell']] };
                                return (
                                  <div className="flex-1 relative group" style={{ marginRight: '40px', marginBottom: '40px' }}>
                                    <div className={`border rounded-lg overflow-hidden shadow-sm ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                                      <table className="w-full border-collapse">
                                        <tbody>
                                          {table.data.map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex === 0 ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-50') : (isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/50')}>
                                              {row.map((cell, colIndex) => (
                                                <td key={colIndex} className={`border-r border-b p-0 relative ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                  <textarea
                                                    value={cell}
                                                    onChange={(e) => {
                                                      const newData = [...table.data];
                                                      newData[rowIndex][colIndex] = e.target.value;
                                                      setTableData(prev => ({ ...prev, [tableId]: { ...table, data: newData } }));
                                                    }}
                                                    placeholder={rowIndex === 0 ? `Column ${colIndex + 1}` : ''}
                                                    className={`w-full min-h-[24px] px-2 py-1 border-none outline-none resize-none bg-transparent text-xs leading-tight ${rowIndex === 0 ? (isDarkMode ? 'font-semibold text-gray-200' : 'font-semibold text-gray-800') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')} ${isDarkMode ? 'focus:bg-blue-900/20 focus:ring-1 focus:ring-blue-700 focus:ring-inset' : 'focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 focus:ring-inset'}`}
                                                    rows={1}
                                                    onInput={(e) => {
                                                      e.target.style.height = 'auto';
                                                      e.target.style.height = Math.max(24, e.target.scrollHeight) + 'px';
                                                    }}
                                                  />
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <button onClick={() => {
                                      const newData = table.data.map(row => [...row, '']);
                                      setTableData(prev => ({ ...prev, [tableId]: { ...table, cols: table.cols + 1, data: newData } }));
                                    }} className={`absolute top-1/2 -right-8 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} title="Add column"><Plus className="w-3.5 h-3.5" /></button>
                                    {table.cols > 1 && <button onClick={() => {
                                      const newData = table.data.map(row => row.slice(0, -1));
                                      setTableData(prev => ({ ...prev, [tableId]: { ...table, cols: table.cols - 1, data: newData } }));
                                    }} className={`absolute top-1/2 -right-16 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-red-500 hover:text-white hover:border-red-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} title="Delete column"><Minus className="w-3.5 h-3.5" /></button>}
                                    <button onClick={() => {
                                      const newRow = Array(table.cols).fill('');
                                      setTableData(prev => ({ ...prev, [tableId]: { ...table, rows: table.rows + 1, data: [...table.data, newRow] } }));
                                    }} className={`absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} title="Add row"><Plus className="w-3.5 h-3.5" /></button>
                                    {table.rows > 1 && <button onClick={() => {
                                      const newData = table.data.slice(0, -1);
                                      setTableData(prev => ({ ...prev, [tableId]: { ...table, rows: table.rows - 1, data: newData } }));
                                    }} className={`absolute left-1/2 -bottom-16 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-red-500 hover:text-white hover:border-red-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} title="Delete row"><Minus className="w-3.5 h-3.5" /></button>}
                                  </div>
                                );
                              })()

                            ) : line.match(/!\[.*?\]\(img-\d+\)/) ? (
                              (() => {
                                const match = line.match(/!\[(.*?)\]\((img-\d+)\)/);
                                const imageId = match[2];
                                const image = selectedImages[imageId];
                                return image ? (
                                  <div className="my-4">
                                    <div className={`relative inline-block rounded-lg overflow-hidden border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                      <img 
                                        src={image.url} 
                                        alt={image.name}
                                        className="max-w-full h-auto max-h-64 object-contain"
                                      />
                                      <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                          onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e) => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                  setSelectedImages(prev => ({ ...prev, [imageId]: { file, url: event.target.result, name: file.name } }));
                                                  const lines = workerReport.split('\n');
                                                  lines[index] = `![${file.name}](${imageId})`;
                                                  setWorkerReport(lines.join('\n'));
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            };
                                            input.click();
                                          }}
                                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                        >
                                          Replace
                                        </button>
                                        <button
                                          onClick={() => {
                                            const lines = workerReport.split('\n');
                                            lines.splice(index, 1);
                                            setWorkerReport(lines.join('\n'));
                                            setSelectedImages(prev => {
                                              const newImages = { ...prev };
                                              delete newImages[imageId];
                                              return newImages;
                                            });
                                          }}
                                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                    <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {image.name}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-red-500 text-sm">Image not found</div>
                                );
                              })()
                            ) : line.startsWith('> ') ? (
                              <div className={`border-l-4 pl-4 py-2 my-2 ${isDarkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'}`}>
                                <input
                                  type="text"
                                  value={line.slice(2)}
                                  onChange={(e) => {
                                    const lines = workerReport.split('\n');
                                    lines[index] = '> ' + e.target.value;
                                    setWorkerReport(lines.join('\n'));
                                  }}
                                  placeholder="Quote text"
                                  className={`w-full outline-none border-none bg-transparent font-inter leading-relaxed italic ${isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                                  style={{ lineHeight: '1.6' }}
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={line.startsWith('# ') ? line.slice(2) : line.startsWith('## ') ? line.slice(3) : line.startsWith('### ') ? line.slice(4) : line}
                                onChange={(e) => {
                                  const lines = workerReport.split('\n');
                                  const originalLine = lines[index];
                                  if (originalLine.startsWith('# ')) {
                                    lines[index] = '# ' + e.target.value;
                                  } else if (originalLine.startsWith('## ')) {
                                    lines[index] = '## ' + e.target.value;
                                  } else if (originalLine.startsWith('### ')) {
                                    lines[index] = '### ' + e.target.value;
                                  } else {
                                    lines[index] = e.target.value;
                                  }
                                  setWorkerReport(lines.join('\n'));
                                }}
                                onClick={(e) => {
                                  const cursorPos = e.target.selectionStart;
                                  if ((line.startsWith('☐ ') || line.startsWith('☑ ')) && cursorPos === 0) {
                                    const lines = workerReport.split('\n');
                                    if (line.startsWith('☐ ')) {
                                      lines[index] = line.replace('☐ ', '☑ ');
                                    } else {
                                      lines[index] = line.replace('☑ ', '☐ ');
                                    }
                                    setWorkerReport(lines.join('\n'));
                                  }
                                }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const lines = workerReport.split('\n');
                                  let newLine = '';
                                  
                                  if (line.startsWith('• ')) {
                                    newLine = '• ';
                                  } else if (line.match(/^\d+\. /)) {
                                    const num = parseInt(line.match(/^(\d+)\./)[1]) + 1;
                                    newLine = num + '. ';
                                  } else if (line.startsWith('☐ ') || line.startsWith('☑ ')) {
                                    newLine = '☐ ';
                                  }
                                  
                                  lines.splice(index + 1, 0, newLine);
                                  setWorkerReport(lines.join('\n'));
                                  setTimeout(() => {
                                    const nextInput = e.target.parentElement.parentElement.nextElementSibling?.querySelector('input');
                                    if (nextInput) nextInput.focus();
                                  }, 0);
                                }
                                if (e.key === 'Backspace' && (line === '' || line === '• ' || line === '☐ ' || line.match(/^\d+\. $/)) && workerReport.split('\n').length > 1) {
                                  e.preventDefault();
                                  const lines = workerReport.split('\n');
                                  lines.splice(index, 1);
                                  setWorkerReport(lines.join('\n'));
                                  setTimeout(() => {
                                    const prevInput = e.target.parentElement.parentElement.previousElementSibling?.querySelector('input');
                                    if (prevInput) prevInput.focus();
                                  }, 0);
                                }
                              }}
                              placeholder={
                                line.startsWith('# ') ? 'Heading 1' :
                                line.startsWith('## ') ? 'Heading 2' :
                                line.startsWith('### ') ? 'Heading 3' :
                                index === 0 && line === '' ? (user?.role === 'manager' 
                                  ? "Write your detailed management report here..."
                                  : "Write your detailed project report here...") : ''
                              }
                                className={`w-full outline-none border-none bg-transparent font-inter leading-relaxed ${isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'} ${
                                  line.startsWith('# ') ? 'text-2xl font-bold' :
                                  line.startsWith('## ') ? 'text-xl font-semibold' :
                                  line.startsWith('### ') ? 'text-lg font-medium' : ''
                                }`}
                                style={{ lineHeight: '1.6' }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                      {workerReport === '' && (
                        <div className="group flex items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors duration-150">
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1 py-1">
                            <button 
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                              onClick={() => setWorkerReport('\n')}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button 
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                            >
                              <GripVertical className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex-1 py-1">
                            <input
                              type="text"
                              value=""
                              onChange={(e) => setWorkerReport(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  setWorkerReport(e.target.value + '\n');
                                }
                              }}
                              placeholder={user?.role === 'manager' 
                                ? "Write your detailed management report here..."
                                : "Write your detailed project report here..."}
                              className={`w-full outline-none border-none bg-transparent font-inter leading-relaxed ${isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                              style={{ lineHeight: '1.6' }}
                            />
                          </div>
                        </div>
                      )}
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
                        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                          {report.content.split('\n').map((line, lineIndex) => {
                            if (line.startsWith('# ')) {
                              return <h1 key={lineIndex} className={`text-2xl font-bold mb-4 mt-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.slice(2)}</h1>;
                            } else if (line.startsWith('## ')) {
                              return <h2 key={lineIndex} className={`text-xl font-semibold mb-3 mt-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.slice(3)}</h2>;
                            } else if (line.startsWith('### ')) {
                              return <h3 key={lineIndex} className={`text-lg font-medium mb-2 mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.slice(4)}</h3>;
                            } else if (line.startsWith('• ')) {
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-blue-500 mt-2">•</span><span>{line.slice(2)}</span></div>;
                            } else if (line.match(/^\d+\. /)) {
                              const match = line.match(/^(\d+)\. (.*)/);
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-blue-500 font-medium">{match[1]}.</span><span>{match[2]}</span></div>;
                            } else if (line.startsWith('☐ ')) {
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-gray-400">☐</span><span>{line.slice(2)}</span></div>;
                            } else if (line.startsWith('☑ ')) {
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-green-500">☑</span><span className="line-through opacity-75">{line.slice(2)}</span></div>;
                            } else if (line === '---') {
                              return <hr key={lineIndex} className={`my-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />;
                            } else if (line.trim() === '') {
                              return <div key={lineIndex} className="mb-2"></div>;
                            } else {
                              return <p key={lineIndex} className="mb-2">{line}</p>;
                            }
                          })}
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
                        <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                          {report.content.split('\n').map((line, lineIndex) => {
                            if (line.startsWith('# ')) {
                              return <h1 key={lineIndex} className={`text-2xl font-bold mb-4 mt-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.slice(2)}</h1>;
                            } else if (line.startsWith('## ')) {
                              return <h2 key={lineIndex} className={`text-xl font-semibold mb-3 mt-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.slice(3)}</h2>;
                            } else if (line.startsWith('### ')) {
                              return <h3 key={lineIndex} className={`text-lg font-medium mb-2 mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{line.slice(4)}</h3>;
                            } else if (line.startsWith('• ')) {
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-blue-500 mt-2">•</span><span>{line.slice(2)}</span></div>;
                            } else if (line.match(/^\d+\. /)) {
                              const match = line.match(/^(\d+)\. (.*)/);
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-blue-500 font-medium">{match[1]}.</span><span>{match[2]}</span></div>;
                            } else if (line.startsWith('☐ ')) {
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-gray-400">☐</span><span>{line.slice(2)}</span></div>;
                            } else if (line.startsWith('☑ ')) {
                              return <div key={lineIndex} className="flex items-start gap-2 mb-1"><span className="text-green-500">☑</span><span className="line-through opacity-75">{line.slice(2)}</span></div>;
                            } else if (line === '---') {
                              return <hr key={lineIndex} className={`my-4 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`} />;
                            } else if (line.trim() === '') {
                              return <div key={lineIndex} className="mb-2"></div>;
                            } else {
                              return <p key={lineIndex} className="mb-2">{line}</p>;
                            }
                          })}
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
                      
                      {/* Formatting Toolbar */}
                      <div className={`border-b p-3 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setWorkerReport(prev => prev + '\n# ')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            title="Add Heading 1"
                          >
                            H1
                          </button>
                          <button
                            onClick={() => setWorkerReport(prev => prev + '\n## ')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            title="Add Heading 2"
                          >
                            H2
                          </button>
                          <button
                            onClick={() => setWorkerReport(prev => prev + '\n### ')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            title="Add Heading 3"
                          >
                            H3
                          </button>
                          <div className={`w-px h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                          <button
                            onClick={() => setWorkerReport(prev => prev + '\n• ')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            title="Add Bullet List"
                          >
                            • List
                          </button>
                          <button
                            onClick={() => setWorkerReport(prev => prev + '\n1. ')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            title="Add Numbered List"
                          >
                            1. List
                          </button>
                          <button
                            onClick={() => setWorkerReport(prev => prev + '\n☐ ')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            title="Add Checkbox"
                          >
                            ☐ Todo
                          </button>
                          <div className={`w-px h-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                          <button
                            onClick={() => setWorkerReport(prev => prev + '\n---\n')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            title="Add Divider"
                          >
                            ➖ Divider
                          </button>
                        </div>
                      </div>
                      
                      <div className={`border rounded-b-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                        <textarea
                          value={workerReport}
                          onChange={(e) => setWorkerReport(e.target.value)}
                          placeholder="Write your detailed project report here...\n\nUse the toolbar above to add formatting like:\n• Headings (H1, H2, H3)\n• Bullet points\n• Numbered lists\n• Checkboxes\n• Dividers\n\nExample:\n# Project Status Report\nThis week we completed...\n\n## Milestones Achieved\n• Feature development: 85%\n• Testing: 60%\n• Documentation: 40%"
                          rows={20}
                          className={`w-full p-6 border-none outline-none resize-none bg-transparent font-inter leading-relaxed ${isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                          style={{ lineHeight: '1.6', minHeight: '500px' }}
                        />
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