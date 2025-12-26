import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, CheckSquare, Plus, X, MessageSquare, Send, Target, FileText, 
  BarChart3, Edit3, Trash2, MoreVertical, Zap, BookOpen, CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getApiUrl } from '../../utils/apiConfig';
import ConfirmationModal from '../common/ConfirmationModal';

const TasksPage = ({ projectId: propProjectId, embedded = false }) => {
  const { projectId: urlProjectId } = useParams();
  const projectId = propProjectId || urlProjectId;
  
  console.log(`TasksPage initialized with projectId: ${projectId}`);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectAssignedUsers, setProjectAssignedUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('Not Started');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState({});
  const [selectedTasks, setSelectedTasks] = useState(new Set());

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    onConfirm: null,
    showCancel: false
  });

  const showModal = (config) => {
    setModalConfig({
      isOpen: true,
      title: config.title || 'Notification',
      message: config.message || '',
      type: config.type || 'info',
      confirmText: config.confirmText || 'OK',
      onConfirm: config.onConfirm || null,
      showCancel: config.showCancel || false
    });
  };

  const prevProjectIdRef = useRef(projectId);

  useEffect(() => {
    console.log('TasksPage mounted with projectId:', projectId);

    const loadData = async () => {
      if (prevProjectIdRef.current !== projectId) {
        setTasks([]);
        prevProjectIdRef.current = projectId;
      }

      console.log(`Loading tasks for ${projectId ? `project: ${projectId}` : 'all tasks'}`);
      setLoading(true);
      try {
        await Promise.all([fetchTasks(), fetchUsers(), fetchProject()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu-container') && !event.target.closest('[data-actions-button]')) {
        setShowActionsMenu({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://notion-l9ti.onrender.com/api/users', {
        method: 'GET',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data.users) ? data.users : data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProject = async () => {
    if (!projectId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`https://notion-l9ti.onrender.com/api/projects/${projectId}`, {
        method: 'GET',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const project = await response.json();
        
        // Get all users (use state if available, otherwise fetch)
        let allUsers = users;
        if (allUsers.length === 0) {
          const userResponse = await fetch('https://notion-l9ti.onrender.com/api/users', {
            method: 'GET',
            headers: {
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            allUsers = Array.isArray(userData.users) ? userData.users : userData;
          }
        }

        // Filter users based on project assignments
        const assignedUserNames = project.assignedTo || [];
        const assignedUserIds = new Set();
        
        // Get project owner ID to exclude from assignee list
        const projectOwnerId = project.ownerUid || project.owner ? String(project.ownerUid || project.owner) : null;

        // Match assignedTo usernames/names with user list
        assignedUserNames.forEach((assignedName) => {
          if (!assignedName) return;
          const matchedUser = allUsers.find(user => {
            const userId = String(user._id || user.id);
            const userName = (user.username || '').toLowerCase();
            const userFullName = (user.name || '').toLowerCase();
            const userEmail = (user.email || '').toLowerCase();
            const assigned = String(assignedName).toLowerCase();
            
            return userName === assigned || 
                   userFullName === assigned || 
                   userEmail === assigned ||
                   userId === assigned;
          });
          if (matchedUser) {
            assignedUserIds.add(String(matchedUser._id || matchedUser.id));
          }
        });

        // Filter users to only those assigned to the project, excluding project owner
        const filteredUsers = allUsers.filter(user => {
          const userId = String(user._id || user.id);
          const isAssigned = assignedUserIds.has(userId);
          const isOwner = projectOwnerId && userId === projectOwnerId;
          return isAssigned && !isOwner; // Include assigned users but exclude owner
        });

        setProjectAssignedUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTasks = async () => {
    console.log('fetchTasks called with projectId:', projectId);

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setTasks([]);
      return [];
    }

    if (!projectId) {
      console.error('No projectId provided - tasks are project-specific');
      setTasks([]);
      return [];
    }

    try {
      const url = `https://notion-l9ti.onrender.com/api/projects/${projectId}/data`;
      console.log('Making request to project-specific endpoint:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const tasksData = Array.isArray(data.tasks) ? data.tasks : [];

      // Process tasks and generate keys if missing
      const processedTasks = tasksData.map((task, index) => {
        const taskKey = task.key || `TH-${100 + index}`;
        return {
          ...task,
          id: task._id || task.id,
          _id: undefined,
          key: taskKey,
          type: task.type || 'Task',
          category: task.category || 'Development',
          status: task.status || (task.completed ? 'Completed' : 'Not Started'),
          priority: task.priority || 'Medium',
          assignee: task.assignee || task.createdBy,
          reporter: task.reporter || task.createdBy,
          comments: Array.isArray(task.comments) ? task.comments : []
        };
      });

      setTasks(processedTasks);
      return processedTasks;
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      setTasks([]);
      return [];
    }
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => (u._id || u.id) === (userId._id || userId.id || userId));
    return user ? (user.name || user.username) : 'Unknown';
  };

  const getUserInitials = (userId) => {
    if (!userId) return 'U';
    const user = users.find(u => (u._id || u.id) === (userId._id || userId.id || userId));
    if (!user) return 'U';
    const name = user.name || user.username || '';
    return name.charAt(0).toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Overdue':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    const p = priority || 'Medium';
    switch (p) {
      case 'Critical':
      case 'critical':
      case 'Highest':
      case 'high':
      case 'High':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'Medium':
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Low':
      case 'low':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Sprint':
        return <Zap className="w-4 h-4 text-indigo-600" />;
      case 'Story':
        return <BookOpen className="w-4 h-4 text-green-600" />;
      default:
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleAllTasks = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;
    if (!newTaskAssignee) {
      showModal({
        title: 'Validation Error',
        message: 'Please select an assignee for the task',
        type: 'warning'
      });
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const taskCount = tasks.length;
      const newKey = `TH-${100 + taskCount}`;

      // Normalize priority to lowercase for backend
      const priorityMap = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Critical': 'high'
      };
      const normalizedPriority = priorityMap[newTaskPriority] || newTaskPriority.toLowerCase() || 'medium';

      const taskData = {
        text: newTaskText.trim(),
        priority: normalizedPriority,
        completed: false,
        type: 'Task',
        key: newKey,
        category: 'Development',
        status: newTaskStatus,
        assignee: newTaskAssignee,
        reporter: currentUser.id,
        dueDate: newTaskDueDate || null
      };

      console.log('Creating task with data:', taskData);

      const response = await fetch(`https://notion-l9ti.onrender.com/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create task' }));
        throw new Error(errorData.message || `Failed to create task: ${response.status}`);
      }

      await fetchTasks();
      setNewTaskText('');
      setNewTaskStatus('Not Started');
      setNewTaskPriority('Medium');
      setNewTaskDueDate('');
      setNewTaskAssignee('');
      setShowAddTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
      showModal({
        title: 'Error',
        message: `Failed to add task: ${error.message}`,
        type: 'danger'
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) throw new Error('Failed to delete task');

      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      showModal({
        title: 'Error',
        message: `Failed to delete task: ${error.message}`,
        type: 'danger'
      });
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const newCompleted = !task.completed;
      const newStatus = newCompleted ? 'Completed' : 'In Progress';

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          completed: newCompleted,
          status: newStatus,
          text: task.text,
          priority: task.priority
        })
      });

      if (!response.ok) throw new Error('Failed to update task');

      await fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const updateTaskField = async (taskId, field, value) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const task = tasks.find(t => t.id === taskId);
      
      // Check if current user is the assignee and trying to modify restricted fields
      if (task && task.assignee && String(task.assignee._id || task.assignee) === String(currentUser.id)) {
        const restrictedFields = ['completed', 'status', 'priority', 'dueDate'];
        if (restrictedFields.includes(field)) {
      showModal({
        title: 'Permission Denied',
        message: 'You cannot modify the completion status, priority, or due date of tasks assigned to you. Please contact the project owner or manager.',
        type: 'warning'
      });
      return;
    }
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          [field]: value
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update task' }));
        throw new Error(errorData.message || 'Failed to update task');
      }

      await fetchTasks();
    } catch (error) {
      console.error(`Error updating task ${field}:`, error);
      alert(`Failed to update ${field}: ${error.message}`);
    }
  };

  return (
    <div className={`${embedded ? '' : `${isDarkMode ? 'bg-gray-50' : 'bg-white'} min-h-screen font-sans`}`}>
      <div className={embedded ? 'p-4' : 'max-w-[1600px] mx-auto px-6 py-8'}>
        {/* Header Section */}
        {!embedded && (
          <div className="mb-6">
            {/* Title */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAddTask(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                >
                  Create Task
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Add Task Form */}
        {showAddTask && (
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-lg backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addTask();
                    }
                    if (e.key === 'Escape') {
                      setShowAddTask(false);
                      setNewTaskText('');
                      setNewTaskStatus('Not Started');
                      setNewTaskPriority('Medium');
                      setNewTaskDueDate('');
                      setNewTaskAssignee('');
                    }
                  }}
                  placeholder="Enter task description..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  onClick={addTask}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  {saving ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTaskText('');
                    setNewTaskStatus('Not Started');
                    setNewTaskPriority('Medium');
                    setNewTaskDueDate('');
                    setNewTaskAssignee('');
                  }}
                  className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select assignee...</option>
                    {projectAssignedUsers.map((user) => (
                      <option key={user._id || user.id} value={user._id || user.id}>
                        {user.name || user.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <span>Loading tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-2">No tasks yet</p>
                <p className="text-sm">Click "Create Task" to add your first task</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full table-fixed">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ width: '30%' }}>Description</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Created</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Status</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Assignee</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-28">Priority</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Due Date</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">Reporter</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-50 transition-all duration-200 border-b border-gray-100 ${
                          selectedTasks.has(task.id) ? 'bg-gradient-to-r from-indigo-50 to-indigo-50' : 'bg-white'
                        }`}
                      >
                        <td className="px-4 py-4">
                          {editingTask === task.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingTaskText}
                                onChange={(e) => setEditingTaskText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editingTaskText.trim()) {
                                      updateTaskField(task.id, 'text', editingTaskText);
                                    }
                                    setEditingTask(null);
                                    setEditingTaskText('');
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingTask(null);
                                    setEditingTaskText('');
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (editingTaskText.trim()) {
                                    updateTaskField(task.id, 'text', editingTaskText);
                                  }
                                  setEditingTask(null);
                                  setEditingTaskText('');
                                }}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTask(null);
                                  setEditingTaskText('');
                                }}
                                className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-900 break-words font-medium">{task.text}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600 truncate">{formatDate(task.createdAt)}</span>
                        </td>
                        <td className="px-4 py-4">
                          {(() => {
                            const isAssignee = currentUser && task.assignee && String(task.assignee._id || task.assignee) === String(currentUser.id);
                            return (
                              <select
                                value={task.status || 'Not Started'}
                                onChange={(e) => updateTaskField(task.id, 'status', e.target.value)}
                                disabled={isAssignee}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 ${isAssignee ? 'cursor-not-allowed opacity-60' : 'cursor-pointer shadow-sm hover:shadow'} transition-all ${getStatusColor(task.status)}`}
                                onClick={(e) => e.stopPropagation()}
                                title={isAssignee ? 'You cannot change the status of tasks assigned to you' : ''}
                              >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Overdue">Overdue</option>
                                <option value="On Hold">On Hold</option>
                              </select>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {task.assignee ? (
                              <>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white text-xs font-semibold shadow-md ring-2 ring-white flex-shrink-0">
                                  {getUserInitials(task.assignee)}
                                </div>
                                <span className="text-sm font-medium text-gray-900 truncate">{getUserName(task.assignee)}</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {(() => {
                            const isAssignee = currentUser && task.assignee && String(task.assignee._id || task.assignee) === String(currentUser.id);
                            return (
                              <select
                                value={task.priority || 'Medium'}
                                onChange={(e) => updateTaskField(task.id, 'priority', e.target.value)}
                                disabled={isAssignee}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-0 ${isAssignee ? 'cursor-not-allowed opacity-60' : 'cursor-pointer shadow-sm hover:shadow'} transition-all ${getPriorityColor(task.priority)}`}
                                onClick={(e) => e.stopPropagation()}
                                title={isAssignee ? 'You cannot change the priority of tasks assigned to you' : ''}
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                              </select>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4">
                          {(() => {
                            const isAssignee = currentUser && task.assignee && String(task.assignee._id || task.assignee) === String(currentUser.id);
                            return (
                              <input
                                type="date"
                                value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const dateValue = e.target.value ? new Date(e.target.value) : null;
                                  updateTaskField(task.id, 'dueDate', dateValue);
                                }}
                                disabled={isAssignee}
                                className={`text-sm text-gray-700 border border-gray-300 rounded-lg px-2 py-1 ${isAssignee ? 'cursor-not-allowed opacity-60 bg-gray-100' : 'cursor-pointer bg-white'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full`}
                                onClick={(e) => e.stopPropagation()}
                                title={isAssignee ? 'You cannot change the due date of tasks assigned to you' : ''}
                              />
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600 font-medium truncate">{getUserName(task.reporter)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionsMenu(prev => ({
                                  ...prev,
                                  [task.id]: !prev[task.id]
                                }));
                              }}
                              data-actions-button
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {showActionsMenu[task.id] && (
                              <div className="actions-menu-container absolute right-0 bottom-full mb-2 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 min-w-[140px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTaskText(task.text);
                                    setEditingTask(task.id);
                                    setShowActionsMenu({});
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-700 flex items-center gap-2"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                    setShowActionsMenu({});
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {/* Footer Create Task Button */}
        {!embedded && (
          <div className="mt-8">
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 px-6 py-3 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        showCancel={modalConfig.showCancel}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default TasksPage;