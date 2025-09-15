import React, { useState, useEffect } from 'react';
import { Flag, User, Search, Plus, Calendar, Users, Trash as TrashIcon, CheckCircle, Clock, AlertCircle, X, BarChart3, MessageSquare, Paperclip, Activity, Send, Zap, Filter, Save, FileText, Target, Sparkles, TrendingUp, Award, Star, Brain, Lightbulb, Rocket, Timer, Eye, Grid, List } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { addNotification } from '../../utils/notifications';
import api from '../../services/api';
import GoalDetailsPage from './GoalDetailsPage';
import { useParams } from 'react-router-dom';



const GoalsPage = () => {
  const { user } = useAppContext();
  const isManager = user?.role === 'manager';
  const { isDarkMode } = useTheme();
  const { goalId } = useParams();
  const [goals, setGoals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewGoal, setViewGoal] = useState(null);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'kanban', 'calendar', 'grid'
  const [selectedGoals, setSelectedGoals] = useState([]);

  // Enhanced filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState({ min: 0, max: 100 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState([
    { id: 1, title: 'Increase monthly active users by 15%', description: 'Focus on user engagement strategies and feature improvements' },
    { id: 2, title: 'Improve customer satisfaction score to 4.8/5', description: 'Enhance support processes and gather user feedback' },
    { id: 3, title: 'Reduce churn rate by 20%', description: 'Implement retention strategies and improve onboarding' }
  ]);

  // Mobile view state
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);




  const normalizeGoal = (g) => ({
    ...g,
    id: g._id || g.id,
    forPerson: g.forPerson ?? g.team ?? '',
  });

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            if (isManager) addNewGoal();
            break;
          case 'f':
            e.preventDefault();
            document.querySelector('input[placeholder="Search goals..."]')?.focus();
            break;
          case 'k':
            e.preventDefault();
            setViewMode('kanban');
            break;
          case 't':
            e.preventDefault();
            setViewMode('table');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    const fetchGoals = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (filterPriority !== 'all') params.append('priority', filterPriority);
        if (searchQuery) params.append('search', searchQuery);
        if (['dueDate', 'priority', 'createdAt'].includes(sortBy)) params.append('sortBy', sortBy);
        const url = `/goals${params.toString() ? `?${params.toString()}` : ''}`;
        const data = await api.get(url);
        const normalized = Array.isArray(data) ? data.map(normalizeGoal) : [];
        setGoals(normalized);
        
        // Check if we need to restore a goal from user picker
        const returnData = sessionStorage.getItem('goalPickerReturn');
        if (returnData) {
          try {
            const pickerData = JSON.parse(returnData);
            if (pickerData.goalState) {
              // Always use the saved goal state to preserve all changes
              setViewGoal(pickerData.goalState);
              // Clean up session storage after restoring
              sessionStorage.removeItem('goalPickerReturn');
            }
          } catch (error) {
            console.error('Error parsing return data:', error);
          }
        }
        
        // If goalId is provided in URL, automatically open that goal
        if (goalId && normalized.length > 0) {
          const goalToOpen = normalized.find(g => g.id === goalId);
          if (goalToOpen) {
            setViewGoal(goalToOpen);
          }
        }
      } catch (e) {
        setError(e?.message || 'Failed to load goals');
        setGoals([]);
      } finally {
        setLoading(false);
      }
    };

    // Handle window resize for mobile responsiveness
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    fetchGoals();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [filterStatus, filterPriority, searchQuery, sortBy, goalId]);

  const deleteGoal = (goalId) => {
    (async () => {
      try {
        await api.delete(`/goals/${goalId}`);
        setGoals(prev => prev.filter(g => g.id !== goalId));
      } catch (e) {
        setError(e?.message || 'Failed to delete goal');
      }
    })();
  };

  const handleOpenGoal = (goal) => {
    // Ensure we have a clean copy of the goal with all necessary fields
    const goalWithDefaults = {
      id: goal.id || goal._id,
      name: goal.name || 'Untitled Goal',
      description: goal.description || '',
      status: goal.status || 'Not started',
      priority: goal.priority || 'Medium',
      dueDate: goal.dueDate || null,
      forPerson: goal.forPerson || '',
      owner: goal.owner || { name: user?.name || 'Unknown' },
      // Include any other fields that might be needed
      ...goal
    };
    
    console.log('Opening goal:', goalWithDefaults);
    setViewGoal(goalWithDefaults);
  };

  const handleCloseGoal = () => setViewGoal(null);

  const handleUpdateGoalField = (field, value) => {
    if (!isManager && field !== 'status') return;
    if (!viewGoal) return;
    const updated = { ...viewGoal, [field]: value };
    setViewGoal(updated);
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));

    const apiField = field === 'forPerson' ? 'team' : field;
    if (apiField === 'owner') return;
    const payload = { [apiField]: value };
    (async () => {
      try {
        await api.put(`/goals/${updated.id}`, payload);
      } catch (e) {
        setGoals(prev => prev.map(g => g.id === updated.id ? viewGoal : g));
        setViewGoal(viewGoal);
      }
    })();
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = (goal.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (goal.owner?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (goal.forPerson?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (goal.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || goal.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'priority':
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'status':
        const statusOrder = { 'Not started': 1, 'In progress': 2, 'Done': 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return 0;
    }
  });

  const addNewGoal = () => {
    const newGoal = {
      id: 'new',
      name: '',
      description: '',
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
      forPerson: '',
      status: 'Not started',
      notes: '',
      owner: user,
      createdAt: new Date().toISOString(),
      dependencies: [],
      subGoals: [],
      reminders: []
    };
    setViewGoal(newGoal);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;

    const filter = {
      id: Date.now(),
      name: filterName,
      filters: {
        status: filterStatus,
        priority: filterPriority,
        search: searchQuery,
        dateRange,
        assignee: assigneeFilter,
        progress: progressFilter
      },
      createdAt: new Date().toISOString()
    };

    setSavedFilters(prev => [...prev, filter]);
    setFilterName('');
    setShowSaveFilter(false);
  };

  const applySavedFilter = (filter) => {
    setFilterStatus(filter.filters.status);
    setFilterPriority(filter.filters.priority);
    setSearchQuery(filter.filters.search);
    setDateRange(filter.filters.dateRange);
    setAssigneeFilter(filter.filters.assignee);
    setProgressFilter(filter.filters.progress);
  };

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setSearchQuery('');
  };

  const applyTemplate = (template) => {
    const newGoal = {
      id: 'new',
      name: template.name,
      description: template.content,
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
      forPerson: '',
      status: 'Not started',
      notes: '',
      owner: user,
      createdAt: new Date().toISOString(),
      dependencies: [],
      subGoals: [],
      reminders: []
    };
    setViewGoal(newGoal);
    setShowTemplates(false);
  };

  const handleConfirmCreateGoal = async (goalData) => {
    if (!goalData.name.trim()) return;

    try {
      const body = {
        name: goalData.name,
        description: goalData.description,
        status: goalData.status,
        priority: goalData.priority,
        dueDate: goalData.dueDate,
        team: goalData.forPerson,
        notes: goalData.notes
      };
      const created = await api.post('/goals', body);
      const normalized = normalizeGoal(created);
      setGoals(prev => [...prev, normalized]);
      setViewGoal(null);
    } catch (e) {
      setError(e?.message || 'Failed to create goal');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };



  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className={`relative overflow-hidden rounded-3xl p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Flag className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Goals</h1>
                </div>
                <p className={`text-base md:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Track and achieve your strategic objectives
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">



                {isManager && (
                  <button
                    onClick={addNewGoal}
                    className="group flex items-center px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus size={16} className="mr-1 md:mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-sm md:text-base">New Goal</span>
                  </button>
                )}
              </div>
            </div>
            <div className={`absolute inset-0 opacity-10 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-200'}`} style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, currentColor 0%, transparent 50%), radial-gradient(circle at 80% 20%, currentColor 0%, transparent 50%)'
            }} />
          </div>
        </div>

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className={`group p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-green-500/50' : 'bg-gradient-to-br from-white to-green-50 border-gray-200 hover:border-green-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-green-600">{goals.filter(g => g.status === 'Done').length}</p>
                <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed Goals</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className={`group p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-blue-500/50' : 'bg-gradient-to-br from-white to-blue-50 border-gray-200 hover:border-blue-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{goals.filter(g => g.status === 'In progress').length}</p>
                <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className={`group p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-orange-500/50' : 'bg-gradient-to-br from-white to-orange-50 border-gray-200 hover:border-orange-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-orange-600">{goals.filter(g => g.status === 'Not started').length}</p>
                <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Not Started</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-orange-100 group-hover:bg-orange-200 transition-colors">
                <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className={`group p-4 md:p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-purple-500/50' : 'bg-gradient-to-br from-white to-purple-50 border-gray-200 hover:border-purple-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-purple-600">{Math.round((goals.filter(g => g.status === 'Done').length / Math.max(goals.length, 1)) * 100)}%</p>
                <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Success Rate</p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                <Award className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>








            {/* Search and Filters */}
            <div className={`mb-6 md:mb-8 p-4 md:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm`}>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
                <div className="relative flex-1 min-w-[200px] md:min-w-80">
                  <Search className={`absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-8 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full border-2 transition-all duration-200 text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 font-medium transition-all duration-200 text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                >
                  <option value="all">📋 All Status</option>
                  <option value="Not started">⏸️ Not Started</option>
                  <option value="In progress">▶️ In Progress</option>
                  <option value="Done">✅ Completed</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className={`px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 font-medium transition-all duration-200 text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                >
                  <option value="all">🎯 All Priority</option>
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-3 py-2 md:px-4 md:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 font-medium transition-all duration-200 text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                >
                  <option value="dueDate">📅 Sort by Due Date</option>
                  <option value="priority">⚡ Sort by Priority</option>
                  <option value="status">📊 Sort by Status</option>
                </select>


              </div>


            </div>

            {/* Goals Table */}
            <div className={`rounded-2xl shadow-xl border-2 overflow-hidden backdrop-blur-sm ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
              <div className="overflow-x-auto">
                {error && (
                  <div className={`px-4 md:px-6 py-3 md:py-4 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
                )}
                {loading ? (
                  <div className="px-4 md:px-6 py-4 md:py-6 text-center text-sm opacity-80">Loading goals...</div>
                ) : (
                  <table className="w-full">
                    <thead className={`${isDarkMode ? 'bg-gray-700 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}`}>
                      <tr>
                        <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGoals(sortedGoals.map(g => g.id));
                              } else {
                                setSelectedGoals([]);
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Goal
                        </th>
                        <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Owner
                        </th>
                        <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Status
                        </th>
                        <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Priority
                        </th>
                        <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Due Date
                        </th>
                        <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                          Assigned To
                        </th>
                        {isManager && (
                          <th className={`px-4 md:px-6 py-2 md:py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'} divide-y`}>
                      {sortedGoals.map((goal) => (
                        <tr
                          key={goal.id}
                          onClick={() => handleOpenGoal(goal)}
                          className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition-colors`}
                        >
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {goal.name || 'Untitled Goal'}
                              </div>
                              <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {goal.description ? (goal.description.length > 30 ? goal.description.substring(0, 30) + '...' : goal.description) : 'No description'}
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell`}>
                            <div className="flex items-center">
                              <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 md:mr-3">
                                {goal.owner?.name ? goal.owner.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {goal.owner?.name || 'Unassigned'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${goal.status === 'Done' ? 'bg-green-100 text-green-800' :
                              goal.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {goal.status || 'Not started'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${goal.priority === 'High' ? 'bg-red-100 text-red-800' :
                              goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {goal.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs md:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {goal.dueDate ? formatDate(goal.dueDate) : 'No due date'}
                              </span>
                              {goal.dueDate && (() => {
                                const daysUntil = Math.ceil((new Date(goal.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                                if (daysUntil < 0 && goal.status !== 'Done') {
                                  return <span className="px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded-full font-medium">Overdue</span>;
                                } else if (daysUntil <= 3 && goal.status !== 'Done') {
                                  return <span className="px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">Due Soon</span>;
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td className={`px-4 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell`}>
                            <span className={`text-xs md:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {goal.forPerson || '—'}
                            </span>
                          </td>
                          {isManager && (
                            <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {sortedGoals.length === 0 && !loading && (
                <div className="text-center py-8 md:py-12">
                  <Flag className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                  <h3 className={`mt-2 text-sm md:text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No goals found</h3>
                  <p className={`mt-1 text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Get started by creating your first goal.</p>
                  <div className="mt-4 md:mt-6">
                    {isManager && (
                      <button
                        onClick={addNewGoal}
                        className="inline-flex items-center px-3 py-2 md:px-4 md:py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-1 md:mr-2" />
                        New Goal
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>



        {/* Save Filter Modal */}
        {showSaveFilter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl w-full max-w-md p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-bold mb-3 md:mb-4">Save Filter</h3>
              <input
                type="text"
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border mb-3 md:mb-4 text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => setShowSaveFilter(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm md:text-base ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentFilter}
                  disabled={!filterName.trim()}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestions Modal */}
        {showAISuggestions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                    AI Goal Suggestions
                  </h3>
                  <button
                    onClick={() => setShowAISuggestions(false)}
                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {aiSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {suggestion.type === 'optimization' && <TrendingUp className="w-4 h-4 text-blue-500" />}
                            {suggestion.type === 'dependency' && <Target className="w-4 h-4 text-orange-500" />}
                            {suggestion.type === 'resource' && <Users className="w-4 h-4 text-green-500" />}
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                                suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                              }`}>
                              {suggestion.priority}
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {suggestion.description}
                          </p>
                        </div>
                        <button className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          {suggestion.action}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowAISuggestions(false)}
                    className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Goal Details Page */}
        {viewGoal && (
          <GoalDetailsPage
            goal={viewGoal}
            onClose={handleCloseGoal}
            onUpdate={(updatedGoal) => {
              if (updatedGoal.id === 'new') {
                // Handle new goal creation
                handleConfirmCreateGoal(updatedGoal);
              } else {
                setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
                setViewGoal(updatedGoal);
              }
            }}
            isManager={isManager}
            isNewGoal={viewGoal.id === 'new'}
          />
        )}


      </div>
    </div>
  );
};

export default GoalsPage;