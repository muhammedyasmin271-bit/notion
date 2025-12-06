import React, { useState, useEffect } from 'react';
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
    const counts = {
      All: projects.length,
      'Not Started': projects.filter(p => !p.status || p.status === 'Not started' || p.status === 'Not Started' || p.status === 'not started' || p.status === '').length,
      'In Progress': projects.filter(p => p.status === 'In Progress' || p.status === 'in progress').length,
      Completed: projects.filter(p => p.status === 'Done' || p.status === 'done').length,
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
      matchesStatus = !project.status || project.status === 'Not started' || project.status === 'Not Started' || project.status === 'not started' || project.status === '';
    } else if (statusFilter === 'In Progress') {
      matchesStatus = project.status === 'In Progress' || project.status === 'in progress';
    } else if (statusFilter === 'Completed') {
      matchesStatus = project.status === 'Done' || project.status === 'done';
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
        console.error('Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
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
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const statusCounts = getStatusCounts();
  const statusFilters = ['All', 'Not Started', 'In Progress', 'Completed'];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDarkMode ? 'border-white' : 'border-gray-900'}`}></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-6 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
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
            className="bg-blue-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
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
                ? isDarkMode ? 'bg-blue-900 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-700 border border-blue-200'
                : isDarkMode ? 'text-gray-400 hover:bg-gray-800 border border-transparent' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
            }`}
          >
            {status === 'Not Started' && <Circle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {status === 'In Progress' && <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {status === 'Completed' && <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span className="hidden sm:inline">{status}</span>
            <span className="sm:hidden">{status === 'Not Started' ? 'Not Started' : status === 'In Progress' ? 'Progress' : 'Done'}</span>
            <span className={`px-1 sm:px-1.5 py-0.5 rounded text-xs font-semibold ${
              statusFilter === status 
                ? isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'
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
            className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
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
                className={`rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1 ${
                  isDarkMode 
                    ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' 
                    : 'bg-white border border-gray-200 hover:border-gray-300'
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
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
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
                          {assignedUsers.slice(0, 3).map((userName, index) => {
                            const initials = userName.trim().charAt(0).toUpperCase();
                            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
                            return (
                              <div
                                key={index}
                                className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full ${colors[index % colors.length]} border-2 ${isDarkMode ? 'border-gray-900' : 'border-white'} flex items-center justify-center text-white text-xs font-medium`}
                                title={userName}
                              >
                                {initials}
                              </div>
                            );
                          })}
                        </div>
                        {assignedUsers.length > 3 && (
                          <span className={`text-xs ml-1.5 sm:ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+{assignedUsers.length - 3}</span>
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
                  <select
                    value={project.priority || 'Medium'}
                    onChange={(e) => handlePriorityChange(projectId, e.target.value, e)}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-xs font-medium cursor-pointer border-0 outline-none appearance-none ${
                      isDarkMode
                        ? (project.priority || 'Medium')?.toLowerCase() === 'high' || (project.priority || 'Medium')?.toLowerCase() === 'critical'
                          ? 'bg-red-900 text-red-200'
                          : (project.priority || 'Medium')?.toLowerCase() === 'medium'
                          ? 'bg-orange-900 text-orange-200'
                          : 'bg-green-900 text-green-200'
                        : (project.priority || 'Medium')?.toLowerCase() === 'high' || (project.priority || 'Medium')?.toLowerCase() === 'critical'
                        ? 'bg-red-100 text-gray-900'
                        : (project.priority || 'Medium')?.toLowerCase() === 'medium'
                        ? 'bg-orange-100 text-gray-900'
                        : 'bg-green-100 text-gray-900'
                    }`}
                  >
                    <option value="Low" className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Low</option>
                    <option value="Medium" className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Medium</option>
                    <option value="High" className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>High</option>
                    <option value="Critical" className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Critical</option>
                  </select>
                  
                  {/* Status Dropdown */}
                  <select
                    value={project.status === 'Done' || project.status === 'done' ? 'Completed' : 
                           project.status === 'Not started' || project.status === 'Not Started' || !project.status ? 'Not Started' : 
                           'In Progress'}
                    onChange={(e) => handleStatusChange(projectId, e.target.value, e)}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border-0 outline-none appearance-none ${
                      isDarkMode
                        ? project.status === 'Done' || project.status === 'done'
                          ? 'bg-green-900 text-green-200'
                          : project.status === 'Not started' || project.status === 'Not Started' || !project.status
                          ? 'bg-gray-800 text-gray-300'
                          : 'bg-blue-900 text-blue-200'
                        : project.status === 'Done' || project.status === 'done'
                        ? 'bg-green-100 text-gray-900'
                        : project.status === 'Not started' || project.status === 'Not Started' || !project.status
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-100 text-gray-900'
                    }`}
                  >
                    <option value="Not Started" className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Not Started</option>
                    <option value="In Progress" className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>In Progress</option>
                    <option value="Completed" className={isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>Completed</option>
                  </select>
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
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
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
