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
import ProjectDetailsPage from '../ProjectDetailPage/ProjectDetailPage';

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
    const returnData = sessionStorage.getItem('projectPickerReturn');
    const selectedUsers = sessionStorage.getItem('selectedProjectUsers');

    if (returnData && selectedUsers) {
      try {
        const pickerData = JSON.parse(returnData);
        console.log('ProjectsPage: Found return data and selected users', pickerData, selectedUsers);

        // If there's a saved project state, restore it
        if (pickerData.projectState) {
          const restoredProject = {
            ...pickerData.projectState,
            forPerson: selectedUsers
          };
          console.log('ProjectsPage: Restoring project with state', restoredProject);
          setViewProject(restoredProject);
        } else {
          // Fallback to old behavior
          if (pickerData.id === 'new') {
            const updatedProject = {
              id: 'new',
              name: '',
              status: 'Not started',
              priority: 'Medium',
              isFavorite: false,
              forPerson: selectedUsers,
              notes: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
              ownerName: user?.name,
              createdAt: new Date().toISOString()
            };
            setViewProject(updatedProject);
          } else {
            // Find the existing project and open it
            const existingProject = projects.find(p => p.id === pickerData.id);
            if (existingProject) {
              const updatedProject = {
                ...existingProject,
                forPerson: selectedUsers
              };
              setViewProject(updatedProject);
            }
          }
        }
        
        // Clean up session storage
        sessionStorage.removeItem('selectedProjectUsers');
        sessionStorage.removeItem('projectPickerReturn');
      } catch (error) {
        console.error('Error parsing return data:', error);
        // Clean up on error
        sessionStorage.removeItem('selectedProjectUsers');
        sessionStorage.removeItem('projectPickerReturn');
      }
    }
  }, [projects, user]);

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

    navigate('/projects/new');
  };

  const handleUpdateField = async (projectId, field, value) => {
    console.log('handleUpdateField called:', { projectId, field, value, userRole: user?.role });
    
    // Only managers can update any field except status - all users can update status
    if (user?.role !== 'manager' && field !== 'status') {
      console.log('Access denied: user is not manager and field is not status');
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return;
    }

    // Optimistic UI update - immediately update the local state
    const updatedProjects = projects.map(p => 
      p.id === projectId ? { 
        ...p, 
        [field]: value, 
        updatedAt: new Date().toISOString(),
        // Increment change count for user actions (not manager actions)
        changeCount: user?.role !== 'manager' ? (p.changeCount || 0) + 1 : p.changeCount || 0
      } : p
    );
    setProjects(updatedProjects);

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
    if (field === 'status' && value !== project.status) {
      // Find the assigned user if exists
      if (project.forPerson) {
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
    }
    
    // Persist to backend
    try {
      const endpoint = field === 'status' 
        ? `http://localhost:5000/api/projects/${projectId}/status`
        : `http://localhost:5000/api/projects/${projectId}`;
      
      console.log('Making API call to:', endpoint, 'with data:', { [field]: value });
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ [field]: value })
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        // Revert optimistic update if API call fails
        const errorText = await response.text();
        console.error('Failed to update project:', response.status, errorText);
        setProjects(projects); // Revert to previous state
        
        // Show error to user
        alert(`Failed to update project: ${errorText}`);
      } else {
        const updated = await response.json();
        console.log('Project updated successfully:', updated);
        // Ensure we have the latest data from server
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updated } : p));
      }
    } catch (err) {
      console.error('Error updating project:', err);
      // Revert optimistic update on error
      setProjects(projects);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (user?.role !== 'manager') return;

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        console.error('Failed to delete project');
        alert('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
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
    navigate(`/projects/${project.id}`);
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
    switch (priority) {
      case 'High': return 'bg-black text-white border border-gray-300';
      case 'Medium': return 'bg-gray-600 text-white border border-gray-400';
      case 'Low': return 'bg-gray-300 text-black border border-gray-400';
      default: return 'bg-gray-400 text-white border border-gray-300';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'In progress': return 'bg-gray-600 text-white border border-gray-400';
      case 'Not started': return 'bg-gray-300 text-black border border-gray-400';
      case 'Done': return 'bg-black text-white border border-gray-300';
      default: return 'bg-gray-400 text-white border border-gray-300';
    }
  };

  const filteredProjects = (projects || []).filter(project => {
    const matchesSearch = (project.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || project.priority === filterPriority;
    const matchesOwner = filterOwner === 'all' || project.ownerUid === filterOwner;
    const forValue = (project.forPerson || project.category || '').toLowerCase();
    const matchesFor = !filterFor || forValue.includes(filterFor.toLowerCase());
    
    // Access control logic
    const isAssignedToUser = project.forPerson && project.forPerson.toLowerCase().includes(user?.name?.toLowerCase() || '');
    const isOwner = project.ownerUid === user?.id || project.ownerName === user?.name;
    const isAssigned = project.forPerson && project.forPerson.trim() !== '';
    
    const hasAccess = isAssigned ? 
      (user?.role === 'manager' || isAssignedToUser) : 
      isOwner;

    return matchesSearch && matchesPriority && matchesOwner && matchesFor && hasAccess;
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

  // Modern Enhanced Theme
  const pageBg = 'text-black bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30';
  const cardBg = 'bg-white/80 backdrop-blur-sm border-gray-200/60 shadow-lg shadow-gray-200/50';
  const subtleBg = 'bg-gradient-to-r from-gray-50 to-slate-50';
  const subtleContainer = 'bg-gradient-to-r from-gray-100 to-slate-100 shadow-inner';
  const hoverSubtle = 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50';
  const divideColor = 'divide-gray-200/70';
  const inputClass = 'bg-white/90 backdrop-blur-sm border-gray-300/60 text-black placeholder-gray-500 shadow-sm';
  const selectedToggle = 'bg-gradient-to-r from-black to-gray-800 text-white shadow-lg';
  const unselectedToggle = 'text-gray-600 hover:text-black hover:bg-gradient-to-r hover:from-gray-100 hover:to-slate-100';

  return (
    <div className={`content p-4 lg:p-8 font-sans min-h-screen ${pageBg}`}>
      <style jsx>{`
        select {
          padding-left: 2.5rem !important;
        }
        select option {
          background: white;
          color: black;
          font-weight: bold;
        }
      `}</style>
      {/* Enhanced Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mr-6 bg-gradient-to-br from-black via-gray-800 to-slate-700 shadow-xl shadow-black/20">
              <ProjectsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-black via-gray-800 to-slate-600 bg-clip-text text-transparent mb-2">Projects</h1>
              <p className="text-gray-600 text-lg font-medium">Manage and execute projects from start to finish</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user?.role === 'manager' && (
              <button
                onClick={() => addNewProject()}
                className="flex items-center px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-black via-gray-800 to-slate-700 text-white hover:from-gray-800 hover:via-slate-700 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <Plus size={18} className="mr-2" />
                New Project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className={`p-6 rounded-2xl border ${cardBg} hover:shadow-xl hover:scale-105 transition-all duration-300 group`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent mb-2">{stats.total}</p>
              <p className="text-sm text-gray-600 font-medium">Total Projects</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl border ${cardBg} hover:shadow-xl hover:scale-105 transition-all duration-300 group`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">{stats.completed}</p>
              <p className="text-sm text-gray-600 font-medium">Completed</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl border ${cardBg} hover:shadow-xl hover:scale-105 transition-all duration-300 group`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">{stats.inProgress}</p>
              <p className="text-sm text-gray-600 font-medium">In Progress</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-2xl border ${cardBg} hover:shadow-xl hover:scale-105 transition-all duration-300 group`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent mb-2">{stats.notStarted}</p>
              <p className="text-sm text-gray-600 font-medium">Not Started</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className={`p-8 rounded-3xl shadow-2xl border mb-12 ${cardBg} backdrop-blur-lg hover:shadow-3xl transition-all duration-300`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${inputClass}`}
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
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Owner</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${inputClass}`}
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
              className={`w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg ${isDarkMode ? 'text-gray-200 bg-gradient-to-r from-gray-800 to-slate-800 hover:from-gray-700 hover:to-slate-700' : 'text-gray-600 bg-gradient-to-r from-gray-100 to-slate-100 hover:from-gray-200 hover:to-slate-200'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced View Toggle */}
      <div className={`flex items-center space-x-4 p-3 rounded-3xl mb-12 max-w-lg ${subtleContainer} shadow-xl backdrop-blur-lg hover:shadow-2xl transition-all duration-300`}>
        <button
          onClick={() => setView('By Status')}
          className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl ${view === 'By Status' ? selectedToggle : unselectedToggle
            } transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
        >
          By Status
        </button>
        <button
          onClick={() => setView('All Projects')}
          className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl ${view === 'All Projects' ? selectedToggle : unselectedToggle
            } transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
        >
          All Projects
        </button>
        <button
          onClick={() => setView('Gantt')}
          className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl ${view === 'Gantt' ? selectedToggle : unselectedToggle
            } transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg`}
        >
          Gantt
        </button>
      </div>

      {view === 'By Status' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statuses.map(status => (
            <div key={status} className={`p-6 rounded-3xl border min-h-[480px] ${cardBg} transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] backdrop-blur-lg`}>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200/50">
                <h2 className="text-xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
                  {status}
                </h2>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 shadow-md">
                  {filteredProjects.filter(p => p.status === status).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredProjects.filter(p => p.status === status).length === 0 && (
                  <div className="h-[350px] flex items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-300/60 rounded-2xl bg-gradient-to-br from-gray-50/50 to-slate-50/50 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-slate-200 flex items-center justify-center">
                        <ProjectsIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium">No projects here yet</p>
                    </div>
                  </div>
                )}
                {filteredProjects.filter(p => p.status === status).map(project => (
                  <div
                    key={project.id}
                    className="group relative p-0 rounded-3xl border-2 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] bg-white/90 hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30 overflow-hidden shadow-xl border-gray-200/60 backdrop-blur-sm"
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
                    {/* Enhanced Status indicator */}
                    <div className={`absolute top-0 left-0 right-0 h-2 ${project.status === 'Not started' ? 'bg-gradient-to-r from-gray-400 to-slate-500' :
                      project.status === 'In progress' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'
                      } shadow-lg`}></div>

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

                      {/* Change indicator - only for managers when there are changes */}
                      {user?.role === 'manager' && project.changeCount > 0 && (
                        <div 
                          className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold shadow-lg transform transition-all duration-300 hover:scale-110 cursor-pointer" 
                          title={`${project.changeCount} recent changes`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Reset change count when manager clicks
                            handleUpdateField(project.id, 'changeCount', 0);
                          }}
                        >
                          <div className="relative">
                            <span className="block">{project.changeCount}</span>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500 animate-ping opacity-75"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced floating overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-15 transition-all duration-700 ${project.status === 'Not started' ? 'from-gray-500/30 via-slate-500/30 to-gray-600/30' : 
                        project.status === 'In progress' ? 'from-blue-500/30 via-purple-500/30 to-pink-500/30' : 'from-green-500/30 via-emerald-500/30 to-teal-500/30'}`}></div>

                    <div className="flex flex-col space-y-5 relative z-10 p-8">
                      {/* Enhanced header with floating elements */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="relative">
                            <h3 className="font-bold text-xl text-black truncate mb-3 leading-tight">
                              {project.name}
                            </h3>
                            {/* Enhanced Floating priority indicator */}
                            <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full shadow-xl ${project.priority === 'High' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                              project.priority === 'Medium' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                'bg-gradient-to-br from-green-400 to-green-600'
                              } opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse ring-2 ring-white`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Modern badges - Editable */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative group">
                          <select
                            value={project.priority}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateField(project.id, 'priority', e.target.value);
                            }}
                            className={`appearance-none cursor-pointer inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-0 outline-none ${getPriorityClass(project.priority)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <Flag size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                        </div>
                        <div className="relative group">
                          <select
                            value={project.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateField(project.id, 'status', e.target.value);
                            }}
                            className={`appearance-none cursor-pointer inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-300 border-0 outline-none ${getStatusClass(project.status)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Not started">Not started</option>
                            <option value="In progress">In progress</option>
                            <option value="Done">Done</option>
                          </select>
                          {project.status === 'Not started' && <Clock size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />}
                          {project.status === 'In progress' && <AlertCircle size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />}
                          {project.status === 'Done' && <CheckCircle size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />}
                        </div>
                      </div>

                      {/* Enhanced assignment with better visual hierarchy */}
                      {project.forPerson && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-black to-gray-800 shadow-lg">
                            <Users size={16} className="text-white" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Assigned to
                            </span>
                            <p className="text-sm font-bold text-black">
                              {project.forPerson}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Enhanced Modern date cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                            <Calendar size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Start</p>
                            <p className="text-sm font-bold text-black">
                              {project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/60 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg">
                            <Calendar size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">End</p>
                            <p className="text-sm font-bold text-black">
                              {project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>



                      {/* Enhanced Project Owner section at bottom */}
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/60 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br from-black to-gray-800 shadow-lg">
                          {project.ownerName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-black">
                            {project.ownerName}
                          </span>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                    className="flex items-center w-full justify-center px-8 py-6 text-sm font-bold border-2 border-dashed rounded-2xl text-gray-600 border-gray-300/60 hover:text-black hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 hover:border-gray-400 transition-all duration-500 hover:shadow-xl hover:scale-[1.02] backdrop-blur-sm"
                  >
                    <div className="w-8 h-8 flex items-center justify-center mr-4 rounded-xl bg-gradient-to-br from-black to-gray-800 shadow-lg">
                      <Plus size={16} className="text-white" />
                    </div>
                    New Project
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'All Projects' && (
        <div className={`rounded-3xl shadow-2xl border overflow-hidden ${cardBg} backdrop-blur-lg`}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${divideColor}`}>
              <thead className={isDarkMode ? 'bg-gradient-to-r from-gray-800 to-slate-800' : 'bg-gradient-to-r from-gray-50 to-slate-50'}>
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Project</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Creator</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Owner</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Priority</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Favorite</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">For (person)</th>
                  <th className="px-8 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${divideColor}`}>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className={`${hoverSubtle} transition-all duration-300 hover:shadow-lg`}>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {user?.role === 'manager' ? (
                        <EditableField
                          value={project.name}
                          onSave={(value) => handleUpdateField(project.id, 'name', value)}
                          className="font-bold"
                          required
                          saveOnEnter={false}
                        />
                      ) : (
                        <span className="font-bold">{project.name}</span>
                      )}
                    </td>
                    <td className={`px-8 py-6 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {project.ownerName}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
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
                    <td className="px-8 py-6 whitespace-nowrap">
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
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ${getPriorityClass(project.priority)}`}>
                            {project.priority}
                          </span>
                        </EditableField>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg ${getPriorityClass(project.priority)}`}>
                          {project.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {project.isFavorite && (
                        <button
                          onClick={() => handleToggleFavorite(project.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold shadow-xl transform transition-all duration-300 hover:scale-110"
                          title="Remove from favorites"
                        >
                          <Heart size={14} className="fill-current" />
                        </button>
                      )}
                    </td>
                    <td className={`px-8 py-6 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {user?.role === 'manager' ? (
                        <EditableField
                          value={project.forPerson || ''}
                          onSave={(value) => handleUpdateField(project.id, 'forPerson', value)}
                          saveOnEnter={false}
                          type="textarea"
                          rows={2}
                        />
                      ) : (
                        <div className="max-w-xs">
                          {project.forPerson ? (
                            <div className="space-y-1">
                              {project.forPerson.split(',').map((name, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                    {name.trim().charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs">{name.trim()}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={`px-8 py-6 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenProject(project)}
                          className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl ${isDarkMode ? 'text-blue-400 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 hover:from-blue-900/40 hover:to-indigo-900/40 border border-blue-500/40' : 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/60'}`}
                        >
                          <Eye size={16} className="mr-2" />
                          View Details
                        </button>
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleEditProject(project)}
                            className={`flex items-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl ${isDarkMode ? 'text-green-400 bg-gradient-to-r from-green-900/30 to-emerald-900/30 hover:from-green-900/40 hover:to-emerald-900/40 border border-green-500/40' : 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200/60'}`}
                          >
                            <Edit3 size={16} className="mr-2" />
                            Edit
                          </button>
                        )}
                        {user?.role === 'manager' && (
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl"
                          >
                            <TrashIcon size={16} className="mr-2" />
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
        <div className={`rounded-3xl shadow-2xl border p-10 ${cardBg} backdrop-blur-xl`}>
          <div className="space-y-8">
            {filteredProjects.map((p) => {
              const progress = getProgressFromStatus(p.status);
              return (
                <div key={p.id} className={`p-8 rounded-3xl border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800/60 to-slate-800/60 border-gray-700/60' : 'bg-gradient-to-r from-white/90 to-slate-50/90 border-gray-200/60'} backdrop-blur-lg`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-xl ${p.status === 'Not started' ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                        p.status === 'In progress' ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'
                        }`}>
                        {p.ownerName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="text-xl font-bold truncate pr-3 bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">{p.name}</span>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {p.forPerson && `Assigned to ${p.forPerson}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getPriorityClass(p.priority)}`}>
                        {p.priority}
                      </span>
                      {p.isFavorite && (
                        <button
                          onClick={() => handleToggleFavorite(p.id)}
                          className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold shadow-xl transform transition-all duration-300 hover:scale-110"
                          title="Remove from favorites"
                        >
                          <Heart size={14} className="fill-current" />
                        </button>
                      )}
                      <span className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${p.status === 'Not started' ? 'from-gray-600 to-slate-600' :
                        p.status === 'In progress' ? 'from-blue-600 to-purple-600' : 'from-green-600 to-emerald-600'
                        }`}>{progress}%</span>
                    </div>
                  </div>
                  <div className={`h-6 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden border border-gray-300/50`}>
                    <div
                      className={`h-6 rounded-full transition-all duration-1000 shadow-xl ${p.status === 'Done' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        p.status === 'In progress' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                          'bg-gradient-to-r from-gray-400 to-gray-500'
                        } relative overflow-hidden`}
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <div className="flex items-center gap-6">
                      {p.startDate && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Start: {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      {p.endDate && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            End: {new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getStatusClass(p.status)}`}>
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
                  <label className="block text-sm font-medium mb-1">For  fuad (person)</label>
                  <input
                    type="text"
                    value={editForm.forPerson || editForm.category || ''}
                    // onChange={(e) => setEditForm({ ...editForm, forPerson: e.target.value })}
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