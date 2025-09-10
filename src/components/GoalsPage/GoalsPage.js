import React, { useState, useEffect } from 'react';
import { Flag, User, Search, Plus, Calendar, Users, Trash as TrashIcon, CheckCircle, Clock, AlertCircle, X, BarChart3, MessageSquare, Paperclip, Activity, Send, Zap } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { addNotification } from '../../utils/notifications';
import api from '../../services/api';
import GoalDetailsPage from './GoalDetailsPage';

const GoalsPage = () => {
  const { user } = useAppContext();
  const isManager = user?.role === 'manager';
  const { isDarkMode } = useTheme();
  const [goals, setGoals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewGoal, setViewGoal] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  


  const normalizeGoal = (g) => ({
    ...g,
    id: g._id || g.id,
    forPerson: g.forPerson ?? g.team ?? '',
  });

  useEffect(() => {
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
      } catch (e) {
        setError(e?.message || 'Failed to load goals');
        setGoals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [filterStatus, filterPriority, searchQuery, sortBy]);

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
    setViewGoal({ ...goal });
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
                         (goal.forPerson?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
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
      createdAt: new Date().toISOString()
    };
    setViewGoal(newGoal);
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
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className={`relative overflow-hidden rounded-3xl p-8 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Flag className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Goals</h1>
                </div>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Track and achieve your strategic objectives
                </p>
              </div>
              {isManager && (
                <button
                  onClick={addNewGoal}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  New Goal
                </button>
              )}
            </div>
            <div className={`absolute inset-0 opacity-10 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-200'}`} style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, currentColor 0%, transparent 50%), radial-gradient(circle at 80% 20%, currentColor 0%, transparent 50%)'
            }} />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-green-500/50' : 'bg-gradient-to-br from-white to-green-50 border-gray-200 hover:border-green-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">{goals.filter(g => g.status === 'Done').length}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed Goals</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-blue-500/50' : 'bg-gradient-to-br from-white to-blue-50 border-gray-200 hover:border-blue-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">{goals.filter(g => g.status === 'In progress').length}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-orange-500/50' : 'bg-gradient-to-br from-white to-orange-50 border-gray-200 hover:border-orange-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-600">{goals.filter(g => g.status === 'Not started').length}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Not Started</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100 group-hover:bg-orange-200 transition-colors">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`mb-8 p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'} backdrop-blur-sm`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-80">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search goals by name, owner, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full border-2 transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 font-medium transition-all duration-200 ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
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
              className={`px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 font-medium transition-all duration-200 ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
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
              className={`px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 font-medium transition-all duration-200 ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
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
              <div className={`px-6 py-4 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
            )}
            {loading ? (
              <div className="px-6 py-6 text-center text-sm opacity-80">Loading goals...</div>
            ) : (
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-gray-700 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Goal
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Owner
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Priority
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Due Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Assigned To
                    </th>
                    {isManager && (
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {goal.name || 'Untitled Goal'}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {goal.description ? (goal.description.length > 50 ? goal.description.substring(0, 50) + '...' : goal.description) : 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                            {goal.owner?.name ? goal.owner.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {goal.owner?.name || 'Unassigned'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          goal.status === 'Done' ? 'bg-green-100 text-green-800' :
                          goal.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {goal.status || 'Not started'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          goal.priority === 'High' ? 'bg-red-100 text-red-800' :
                          goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {goal.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {goal.dueDate ? formatDate(goal.dueDate) : 'No due date'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {goal.forPerson || '—'}
                        </span>
                      </td>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
            <div className="text-center py-12">
              <Flag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No goals found</h3>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Get started by creating your first goal.</p>
              <div className="mt-6">
                {isManager && (
                  <button
                    onClick={addNewGoal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Goal
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

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