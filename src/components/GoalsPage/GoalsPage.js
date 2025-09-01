import React, { useState, useEffect } from 'react';
import { Flag, User, Search, Plus, Calendar, Users, Trash as TrashIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { addNotification } from '../../utils/notifications';
import api from '../../services/api';

const GoalsPage = () => {
  const { user } = useAppContext();
  const isManager = user?.role === 'manager';
  const { isDarkMode } = useTheme();
  const [goals, setGoals] = useState([]);
  // Removed view mode toggle (All / By Status / My)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editForm, setEditForm] = useState({});
  // Fullscreen view state
  const [viewGoal, setViewGoal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    forPerson: '',
    status: 'Not started',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Normalize server goal to UI shape
  const normalizeGoal = (g) => ({
    ...g,
    id: g._id || g.id,
    forPerson: g.forPerson ?? g.team ?? '',
  });

  // Fetch goals from API when filters/search/sort change
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (filterPriority !== 'all') params.append('priority', filterPriority);
        if (searchQuery) params.append('search', searchQuery);
        // Only pass sortBy that backend understands
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

  // No localStorage persistence; backend is source of truth

  // Only show Delete action (soft delete via API)

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

  const getStatusColor = (status) => {
    if (isDarkMode) {
      switch (status) {
        case 'Done': return 'bg-white text-black border border-gray-600';
        case 'In progress': return 'bg-gray-700 text-white border border-gray-600';
        case 'Not started': return 'bg-gray-800 text-gray-300 border border-gray-700';
        default: return 'bg-gray-600 text-white border border-gray-500';
      }
    } else {
      switch (status) {
        case 'Done': return 'bg-black text-white border border-gray-300';
        case 'In progress': return 'bg-gray-600 text-white border border-gray-400';
        case 'Not started': return 'bg-gray-300 text-black border border-gray-400';
        default: return 'bg-gray-400 text-white border border-gray-300';
      }
    }
  };

  // Open/close fullscreen view
  const handleOpenGoal = (goal) => {
    setViewGoal({ ...goal });
  };
  const handleCloseGoal = () => setViewGoal(null);
  const handleUpdateGoalField = (field, value) => {
    // Only managers can edit non-status fields
    if (!isManager && field !== 'status') return;
    if (!viewGoal) return;
    const updated = { ...viewGoal, [field]: value };
    setViewGoal(updated);
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));

    // Persist change (optimistic update). Map UI field -> API field.
    const apiField = field === 'forPerson' ? 'team' : field;
    // Don't attempt to update owner text via API here
    if (apiField === 'owner') return;
    const payload = { [apiField]: value };
    (async () => {
      try {
        await api.put(`/goals/${updated.id}`, payload);
      } catch (e) {
        // Revert on error
        setGoals(prev => prev.map(g => g.id === updated.id ? viewGoal : g));
        setViewGoal(viewGoal);
      }
    })();
  };

  const getPriorityColor = (priority) => {
    if (isDarkMode) {
      switch (priority) {
        case 'High': return 'bg-white text-black border border-gray-600';
        case 'Medium': return 'bg-gray-700 text-white border border-gray-600';
        case 'Low': return 'bg-gray-800 text-gray-300 border border-gray-700';
        default: return 'bg-gray-600 text-white border border-gray-500';
      }
    } else {
      switch (priority) {
        case 'High': return 'bg-black text-white border border-gray-300';
        case 'Medium': return 'bg-gray-600 text-white border border-gray-400';
        case 'Low': return 'bg-gray-300 text-black border border-gray-400';
        default: return 'bg-gray-400 text-white border border-gray-300';
      }
    }
  };

  const getForColor = (forPerson) => {
    if (isDarkMode) {
      return 'bg-gray-700 text-white border border-gray-600';
    } else {
      return 'bg-gray-200 text-black border border-gray-300';
    }
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
    setNewGoalForm({
      name: '',
      description: '',
      priority: 'Medium',
      dueDate: new Date().toISOString().split('T')[0],
      forPerson: '',
      status: 'Not started'
    });
    setShowCreateModal(true);
  };

  const handleConfirmCreateGoal = async () => {
    if (!newGoalForm.name.trim()) return;
    
    try {
      const body = {
        name: newGoalForm.name,
        description: newGoalForm.description,
        status: newGoalForm.status,
        priority: newGoalForm.priority,
        dueDate: newGoalForm.dueDate,
        team: newGoalForm.forPerson,
      };
      const created = await api.post('/goals', body);
      const normalized = normalizeGoal(created);
      setGoals(prev => [...prev, normalized]);
      
      setShowCreateModal(false);
      setNewGoalForm({
        name: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        forPerson: '',
        status: 'Not started',
        notes: ''
      });
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

  const startEditing = (goal) => {
    setEditingGoal(goal.id);
    setEditForm({
      name: goal.name || '',
      description: goal.description || '',
      owner: goal.owner?.name || '',
      status: goal.status || 'Not started',
      dueDate: goal.dueDate || '',
      priority: goal.priority || 'Medium',
      notes: goal.notes || '',
      forPerson: goal.forPerson || ''
    });
  };

  const saveEdit = async () => {
    const prev = goals.find(g => g.id === editingGoal);
    const payload = {
      name: editForm.name,
      description: editForm.description,
      status: editForm.status,
      priority: editForm.priority,
      dueDate: editForm.dueDate,
      team: editForm.forPerson,
    };
    try {
      const updated = await api.put(`/goals/${editingGoal}`, payload);
      const normalized = normalizeGoal(updated);
      const updatedGoals = goals.map(g => (g.id === editingGoal ? normalized : g));
      setGoals(updatedGoals);
      // Notification when a goal is marked as Done
      try {
        if (prev && prev.status !== 'Done' && editForm.status === 'Done') {
          addNotification(user?.id, {
            title: 'Goal Completed',
            message: `${editForm.name || 'A goal'} was marked as Done`,
            type: 'goal',
          });
        }
      } catch {}
    } catch (e) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setEditingGoal(null);
      setEditForm({});
    }
  };

  const cancelEdit = () => {
    setEditingGoal(null);
    setEditForm({});
  };

  // Delete action removed with Actions column

  const cardCls = isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`content p-4 lg:p-6 transition-colors duration-300 ${
      isDarkMode
        ? 'bg-black text-white'
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <Flag className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Goals & Objectives</h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track progress and achieve your team's strategic objectives</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isManager && (
              <button
                onClick={addNewGoal}
                className={`flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                  isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                <Plus size={18} className="mr-2" /> New Goal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Professional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{goals.filter(g => g.status === 'Done').length}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
              <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{goals.filter(g => g.status === 'In progress').length}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <Clock className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{goals.filter(g => g.status === 'Not started').length}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Not Started</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <AlertCircle className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search goals by name, owner, or for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 w-80 text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="all">All Status</option>
              <option value="Not started">Not started</option>
              <option value="In progress">In progress</option>
              <option value="Done">Done</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>


        </div>
      </div>

        {/* Goals Table */}
      <div className={`rounded-xl shadow-lg border overflow-hidden ${cardCls}`}>
          <div className="overflow-x-auto">
            {error && (
              <div className={`px-6 py-4 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>
            )}
            {loading ? (
              <div className="px-6 py-6 text-center text-sm opacity-80">Loading goals...</div>
            ) : (
            <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-gray-900 border-b border-gray-700 text-gray-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="flex items-center">
                    <span className="text-lg">🎯</span>
                    <span className="ml-2">Goal & Description</span>
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Owner
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="flex items-center">
                    <span className="text-lg">✨</span>
                    <span className="ml-2">Status</span>
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due Date
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="flex items-center">
                    <span className="text-lg">🔥</span>
                    <span className="ml-2">Priority</span>
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    For
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-transparent divide-gray-800' : 'bg-white divide-gray-100'} divide-y`}>
              {sortedGoals.map((goal) => (
                <tr
                  key={goal.id}
                  className={`${isDarkMode ? 'hover:bg-gray-900/40' : 'hover:bg-gray-50'} transition-all duration-200 group cursor-pointer`}
                  onClickCapture={(e) => {
                    const el = e.target;
                    if (
                      el.closest && (
                        el.closest('button') ||
                        el.closest('a') ||
                        el.closest('input') ||
                        el.closest('select') ||
                        el.closest('textarea')
                      )
                    ) return;
                    handleOpenGoal(goal);
                  }}
                >
                  <td className="px-6 py-5 whitespace-nowrap group-hover:scale-105 transition-transform duration-200">
                    <div className="group-hover:text-lg group-hover:font-medium transition-all duration-200">
                      <div className={`text-sm font-semibold mb-2 group-hover:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{goal.name || 'Untitled Goal'}</div>
                      <div className={`text-sm max-w-xs group-hover:text-base group-hover:font-normal leading-relaxed ${isDarkMode ? 'text-gray-300 group-hover:text-gray-200' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {(() => {
                          const d = (goal.description || '').trim();
                          if (!d) return 'No description';
                          const words = d.split(/\s+/);
                          return words[0] + (words.length > 1 ? '...' : '');
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                        {goal.owner?.name ? goal.owner.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{goal.owner?.name || 'Unassigned'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(goal.status || 'Not started')}`}>
                      {goal.status || 'Not started'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {goal.dueDate ? formatDate(goal.dueDate) : 'No due date'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(goal.priority || 'Medium')}`}>
                      {goal.priority || 'Medium'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getForColor(goal.forPerson || 'General')}`}>
                      {goal.forPerson && goal.forPerson.length > 15 ? goal.forPerson.substring(0, 15) + '...' : (goal.forPerson || 'General')}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-1">
                      {isManager && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
            )}
          </div>

          {sortedGoals.length === 0 && (
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

      {/* Add New Goal Link */}
      {sortedGoals.length > 0 && (
        <div className="mt-4 text-center">
          {isManager && (
            <button
              onClick={addNewGoal}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              New goal
            </button>
          )}
        </div>
      )}

      {/* Professional Goal View Modal */}
      {viewGoal && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/80' : 'bg-white/80'}`} onClick={handleCloseGoal} />
          <div className="relative h-full w-full flex items-center justify-center p-6">
            <div className={`flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border-2 ${
              isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
            }`}>
              <div className={`flex items-center justify-between px-8 py-6 border-b-2 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}>
                    <Flag className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{viewGoal.name || 'Goal'}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(viewGoal.status || 'Not started')}`}>{viewGoal.status || 'Not started'}</span>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(viewGoal.priority || 'Medium')}`}>{viewGoal.priority || 'Medium'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseGoal}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Goal Details</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Goal Name</label>
                      <input
                        type="text"
                        value={viewGoal.name || ''}
                        onChange={(e) => handleUpdateGoalField('name', e.target.value)}
                        disabled={!isManager}
                        className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black focus:border-black'
                        } ${!isManager ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="Goal name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Flag size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Priority Level
                      </label>
                      <select
                        value={viewGoal.priority || 'Medium'}
                        onChange={(e) => handleUpdateGoalField('priority', e.target.value)}
                        disabled={!isManager}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black focus:border-black'
                        } ${!isManager ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <option value="High">🔴 High Priority</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🟢 Low Priority</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Calendar size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={viewGoal.dueDate ? String(viewGoal.dueDate).slice(0,10) : ''}
                        onChange={(e) => handleUpdateGoalField('dueDate', e.target.value)}
                        disabled={!isManager}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black focus:border-black'
                        } ${!isManager ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Users size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Assign To
                      </label>
                      <input
                        type="text"
                        value={viewGoal.forPerson || ''}
                        onChange={(e) => handleUpdateGoalField('forPerson', e.target.value)}
                        disabled={!isManager}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        } ${!isManager ? 'opacity-60 cursor-not-allowed' : ''}`}
                        placeholder="Enter team or person"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Status & Owner</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <CheckCircle size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                          Status
                        </label>
                        <select
                          value={viewGoal.status || 'Not started'}
                          onChange={(e) => handleUpdateGoalField('status', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                            isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white focus:border-white' 
                              : 'bg-gray-50 border-gray-300 text-black focus:border-black'
                          }`}
                        >
                          <option value="Not started">⏸️ Not Started</option>
                          <option value="In progress">▶️ In Progress</option>
                          <option value="Done">✅ Completed</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <User size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                          Owner
                        </label>
                        <input
                          type="text"
                          value={viewGoal.owner?.name || ''}
                          disabled
                          className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 opacity-60 cursor-not-allowed ${
                            isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                          placeholder="Owner name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Goal Description</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                        <textarea
                          value={viewGoal.description || ''}
                          onChange={(e) => handleUpdateGoalField('description', e.target.value)}
                          disabled={!isManager}
                          rows={5}
                          placeholder="Describe what you want to achieve, success criteria, and key milestones..."
                          className={`w-full px-6 py-4 rounded-2xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 resize-none ${
                            isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                              : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                          } ${!isManager ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Additional Notes</label>
                        <textarea
                          value={viewGoal.notes || ''}
                          onChange={(e) => handleUpdateGoalField('notes', e.target.value)}
                          disabled={!isManager}
                          rows={6}
                          placeholder="Add any additional context, resources needed, or important considerations..."
                          className={`w-full px-6 py-4 rounded-2xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 resize-none ${
                            isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                              : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                          } ${!isManager ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/80' : 'bg-white/80'}`} onClick={() => setShowCreateModal(false)} />
          <div className="relative h-full w-full flex items-center justify-center p-6">
            <div className={`flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border-2 ${
              isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
            }`}>
              <div className={`flex items-center justify-between px-8 py-6 border-b-2 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}>
                    <Flag className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Create New Goal</h2>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Set and achieve your objectives</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Goal Details</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Goal Name *</label>
                      <input
                        type="text"
                        value={newGoalForm.name}
                        onChange={(e) => setNewGoalForm({...newGoalForm, name: e.target.value})}
                        placeholder="Enter a clear and specific goal"
                        className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Flag size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Priority Level
                      </label>
                      <select
                        value={newGoalForm.priority}
                        onChange={(e) => setNewGoalForm({...newGoalForm, priority: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black focus:border-black'
                        }`}
                      >
                        <option value="High">🔴 High Priority</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🟢 Low Priority</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Calendar size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newGoalForm.dueDate}
                        onChange={(e) => setNewGoalForm({...newGoalForm, dueDate: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black focus:border-black'
                        }`}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Users size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Assign To
                      </label>
                      <input
                        type="text"
                        value={newGoalForm.forPerson}
                        onChange={(e) => setNewGoalForm({...newGoalForm, forPerson: e.target.value})}
                        placeholder="Enter team or person"
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Goal Description</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                        <textarea
                          value={newGoalForm.description}
                          onChange={(e) => setNewGoalForm({...newGoalForm, description: e.target.value})}
                          rows={5}
                          placeholder="Describe what you want to achieve, success criteria, and key milestones..."
                          className={`w-full px-6 py-4 rounded-2xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 resize-none ${
                            isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                              : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                          }`}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Additional Notes</label>
                        <textarea
                          value={newGoalForm.notes}
                          onChange={(e) => setNewGoalForm({...newGoalForm, notes: e.target.value})}
                          rows={6}
                          placeholder="Add any additional context, resources needed, or important considerations..."
                          className={`w-full px-6 py-4 rounded-2xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 resize-none ${
                            isDarkMode 
                              ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                              : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center justify-between px-8 py-6 border-t-2 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${newGoalForm.name.trim() ? (isDarkMode ? 'bg-white' : 'bg-black') : 'bg-gray-400'}`} />
                  <span className={`text-sm font-medium ${
                    newGoalForm.name.trim() 
                      ? (isDarkMode ? 'text-white' : 'text-black') 
                      : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    {newGoalForm.name.trim() ? 'Ready to create' : 'Goal name required'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`px-6 py-3 text-base font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCreateGoal}
                    disabled={!newGoalForm.name.trim()}
                    className={`px-8 py-3 text-base font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      isDarkMode 
                        ? 'bg-white text-black hover:bg-gray-100 shadow-white/20' 
                        : 'bg-black text-white hover:bg-gray-900 shadow-black/20'
                    }`}
                  >
                    Create Goal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
