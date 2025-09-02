import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, Flag, Clock, CheckCircle, AlertCircle, Edit3, X, Trash2, Users, Target, BarChart3,
  MessageSquare, Paperclip, Plus, Send, Activity, Zap, FileText, Image, Video, Music, Archive,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Type
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';


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
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [textareaRef, setTextareaRef] = useState(null);
  const saveTimer = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchProjectData();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  // Debounced autosave for notes
  const debouncedSaveNotes = (html) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsSaving(true);
    saveTimer.current = setTimeout(async () => {
      try {
        await updateProject('notes', html);
      } finally {
        setIsSaving(false);
      }
    }, 600);
  };

  const fetchProjectData = async () => {
    try {
      const [commentsRes, attachmentsRes, activitiesRes, tasksRes] = await Promise.all([
        fetch(`http://localhost:5000/api/projects/${projectId}/comments`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }),
        fetch(`http://localhost:5000/api/projects/${projectId}/attachments`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }),
        fetch(`http://localhost:5000/api/projects/${projectId}/activities`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }),
        fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        })
      ]);
      
      if (commentsRes.ok) setComments(await commentsRes.json());
      if (attachmentsRes.ok) setAttachments(await attachmentsRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const updateProject = async (field, value) => {
    if (user?.role !== 'manager' && field !== 'status') return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ [field]: value })
      });
      
      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        addActivity(`Updated ${field} to "${value}"`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };
  
  const addActivity = async (action) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        const newActivity = await response.json();
        setActivities(prev => [newActivity, ...prev]);
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };
  
  const addComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ text: newComment })
      });
      
      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment('');
        addActivity('Added a comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ text: newTask })
      });
      
      if (response.ok) {
        const task = await response.json();
        setTasks(prev => [...prev, task]);
        setNewTask('');
        setShowAddTask(false);
        addActivity(`Added task: "${newTask}"`);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
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

  const insertFormat = (format) => {
    if (!textareaRef) return;
    
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    let element;
    
    switch (format) {
      case 'h1':
        element = document.createElement('h1');
        element.style.fontSize = '1.5em';
        element.style.fontWeight = 'bold';
        element.style.margin = '0.5em 0';
        element.textContent = selectedText || 'Heading 1';
        break;
      case 'h2':
        element = document.createElement('h2');
        element.style.fontSize = '1.25em';
        element.style.fontWeight = 'bold';
        element.style.margin = '0.4em 0';
        element.textContent = selectedText || 'Heading 2';
        break;
      case 'bold':
        element = document.createElement('b');
        element.textContent = selectedText || 'Bold text';
        break;
      case 'italic':
        element = document.createElement('i');
        element.textContent = selectedText || 'Italic text';
        break;
      case 'underline':
        element = document.createElement('u');
        element.textContent = selectedText || 'Underlined text';
        break;
      case 'strikethrough':
        element = document.createElement('s');
        element.textContent = selectedText || 'Strikethrough text';
        break;
      case 'bullet':
        const ul = document.createElement('ul');
        const li = document.createElement('li');
        li.textContent = selectedText || 'List item';
        ul.appendChild(li);
        element = ul;
        break;
      case 'number':
        const ol = document.createElement('ol');
        const li2 = document.createElement('li');
        li2.textContent = selectedText || 'List item';
        ol.appendChild(li2);
        element = ol;
        break;
      default:
        return;
    }
    
    range.deleteContents();
    range.insertNode(element);
    
    updateProject('notes', textareaRef.innerHTML);
    setShowFormatMenu(false);
    
    setTimeout(() => {
      textareaRef.focus();
    }, 0);
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
          <button>fuad</button>
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
                    <select
                      value={project.status}
                      onChange={(e) => updateProject('status', e.target.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)} bg-transparent`}
                    >
                      <option value="Not started">Not started</option>
                      <option value="In progress">In progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>

                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Flag className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold">Priority</span>
                    </div>
                    {user?.role === 'manager' ? (
                      <select
                        value={project.priority}
                        onChange={(e) => updateProject('priority', e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(project.priority)} bg-transparent`}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
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
                    <div className="relative">
                      <div className="relative">
                        <button
                          onClick={() => setShowFormatMenu(!showFormatMenu)}
                          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 ${
                            isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          +
                        </button>
                        
                        {showFormatMenu && (
                          <div className={`absolute top-8 left-2 z-20 p-2 rounded-lg border shadow-lg ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}>
                            <div className="grid grid-cols-4 gap-1">
                              <button onClick={() => insertFormat('h1')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Heading 1">
                                <Type className="w-4 h-4" />
                                <span className="text-xs font-bold">H1</span>
                              </button>
                              <button onClick={() => insertFormat('h2')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Heading 2">
                                <Type className="w-3 h-3" />
                                <span className="text-xs font-bold">H2</span>
                              </button>
                              <button onClick={() => insertFormat('bold')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Bold">
                                <Bold className="w-4 h-4" />
                              </button>
                              <button onClick={() => insertFormat('italic')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Italic">
                                <Italic className="w-4 h-4" />
                              </button>
                              <button onClick={() => insertFormat('underline')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Underline">
                                <Underline className="w-4 h-4" />
                              </button>
                              <button onClick={() => insertFormat('strikethrough')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Strikethrough">
                                <Strikethrough className="w-4 h-4" />
                              </button>
                              <button onClick={() => insertFormat('bullet')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Bullet List">
                                <List className="w-4 h-4" />
                              </button>
                              <button onClick={() => insertFormat('number')} className={`p-2 rounded transition-colors duration-200 hover:bg-blue-500 hover:text-white ${isDarkMode ? 'hover:bg-blue-600' : ''}`} title="Numbered List">
                                <ListOrdered className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div
                          ref={setTextareaRef}
                          contentEditable
                          onInput={(e) => debouncedSaveNotes(e.currentTarget.innerHTML)}
                          onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === 's') {
                              e.preventDefault();
                              updateProject('notes', e.target.innerHTML);
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: project.notes || '' }}
                          className={`w-full p-4 pl-10 rounded-xl border resize-none min-h-[300px] focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                          style={{ 
                            lineHeight: '1.6',
                            fontFamily: 'inherit'
                          }}
                          data-placeholder="Add project description..."
                        />
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                          <span>Press Ctrl+S to save</span>
                          {isSaving && <span className="opacity-80">• Saving…</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div 
                        className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        style={{ lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{
                          __html: (project.notes || 'No description available.')
                            .replace(/<h1>/g, '<h1 style="font-size: 1.5em; font-weight: bold; margin: 0.5em 0; color: inherit; display: block;">')
                            .replace(/<h2>/g, '<h2 style="font-size: 1.25em; font-weight: bold; margin: 0.4em 0; color: inherit; display: block;">')
                            .replace(/<b>/g, '<b style="font-weight: bold;">')
                            .replace(/<i>/g, '<i style="font-style: italic;">')
                            .replace(/<u>/g, '<u style="text-decoration: underline;">')
                            .replace(/<s>/g, '<s style="text-decoration: line-through;">')
                            .replace(/<ul>/g, '<ul style="margin: 0.5em 0; padding-left: 1.5em;">')
                            .replace(/<ol>/g, '<ol style="margin: 0.5em 0; padding-left: 1.5em;">')
                            .replace(/<li>/g, '<li style="margin: 0.2em 0;">')
                            .replace(/\n/g, '<br>')
                        }}
                      />
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
                      <input
                        type="text"
                        value={project.forPerson || ''}
                        onChange={(e) => updateProject('forPerson', e.target.value)}
                        placeholder="Assign to someone..."
                        className={`px-3 py-1 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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
                      <input
                        type="date"
                        value={project.startDate || ''}
                        onChange={(e) => updateProject('startDate', e.target.value)}
                        className={`px-3 py-1 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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
                      <input
                        type="date"
                        value={project.endDate || ''}
                        onChange={(e) => updateProject('endDate', e.target.value)}
                        className={`px-3 py-1 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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