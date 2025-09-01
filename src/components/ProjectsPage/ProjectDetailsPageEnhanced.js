import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, Flag, Clock, CheckCircle, AlertCircle, Edit3, X, Trash2, Users, Target, BarChart3,
  MessageSquare, Paperclip, Plus, Send, Download, Eye, Activity, Zap, FileText, Image, Video, Music, Archive
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import EditableField from '../common/EditableField';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const foundProject = projects.find(p => p.id === projectId);
      setProject(foundProject);
    }
    
    const savedComments = localStorage.getItem(`project_comments_${projectId}`);
    if (savedComments) setComments(JSON.parse(savedComments));
    
    const savedAttachments = localStorage.getItem(`project_attachments_${projectId}`);
    if (savedAttachments) setAttachments(JSON.parse(savedAttachments));
    
    const savedActivities = localStorage.getItem(`project_activities_${projectId}`);
    if (savedActivities) setActivities(JSON.parse(savedActivities));
    
    const savedTasks = localStorage.getItem(`project_tasks_${projectId}`);
    if (savedTasks) setTasks(JSON.parse(savedTasks));
  }, [projectId]);

  const updateProject = (field, value) => {
    if (user?.role !== 'manager' && field !== 'status') return;
    
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, [field]: value, updatedAt: new Date().toISOString() } : p
      );
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      setProject(prev => ({ ...prev, [field]: value, updatedAt: new Date().toISOString() }));
      addActivity(`Updated ${field} to "${value}"`);
    }
  };
  
  const addActivity = (action) => {
    const newActivity = {
      id: Date.now(),
      action,
      user: user.name,
      timestamp: new Date().toISOString()
    };
    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);
    localStorage.setItem(`project_activities_${projectId}`, JSON.stringify(updatedActivities));
  };
  
  const addComment = () => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      text: newComment,
      user: user.name,
      timestamp: new Date().toISOString()
    };
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    localStorage.setItem(`project_comments_${projectId}`, JSON.stringify(updatedComments));
    setNewComment('');
    addActivity('Added a comment');
  };
  
  const addTask = () => {
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      createdBy: user.name,
      timestamp: new Date().toISOString()
    };
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    localStorage.setItem(`project_tasks_${projectId}`, JSON.stringify(updatedTasks));
    setNewTask('');
    setShowAddTask(false);
    addActivity(`Added task: "${newTask}"`);
  };
  
  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem(`project_tasks_${projectId}`, JSON.stringify(updatedTasks));
    
    const task = tasks.find(t => t.id === taskId);
    addActivity(`${task.completed ? 'Uncompleted' : 'Completed'} task: "${task.text}"`);
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const attachment = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedBy: user.name,
      timestamp: new Date().toISOString()
    };
    
    const updatedAttachments = [...attachments, attachment];
    setAttachments(updatedAttachments);
    localStorage.setItem(`project_attachments_${projectId}`, JSON.stringify(updatedAttachments));
    addActivity(`Uploaded file: "${file.name}"`);
  };
  
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4" />;
    return <Archive className="w-4 h-4" />;
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteProject = () => {
    if (user?.role !== 'manager') return;
    
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const projectToDelete = projects.find(p => p.id === projectId);
      
      if (projectToDelete) {
        const deletedProjects = JSON.parse(localStorage.getItem('deletedProjects') || '[]');
        const projectWithDeleteInfo = { ...projectToDelete, deletedAt: new Date().toISOString() };
        localStorage.setItem('deletedProjects', JSON.stringify([...deletedProjects, projectWithDeleteInfo]));
        
        const updatedProjects = projects.filter(p => p.id !== projectId);
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
        
        navigate('/projects');
      }
    }
  };

  if (!project) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
              isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'text-green-500 bg-green-50 border-green-200';
      case 'In progress': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'Not started': return 'text-gray-500 bg-gray-50 border-gray-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-500 bg-red-50 border-red-200';
      case 'Medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-green-500 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'Done': return 100;
      case 'In progress': return 50;
      case 'Not started': return 10;
      default: return 0;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b backdrop-blur-sm ${
        isDarkMode ? 'bg-black/80 border-gray-800' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/projects')}
                className={`p-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user?.role === 'manager' && (
                <button
                  onClick={deleteProject}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className={`flex space-x-1 p-1 rounded-xl mb-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'comments', label: 'Comments', icon: MessageSquare },
            { id: 'files', label: 'Files', icon: Paperclip },
            { id: 'activity', label: 'Activity', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                    : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-black hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'comments' && comments.length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'
                  }`}>
                    {comments.length}
                  </span>
                )}
                {tab.id === 'tasks' && tasks.length > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-gray-200 text-gray-800' : 'bg-green-500 text-white'
                  }`}>
                    {tasks.filter(t => !t.completed).length}/{tasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h2 className="text-xl font-bold mb-6">Project Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">Status</span>
                    </div>
                    <EditableField
                      value={project.status}
                      onSave={(value) => updateProject('status', value)}
                      type="select"
                      options={[
                        { value: 'Not started', label: 'Not started' },
                        { value: 'In progress', label: 'In progress' },
                        { value: 'Done', label: 'Done' }
                      ]}
                    >
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </EditableField>
                  </div>

                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Flag className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold">Priority</span>
                    </div>
                    {user?.role === 'manager' ? (
                      <EditableField
                        value={project.priority}
                        onSave={(value) => updateProject('priority', value)}
                        type="select"
                        options={[
                          { value: 'High', label: 'High' },
                          { value: 'Medium', label: 'Medium' },
                          { value: 'Low', label: 'Low' }
                        ]}
                      >
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </EditableField>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">Progress</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{getProgressPercentage(project.status)}%</span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Complete</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                          style={{ width: `${getProgressPercentage(project.status)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  {user?.role === 'manager' ? (
                    <EditableField
                      value={project.notes || ''}
                      onSave={(value) => updateProject('notes', value)}
                      type="textarea"
                      rows={6}
                      placeholder="Add project description..."
                    />
                  ) : (
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <p className={`whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {project.notes || 'No description available.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Tasks</h2>
                  <button
                    onClick={() => setShowAddTask(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
                
                {showAddTask && (
                  <div className={`p-4 rounded-xl border mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Enter task description..."
                        className={`flex-1 px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                      />
                      <button onClick={addTask} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        Add
                      </button>
                      <button
                        onClick={() => { setShowAddTask(false); setNewTask(''); }}
                        className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-3 p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          task.completed ? 'bg-green-500 border-green-500 text-white' : isDarkMode ? 'border-gray-600 hover:border-green-500' : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {task.completed && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <p className={task.completed ? 'line-through opacity-60' : ''}>{task.text}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created by {task.createdBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'comments' && (
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h2 className="text-xl font-bold mb-6">Comments</h2>
                
                <div className={`p-4 rounded-xl border mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex gap-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className={`flex-1 px-4 py-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                    />
                    <button onClick={addComment} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                          {comment.user.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{comment.user}</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(comment.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className={`ml-11 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'files' && (
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Files</h2>
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
                  }`}>
                    <Paperclip className="w-4 h-4" />
                    Upload
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map(file => (
                    <div key={file.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{file.name}</p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h2 className="text-xl font-bold mb-6">Activity</h2>
                
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className={`flex items-start gap-3 p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                          <span className="font-semibold">{activity.user}</span> {activity.action}
                        </p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold mb-4">Project Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Owner</p>
                    <p className="font-medium">{project.ownerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assigned To</p>
                    {user?.role === 'manager' ? (
                      <EditableField
                        value={project.forPerson || ''}
                        onSave={(value) => updateProject('forPerson', value)}
                        placeholder="Assign to someone..."
                      />
                    ) : (
                      <p className="font-medium">{project.forPerson || 'Unassigned'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start Date</p>
                    {user?.role === 'manager' ? (
                      <EditableField
                        value={project.startDate || ''}
                        onSave={(value) => updateProject('startDate', value)}
                        type="date"
                      />
                    ) : (
                      <p className="font-medium">{project.startDate || 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>End Date</p>
                    {user?.role === 'manager' ? (
                      <EditableField
                        value={project.endDate || ''}
                        onSave={(value) => updateProject('endDate', value)}
                        type="date"
                      />
                    ) : (
                      <p className="font-medium">{project.endDate || 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Updated</p>
                    <p className="font-medium">
                      {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {(user?.role === 'manager' || user?.id === project.ownerUid) && (
                  <>
                    {project.status !== 'In progress' && (
                      <button
                        onClick={() => updateProject('status', 'In progress')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                          isDarkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                        Start Project
                      </button>
                    )}
                    
                    {project.status !== 'Done' && (
                      <button
                        onClick={() => updateProject('status', 'Done')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                          isDarkMode ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark Complete
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => navigate('/projects')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;