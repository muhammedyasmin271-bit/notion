import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, Search, UserCheck, UserX, Trash2,
  Shield, Crown, User as UserIcon, Calendar,
  Edit3, Mail, Phone, Building, Check, X, Clock,
  MessageSquare, UserPlus, MoreVertical, Eye, ChevronDown, Star
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import ConfirmationModal from '../common/ConfirmationModal';
import { useNavigate, useSearchParams } from 'react-router-dom';

const UserManagementPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

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
  const [searchParams] = useSearchParams();
  
  // Get companyId from query params or user context
  const companyId = searchParams.get('company') || user?.companyId || localStorage.getItem('currentCompanyId');
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin';
  const canManageUsers = isManager || isAdmin;
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isPickerMode, setIsPickerMode] = useState(false);
  const [pickerData, setPickerData] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Role Filter Selector Component
  const RoleFilterSelector = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const roleOptions = [
      { value: 'all', label: 'All Roles', hoverColor: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100' },
      { value: 'admin', label: 'Admins', hoverColor: isDarkMode ? 'hover:bg-purple-500/20' : 'hover:bg-purple-50' },
      { value: 'manager', label: 'Managers', hoverColor: isDarkMode ? 'hover:bg-blue-500/20' : 'hover:bg-blue-50' },
      { value: 'user', label: 'Team Members', hoverColor: isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-50' }
    ];

    const currentRole = roleOptions.find(option => option.value === value) || roleOptions[0];

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
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 sm:w-auto px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-transparent focus:outline-none border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} transition-colors`}
        >
          <span>{currentRole.label}</span>
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
        {isOpen && (
          <div className={`absolute left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} w-full min-w-[150px]`}>
            <div className="py-1">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
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

  // Status Filter Selector Component
  const StatusFilterSelector = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const statusOptions = [
      { value: 'all', label: 'All Statuses', hoverColor: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100' },
      { value: 'pending', label: 'Pending', hoverColor: isDarkMode ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-50' },
      { value: 'approved', label: 'Approved', hoverColor: isDarkMode ? 'hover:bg-green-500/20' : 'hover:bg-green-50' },
      { value: 'declined', label: 'Declined', hoverColor: isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50' }
    ];

    const currentStatus = statusOptions.find(option => option.value === value) || statusOptions[0];

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
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 sm:w-auto px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-transparent focus:outline-none border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white hover:bg-gray-800' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} transition-colors`}
        >
          <span>{currentStatus.label}</span>
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>
        {isOpen && (
          <div className={`absolute left-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} w-full min-w-[150px]`}>
            <div className="py-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPicker = urlParams.get('picker') === 'true' || urlParams.get('picker') === '1';
    setIsPickerMode(isPicker);

    if (isPicker) {
      // Check for project or goal picker data
      const projectData = sessionStorage.getItem('projectPickerReturn');
      const goalData = sessionStorage.getItem('goalPickerReturn');

      if (projectData) {
        const data = JSON.parse(projectData);
        setPickerData(data);
        // Pre-select users based on current assignment
        if (data.currentAssignment) {
          const currentNames = data.currentAssignment.split(',').map(name => name.trim()).filter(name => name);
          setSelectedUsers(currentNames);
        }
      } else if (goalData) {
        const data = JSON.parse(goalData);
        setPickerData(data);
        // Pre-select users based on current assignment
        if (data.currentAssignment) {
          const currentNames = data.currentAssignment.split(',').map(name => name.trim()).filter(name => name);
          setSelectedUsers(currentNames);
        }
      }
    }

    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const apiService = (await import('../../services/api')).default;
      const response = await apiService.getUsers();
      const dbUsers = response.users.map(user => ({
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department || 'General',
        phone: user.phone || 'Not provided',
        location: user.location || 'Not specified',
        joinDate: user.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        // status and isActive come from backend; status can be 'pending' | 'approved' | 'declined'
        status: user.status || (user.isActive ? 'approved' : 'pending'),
        isActive: !!user.isActive,
        files: user.files || [],
        points: user.points !== undefined && user.points !== null ? user.points : 0
      }));
      setUsers(dbUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = userItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userItem.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userItem.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || userItem.role === filterRole;
    // Hide declined users unless explicitly filtering for declined
    const declinedHidden = userItem.status === 'declined' && filterStatus !== 'declined';
    const matchesStatus = filterStatus === 'all' || userItem.status === filterStatus;
    
    // Role-based visibility for pending approvals
    if (userItem.status === 'pending') {
      // Admins see all pending users
      if (user?.role === 'admin') {
        // Admin sees all
      } else if (user?.role === 'manager') {
        // Managers only see pending regular users, not other managers
        if (userItem.role === 'manager') return false;
      }
    }
    
    return !declinedHidden && matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const password = formData.get('password');
    const memberData = {
      name: formData.get('name'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: password,
      role: formData.get('role'),
      department: formData.get('department'),
      phone: formData.get('phone'),
      location: formData.get('location')
    };

    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.createUser(memberData);

      setShowCreateForm(false);
      await loadUsers();

      showModal({
        title: 'User Created',
        message: `Member created successfully!\n\nLogin Credentials:\nUsername: ${memberData.username}\nPassword: ${password}`,
        type: 'success'
      });

    } catch (error) {
      console.error('Error creating member:', error);
      showModal({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create member. Please try again.',
        type: 'danger'
      });
    }
  };

  const handleUserSelection = (userName) => {
    setSelectedUsers(prev => {
      if (prev.includes(userName)) {
        return prev.filter(name => name !== userName);
      } else {
        return [...prev, userName];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (!pickerData) return;

    // Join user names with comma delimiter for consistency
    const selectedUserNames = selectedUsers.join(',');
    console.log('Storing selected users:', selectedUserNames);

    // Create or update the picker return data
    const returnData = {
      type: pickerData.type,
      timestamp: new Date().toISOString(),
      goalState: pickerData.goalState || null,
      descriptionBlocks: pickerData.descriptionBlocks || null
    };

    if (pickerData.type === 'project') {
      sessionStorage.setItem('selectedProjectUsers', selectedUserNames);
      sessionStorage.setItem('projectPickerReturn', JSON.stringify(returnData));
      console.log('Navigating back to projects with picker data preserved');
      const backUrl = companyId ? `/projects?company=${companyId}` : '/projects';
      navigate(backUrl);
    } else if (pickerData.type === 'goal') {
      sessionStorage.setItem('selectedGoalUsers', selectedUserNames);
      sessionStorage.setItem('goalPickerReturn', JSON.stringify(returnData));
      console.log('Navigating back to goals with picker data preserved');
      navigate('/goals');
    }
  };

  const handleCancelSelection = () => {
    const projectData = sessionStorage.getItem('projectPickerReturn');
    const goalData = sessionStorage.getItem('goalPickerReturn');

    if (projectData) {
      const data = JSON.parse(projectData);
      sessionStorage.removeItem('projectPickerReturn');
      if (data.id && data.id !== 'new') {
        const projectUrl = companyId ? `/projects/${data.id}?company=${companyId}` : `/projects/${data.id}`;
        navigate(projectUrl);
      } else {
        const backUrl = companyId ? `/projects?company=${companyId}` : '/projects';
        navigate(backUrl);
      }
    } else if (goalData) {
      const data = JSON.parse(goalData);
      sessionStorage.removeItem('goalPickerReturn');
      if (data.id && data.id !== 'new') {
        navigate(`/goals/${data.id}`);
      } else {
        navigate('/goals');
      }
    } else {
      navigate(-1); // Go back to previous page
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const apiService = (await import('../../services/api')).default;
        await apiService.deleteUser(userId);
        await loadUsers();
        showModal({
          title: 'Success',
          message: 'User deleted successfully!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        showModal({
          title: 'Error',
          message: 'Failed to delete user. Please try again.',
          type: 'danger'
        });
      }
    }
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowCreateForm(true);
  };

  const handleToggleStatus = async (userId) => {
    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.toggleUserStatus(userId);
      await loadUsers();
      showModal({
        title: 'Success',
        message: 'User status updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      showModal({
        title: 'Error',
        message: 'Failed to update user status. Please try again.',
        type: 'danger'
      });
    }
  };

  const handleApprove = async (userId) => {
    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.approveUser(userId);
      await loadUsers();
      showModal({
        title: 'Success',
        message: 'User approved successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error approving user:', error);
      showModal({
        title: 'Error',
        message: error.message || 'Failed to approve user.',
        type: 'danger'
      });
    }
  };

  const handleDecline = async (userId) => {
    if (!window.confirm('Are you sure you want to decline this user?')) return;
    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.declineUser(userId);
      await loadUsers();
      showModal({
        title: 'Success',
        message: 'User declined successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error declining user:', error);
      showModal({
        title: 'Error',
        message: error.message || 'Failed to decline user.',
        type: 'danger'
      });
    }
  };

  const handleMakeManager = async (userId) => {
    if (!window.confirm('Are you sure you want to make this user a manager?')) return;
    try {
      const apiService = (await import('../../services/api')).default;
      // Use the admin endpoint if user is admin, otherwise use the manager endpoint
      if (isAdmin) {
        await apiService.put(`/auth/admin/users/${userId}/make-manager`, {});
      } else {
        // Fallback to manager endpoint
        await apiService.put(`/auth/users/${userId}/make-manager`, {});
      }
      await loadUsers();
      showModal({
        title: 'Success',
        message: 'User is now a manager.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error making user manager:', error);
      showModal({
        title: 'Error',
        message: error.message || 'Failed to make user manager.',
        type: 'danger'
      });
    }
  };

  const handleMakeUser = async (userId) => {
    if (!window.confirm('Are you sure you want to make this manager a regular user?')) return;
    try {
      const apiService = (await import('../../services/api')).default;
      // Use the admin endpoint if user is admin, otherwise use the manager endpoint
      if (isAdmin) {
        await apiService.put(`/auth/admin/users/${userId}/make-user`, {});
      } else {
        // Fallback to manager endpoint
        await apiService.put(`/auth/users/${userId}/make-user`, {});
      }
      await loadUsers();
      showModal({
        title: 'Success',
        message: 'Manager is now a regular user.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error making manager user:', error);
      showModal({
        title: 'Error',
        message: error.message || 'Failed to make manager user.',
        type: 'danger'
      });
    }
  };

  const getRoleDisplay = (user) => {
    // Use department if available, otherwise use role
    if (user.department && user.department !== 'General' && user.department !== 'Not provided') {
      return user.department;
    }
    if (user.role === 'admin') return 'Admin';
    if (user.role === 'manager') return 'Manager';
    return 'Team Member';
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      department: formData.get('department'),
      phone: formData.get('phone'),
      location: formData.get('location')
    };

    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.updateUser(editingUser.id, updatedData);

      setShowCreateForm(false);
      setEditingUser(null);
      await loadUsers();

      showModal({
        title: 'Success',
        message: 'Member updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating member:', error);
      showModal({
        title: 'Error',
        message: 'Failed to update member. Please try again.',
        type: 'danger'
      });
    }
  };

  return (
    <div className={`content p-3 sm:p-6 lg:p-8 font-sans min-h-screen ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-white text-gray-900'
      }`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-6 shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              }`}>
              <Users className={`w-6 h-6 sm:w-8 sm:h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {isPickerMode ? 'Select Team Members' : 'Team Members'}
              </h1>
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isPickerMode ? `Select users to assign to ${pickerData?.type || 'item'}` : 'Manage your team and user accounts'}
              </p>
            </div>
          </div>

          {isPickerMode ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelSelection}
                className="px-6 py-3 text-sm font-semibold rounded-xl bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                className={`flex items-center px-6 py-3 text-sm font-semibold rounded-xl ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Selection ({selectedUsers.length})
              </button>
            </div>
          ) : (
            canManageUsers && (
              <button
                onClick={() => setShowCreateForm(true)}
                className={`flex items-center px-6 py-3 text-sm font-semibold rounded-xl ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            )
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className={`p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.length}
                </p>
                <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                  Total Users
                </p>
              </div>
              <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                <Users className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
            </div>
          </div>

          <div className={`p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.filter(u => u.status === 'pending').length}
                </p>
                <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                  Pending Approval
                </p>
              </div>
              <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
                <Clock className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
              </div>
            </div>
          </div>

          <div className={`p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.filter(u => u.status === 'approved').length}
                </p>
                <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                  Approved Users
                </p>
              </div>
              <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                <Check className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
              </div>
            </div>
          </div>

          <div className={`p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.filter(u => u.role === 'manager').length}
                </p>
                <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                  Managers
                </p>
              </div>
              <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                style={isDarkMode ? { backgroundColor: '#ffffff' } : { backgroundColor: '#000000' }}
              >
                <Crown className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-3 rounded-lg w-full text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
            />
          </div>

          <div className="flex gap-2 sm:gap-3">
            <RoleFilterSelector
              value={filterRole}
              onChange={setFilterRole}
            />

            <StatusFilterSelector
              value={filterStatus}
              onChange={setFilterStatus}
            />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
        {filteredUsers.map((userItem) => {
          const roleDisplay = getRoleDisplay(userItem);
          const joinDate = new Date(userItem.joinDate).toLocaleDateString('en-US', { 
            month: 'numeric', 
            day: 'numeric', 
            year: 'numeric' 
          });

          return (
            <div
              key={userItem.id}
              className={`relative rounded-xl shadow-lg border overflow-hidden transition-all duration-200 ${isPickerMode && selectedUsers.includes(userItem.name)
                ? (isDarkMode ? 'bg-white/20 border-white ring-2 ring-white/30' : 'bg-black/20 border-black ring-2 ring-black/30')
                : userItem.status === 'pending'
                  ? (isDarkMode ? 'bg-yellow-900/10 border-yellow-700 ring-2 ring-yellow-600/20' : 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400/20')
                  : (isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')
                } ${isPickerMode ? 'cursor-pointer hover:scale-105' : ''}`}
              onClick={() => isPickerMode ? handleUserSelection(userItem.name) : null}
            >

              {/* Card Content */}
              <div className="p-6 pb-4">
                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                    }`}>
                    {userItem.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Name */}
                <h3 className={`text-center font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userItem.name}
                </h3>

                {/* Role */}
                <p className={`text-center text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {roleDisplay}
                </p>

                {/* Join Date */}
                <div className="mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Join Date</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{joinDate}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isPickerMode && canManageUsers && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {userItem.status === 'pending' ? (
                      // Pending users: Show Approve and Disapprove buttons
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(userItem.id);
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 ${
                            isDarkMode
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50'
                              : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDecline(userItem.id);
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 ${
                            isDarkMode
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/50'
                              : 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                          }`}
                        >
                          <X className="w-4 h-4" />
                          Disapprove
                        </button>
                      </div>
                    ) : (
                      // Approved users: Show action icons horizontally
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(userItem.id);
                          }}
                          className={`flex items-center justify-center p-2 transition-all hover:scale-110 ${
                            userItem.isActive
                              ? isDarkMode
                                ? 'text-orange-400 hover:text-orange-300'
                                : 'text-orange-600 hover:text-orange-700'
                              : isDarkMode
                                ? 'text-green-400 hover:text-green-300'
                                : 'text-green-600 hover:text-green-700'
                          }`}
                          title={userItem.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {userItem.isActive ? (
                            <UserX className="w-5 h-5" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(userItem.id);
                          }}
                          className={`flex items-center justify-center p-2 transition-all hover:scale-110 ${
                            isDarkMode
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUserProfile(userItem);
                          }}
                          className={`flex items-center justify-center p-2 transition-all hover:scale-110 ${
                            isDarkMode
                              ? 'text-white hover:text-gray-300'
                              : 'text-black hover:text-gray-700'
                          }`}
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Picker Mode Selection Indicator */}
              {isPickerMode && (
                <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${selectedUsers.includes(userItem.name) ? 'opacity-100' : 'opacity-0'}`}>
                  <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'}`}
                    style={isDarkMode ? { backgroundColor: '#ffffff' } : { backgroundColor: '#000000' }}
                  >
                    <Check className="w-5 h-5" />
                    Selected
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full px-6 py-12 text-center">
            <Users className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mx-auto h-12 w-12 mb-4`} />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No users found
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {showUserProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className={`rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 flex-1 min-w-0">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'
                    }`}>
                    <UserIcon className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black mb-1 sm:mb-2 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {showUserProfile.name}
                    </h2>
                    <span className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border-2 inline-block ${showUserProfile.role === 'admin'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : showUserProfile.role === 'manager'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          : isDarkMode ? 'bg-white/20 text-white border-white/30' : 'bg-black/20 text-black border-black/30'
                      }`}>
                      {showUserProfile.role === 'admin' ? 'Admin' : showUserProfile.role === 'manager' ? 'Manager' : 'Team Member'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserProfile(null)}
                  className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl flex-shrink-0 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div>
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {showUserProfile.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {showUserProfile.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {showUserProfile.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Account Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        @{showUserProfile.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        Joined {new Date(showUserProfile.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Points display - only for admins */}
                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        <Star className={`w-5 h-5 opacity-50 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          Points: <span className={`font-bold ${(showUserProfile.points || 0) >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                            {showUserProfile.points !== undefined && showUserProfile.points !== null ? showUserProfile.points : 0}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  User Files ({showUserProfile.files?.length || 0})
                </h3>
                {showUserProfile.files && showUserProfile.files.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {showUserProfile.files.map((file, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                            }`}
                            style={isDarkMode ? { backgroundColor: '#ffffff' } : { backgroundColor: '#000000' }}
                          >
                            📄
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {file.name || `File ${index + 1}`}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {file.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="text-4xl mb-2">📁</div>
                    <p>No files uploaded yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className={`px-8 py-6 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
              <button
                onClick={() => setShowUserProfile(null)}
                className={`px-6 py-3 text-sm font-semibold rounded-xl ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Member Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className={`rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className={`px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'
                    }`}>
                    <Plus className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-xl sm:text-2xl lg:text-3xl font-black mb-1 sm:mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {editingUser ? 'Edit Member' : 'Add New Member'}
                    </h2>
                    <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {editingUser ? 'Update team member information' : 'Create a new team member account'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl flex-shrink-0 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={editingUser ? handleUpdateMember : handleCreateMember} className="p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    placeholder="John Doe"
                    defaultValue={editingUser?.name || ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    placeholder="john.doe"
                    defaultValue={editingUser?.username || ''}
                    disabled={editingUser}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    placeholder="john@company.com"
                    defaultValue={editingUser?.email || ''}
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength="6"
                      className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role *
                  </label>
                  <select
                    name="role"
                    required
                    className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    defaultValue={editingUser?.role || 'user'}
                  >
                    <option value="user">👤 Team Member</option>
                    <option value="manager">👑 Manager</option>
                    {isAdmin && <option value="admin">🛡️ Admin</option>}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    placeholder="Engineering"
                    defaultValue={editingUser?.department || ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    placeholder="+1 (555) 123-4567"
                    defaultValue={editingUser?.phone || ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    className={`w-full px-4 py-3 border-2 rounded-xl ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    placeholder="New York, NY"
                    defaultValue={editingUser?.location || ''}
                  />
                </div>
              </div>

              <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-6 sm:mt-8 lg:mt-10 pt-4 sm:pt-5 lg:pt-6 border-t-2 gap-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {editingUser ? '✏️ Update member information' : '👤 Member will receive login credentials to join the team'}
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingUser(null);
                    }}
                    className={`px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl ${isDarkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                    style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                  >
                    {editingUser ? '✏️ Update Member' : '🎉 Create Member'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
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

export default UserManagementPage;