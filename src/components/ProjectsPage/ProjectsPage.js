import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Users,
  Flag,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Paperclip,
  Search,
  Filter,
  Pin,
  Archive,
  Pause,
  Lock,
  Globe,
  Flame,
  Star,
  CheckSquare,
  Circle,
  ChevronDown,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const ProjectsPage = () => {
  const { user, users, setUsers, canCreateProjects } = useAppContext();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [loading, setLoading] = useState(true);

  // Priority Selector Component
  const PrioritySelector = ({ priority, onChange, projectId, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const priorityOptions = [
      { value: 'Low', label: 'Low', hoverColor: isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-50' },
      { value: 'Medium', label: 'Medium', hoverColor: isDarkMode ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-50' },
      { value: 'High', label: 'High', hoverColor: isDarkMode ? 'hover:bg-orange-500/20' : 'hover:bg-orange-50' },
      { value: 'Critical', label: 'Critical', hoverColor: isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50' }
    ];

    const currentPriority = priorityOptions.find(option => option.value === priority) || priorityOptions[1];

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={dropdownRef} onClick={(e) => { e.stopPropagation(); if (onClick) onClick(e); }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-xs font-medium flex items-center gap-1.5 bg-transparent focus:outline-none min-w-[80px] ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'} transition-colors`}
        >
          <span className={`${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{currentPriority.label}</span>
          <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
        {isOpen && (
          <div className={`absolute left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} w-full min-w-[100px]`}>
            <div className="py-1">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(projectId, option.value, e);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left ${option.hoverColor} transition-colors ${isDarkMode ? 'text-gray-200' : 'text-black'}`}
                >
                  <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Status Selector Component
  const StatusSelector = ({ status, onChange, projectId, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Get current project to check user permissions
    const currentProject = projects.find(p => (p._id || p.id) === projectId);
    const isOwner = currentProject && user && (currentProject.ownerUid === user.id);
    const isAssigned = currentProject && user && currentProject.assignedTo && 
      (currentProject.assignedTo.includes(user.username) || currentProject.assignedTo.includes(user.name));
    const isViewer = currentProject && user && currentProject.viewers && 
      (currentProject.viewers.includes(user.username) || currentProject.viewers.includes(user.name));
    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
    
    // Determine available status options based on user permissions
    let statusOptions = [
      { value: 'Not Started', label: 'Not Started', hoverColor: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100' },
      { value: 'In Progress', label: 'In Progress', hoverColor: isDarkMode ? 'hover:bg-blue-500/20' : 'hover:bg-blue-50' }
    ];
    
    // Only add "Completed" option if user is owner, viewer, or admin (not just assigned)
    if (isAdmin || isOwner || isViewer) {
      statusOptions.push({ value: 'Completed', label: 'Completed', hoverColor: isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-50' });
    }

    const normalizedStatus = status === 'Done' || status === 'done' ? 'Completed' : 
                             status === 'Not started' || status === 'Not Started' || !status ? 'Not Started' : 
                             'In Progress';
    const currentStatus = statusOptions.find(option => option.value === normalizedStatus) || statusOptions[0];

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={dropdownRef} onClick={(e) => { e.stopPropagation(); if (onClick) onClick(e); }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 bg-transparent focus:outline-none min-w-[100px] ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'} transition-colors`}
        >
          <span className={`${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{currentStatus.label}</span>
          <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
        {isOpen && (
          <div className={`absolute left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} w-full min-w-[120px]`}>
            <div className="py-1">
              {statusOptions.map((option) => {
                const isDisabled = option.value === 'Completed' && isAssigned && !isOwner && !isViewer && !isAdmin;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        onChange(projectId, option.value, e);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full flex items-center px-3 py-2 text-left transition-colors ${
                      isDisabled 
                        ? isDarkMode ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                        : `${option.hoverColor} ${isDarkMode ? 'text-gray-200' : 'text-black'}`
                    }`}
                    title={isDisabled ? 'Only project owners and viewers can mark projects as completed' : ''}
                  >
                    <span className={`font-medium ${
                      isDisabled 
                        ? isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        : isDarkMode ? 'text-gray-200' : 'text-black'
                    }`}>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      fetchAllTasks();
    } else {
      setLoading(false);
    }
  }, [projects]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:9000/api/users?limit=100', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:9000/api/projects', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        const projectsWithDetails = await Promise.all(
          data.map(async (project) => {
            try {
              const projectId = project._id || project.id;
              const detailResponse = await fetch(`http://localhost:9000/api/projects/${projectId}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
              });
              if (detailResponse.ok) {
                const details = await detailResponse.json();
                return {
                  ...project,
                  assignedTo: details.assignedTo || project.assignedTo || [],
                  forPerson: details.forPerson || project.forPerson || ''
                };
              }
            } catch (error) {
              console.error(`Error fetching project details for ${project._id || project.id}:`, error);
            }
            return project;
          })
        );
        setProjects(projectsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    const taskCounts = {};

    for (const project of projects) {
      try {
        const projectId = project._id || project.id;
        const response = await fetch(`http://localhost:9000/api/projects/${projectId}/data`, {
          headers: { 'x-auth-token': token }
        });
        if (response.ok) {
          const data = await response.json();
          const tasks = data.tasks || [];
          taskCounts[projectId] = {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length
          };
        }
      } catch (error) {
        console.error(`Error fetching tasks for project ${project._id || project.id}:`, error);
      }
    }
    setAllTasks(taskCounts);
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusCounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const counts = {
      All: projects.length,
      'Not Started': projects.filter(p => {
        const status = (p.status || '').toLowerCase();
        const isNotStarted = !p.status || status === 'not started' || status === '';
        
        if (!isNotStarted) return false;
        
        // Exclude projects that have passed their due date (they belong in Unfinished)
        if (p.endDate) {
          const endDate = new Date(p.endDate);
          endDate.setHours(0, 0, 0, 0);
          if (today > endDate) return false;
        }
        
        return true;
      }).length,
      'In Progress': projects.filter(p => {
        const status = (p.status || '').toLowerCase();
        const isInProgress = status === 'in progress';
        
        if (!isInProgress) return false;
        
        // Exclude projects that have passed their due date (they belong in Unfinished)
        if (p.endDate) {
          const endDate = new Date(p.endDate);
          endDate.setHours(0, 0, 0, 0);
          if (today > endDate) return false;
        }
        
        return true;
      }).length,
      Completed: projects.filter(p => {
        const status = (p.status || '').toLowerCase();
        return status === 'done';
      }).length,
      Unfinished: projects.filter(p => {
        const status = (p.status || '').toLowerCase();
        if (status === 'done') return false;
        
        // Check if project has passed its due date
        if (p.endDate) {
          const endDate = new Date(p.endDate);
          endDate.setHours(0, 0, 0, 0);
          return today > endDate;
        }
        
        return false;
      }).length,
    };
    return counts;
  };

  const getProjectTasks = (projectId) => {
    return allTasks[projectId] || { total: 0, completed: 0 };
  };

  const getProgressPercent = (projectId) => {
    const tasks = getProjectTasks(projectId);
    if (tasks.total === 0) return 0;
    return Math.round((tasks.completed / tasks.total) * 100);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.name || project.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || (project.priority || '').toLowerCase() === filterPriority.toLowerCase();
    
    let matchesStatus = true;
    if (statusFilter === 'Not Started') {
      const status = (project.status || '').toLowerCase();
      const isNotStarted = !project.status || status === 'not started' || status === '';
      
      if (!isNotStarted) {
        matchesStatus = false;
      } else {
        // Exclude projects that have passed their due date (they belong in Unfinished)
        if (project.endDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(project.endDate);
          endDate.setHours(0, 0, 0, 0);
          matchesStatus = today <= endDate; // Only show if due date hasn't passed
        } else {
          matchesStatus = true; // No due date, so it's still "Not Started"
        }
      }
    } else if (statusFilter === 'In Progress') {
      const status = (project.status || '').toLowerCase();
      const isInProgress = status === 'in progress';
      
      if (!isInProgress) {
        matchesStatus = false;
      } else {
        // Exclude projects that have passed their due date (they belong in Unfinished)
        if (project.endDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(project.endDate);
          endDate.setHours(0, 0, 0, 0);
          matchesStatus = today <= endDate; // Only show if due date hasn't passed
        } else {
          matchesStatus = true; // No due date, so it's still "In Progress"
        }
      }
    } else if (statusFilter === 'Completed') {
      const status = (project.status || '').toLowerCase();
      matchesStatus = status === 'done';
    } else if (statusFilter === 'Unfinished') {
      const status = (project.status || '').toLowerCase();
      if (status === 'done') {
        matchesStatus = false;
      } else {
        // Check if project has passed its due date
        if (project.endDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const endDate = new Date(project.endDate);
          endDate.setHours(0, 0, 0, 0);
          matchesStatus = today > endDate;
        } else {
          matchesStatus = false;
        }
      }
    }
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const addNewProject = () => {
    if (!user) return;
    const companyId = user?.companyId || 'default';
    navigate(`/${companyId}/projects/new`);
  };

  const handleOpenProject = (projectId) => {
    const companyId = user?.companyId || 'default';
    navigate(`/${companyId}/projects/${projectId}`);
  };

  const handlePriorityChange = async (projectId, newPriority, e) => {
    e.stopPropagation();
    
    // Check if user can change priority (only owners, viewers, and admins)
    const currentProject = projects.find(p => (p._id || p.id) === projectId);
    const isOwner = currentProject && user && (currentProject.ownerUid === user.id);
    const isAssigned = currentProject && user && currentProject.assignedTo && 
      (currentProject.assignedTo.includes(user.username) || currentProject.assignedTo.includes(user.name));
    const isViewer = currentProject && user && currentProject.viewers && 
      (currentProject.viewers.includes(user.username) || currentProject.viewers.includes(user.name));
    const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
    
    // Assigned users cannot change priority
    if (isAssigned && !isOwner && !isViewer && !isAdmin) {
      alert('Only project owners and viewers can change project priority.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:9000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ priority: newPriority })
      });

      if (response.ok) {
        // Optimistic update
        setProjects(prevProjects =>
          prevProjects.map(p =>
            (p._id === projectId || p.id === projectId) ? { ...p, priority: newPriority } : p
          )
        );
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Error updating project priority');
    }
  };

  const handleStatusChange = async (projectId, newStatus, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      // Map display status to backend status
      const backendStatus = newStatus === 'Completed' ? 'Done' : 
                           newStatus === 'Not Started' ? 'Not started' : 
                           newStatus;
      
      const response = await fetch(`http://localhost:9000/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status: backendStatus })
      });

      if (response.ok) {
        // Optimistic update
        setProjects(prevProjects =>
          prevProjects.map(p =>
            (p._id === projectId || p.id === projectId) ? { ...p, status: backendStatus } : p
          )
        );
      } else {
        // Handle permission errors
        const errorData = await response.json();
        console.error('Failed to update status:', errorData.message);
        // You could show a toast notification here
        alert(errorData.message || 'Failed to update project status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating project status');
    }
  };

  const statusCounts = getStatusCounts();
  const statusFilters = ['All', 'Not Started', 'In Progress', 'Completed', 'Unfinished'];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}
        style={isDarkMode ? { backgroundColor: '#141414' } : {}}
      >
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDarkMode ? 'border-white' : 'border-gray-900'}`}></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-6 ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-gray-50 text-gray-900'}`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      {/* Header Section */}
      <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Projects</h1>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage and track all your projects
          </p>
        </div>
        {/* Create Project Button */}
        {canCreateProjects() && (
          <button
            onClick={addNewProject}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto justify-center ${
              isDarkMode 
                ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' 
                : 'bg-white hover:bg-gray-100 text-black border border-black'
            }`}
            style={isDarkMode ? { backgroundColor: '#141414' } : {}}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create new project</span>
            <span className="sm:hidden">New Project</span>
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-4 sm:mb-6 flex items-center gap-2 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap transition-all ${
              statusFilter === status
                ? isDarkMode ? 'bg-[#141414] text-white border border-white' : 'bg-white text-black border border-black'
                : isDarkMode ? 'text-gray-400 hover:bg-gray-800 border border-transparent' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
            }`}
            style={statusFilter === status && isDarkMode ? { backgroundColor: '#141414' } : {}}
          >
            {status === 'Not Started' && <Circle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {status === 'In Progress' && <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {status === 'Unfinished' && <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {status === 'Completed' && <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span className="hidden sm:inline">{status}</span>
            <span className="sm:hidden">{status === 'Not Started' ? 'Not Started' : status === 'In Progress' ? 'Progress' : status === 'Unfinished' ? 'Unfinished' : 'Done'}</span>
            <span className={`px-1 sm:px-1.5 py-0.5 rounded text-xs font-semibold ${
              statusFilter === status 
                ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              {statusCounts[status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 sm:mb-8 flex items-center gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search projects"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white focus:border-white' : 'focus:ring-black focus:border-black'} text-sm ${
              isDarkMode 
                ? 'bg-gray-900 border border-gray-700 text-white placeholder-gray-500' 
                : 'bg-white border border-gray-300 text-gray-700 placeholder-gray-400'
            }`}
          />
        </div>
        <button className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-colors ${
          isDarkMode 
            ? 'bg-gray-900 border border-gray-700 text-gray-300 hover:bg-gray-800' 
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}>
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {filteredProjects.map((project) => {
            const projectId = project._id || project.id;
            const tasks = getProjectTasks(projectId);
            const progressPercent = getProgressPercent(projectId);
            const assignedUsers = project.assignedTo || (project.forPerson ? project.forPerson.split(',').map(u => u.trim()) : []);
            
            return (
              <div
                key={projectId}
                className={`rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gray-900 border border-gray-800' 
                    : 'bg-white border border-gray-200'
                }`}
                onClick={() => handleOpenProject(projectId)}
              >
                {/* Card Header with Title and Icons */}
                <div className={`flex items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 ${isDarkMode ? 'border-b border-gray-800' : 'border-b border-gray-200'}`}>
                  <h3 className={`font-semibold text-base sm:text-lg flex-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{project.name || project.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {project.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </div>
                </div>

                {/* Task Completion Stats with Progress Bar */}
                <div className="mb-3 sm:mb-4 lg:mb-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckSquare className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <span className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {tasks.completed}/{tasks.total}
                      </span>
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ({progressPercent}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className={`w-full rounded-full h-2 sm:h-2.5 overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div
                      className={`h-full rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Users and Deadline - Side by Side */}
                <div className="mb-3 sm:mb-4 lg:mb-5 flex items-start justify-between gap-2 sm:gap-4">
                  {/* Assigned Users */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs mb-1.5 sm:mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Assigned:</div>
                    {assignedUsers.length > 0 ? (
                      <div className="flex items-center">
                        <div className="flex -space-x-1.5 sm:-space-x-2">
                          {assignedUsers.slice(0, 6).map((userName, index) => {
                            const initials = userName.trim().charAt(0).toUpperCase();
                            const colors = isDarkMode 
                              ? ['bg-gray-800', 'bg-gray-700', 'bg-gray-600', 'bg-gray-500', 'bg-gray-400']
                              : ['bg-white', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400'];
                            return (
                              <div
                                key={index}
                                className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full ${colors[index % colors.length]} border-2 ${isDarkMode ? 'border-[#141414]' : 'border-black'} flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-black'} text-xs font-medium`}
                                title={userName}
                              >
                                {initials}
                              </div>
                            );
                          })}
                        </div>
                        {assignedUsers.length > 6 && (
                          <span className={`text-xs ml-1.5 sm:ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+{assignedUsers.length - 6}</span>
                        )}
                      </div>
                    ) : (
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Unassigned</div>
                    )}
                  </div>

                  {/* End day */}
                  {project.endDate && (
                    <div className="flex-1 text-right min-w-0">
                      <div className={`text-xs mb-1.5 sm:mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Due:</div>
                      <div className={`flex items-center justify-end gap-1 sm:gap-1.5 text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(project.endDate)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags Row with Editable Dropdowns */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {/* Priority Dropdown */}
                  <PrioritySelector
                    priority={project.priority || 'Medium'}
                    onChange={handlePriorityChange}
                    projectId={projectId}
                  />
                  
                  {/* Status Dropdown */}
                  <StatusSelector
                    status={project.status}
                    onChange={handleStatusChange}
                    projectId={projectId}
                  />
                </div>
              </div>
            );
          })}
        </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No projects found</p>
          {canCreateProjects() && (
            <button
              onClick={addNewProject}
              className={`mt-4 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' 
                  : 'bg-white hover:bg-gray-100 text-black border border-black'
              }`}
              style={isDarkMode ? { backgroundColor: '#141414' } : {}}
            >
              Create your first project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
