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
  Users,
  Flag,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Target,
  X,
  Eye,
  Edit3,
  Heart,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../common/PageHeader';
import EditableField from '../common/EditableField';
import { useTheme } from '../../context/ThemeContext';
import { notifyProjectAssignment, notifyProjectUpdate } from '../../utils/notifications';
import ProjectDetailsPage from './ProjectDetailsPage';

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

  useEffect(() => {
    fetchProjects();
  }, []);

  // Check if returning from user selection
  useEffect(() => {
    const returnData = sessionStorage.getItem('returnToProject');
    const selectedUsers = sessionStorage.getItem('selectedProjectUsers');

    if (returnData) {
      const projectData = JSON.parse(returnData);
      sessionStorage.removeItem('returnToProject');

      // If it's a new project, restore it with selected users
      if (projectData.id === 'new') {
        const updatedProject = {
          ...projectData,
          forPerson: selectedUsers || projectData.forPerson || ''
        };
        setViewProject(updatedProject);
        if (selectedUsers) {
          sessionStorage.removeItem('selectedProjectUsers');
        }
      } else {
        // Find the existing project and open it
        const existingProject = projects.find(p => p.id === projectData.id);
        if (existingProject) {
          const updatedProject = {
            ...existingProject,
            forPerson: selectedUsers || existingProject.forPerson || ''
          };
          setViewProject(updatedProject);
          if (selectedUsers) {
            sessionStorage.removeItem('selectedProjectUsers');
          }
        }
      }
    }
  }, [projects]);

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

  const addNewProject = (status = 'Not started') => {
    if (!user) {
      console.error('Cannot add project. User is not authenticated.');
      return;
    }
    if (user?.role !== 'manager') {
      return;
    }

    const newProject = {
      id: 'new',
      name: '',
      status,
      priority: 'Medium',
      isFavorite: false,
      forPerson: '',
      notes: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      ownerName: user.name,
      createdAt: new Date().toISOString()
    };

    setViewProject(newProject);
  };

  const handleUpdateField = async (projectId, field, value) => {
    // Only managers can update any field on projects
    if (user?.role !== 'manager') return;

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
    // Persist to backend
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
        const updated = await response.json();
        setProjects(projects.map(p => (p.id === projectId ? updated : p)));
      } else {
        console.error('Failed to update project');
      }
    } catch (err) {
      console.error('Error updating project:', err);
    }
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

  const handleToggleFavorite = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedFavoriteStatus = !project.isFavorite;

    // Update local state immediately for responsive UI
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, isFavorite: updatedFavoriteStatus } : p
    ));

    // Persist to backend
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ isFavorite: updatedFavoriteStatus })
      });

      if (!response.ok) {
        // Revert local state if backend update fails
        setProjects(projects.map(p =>
          p.id === projectId ? { ...p, isFavorite: project.isFavorite } : p
        ));
        console.error('Failed to update favorite status');
      }
    } catch (err) {
      // Revert local state if backend update fails
      setProjects(projects.map(p =>
        p.id === projectId ? { ...p, isFavorite: project.isFavorite } : p
      ));
      console.error('Error updating favorite status:', err);
    }
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

  const handleOpenProject = (project) => {
    setViewProject({ ...project });
  };

  const handleCloseProject = () => setViewProject(null);

  const handleConfirmCreateProject = async (projectData) => {
    if (!projectData.name || !projectData.name.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          name: projectData.name,
          status: projectData.status,
          priority: projectData.priority,
          isFavorite: projectData.isFavorite || false,
          forPerson: projectData.forPerson,
          notes: projectData.notes,
          startDate: projectData.startDate,
          endDate: projectData.endDate
        })
      });

      if (response.ok) {
        const created = await response.json();
        setProjects(prev => [...prev, created]);
        setViewProject(null);
        // Navigate to the newly created project
        navigate(`/projects/${created.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
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

  // Enhanced Beautiful Theme
  const pageBg = isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900';
  const cardBg = isDarkMode ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200/50 backdrop-blur-sm shadow-xl';
  const subtleBg = isDarkMode ? 'bg-gray-800/60' : 'bg-gray-50/60';
  const subtleContainer = isDarkMode ? 'bg-gray-800/40' : 'bg-gray-100/40';
  const hoverSubtle = isDarkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50/60';
  const divideColor = isDarkMode ? 'divide-gray-700/50' : 'divide-gray-200/50';
  const inputClass = isDarkMode
    ? 'bg-gray-800/60 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-sm'
    : 'bg-white/60 border-gray-300/50 text-gray-900 placeholder-gray-500 backdrop-blur-sm';
  const selectedToggle = isDarkMode ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg';
  const unselectedToggle = isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' : 'text-gray-600 hover:text-black hover:bg-gray-100/50';

  return (
    <div className={`content p-4 lg:p-6 font-sans ${pageBg}`}>
      {/* Enhanced Beautiful Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mr-8 shadow-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 transform hover:scale-105 transition-all duration-300`}>
              <ProjectsIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className={`text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2`}>Projects</h1>
              <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>Manage and execute projects from start to finish</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {user?.role === 'manager' && (
              <button
                onClick={() => addNewProject()}
                className="group relative flex items-center px-8 py-4 text-base font-semibold rounded-2xl transition-all duration-200 ease-in-out shadow-2xl hover:shadow-3xl transform hover:scale-110 hover:-translate-y-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="w-6 h-6 flex items-center justify-center mr-3 relative z-10">
                  <Plus size={16} className="transition-transform duration-200 group-hover:rotate-90" />
                </div>
                <span className="relative z-10">New Project</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Beautiful Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className={`group p-8 rounded-3xl shadow-2xl border transition-all duration-500 hover:shadow-3xl hover:scale-110 transform ${cardBg} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2`}>{stats.total}</p>
              <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Projects</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        <div className={`group p-8 rounded-3xl shadow-2xl border transition-all duration-500 hover:shadow-3xl hover:scale-110 transform ${cardBg} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2`}>{stats.completed}</p>
              <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        <div className={`group p-8 rounded-3xl shadow-2xl border transition-all duration-500 hover:shadow-3xl hover:scale-110 transform ${cardBg} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-4xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2`}>{stats.inProgress}</p>
              <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-600 shadow-lg">
              <Clock className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        <div className={`group p-8 rounded-3xl shadow-2xl border transition-all duration-500 hover:shadow-3xl hover:scale-110 transform ${cardBg} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className={`text-4xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent mb-2`}>{stats.notStarted}</p>
              <p className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Not Started</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-500 to-slate-600 shadow-lg">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className={`p-6 rounded-2xl shadow-xl border mb-8 ${cardBg} backdrop-blur-sm`}>
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

      {/* Enhanced View Toggle */}
      <div className={`flex items-center space-x-3 p-2 rounded-2xl mb-10 max-w-md ${subtleContainer} shadow-lg backdrop-blur-sm`}>
        <button
          onClick={() => setView('By Status')}
          className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg ${view === 'By Status' ? selectedToggle : unselectedToggle
            } transition-colors duration-200`}
        >
          By Status
        </button>
        <button
          onClick={() => setView('All Projects')}
          className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg ${view === 'All Projects' ? selectedToggle : unselectedToggle
            } transition-colors duration-200`}
        >
          All Projects
        </button>
        <button
          onClick={() => setView('Gantt')}
          className={`flex items-center px-3 py-1.5 text-sm font-semibold rounded-lg ${view === 'Gantt' ? selectedToggle : unselectedToggle
            } transition-colors duration-200`}
        >
          Gantt
        </button>
      </div>

      {view === 'By Status' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map(status => (
            <div key={status} className={`p-6 rounded-3xl shadow-2xl border min-h-[500px] ${cardBg} backdrop-blur-sm relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-500
                ${status === 'Not started' ? 'from-gray-500 to-slate-600' : 
                  status === 'In progress' ? 'from-blue-500 to-purple-600' : 'from-green-500 to-emerald-600'}"></div>
              <div className={`flex items-center justify-between mb-6 pb-4 border-b-2 relative z-10 ${status === 'Not started' ? 'border-gray-400/50' :
                status === 'In progress' ? 'border-blue-500/50' : 'border-green-500/50'
                }`}>
                <h2 className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${status === 'Not started' ? 'from-gray-600 to-slate-600' :
                  status === 'In progress' ? 'from-blue-600 to-purple-600' : 'from-green-600 to-emerald-600'
                  }`}>
                  {status}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-lg ${status === 'Not started' ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white' :
                  status === 'In progress' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  }`}>
                  {filteredProjects.filter(p => p.status === status).length}
                </span>
              </div>
              <div className="space-y-4">
                {filteredProjects.filter(p => p.status === status).map(project => (
                  <div
                    key={project.id}
                    className={`group relative p-0 rounded-3xl border-2 cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:-translate-y-2 transform ${isDarkMode ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 hover:border-gray-600/70 backdrop-blur-xl' : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-gray-200/50 hover:border-gray-300/70 backdrop-blur-xl shadow-xl'} overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:via-transparent before:to-black/5 before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100`}
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
                        return;
                      }
                      handleOpenProject(project);
                    }}
                  >
                    {/* Enhanced status indicator with gradient glow */}
                    <div className={`absolute top-0 left-0 right-0 h-2 ${project.status === 'Not started' ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-slate-500' :
                      project.status === 'In progress' ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
                      } shadow-lg`}>
                      <div className={`absolute inset-0 blur-sm ${project.status === 'Not started' ? 'bg-gradient-to-r from-gray-400 via-gray-500 to-slate-500' :
                        project.status === 'In progress' ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
                        } opacity-60`}></div>
                    </div>

                    {/* Update indicator and Favorite icon in top-right corner */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                      {/* Favorite icon - only shown when project is favorited */}
                      {project.isFavorite && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(project.id);
                          }}
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg transform transition-all duration-300 hover:scale-110"
                          title="Remove from favorites"
                        >
                          <Heart size={12} className="fill-current" />
                        </button>
                      )}

                      {/* Update indicator */}
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold shadow-lg transform transition-all duration-300 hover:scale-110" title={`${project.updateCount || 3} recent updates`}>
                        <div className="relative">
                          <span className="block">{project.updateCount || 3}</span>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500 animate-ping opacity-75"></div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced floating overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500
                      ${project.status === 'Not started' ? 'from-gray-500/20 via-slate-500/20 to-gray-600/20' : 
                        project.status === 'In progress' ? 'from-blue-500/20 via-purple-500/20 to-pink-500/20' : 'from-green-500/20 via-emerald-500/20 to-teal-500/20'}"></div>

                    <div className="flex flex-col space-y-6 relative z-10 p-6">
                      {/* Enhanced header with floating elements */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="relative">
                            <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate drop-shadow-sm">
                              {project.name}
                            </h3>
                            {/* Floating priority indicator */}
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full shadow-lg ${project.priority === 'High' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                              project.priority === 'Medium' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                'bg-gradient-to-br from-green-400 to-green-600'
                              } opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced priority and status badges with glowing effects */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`relative inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold shadow-lg border-2 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm ${getPriorityClass(project.priority)}`}>
                          <div className={`absolute inset-0 rounded-2xl blur-sm opacity-40 ${project.priority === 'High' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            project.priority === 'Medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              'bg-gradient-to-r from-green-400 to-green-600'
                            }`}></div>
                          <Flag size={12} className="mr-2 relative z-10" />
                          <span className="relative z-10">{project.priority}</span>
                        </span>
                        <span className={`relative inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold shadow-lg border-2 transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm ${getStatusClass(project.status)}`}>
                          <div className={`absolute inset-0 rounded-2xl blur-sm opacity-40 ${project.status === 'Not started' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                            project.status === 'In progress' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'
                            }`}></div>
                          <div className="relative z-10 flex items-center">
                            {project.status === 'Not started' && <Clock size={12} className="mr-2" />}
                            {project.status === 'In progress' && <AlertCircle size={12} className="mr-2" />}
                            {project.status === 'Done' && <CheckCircle size={12} className="mr-2" />}
                            {project.status}
                          </div>
                        </span>
                      </div>

                      {/* Enhanced assignment with better visual hierarchy */}
                      {project.forPerson && (
                        <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50/80 border-blue-200/50'}`}>
                          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                            <Users size={14} className="text-white" />
                          </div>
                          <div>
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                              Assigned to
                            </span>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              {project.forPerson}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Enhanced dates with modern card design */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50/80 border-green-200/50'}`}>
                          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                            <Calendar size={14} className="text-white" />
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>Start</p>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                              {project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50/80 border-red-200/50'}`}>
                          <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                            <Calendar size={14} className="text-white" />
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>End</p>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                              {project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced notes preview with gradient border */}
                      {project.notes && (
                        <div className={`relative p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${isDarkMode ? 'bg-gray-700/30 border-gray-600/30' : 'bg-gray-50/80 border-gray-200/50'}`}>
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${project.status === 'Not started' ? 'from-gray-500 to-slate-600' :
                            project.status === 'In progress' ? 'from-blue-500 to-purple-600' : 'from-green-500 to-emerald-600'
                            }`}></div>
                          <div className="flex items-start gap-3 relative z-10">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 shadow-md flex-shrink-0">
                              <FileText size={12} className="text-white" />
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-3 leading-relaxed`}>
                              {project.notes.length > 120 ? project.notes.substring(0, 120) + '...' : project.notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Project Owner section at bottom */}
                      <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50/80 border-purple-200/50'}`}>
                        <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg transition-all duration-300 group-hover:scale-110 ${project.status === 'Not started' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                          project.status === 'In progress' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'
                          }`}>
                          {project.ownerName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {project.ownerName}
                          </span>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                            Project Owner
                          </div>
                        </div>
                      </div>

                      {/* Enhanced action button with gradient and glow */}
                      {/* Removed View Details button */}
                    </div>
                  </div>
                ))}
                {user?.role === 'manager' && (
                  <button
                    onClick={() => addNewProject(status)}
                    className={`group flex items-center w-full justify-center px-8 py-6 text-base font-bold border-3 border-dashed rounded-3xl transition-all duration-500 hover:scale-110 hover:-translate-y-2 transform shadow-xl hover:shadow-2xl ${isDarkMode ? 'text-gray-400 border-gray-600/50 hover:text-white hover:bg-gray-700/40 hover:border-gray-500/70 backdrop-blur-xl' : 'text-gray-600 border-gray-400/50 hover:text-gray-800 hover:bg-gray-100/40 hover:border-gray-500/70 backdrop-blur-xl'
                      } relative overflow-hidden`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-15 transition-opacity duration-500 ${status === 'Not started' ? 'from-gray-500/30 via-slate-500/30 to-gray-600/30' :
                      status === 'In progress' ? 'from-blue-500/30 via-purple-500/30 to-pink-500/30' : 'from-green-500/30 via-emerald-500/30 to-teal-500/30'
                      }`}></div>
                    <div className="w-6 h-6 flex items-center justify-center mr-4 rounded-full transition-all duration-200 ease-in-out group-hover:scale-110 group-hover:rotate-90 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg relative z-10">
                      <Plus size={14} className="text-white" />
                    </div>
                    <span className="relative z-10 transition-all duration-300 group-hover:font-extrabold">New Project</span>
                    <div className={`absolute inset-0 rounded-3xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${status === 'Not started' ? 'border-gray-400/50' :
                      status === 'In progress' ? 'border-blue-400/50' : 'border-green-400/50'
                      }`}></div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Favorite</th>
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
                      {user?.role === 'manager' ? (
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
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(project.status)}`}>
                          {project.status}
                        </span>
                      )}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.isFavorite && (
                        <button
                          onClick={() => handleToggleFavorite(project.id)}
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg transform transition-all duration-300 hover:scale-110"
                          title="Remove from favorites"
                        >
                          <Heart size={12} className="fill-current" />
                        </button>
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
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenProject(project)}
                          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl ${isDarkMode ? 'text-blue-400 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30' : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'}`}
                        >
                          <Eye size={14} className="mr-2" />
                          View Details
                        </button>
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleEditProject(project)}
                            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl ${isDarkMode ? 'text-green-400 bg-green-900/20 hover:bg-green-900/30 border border-green-500/30' : 'text-green-600 bg-green-50 hover:bg-green-100 border border-green-200'}`}
                          >
                            <Edit3 size={14} className="mr-2" />
                            Edit
                          </button>
                        )}
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                          >
                            <TrashIcon size={14} className="mr-2" />
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
        <div className={`rounded-3xl shadow-2xl border p-8 ${cardBg} backdrop-blur-xl`}>
          <div className="space-y-6">
            {filteredProjects.map((p) => {
              const progress = getProgressFromStatus(p.status);
              return (
                <div key={p.id} className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-lg ${p.status === 'Not started' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                        p.status === 'In progress' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'
                        }`}>
                        {p.ownerName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="text-lg font-semibold truncate pr-3">{p.name}</span>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {p.forPerson && `Assigned to ${p.forPerson}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityClass(p.priority)}`}>
                        {p.priority}
                      </span>
                      {p.isFavorite && (
                        <button
                          onClick={() => handleToggleFavorite(p.id)}
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg transform transition-all duration-300 hover:scale-110"
                          title="Remove from favorites"
                        >
                          <Heart size={12} className="fill-current" />
                        </button>
                      )}
                      <span className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${p.status === 'Not started' ? 'from-gray-600 to-slate-600' :
                        p.status === 'In progress' ? 'from-blue-600 to-purple-600' : 'from-green-600 to-emerald-600'
                        }`}>{progress}%</span>
                    </div>
                  </div>
                  <div className={`h-4 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                    <div
                      className={`h-4 rounded-full transition-all duration-700 shadow-lg ${p.status === 'Done' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        p.status === 'In progress' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                          'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <div className="flex items-center gap-4">
                      {p.startDate && (
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Start: {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {p.endDate && (
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          End: {new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )
      }

      {/* Project Details Page */}
      {
        viewProject && (
          <ProjectDetailsPage
            project={viewProject}
            onClose={handleCloseProject}
            onUpdate={(updatedProject) => {
              if (updatedProject.id === 'new') {
                handleConfirmCreateProject(updatedProject);
              } else {
                setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                setViewProject(updatedProject);
              }
            }}
            isManager={user?.role === 'manager'}
            isNewProject={viewProject.id === 'new'}
          />
        )
      }

      {/* Edit Project Modal */}
      {
        editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, forPerson: e.target.value })}
                    placeholder="Who is this for?"
                    className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className={`px-6 py-2 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-sm ${isDarkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-600' : 'text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ProjectsPage;