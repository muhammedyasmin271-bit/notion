import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid as ProjectsIcon,
  Plus,
  Search,
  Filter,
  Trash as TrashIcon,
  Calendar,
  User,
  Flag,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../common/PageHeader';
import EditableField from '../common/EditableField';
import { useTheme } from '../../context/ThemeContext';
import { notifyProjectAssignment, notifyProjectUpdate } from '../../utils/notifications';

const ProjectsPage = () => {
  const { user, users } = useAppContext();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState('By Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterFor, setFilterFor] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [viewProject, setViewProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    priority: 'Medium',
    forPerson: '',
    notes: '',
    status: 'Not started'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const statuses = ['Not started', 'In progress', 'Done'];

  const handleAddProject = (status = 'Not started') => {
    if (!user) {
      console.error('Cannot add project. User is not authenticated.');
      return;
    }
    if (user?.role !== 'manager') {
      return;
    }
    setNewProjectForm({
      name: '',
      priority: 'Medium',
      forPerson: '',
      notes: '',
      status
    });
    setShowCreateModal(true);
  };

  const handleConfirmCreateProject = async () => {
    if (!newProjectForm.name.trim()) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          name: newProjectForm.name,
          status: newProjectForm.status,
          priority: newProjectForm.priority,
          forPerson: newProjectForm.forPerson,
          notes: newProjectForm.notes,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
        })
      });
      
      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [...prev, newProject].sort((a, b) => a.name.localeCompare(b.name)));
        
        setShowCreateModal(false);
        setNewProjectForm({
          name: '',
          priority: 'Medium',
          forPerson: '',
          notes: '',
          status: 'Not started'
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleUpdateField = (projectId, field, value) => {
    // Regular users can only update status
    if (user?.role !== 'manager' && field !== 'status') return;
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Check if assigning to a user (forPerson field)
    if (field === 'forPerson' && value && value !== project.forPerson) {
      // Find the user being assigned
      const assignedUser = users.find(u => 
        u.name.toLowerCase().includes(value.toLowerCase()) || 
        u.email?.toLowerCase().includes(value.toLowerCase())
      );
      
      if (assignedUser && user) {
        // Send notification to assigned user
        notifyProjectAssignment(
          assignedUser.id,
          assignedUser.name,
          project.name,
          user.id,
          user.name
        );
      }
    }
    
    // Check if updating project status
    if (field === 'status' && value !== project.status && project.forPerson) {
      // Find the assigned user
      const assignedUser = users.find(u => 
        u.name.toLowerCase().includes(project.forPerson.toLowerCase()) || 
        u.email?.toLowerCase().includes(project.forPerson.toLowerCase())
      );
      
      if (assignedUser && user) {
        // Send notification about status update
        notifyProjectUpdate(
          assignedUser.id,
          assignedUser.name,
          project.name,
          `updated to ${value}`,
          user.id,
          user.name
        );
      }
    }
    
    setProjects(projects.map(p => 
      p.id === projectId 
        ? { ...p, [field]: value, updatedAt: new Date().toISOString() } 
        : p
    ));
  };

  const handleDeleteProject = (projectId) => {
    if (user?.role !== 'manager') return;
    
    const projectToDelete = projects.find(p => p.id === projectId);
    if (projectToDelete) {
      // Move to trash instead of permanent deletion
      const deletedProjects = JSON.parse(localStorage.getItem('deletedProjects') || '[]');
      const projectWithDeleteInfo = {
        ...projectToDelete,
        deletedAt: new Date().toISOString()
      };
      localStorage.setItem('deletedProjects', JSON.stringify([...deletedProjects, projectWithDeleteInfo]));
    }
    
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const handleEditProject = (project) => {
    if (user?.role !== 'manager') return;
    setEditingProject(project.id);
    setEditForm({
      name: project.name,
      priority: project.priority,
      forPerson: project.forPerson || project.category || '',
      notes: project.notes
    });
  };

  const handleSaveEdit = () => {
    if (!editingProject) return;
    if (user?.role !== 'manager') return;
    
    const updatedProjects = projects.map(project => 
      project.id === editingProject 
        ? { ...project, ...editForm, updatedAt: new Date().toISOString() } 
        : project
    );
    setProjects(updatedProjects);
    setEditingProject(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditForm({});
  };

  const handleOpenProjectNote = (project) => {
    setViewProject(project);
  };

  const handleCloseProjectNote = () => {
    setViewProject(null);
  };

  const getPriorityClass = (priority) => {
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

  const getStatusClass = (status) => {
    if (isDarkMode) {
      switch (status) {
        case 'In progress': return 'bg-gray-700 text-white border border-gray-600';
        case 'Not started': return 'bg-gray-800 text-gray-300 border border-gray-700';
        case 'Done': return 'bg-white text-black border border-gray-600';
        default: return 'bg-gray-600 text-white border border-gray-500';
      }
    } else {
      switch (status) {
        case 'In progress': return 'bg-gray-600 text-white border border-gray-400';
        case 'Not started': return 'bg-gray-300 text-black border border-gray-400';
        case 'Done': return 'bg-black text-white border border-gray-300';
        default: return 'bg-gray-400 text-white border border-gray-300';
      }
    }
  };

  const filteredProjects = (projects || []).filter(project => {
    const matchesSearch = (project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
    const matchesOwner = filterOwner === 'all' || project.ownerUid === filterOwner;
    const forValue = (project.forPerson || project.category || '').toLowerCase();
    const matchesFor = !filterFor || forValue.includes(filterFor.toLowerCase());
    
    return matchesSearch && matchesPriority && matchesOwner && matchesFor;
  });

  const getProjectStats = () => {
    const projectList = projects || [];
    const total = projectList.length;
    const completed = projectList.filter(p => p.status === 'Done').length;
    const inProgress = projectList.filter(p => p.status === 'In progress').length;
    const notStarted = projectList.filter(p => p.status === 'Not started').length;
    
    return { total, completed, inProgress, notStarted };
  };

  const stats = getProjectStats();

  const getProgressFromStatus = (status) => {
    switch (status) {
      case 'Done':
        return 100;
      case 'In progress':
        return 50;
      case 'Not started':
      default:
        return 10;
    }
  };

  // Gantt config: base date and labels for the next 8 weeks
  const ganttWeeks = 8;
  const ganttBaseDate = new Date();
  ganttBaseDate.setHours(0, 0, 0, 0);
  const ganttWeekLabels = Array.from({ length: ganttWeeks }, (_, i) => {
    const d = new Date(ganttBaseDate.getTime() + i * 7 * 24 * 3600 * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  // Professional Black & White Theme
  const pageBg = isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900';
  const cardBg = isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const subtleBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  const subtleContainer = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
  const hoverSubtle = isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  const divideColor = isDarkMode ? 'divide-gray-800' : 'divide-gray-200';
  const inputClass = isDarkMode
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
  const selectedToggle = isDarkMode ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg';
  const unselectedToggle = isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-black hover:bg-gray-100';

  return (
    <div className={`content p-4 lg:p-6 font-sans ${pageBg}`}>
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg ${cardBg}`}>
              <ProjectsIcon className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Projects</h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and execute projects from start to finish</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user?.role === 'manager' && (
              <button 
                onClick={() => handleAddProject()} 
                className={`flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                  isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
                }`}
              >
                <Plus size={18} className="mr-2" /> New Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Professional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.total}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Projects</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.completed}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
              <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.inProgress}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <Clock className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{stats.notStarted}</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Not Started</p>
            </div>
            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <AlertCircle className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-lg shadow-sm border mb-6 ${cardBg}`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">For (person)</label>
            <input
              type="text"
              placeholder="Filter by person..."
              value={filterFor}
              onChange={(e) => setFilterFor(e.target.value)}
              className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Owner</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            >
              <option value="all">All Owners</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterPriority('all');
                setFilterFor('');
                setFilterOwner('all');
              }}
              className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isDarkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className={`flex items-center space-x-2 p-1 rounded-lg mb-8 max-w-sm ${subtleContainer}`}>
        <button
          onClick={() => setView('By Status')}
          className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg ${
            view === 'By Status' ? selectedToggle : unselectedToggle
          } transition-colors duration-200`}
        >
          By Status
        </button>
        <button
          onClick={() => setView('All Projects')}
          className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg ${
            view === 'All Projects' ? selectedToggle : unselectedToggle
          } transition-colors duration-200`}
        >
          All Projects
        </button>
        <button
          onClick={() => setView('Gantt')}
          className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg ${
            view === 'Gantt' ? selectedToggle : unselectedToggle
          } transition-colors duration-200`}
        >
          Gantt
        </button>
      </div>

      {view === 'By Status' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map(status => (
            <div key={status} className={`p-4 rounded-xl shadow-sm border min-h-[400px] ${cardBg}`}>
              <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${
                status === 'Not started' ? 'border-gray-400' : 
                status === 'In progress' ? 'border-blue-500' : 'border-green-500'
              }`}>
                <h2 className={`text-lg font-bold ${
                  status === 'Not started' ? (isDarkMode ? 'text-gray-300' : 'text-gray-600') : 
                  status === 'In progress' ? 'text-blue-500' : 'text-green-500'
                }`}>
                  {status}
                </h2>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {filteredProjects.filter(p => p.status === status).length}
                </span>
              </div>
              <div className="space-y-4">
                {filteredProjects.filter(p => p.status === status).map(project => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border relative cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-white'}`}
                    onClick={(e) => {
                      const el = e.target;
                      if (
                        el.closest && (
                          el.closest('button') ||
                          el.closest('input') ||
                          el.closest('textarea') ||
                          el.closest('select') ||
                          el.closest('[contenteditable="true"]')
                        )
                      ) {
                        return; // let interactive elements work normally
                      }
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{project.name}</span>
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center px-2 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
                          >
                            <TrashIcon size={14} className="mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                      
                      <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <User size={14} />
                        <span>Owner: {project.ownerName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Flag size={14} className="text-gray-500" />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>For:</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-200 text-black border-gray-300'
                        }`}>
                          {project.forPerson || project.category || '—'}
                        </span>
                      </div>

                      {/* Dates for Gantt */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className={`text-sm mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start:</span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{project.startDate || '—'}</span>
                        </div>
                        <div>
                          <span className={`text-sm mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>End:</span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{project.endDate || '—'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-gray-500" />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {(() => {
                          const n = (project.notes || '').trim();
                          if (!n) return '—';
                          const parts = n.split(/\s+/);
                          return parts[0] + (parts.length > 1 ? '...' : '');
                        })()}
                      </p>
                    </div>
                  </div>
                ))}
                {user?.role === 'manager' && (
                  <button
                    onClick={() => handleAddProject(status)}
                    className={`flex items-center w-full justify-center px-4 py-3 text-sm font-semibold border-2 border-dashed rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'text-gray-400 border-gray-600 hover:text-white hover:bg-gray-800 hover:border-gray-500' : 'text-gray-600 border-gray-400 hover:text-black hover:bg-gray-100 hover:border-gray-500'
                    }`}
                  >
                    <Plus size={18} className="mr-2" /> New Project
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {view === 'All Projects' && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${divideColor}`}>
              <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">For (person)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${divideColor}`}>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className={`${hoverSubtle}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user?.role === 'manager' ? (
                        <EditableField
                          value={project.name}
                          onSave={(value) => handleUpdateField(project.id, 'name', value)}
                          className="font-medium"
                          required
                          saveOnEnter={false}
                        />
                      ) : (
                        <span className="font-medium">{project.name}</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {project.ownerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EditableField
                        value={project.status}
                        onSave={(value) => {
                          handleUpdateField(project.id, 'status', value);
                          // Force immediate re-render to update the column placement
                          const updatedProjects = projects.map(p => 
                            p.id === project.id 
                              ? { ...p, status: value, updatedAt: new Date().toISOString() } 
                              : p
                          );
                          setProjects(updatedProjects);
                        }}
                        type="select"
                        options={[
                          { value: 'Not started', label: 'Not started' },
                          { value: 'In progress', label: 'In progress' },
                          { value: 'Done', label: 'Done' }
                        ]}
                        saveOnEnter={false}
                      >
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(project.status)}`}>
                          {project.status}
                        </span>
                      </EditableField>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user?.role === 'manager' ? (
                        <EditableField
                          value={project.priority}
                          onSave={(value) => handleUpdateField(project.id, 'priority', value)}
                          type="select"
                          options={[
                            { value: 'High', label: 'High' },
                            { value: 'Medium', label: 'Medium' },
                            { value: 'Low', label: 'Low' }
                          ]}
                          saveOnEnter={false}
                        >
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(project.priority)}`}>
                            {project.priority}
                          </span>
                        </EditableField>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(project.priority)}`}>
                          {project.priority}
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {user?.role === 'manager' ? (
                        <EditableField
                          value={project.forPerson || ''}
                          onSave={(value) => handleUpdateField(project.id, 'forPerson', value)}
                          saveOnEnter={false}
                        />
                      ) : (
                        <span>{project.forPerson || '—'}</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {user?.role === 'manager' ? (
                        <EditableField
                          value={project.notes}
                          onSave={(value) => handleUpdateField(project.id, 'notes', value)}
                          type="textarea"
                          rows={2}
                          placeholder="Add notes..."
                          saveOnEnter={false}
                        />
                      ) : (
                        <span className={`inline-block max-w-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{project.notes || '—'}</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className={`flex items-center px-2 py-1 text-sm font-medium ${isDarkMode ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/30' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'} rounded-md transition-colors duration-200`}
                        >
                          View
                        </button>
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleEditProject(project)}
                            className={`flex items-center px-2 py-1 text-sm font-medium ${isDarkMode ? 'text-green-400 bg-green-900/20 hover:bg-green-900/30' : 'text-green-600 bg-green-50 hover:bg-green-100'} rounded-md transition-colors duration-200`}
                          >
                            Edit
                          </button>
                        )}
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center px-2 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
                          >
                            <TrashIcon size={14} className="mr-1" />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {view === 'Gantt' && (
        <div className={`rounded-xl shadow-sm border p-4 ${cardBg}`}>
          <div className="space-y-3">
            {filteredProjects.map((p) => {
              const progress = getProgressFromStatus(p.status);
              return (
                <div key={p.id} className="">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate pr-3">{p.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{progress}%</span>
                  </div>
                  <div className={`h-3 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div
                      className={`h-3 rounded ${p.status === 'Done' ? 'bg-green-500' : p.status === 'In progress' ? 'bg-blue-500' : 'bg-gray-400'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Project Note */}
      {viewProject && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseProjectNote} />
          {/* Panel Container */}
          <div className="relative h-full w-full flex items-start justify-center p-4 sm:p-6">
            <div className={`flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
              {/* Sticky Header */}
              <div className={`sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b ${isDarkMode ? 'border-gray-800 bg-gray-950/90' : 'border-gray-200 bg-white/90'} backdrop-blur`}>
                <div className="flex items-center gap-3 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold truncate">{viewProject.name || 'Project'}</h2>
                  <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(viewProject.status)}`}>{viewProject.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  {user?.role === 'manager' && (
                    <button
                      onClick={() => { handleDeleteProject(viewProject.id); handleCloseProjectNote(); }}
                      className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors duration-200"
                    >
                      <TrashIcon size={16} className="mr-1" /> Delete
                    </button>
                  )}
                  <button
                    onClick={handleCloseProjectNote}
                    className={`px-3 py-2 text-sm rounded-md ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-6 py-6">
                  {/* Meta Card */}
                  <div className={`rounded-xl border p-5 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex flex-col gap-4">
                      <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <User size={14} />
                        <span>Owner: {viewProject.ownerName}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Flag size={14} className="text-gray-500" />
                          {user?.role === 'manager' ? (
                            <EditableField
                              value={viewProject.priority}
                              onSave={(value) => { handleUpdateField(viewProject.id, 'priority', value); setViewProject({ ...viewProject, priority: value }); }}
                              type="select"
                              options={[
                                { value: 'High', label: 'High' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'Low', label: 'Low' }
                              ]}
                              saveOnEnter={false}
                            >
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(viewProject.priority)}`}>
                                {viewProject.priority}
                              </span>
                            </EditableField>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(viewProject.priority)}`}>
                              {viewProject.priority}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>For:</span>
                          {user?.role === 'manager' ? (
                            <EditableField
                              value={viewProject.forPerson || viewProject.category || ''}
                              onSave={(value) => { handleUpdateField(viewProject.id, 'forPerson', value); setViewProject({ ...viewProject, forPerson: value }); }}
                              saveOnEnter={false}
                            />
                          ) : (
                            <span>{viewProject.forPerson || viewProject.category || '—'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-500" />
                          <EditableField
                            value={viewProject.status}
                            onSave={(value) => { handleUpdateField(viewProject.id, 'status', value); setViewProject({ ...viewProject, status: value }); }}
                            type="select"
                            options={[
                              { value: 'Not started', label: 'Not started' },
                              { value: 'In progress', label: 'In progress' },
                              { value: 'Done', label: 'Done' }
                            ]}
                            saveOnEnter={false}
                          >
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(viewProject.status)}`}>
                              {viewProject.status}
                            </span>
                          </EditableField>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className={`text-sm mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start:</span>
                          {user?.role === 'manager' ? (
                            <EditableField
                              value={viewProject.startDate || ''}
                              onSave={(value) => { handleUpdateField(viewProject.id, 'startDate', value); setViewProject({ ...viewProject, startDate: value }); }}
                              type="date"
                              saveOnEnter={false}
                            />
                          ) : (
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewProject.startDate || '—'}</span>
                          )}
                        </div>
                        <div>
                          <span className={`text-sm mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>End:</span>
                          {user?.role === 'manager' ? (
                            <EditableField
                              value={viewProject.endDate || ''}
                              onSave={(value) => { handleUpdateField(viewProject.id, 'endDate', value); setViewProject({ ...viewProject, endDate: value }); }}
                              type="date"
                              saveOnEnter={false}
                            />
                          ) : (
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{viewProject.endDate || '—'}</span>
                          )}
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project Name</label>
                        {user?.role === 'manager' ? (
                          <EditableField
                            value={viewProject.name}
                            onSave={(value) => {
                              handleUpdateField(viewProject.id, 'name', value);
                              setViewProject({ ...viewProject, name: value, updatedAt: new Date().toISOString() });
                            }}
                            className="text-base font-semibold"
                            required
                            minLength={3}
                            saveOnEnter={false}
                          />
                        ) : (
                          <div className="text-base font-semibold">{viewProject.name}</div>
                        )}
                      </div>

                      {/* Notes - acts like the note editor */}
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</label>
                        {user?.role === 'manager' ? (
                          <EditableField
                            value={viewProject.notes}
                            onSave={(value) => { handleUpdateField(viewProject.id, 'notes', value); setViewProject({ ...viewProject, notes: value }); }}
                            type="textarea"
                            rows={10}
                            placeholder="Write detailed notes for this project..."
                            className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
                            saveOnEnter={false}
                          />
                        ) : (
                          <div className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{viewProject.notes || '—'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Professional Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          {/* Enhanced Backdrop */}
          <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? 'bg-black/80' : 'bg-white/80'}`} onClick={() => setShowCreateModal(false)} />
          {/* Centered Panel */}
          <div className="relative h-full w-full flex items-center justify-center p-6">
            <div className={`flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border-2 ${
              isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'
            }`}>
              {/* Professional Header */}
              <div className={`flex items-center justify-between px-8 py-6 border-b-2 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}>
                    <Plus className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Create New Project</h2>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Build something amazing</p>
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

              {/* Professional Form Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
                  {/* Project Name Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Project Details</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Project Name *</label>
                      <input
                        type="text"
                        value={newProjectForm.name}
                        onChange={(e) => setNewProjectForm({...newProjectForm, name: e.target.value})}
                        placeholder="Enter a descriptive project name"
                        className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Project Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Flag size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Priority Level
                      </label>
                      <select
                        value={newProjectForm.priority}
                        onChange={(e) => setNewProjectForm({...newProjectForm, priority: e.target.value})}
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
                        <User size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Assign To
                      </label>
                      <input
                        type="text"
                        value={newProjectForm.forPerson}
                        onChange={(e) => setNewProjectForm({...newProjectForm, forPerson: e.target.value})}
                        placeholder="Enter team member name"
                        className={`w-full px-4 py-3 rounded-xl text-base font-medium border-2 transition-all duration-200 focus:outline-none focus:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                            : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:border-black'
                        }`}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Calendar size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                        Initial Status
                      </label>
                      <select
                        value={newProjectForm.status}
                        onChange={(e) => setNewProjectForm({...newProjectForm, status: e.target.value})}
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
                  </div>

                  {/* Project Description */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Project Description</h3>
                    </div>
                    <div className="space-y-3">
                      <label className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Detailed Notes</label>
                      <textarea
                        value={newProjectForm.notes}
                        onChange={(e) => setNewProjectForm({...newProjectForm, notes: e.target.value})}
                        rows={8}
                        placeholder="Describe the project goals, requirements, timeline, and any important details..."
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
              
              {/* Professional Action Bar */}
              <div className={`flex items-center justify-between px-8 py-6 border-t-2 ${
                isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${newProjectForm.name.trim() ? (isDarkMode ? 'bg-white' : 'bg-black') : 'bg-gray-400'}`} />
                  <span className={`text-sm font-medium ${
                    newProjectForm.name.trim() 
                      ? (isDarkMode ? 'text-white' : 'text-black') 
                      : (isDarkMode ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    {newProjectForm.name.trim() ? 'Ready to create' : 'Project name required'}
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
                    onClick={handleConfirmCreateProject}
                    disabled={!newProjectForm.name.trim()}
                    className={`px-8 py-3 text-base font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      isDarkMode 
                        ? 'bg-white text-black hover:bg-gray-100 shadow-white/20' 
                        : 'bg-black text-white hover:bg-gray-900 shadow-black/20'
                    }`}
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">For (person)</label>
                <input
                  type="text"
                  value={editForm.forPerson || editForm.category || ''}
                  onChange={(e) => setEditForm({...editForm, forPerson: e.target.value})}
                  placeholder="Who is this for?"
                  className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isDarkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
