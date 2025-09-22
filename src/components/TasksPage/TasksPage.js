import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Plus, X, MessageSquare, Send, Target, FileText, Menu, Home, Inbox, FolderOpen, Calendar, BarChart3, Settings, Trash2, StickyNote, Users, Edit3, MoreHorizontal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TasksPage = ({ projectId: propProjectId, projectName: propProjectName = 'Project', embedded = false }) => {
  const { projectId: urlProjectId } = useParams();
  const projectId = propProjectId || urlProjectId;
  const projectName = propProjectName || 'Project';
  
  console.log(`TasksPage initialized with projectId: ${projectId}, projectName: ${projectName}`);
  const navigate = useNavigate();
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
  const [editText, setEditText] = useState('');
  const [showTaskMenu, setShowTaskMenu] = useState({});

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.task-menu')) {
        setShowTaskMenu({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      const url = `http://localhost:5000/api/projects/${projectId}/data`;
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
        ? `http://localhost:5000/api/projects/${projectId}/tasks/${taskData.id}`
        : `http://localhost:5000/api/projects/${projectId}/tasks`;

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

      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
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

      const url = `http://localhost:5000/api/projects/${projectId}/tasks/${taskId}`;

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

      const url = `http://localhost:5000/api/projects/${projectId}/tasks/${id}`;

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

      const url = `http://localhost:5000/api/projects/${projectId}/tasks`;

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

      // Find the task to ensure it exists
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        alert('Task not found');
        return;
      }

      const commentData = {
        text: commentText,
        createdBy: localStorage.getItem('userId'),
        timestamp: new Date().toISOString()
      };

      console.log('Adding comment with data:', commentData);

      // Update the task with the new comment
      const updateData = {
        text: task.text,
        priority: task.priority || 'medium',
        completed: task.completed || false,
        comments: [
          ...(task.comments || []),
          commentData
        ]
      };

      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updateData)
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

  const startEditing = (task) => {
    setEditingTask(task.id || task._id);
    setEditText(task.text);
    setShowTaskMenu({});
  };

  const saveEdit = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found for editing:', taskId);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required');
      }

      if (!projectId) {
        console.error('No project ID available');
        throw new Error('Project ID is required');
      }

      console.log(`Saving edit for task ${taskId} in project ${projectId}`);
      console.log('Edit text:', editText.trim());

      const updateData = {
        text: editText.trim(),
        priority: task.priority || 'medium',
        completed: task.completed || false
      };

      console.log('Update data:', updateData);

      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(updateData)
      });

      console.log('Save edit response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorData = { message: 'Failed to save task edit' };
        }
        throw new Error(errorData.message || 'Failed to save task edit');
      }

      const updatedTask = await response.json();
      console.log('Task edit saved successfully:', updatedTask);

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? {
              ...t,
              text: editText.trim(),
              updatedAt: updatedTask.updatedAt
            }
            : t
        )
      );

      // Reset editing state
      setEditingTask(null);
      setEditText('');

      return updatedTask;
    } catch (error) {
      console.error('Error saving task edit:', error);
      if (error.message === 'Failed to fetch') {
        alert('Cannot connect to server. Please check if the backend is running.');
      } else {
        alert(`Failed to save edit: ${error.message}`);
      }
      return null;
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText('');
  };

  const handleDeleteTask = async (taskId) => {
    try {
      if (!taskId) {
        console.error('Invalid task ID');
        return;
      }

      if (window.confirm('Are you sure you want to delete this task?')) {
        const success = await deleteTask(taskId);
        if (success) {
          setShowTaskMenu({});
        }
      }
    } catch (error) {
      console.error('Error handling delete task:', error);
    }
  };

  const toggleTaskMenu = (taskId) => {
    setShowTaskMenu(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className={`${embedded ? '' : `${isDarkMode ? 'bg-black text-gray-100' : 'bg-white text-black'} min-h-screen font-sans`}`}>
      <div className={embedded ? 'p-4' : 'max-w-6xl mx-auto px-4 py-8'}>
        {!embedded && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-blue-500" />
                <h1 className="text-3xl font-bold">Tasks</h1>
              </div>
            </div>

          </div>
        )}

        {!embedded && (
          <div className={`${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'} backdrop-blur-sm p-6 rounded-2xl border shadow-lg mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Progress</h2>
              <span className="text-sm text-gray-500">{completedCount}/{tasks.length} completed</span>
            </div>
            <div className={`w-full bg-gray-200 rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{Math.round(progressPercentage)}% complete</p>
          </div>
        )}

        <div className={`${embedded ? '' : `${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'} backdrop-blur-sm rounded-2xl border shadow-lg`} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{projectId ? 'Project Tasks' : 'All Tasks'}</h2>
            <button
              onClick={() => setShowAddTask(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {error && (
            <div className={`p-3 rounded-lg border mb-4 ${isDarkMode ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
            </div>
          )}

          {showAddTask && (
            <div className={`p-4 rounded-lg border mb-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask();
                    if (e.key === 'Escape') { setShowAddTask(false); setNewTaskText(''); }
                  }}
                  placeholder="Enter task description..."
                  className={`flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                  autoFocus
                />
                <button
                  onClick={addTask}
                  disabled={saving}
                  className={`px-4 py-2 rounded transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-600' : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-400'} text-white`}
                >
                  {saving ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowAddTask(false); setNewTaskText(''); }}
                  className={`px-3 py-2 rounded transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white`}
                >
                  <X className="w-4 h-4" />
                </button>
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
              tasks.map(task => (
                <div key={task.id || task._id} className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id || task._id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      {editingTask === (task.id || task._id) ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(task.id || task._id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className={`flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(task.id || task._id)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className={`px-3 py-1 rounded text-sm transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 hover:bg-gray-500'} text-white`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className={task.completed ? 'line-through text-gray-500' : ''}>
                          {task.text}
                        </span>
                      )}
                    </div>
                    <div className="relative task-menu">
                      <button
                        onClick={() => toggleTaskMenu(task.id || task._id)}
                        className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {showTaskMenu[task.id || task._id] && (
                        <div className={`absolute right-0 top-8 w-32 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <div className="py-1">
                            <button
                              onClick={() => startEditing(task)}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id || task._id)}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors text-red-600 ${isDarkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleComments(task.id || task._id)}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Comments ({task.comments.length})
                  </button>
                  {showComments[task.id || task._id] && (
                    <div className={`mt-3 p-3 rounded border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
                      {Array.isArray(task.comments) && task.comments.map(comment => (
                        <div key={comment._id} className="mb-2 pb-2 border-b border-gray-300 last:border-b-0">
                          <p className="text-sm">{comment.text}</p>
                          <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newComment[task.id || task._id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [task.id || task._id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && addComment(task.id || task._id)}
                          placeholder="Add a comment..."
                          className={`flex-1 px-2 py-1 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                        />
                        <button
                          onClick={() => addComment(task.id || task._id)}
                          className={`px-2 py-1 rounded text-sm transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default TasksPage;