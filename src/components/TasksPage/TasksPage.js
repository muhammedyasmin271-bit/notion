import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Plus, X, MessageSquare, Send, Target, FileText, BarChart3, Edit3, Trash2, MoreVertical } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TasksPage = ({ projectId: propProjectId, projectName: propProjectName = 'Project', embedded = false }) => {
  const { projectId: urlProjectId } = useParams();
  const projectId = propProjectId || urlProjectId;
  const projectName = propProjectName || 'Project';
  
  console.log(`TasksPage initialized with projectId: ${projectId}, projectName: ${projectName}`);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState({});


  const quickNavRef = useRef(null);

  const prevProjectIdRef = useRef(projectId);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('TasksPage mounted with projectId:', projectId, 'projectName:', projectName);

    const loadTasks = async () => {
      // Clear tasks only when projectId actually changes
      if (prevProjectIdRef.current !== projectId) {
        setTasks([]);
        prevProjectIdRef.current = projectId;
      }

      console.log(`Loading tasks for ${projectId ? `project: ${projectId} (${projectName})` : 'all tasks'}`);
      setLoading(true);
      try {
        await fetchTasks();
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [projectId, projectName]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside any actions menu container
      if (!event.target.closest('.actions-menu-container') && !event.target.closest('[data-actions-button]')) {
        setShowActionsMenu({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);



  const fetchTasks = async () => {
    console.log('fetchTasks called with projectId:', projectId);

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      setTasks([]);
      return [];
    }

    console.log('Fetching tasks for project:', projectId);

    if (!projectId) {
      console.error('No projectId provided - tasks are project-specific');
      setTasks([]);
      return [];
    }

    try {
      const url = `http://localhost:9000/api/projects/${projectId}/data`;
      console.log('Making request to project-specific endpoint:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched raw data:', JSON.stringify(data, null, 2));

      const tasksData = Array.isArray(data.tasks) ? data.tasks : [];
      console.log('Tasks data array:', tasksData);
      console.log('Number of tasks found:', tasksData.length);

      // Ensure all tasks have proper IDs and comments array
      const processedTasks = tasksData.map(task => {
        console.log('Processing task:', task);
        return {
          ...task,
          id: task._id || task.id, // Handle both _id and id
          _id: undefined, // Remove _id to avoid confusion
          comments: Array.isArray(task.comments) ? task.comments : [] // Ensure comments is always an array
        };
      });

      console.log('Final processed tasks:', processedTasks);
      setTasks(processedTasks);
      return processedTasks;
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      setTasks([]);
      return [];
    }
  };

  const saveTask = async (taskData) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      console.log('Starting saveTask with:', { taskData, projectId, hasToken: !!token });

      if (!token) {
        const errorMsg = 'No authentication token found. Please log in again.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      if (!taskData || !taskData.text || !taskData.text.trim()) {
        const errorMsg = 'Task text is required';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      if (!projectId) {
        const errorMsg = 'Cannot save task: Project not properly loaded';
        console.error(errorMsg, { projectId, projectName });
        throw new Error(errorMsg);
      }

      // Prepare task data for the API
      const taskToSave = {
        text: taskData.text.trim(),
        priority: taskData.priority || 'medium',
        completed: taskData.completed || false,
        dueDate: taskData.dueDate || null,
        createdBy: taskData.createdBy || localStorage.getItem('userId')
      };

      console.log('Sending task to server:', taskToSave);

      // Determine if we're creating a new task or updating an existing one
      const isUpdate = taskData.id;
      const url = isUpdate
        ? `http://localhost:9000/api/projects/${projectId}/tasks/${taskData.id}`
        : `http://localhost:9000/api/projects/${projectId}/tasks`;

      console.log(`Making ${isUpdate ? 'PUT' : 'POST'} request to:`, url);

      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        credentials: 'include',
        body: JSON.stringify(taskToSave)
      });

      console.log('Server response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json().catch(() => ({}));
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorData = { message: 'Failed to parse error response' };
        }

        const errorMsg = `Failed to ${isUpdate ? 'update' : 'save'} task: ${response.status} - ${errorData.message || 'Unknown error'}`;
        console.error(errorMsg, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        });

        throw new Error(errorMsg);
      }

      const newTask = await response.json();
      console.log('Task saved successfully:', newTask);

      // Refresh the task list
      await fetchTasks();
      return newTask;
    } catch (error) {
      console.error('Error saving task:', error);

      // Handle network errors with a clearer message
      if (error.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else {
        setError(error.message || 'Failed to save task');
      }

      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      if (!taskId || !updates) {
        console.error('Invalid task ID or updates');
        return null;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      const response = await fetch(`http://localhost:9000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        return updatedTask;
      } else {
        console.error('Failed to update task:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  };

  const deleteTask = async (taskId) => {
    if (!taskId) {
      console.error('Missing taskId for deletion');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }

      console.log(`Deleting task ${taskId}`);

      if (!projectId) {
        throw new Error('Project ID is required for task operations');
      }

      const url = `http://localhost:9000/api/projects/${projectId}/tasks/${taskId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorData = { message: 'Failed to delete task' };
        }
        throw new Error(errorData.message || 'Failed to delete task');
      }

      // Update local state to remove the deleted task
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      console.log(`Task ${taskId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error; // Re-throw to allow error handling in the calling function
    }
  };

  const toggleTask = async (id) => {
    try {
      if (!id) {
        console.error('Invalid task ID');
        return;
      }

      const task = tasks.find(t => t.id === id);
      if (!task) {
        console.error('Task not found:', id);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }

      console.log(`Toggling task ${id} completion status to ${!task.completed}`);

      if (!projectId) {
        throw new Error('Project ID is required for task operations');
      }

      const url = `http://localhost:9000/api/projects/${projectId}/tasks/${id}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          completed: !task.completed,
          // Preserve other task properties
          text: task.text,
          priority: task.priority
        })
      });

      console.log('Toggle task response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorData = { message: 'Failed to update task status' };
        }
        throw new Error(errorData.message || 'Failed to update task status');
      }

      // Update local state
      const updatedTask = await response.json();
      setTasks(tasks.map(t =>
        t.id === id
          ? {
            ...t,
            completed: updatedTask.completed,
            updatedAt: updatedTask.updatedAt
          }
          : t
      ));

      return updatedTask;
    } catch (error) {
      console.error('Error toggling task status:', error);
      throw error;
    }
  };

  const [error, setError] = useState('');

  const addTask = async () => {
    setError('');

    if (!newTaskText.trim()) {
      const errorMsg = 'Task text cannot be empty';
      setError(errorMsg);
      console.error(errorMsg);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const taskData = {
        text: newTaskText.trim(),
        priority: 'medium',
        completed: false
      };

      console.log('Adding new task with data:', taskData);
      console.log('Project ID:', projectId);
      console.log('Token available:', !!token);

      if (!projectId) {
        throw new Error('Project ID is required to add tasks');
      }

      const url = `http://localhost:9000/api/projects/${projectId}/tasks`;

      console.log('Making request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(taskData)
      });

      console.log('Add task response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          console.log('Error response text:', responseText);
          errorData = responseText ? JSON.parse(responseText) : { message: 'Unknown error' };
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const savedTask = await response.json();
      console.log('Task added successfully:', savedTask);

      // Update local state with the new task
      setTasks(prevTasks => [
        ...prevTasks,
        {
          ...savedTask,
          id: savedTask._id || savedTask.id,
          _id: undefined,
          comments: Array.isArray(savedTask.comments) ? savedTask.comments : []
        }
      ]);

      // Reset form
      setNewTaskText('');
      setShowAddTask(false);

      return savedTask;
    } catch (error) {
      let errorMsg = 'Failed to add task. ';

      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Check if it's a network error (server not reachable)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorMsg += 'Please make sure the backend server is running on port 5000.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }

      setError(errorMsg);
      console.error('Error in addTask:', error);
    }
  };

  const toggleComments = (taskId) => {
    setShowComments(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const addComment = async (taskId) => {
    try {
      if (!taskId || !projectId) {
        console.error('Missing task ID or project ID for comment');
        alert('Missing required information');
        return;
      }

      const commentText = newComment[taskId]?.trim();
      if (!commentText) {
        console.error('Comment text is empty');
        alert('Comment text cannot be empty');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        alert('Authentication required. Please log in again.');
        return;
      }

      console.log(`Adding comment to task ${taskId} in project ${projectId}`);

      const response = await fetch(`http://localhost:9000/api/projects/${projectId}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          text: commentText
        })
      });

      console.log('Add comment response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorData = { message: 'Failed to add comment' };
        }
        throw new Error(errorData.message || 'Failed to add comment');
      }

      const updatedTask = await response.json();
      console.log('Comment added successfully');

      // Update local state with the updated task
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? {
              ...t,
              comments: updatedTask.comments || []
            }
            : t
        )
      );

      // Clear the comment input
      setNewComment(prev => ({ ...prev, [taskId]: '' }));

      return updatedTask;
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.message === 'Failed to fetch') {
        alert('Cannot connect to server. Please check if the backend is running.');
      } else {
        alert(`Failed to add comment: ${error.message}`);
      }
      return null;
    }
  };

  const startEditTask = (task) => {
    console.log('startEditTask called for task:', task);
    setEditingTask(task.id);
    setEditTaskText(task.text);
  };

  const cancelEditTask = () => {
    setEditingTask(null);
    setEditTaskText('');
  };

  const saveEditTask = async (taskId) => {
    try {
      if (!editTaskText.trim()) {
        alert('Task text cannot be empty');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      if (!projectId) {
        throw new Error('Project ID is required for task operations');
      }

      const url = `http://localhost:9000/api/projects/${projectId}/tasks/${taskId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          text: editTaskText.trim()
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Failed to update task' };
        }
        throw new Error(errorData.message || 'Failed to update task');
      }

      const updatedTask = await response.json();
      
      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? { ...t, text: updatedTask.text, updatedAt: updatedTask.updatedAt }
            : t
        )
      );

      // Clear editing state
      setEditingTask(null);
      setEditTaskText('');
      
      console.log('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Failed to update task: ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTask(taskId);
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(`Failed to delete task: ${error.message}`);
    }
  };

  const toggleActionsMenu = (taskId) => {
    console.log('toggleActionsMenu called for taskId:', taskId);
    console.log('Current showActionsMenu state:', showActionsMenu);
    setShowActionsMenu(prev => {
      const newState = {
        ...prev,
        [taskId]: !prev[taskId]
      };
      console.log('New showActionsMenu state:', newState);
      return newState;
    });
  };





  const completedCount = tasks.filter(task => task.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <>
    <div className={`${embedded ? '' : `${isDarkMode ? 'bg-black text-gray-100' : 'bg-white text-black'} min-h-screen font-sans`}`}>
      <div className={embedded ? 'p-4' : 'max-w-6xl mx-auto px-4 py-8'}>
        {!embedded && (
          <div className={`flex items-center justify-between mb-4 sm:mb-8 p-3 sm:p-6 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700/50' : 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100/50'} backdrop-blur-sm shadow-lg`}>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700/50 hover:scale-105' : 'hover:bg-white/70 hover:scale-105'} shadow-sm`}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-500/10'} shadow-sm`}>
                  <CheckSquare className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Tasks</h1>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your project tasks</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {!embedded && (
          <div className={`hidden sm:block ${isDarkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50' : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50'} backdrop-blur-sm p-4 sm:p-8 rounded-2xl sm:rounded-3xl border shadow-xl mb-4 sm:mb-8`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'bg-green-600/20' : 'bg-green-500/10'}`}>
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold">Progress Overview</h2>
              </div>
              <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-500/10 text-blue-600'} font-semibold text-sm sm:text-base`}>
                {completedCount}/{tasks.length} completed
              </div>
            </div>
            <div className={`w-full h-3 sm:h-4 rounded-full ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'} overflow-hidden shadow-inner`}>
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 sm:mt-4 gap-2 sm:gap-0">
              <p className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{Math.round(progressPercentage)}% complete</p>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500"></div>
                <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Task completion</span>
              </div>
            </div>
          </div>
        )}

        <div className={`${embedded ? '' : `${isDarkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50' : 'bg-gradient-to-br from-white/90 to-gray-50/90 border-gray-200/50'} backdrop-blur-sm rounded-2xl sm:rounded-3xl border shadow-xl`} p-4 sm:p-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-500/10'}`}>
                <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold">{projectId ? 'Project Tasks' : 'All Tasks'}</h2>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className={`flex items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base`}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add New Task</span>
              <span className="sm:hidden">Add Task</span>
            </button>
          </div>

          {error && (
            <div className={`p-3 rounded-lg border mb-4 ${isDarkMode ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
            </div>
          )}

          {showAddTask && (
            <div className={`p-3 sm:p-4 rounded-lg border mb-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask();
                    if (e.key === 'Escape') { setShowAddTask(false); setNewTaskText(''); }
                  }}
                  placeholder="Enter task description..."
                  className={`flex-1 px-3 py-2.5 sm:py-2 text-sm sm:text-base rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={addTask}
                    disabled={saving}
                    className={`px-4 py-2.5 sm:py-2 rounded transition-colors text-sm sm:text-base ${isDarkMode ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600' : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-400'} text-white flex-1 sm:flex-none`}
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    onClick={() => { setShowAddTask(false); setNewTaskText(''); }}
                    className={`px-3 py-2.5 sm:py-2 rounded transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 min-h-[200px]">
            {loading ? (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <span className="text-sm">Loading tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-2">No tasks yet</p>
                <p className="text-sm">Click "Add Task" to create your first task</p>
              </div>
            ) : (
              tasks.map(task => {
                const taskId = task.id || task._id;
                console.log('Rendering task with ID:', taskId, 'task object:', task);
                return (
                <div key={taskId} className={`relative p-3 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-200 hover:shadow-lg ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/60 to-gray-700/60 hover:border-gray-600/50' : 'border-gray-200/50 bg-gradient-to-r from-white/80 to-gray-50/80 hover:border-gray-300/50'} backdrop-blur-sm`}>
                  <div className="flex items-start gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(taskId)}
                      className="w-5 h-5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {editingTask === taskId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTaskText}
                            onChange={(e) => setEditTaskText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditTask(taskId);
                              if (e.key === 'Escape') cancelEditTask();
                            }}
                            className={`flex-1 px-2 py-1 text-sm sm:text-base rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditTask(taskId)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditTask}
                            className={`px-2 py-1 rounded text-xs transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className={`text-sm sm:text-base break-words ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Actions button clicked for task:', taskId);
                          toggleActionsMenu(taskId);
                        }}
                        data-actions-button
                        className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 hover:scale-105' : 'hover:bg-gray-200 hover:scale-105'} cursor-pointer`}
                        title="Task actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showActionsMenu[taskId] && (
                        <div className={`actions-menu-container absolute right-2 top-12 z-10 py-1 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditTask(task);
                              setShowActionsMenu({});
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(taskId);
                              setShowActionsMenu({});
                            }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleComments(taskId)}
                    className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
                  >
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    Comments ({task.comments.length})
                  </button>
                  {showComments[taskId] && (
                    <div className={`mt-3 p-2 sm:p-3 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
                      {Array.isArray(task.comments) && task.comments.map(comment => (
                        <div key={comment._id} className="mb-2 pb-2 border-b border-gray-300 last:border-b-0">
                          <p className="text-xs sm:text-sm break-words">{comment.text}</p>
                          <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex gap-1 sm:gap-2 mt-2">
                        <input
                          type="text"
                          value={newComment[taskId] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [taskId]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && addComment(taskId)}
                          placeholder="Add a comment..."
                          className={`flex-1 px-2 py-1.5 sm:py-1 text-xs sm:text-sm rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        <button
                          onClick={() => addComment(taskId)}
                          className={`px-2 py-1.5 sm:py-1 rounded text-xs sm:text-sm transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white flex-shrink-0`}
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>
        </div>


      </div>


    </div>
    </>
  );
};

export default TasksPage;