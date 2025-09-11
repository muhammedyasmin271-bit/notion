import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, UserCheck, UserX, Trash2,
  Shield, Crown, User as UserIcon, Calendar,
  Edit3, Mail, Phone, Building, Check, X, Clock
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const UserManagementPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPicker = urlParams.get('picker') === '1';
    setIsPickerMode(isPicker);

    if (isPicker) {
      // Check for project or goal picker data
      const projectData = sessionStorage.getItem('projectPickerReturn');
      const goalData = sessionStorage.getItem('goalPickerReturn');

      if (projectData) {
        const data = JSON.parse(projectData);
        setPickerData(data);
        // Pre-select users based on current assignment - split with the new delimiter
        if (data.currentAssignment) {
          const currentNames = data.currentAssignment.split('; ').map(name => name.trim());
          setSelectedUsers(currentNames);
        }
      } else if (goalData) {
        const data = JSON.parse(goalData);
        setPickerData(data);
        // Pre-select users based on current assignment - split with the new delimiter
        if (data.currentAssignment) {
          const currentNames = data.currentAssignment.split('; ').map(name => name.trim());
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
        files: user.files || []
      }));
      setUsers(dbUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    // Hide declined users unless explicitly filtering for declined
    const declinedHidden = user.status === 'declined' && filterStatus !== 'declined';
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
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

      alert(`Member created successfully!\\n\\nLogin Credentials:\\nUsername: ${memberData.username}\\nPassword: ${password}`);

    } catch (error) {
      console.error('Error creating member:', error);
      alert(error.response?.data?.message || 'Failed to create member. Please try again.');
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

    // Join user names with a more robust delimiter to handle names with commas
    const selectedUserNames = selectedUsers.join('; ');
    console.log('Storing selected users:', selectedUserNames);

    if (pickerData.type === 'project') {
      sessionStorage.setItem('selectedProjectUsers', selectedUserNames);
      // Keep the project picker return data for state restoration
      // Don't remove it here - let the ProjectDetailsPage handle it
      console.log('Navigating back to projects with picker data preserved');
      navigate('/projects');
    } else if (pickerData.type === 'goal') {
      sessionStorage.setItem('selectedGoalUsers', selectedUserNames);
      sessionStorage.removeItem('goalPickerReturn');
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
        navigate(`/projects/${data.id}`);
      } else {
        navigate('/projects');
      }
    } else if (goalData) {
      sessionStorage.removeItem('goalPickerReturn');
      navigate('/goals');
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
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
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
      alert('User status updated successfully!');
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleApprove = async (userId) => {
    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.approveUser(userId);
      await loadUsers();
      alert('User approved successfully.');
    } catch (error) {
      console.error('Error approving user:', error);
      alert(error.message || 'Failed to approve user.');
    }
  };

  const handleDecline = async (userId) => {
    if (!window.confirm('Are you sure you want to decline this user?')) return;
    try {
      const apiService = (await import('../../services/api')).default;
      await apiService.declineUser(userId);
      await loadUsers();
      alert('User declined successfully.');
    } catch (error) {
      console.error('Error declining user:', error);
      alert(error.message || 'Failed to decline user.');
    }
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

      alert('Member updated successfully!');
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member. Please try again.');
    }
  };

  return (
    <div className={`content p-6 lg:p-8 font-sans min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              }`}>
              <Users className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {isPickerMode ? 'Select Team Members' : 'Team Members'}
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                className="flex items-center px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Selection ({selectedUsers.length})
              </button>
            </div>
          ) : (
            isManager && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            )
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.length}
                </p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Users
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                <Users className={`h-8 w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.filter(u => u.status === 'pending').length}
                </p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending Approval
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
                <Clock className={`h-8 w-8 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.filter(u => u.status === 'approved').length}
                </p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Approved Users
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                <Check className={`h-8 w-8 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {users.filter(u => u.role === 'manager').length}
                </p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Managers
                </p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <Crown className={`h-8 w-8 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-3 rounded-lg w-80 text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={`px-4 py-3 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
          >
            <option value="all">All Roles</option>
            <option value="manager">Managers</option>
            <option value="user">Team Members</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-3 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((userItem) => (
          <div
            key={userItem.id}
            className={`rounded-2xl shadow-lg border overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 ${isPickerMode && selectedUsers.includes(userItem.name)
              ? (isDarkMode ? 'bg-blue-900/20 border-blue-600 ring-2 ring-blue-500/30' : 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/30')
              : userItem.status === 'pending'
                ? (isDarkMode ? 'bg-yellow-900/10 border-yellow-700 ring-2 ring-yellow-600/20' : 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-400/20')
                : (isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')
              }`}
            onClick={() => isPickerMode ? handleUserSelection(userItem.name) : setShowUserProfile(userItem)}
          >
            {/* User Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                  }`}>
                  {userItem.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userItem.name}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    @{userItem.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 flex items-center gap-2 ${userItem.role === 'manager'
                  ? (isDarkMode ? 'bg-yellow-900 text-yellow-300 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-300')
                  : (isDarkMode ? 'bg-blue-900 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300')
                  }`}>
                  {userItem.role === 'manager' ? <Crown className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                  {userItem.role === 'manager' ? 'Manager' : 'Team Member'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 flex items-center gap-1 ${userItem.status === 'approved'
                  ? (isDarkMode ? 'bg-green-900 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-300')
                  : userItem.status === 'declined'
                    ? (isDarkMode ? 'bg-red-900 text-red-300 border-red-700' : 'bg-red-100 text-red-800 border-red-300')
                    : (isDarkMode ? 'bg-yellow-900 text-yellow-300 border-yellow-700' : 'bg-yellow-100 text-yellow-700 border-yellow-300')
                  }`}>
                  {userItem.status === 'pending' && <Clock className="w-3 h-3" />}
                  {userItem.status === 'approved' && <Check className="w-3 h-3" />}
                  {userItem.status === 'declined' && <X className="w-3 h-3" />}
                  {userItem.status.charAt(0).toUpperCase() + userItem.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {userItem.department}
                </span>
              </div>
            </div>

            {/* User Details */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 opacity-50" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {userItem.email}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 opacity-50" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {userItem.phone}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 opacity-50" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {userItem.location}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 opacity-50" />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Joined {new Date(userItem.joinDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className={`w-4 h-4 rounded opacity-50 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {userItem.files?.length || 0} files uploaded
                  </span>
                </div>
              </div>

              {isPickerMode && (
                <div className="mt-4">
                  <div className={`flex items-center justify-center p-3 rounded-lg ${selectedUsers.includes(userItem.name)
                    ? 'bg-blue-600 text-white'
                    : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {selectedUsers.includes(userItem.name) ? (
                      <><Check className="w-4 h-4 mr-2" /> Selected</>
                    ) : (
                      'Click to Select'
                    )}
                  </div>
                </div>
              )}

              {!isPickerMode && isManager && (
                <div className="flex items-center space-x-2 mt-4">
                  {userItem.status === 'pending' ? (
                    <>
                      <button
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${isDarkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        onClick={(e) => { e.stopPropagation(); handleApprove(userItem.id); }}
                        title="Approve User"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        onClick={(e) => { e.stopPropagation(); handleDecline(userItem.id); }}
                        title="Decline User"
                      >
                        <X className="w-3 h-3" />
                        Decline
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`flex-1 p-2 rounded-lg ${isDarkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(userItem);
                        }}
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        className={`flex-1 p-2 rounded-lg ${userItem.isActive
                          ? (isDarkMode ? 'bg-orange-900 text-orange-300 hover:bg-orange-800' : 'bg-orange-100 text-orange-700 hover:bg-orange-200')
                          : (isDarkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200')
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(userItem.id);
                        }}
                        title={userItem.isActive ? 'Deactivate User' : 'Activate User'}
                      >
                        {userItem.isActive ? <UserX className="w-4 h-4 mx-auto" /> : <UserCheck className="w-4 h-4 mx-auto" />}
                      </button>
                      <button
                        className={`flex-1 p-2 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteUser(userItem.id);
                        }}
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className={`px-8 py-6 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-white' : 'bg-black'
                    }`}>
                    <UserIcon className={`w-10 h-10 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {showUserProfile.name}
                    </h2>
                    <span className="px-4 py-2 rounded-xl text-sm font-bold border-2 bg-blue-100 text-blue-800 border-blue-300">
                      {showUserProfile.role === 'manager' ? 'Manager' : 'Team Member'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserProfile(null)}
                  className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'
                            }`}>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            }`}>
            <div className={`px-8 py-6 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-white' : 'bg-black'
                    }`}>
                    <Plus className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {editingUser ? 'Edit Member' : 'Add New Member'}
                    </h2>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {editingUser ? 'Update team member information' : 'Create a new team member account'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className={`p-4 rounded-2xl ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={editingUser ? handleUpdateMember : handleCreateMember} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className={`flex items-center justify-between mt-10 pt-6 border-t-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {editingUser ? '✏️ Update member information' : '👤 Member will receive login credentials to join the team'}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingUser(null);
                    }}
                    className={`px-8 py-3 text-base font-semibold rounded-2xl ${isDarkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700"
                  >
                    {editingUser ? '✏️ Update Member' : '🎉 Create Member'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;