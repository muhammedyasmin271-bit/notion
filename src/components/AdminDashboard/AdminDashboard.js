import React, { useState, useEffect } from 'react';
import {
  Shield, Users, UserPlus, Settings, BarChart3, Bell,
  FileText, Calendar, MessageSquare, TrendingUp,
  CheckCircle, XCircle, Clock, Search, Filter,
  Eye, EyeOff, Crown, User, Trash2, Edit3, Plus,
  Download, Upload, RefreshCw, AlertTriangle,
  Activity, Database, Server, Zap, PieChart,
  BarChart, LineChart, MapPin, Mail, Phone,
  Lock, Unlock, Ban, Award, Target, CalendarDays, DollarSign,
  MoreVertical, ChevronDown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';
import { useNavigate } from 'react-router-dom';
import PointsChart from './PointsChart';

const AdminDashboard = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    managers: 0,
    admins: 0,
    recentUsers: 0,
    monthlyUsers: 0,
    inactiveUsers: 0,
    roleDistribution: { users: 0, managers: 0, admins: 0 },
    growthMetrics: { weekly: 0, monthly: 0 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      const { getUsers } = await import('../../services/api');
      const response = await getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { getUserStats } = await import('../../services/api');
      const response = await getUserStats();
      setStats({
        totalUsers: response.total || 0,
        activeUsers: response.active || response.approvedUsers || 0,
        pendingUsers: response.pending || 0,
        managers: response.managers || 0,
        admins: response.admins || 0,
        recentUsers: response.recentUsers || 0,
        monthlyUsers: response.monthlyUsers || 0,
        inactiveUsers: response.inactiveUsers || 0,
        roleDistribution: response.roleDistribution || { users: 0, managers: 0, admins: 0 },
        growthMetrics: response.growthMetrics || { weekly: 0, monthly: 0 }
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const { createUser } = await import('../../services/api');
      await createUser(newUser);
      setShowCreateForm(false);
      setNewUser({ name: '', username: '', email: '', password: '', role: 'user' });
      loadUsers();
      loadStats();
      if (!window.confirm('User created successfully! Click OK to continue.')) return;
    } catch (error) {
      console.error('Error creating user:', error);
      if (!window.confirm('Failed to create user: ' + (error.message || 'Unknown error') + '. Click OK to continue.')) return;
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const { toggleUserStatus } = await import('../../services/api');
      await toggleUserStatus(userId);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Error toggling user status:', error);
      if (!window.confirm('Failed to update user status. Click OK to continue.')) return;
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const { deleteUser } = await import('../../services/api');
      await deleteUser(userId);
      loadUsers();
      loadStats();
      if (!window.confirm('User deleted successfully! Click OK to continue.')) return;
    } catch (error) {
      console.error('Error deleting user:', error);
      if (!window.confirm('Failed to delete user: ' + (error.message || 'Unknown error') + '. Click OK to continue.')) return;
    }
  };

  const handleMakeManager = async (userId) => {
    try {
      const { put } = await import('../../services/api');
      await put(`/auth/admin/users/${userId}/make-manager`, {});
      loadUsers();
      if (!window.confirm('User is now a manager! Click OK to continue.')) return;
    } catch (error) {
      console.error('Error making user manager:', error);
      if (!window.confirm('Failed to make user manager. Click OK to continue.')) return;
    }
  };

  const handleMakeUser = async (userId) => {
    try {
      const { put } = await import('../../services/api');
      await put(`/auth/admin/users/${userId}/make-user`, {});
      loadUsers();
      if (!window.confirm('Manager is now a regular user! Click OK to continue.')) return;
    } catch (error) {
      console.error('Error making manager user:', error);
      if (!window.confirm('Failed to make manager user. Click OK to continue.')) return;
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;

    try {
      const { deleteUser } = await import('../../services/api');
      await Promise.all(selectedUsers.map(id => deleteUser(id)));
      setSelectedUsers([]);
      loadUsers();
      loadStats();
      if (!window.confirm('Users deleted successfully! Click OK to continue.')) return;
    } catch (error) {
      console.error('Error deleting users:', error);
      if (!window.confirm('Failed to delete users: ' + (error.message || 'Unknown error') + '. Click OK to continue.')) return;
    }
  };

  const handleBulkActivate = async () => {
    try {
      const { put } = await import('../../services/api');
      await Promise.all(selectedUsers.map(id => put(`/auth/users/${id}/status`, {})));
      setSelectedUsers([]);
      loadUsers();
      if (!window.confirm('Users activated successfully! Click OK to continue.')) return;
    } catch (error) {
      console.error('Error activating users:', error);
      if (!window.confirm('Failed to activate users: ' + (error.message || 'Unknown error') + '. Click OK to continue.')) return;
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && u.isActive) ||
      (filterStatus === 'inactive' && !u.isActive) ||
      (filterStatus === 'pending' && u.status === 'pending');

    return matchesSearch && matchesRole && matchesStatus;
  });

  const StatCard = ({ title, value, subtitle, colorLine }) => (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
      <div className="mb-4">
        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{title}</p>
        <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {value.toLocaleString()}
        </p>
        <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
      </div>
      <div className={`h-1 rounded-full ${colorLine}`}></div>
    </div>
  );

  return (
    <RoleGuard requiredRole="manager" fallback={
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} flex items-center justify-center p-8`}>
        <div className={`text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-12 max-w-md`}>
          <Shield className={`w-20 h-20 mx-auto mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          <h2 className="text-3xl font-black mb-4 text-gray-900">Access Denied</h2>
          <p className="text-gray-600 text-lg">You need admin privileges to access this page.</p>
        </div>
      </div>
    }>
      <div className={`min-h-screen ${isDarkMode ? 'bg-[#141414]' : 'bg-gray-50'}`}
        style={isDarkMode ? { backgroundColor: '#141414' } : {}}
      >
        {/* Fixed Payment Button */}
        <div className="fixed top-3 right-3 sm:top-6 sm:right-6 z-50">
          <button
            onClick={() => {
              const companyId = user?.companyId;
              navigate(companyId ? `/${companyId}/admin/payments` : '/admin/payments');
            }}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-4 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-full font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 text-xs sm:text-base`}
          >
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">Payments</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-3 sm:p-6">
          {/* User Management Section */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden mb-6 sm:mb-8`}>
            <div className="p-3 sm:p-6">
              {/* Search and Filters */}
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, User ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 w-full rounded-lg border text-sm sm:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-black'} transition-all`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <div className="relative flex-1 sm:flex-none min-w-[120px]">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-sm sm:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-black'} appearance-none pr-8 cursor-pointer`}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="relative flex-1 sm:flex-none min-w-[120px]">
                    <Calendar className={`absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className={`w-full pl-8 sm:pl-10 pr-6 sm:pr-8 py-2 sm:py-3 rounded-lg border text-sm sm:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white' : 'focus:ring-black'} appearance-none cursor-pointer`}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                    <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-sm sm:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} transition-colors`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">More Filter</span>
                    <span className="sm:hidden">Filter</span>
                  </button>
                </div>
              </div>

              {/* Bulk Actions Panel */}
              {showBulkActions && (
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4 mb-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedUsers.length} users selected</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleBulkActivate}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                      >
                        <Unlock className="w-4 h-4" />
                        Activate
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 sm:gap-3 mb-4 sm:mb-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold transition-colors ${
                    isDarkMode 
                      ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' 
                      : 'bg-white hover:bg-gray-100 text-black border border-black'
                  }`}
                  style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {/* Users Table - Mobile Card View / Desktop Table View */}
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <table className="w-full hidden md:table">
                  <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <tr>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-6">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={handleSelectAll}
                          className={`rounded w-4 h-4 cursor-pointer ${isDarkMode ? 'text-white' : 'text-black'}`}
                        />
                      </th>
                      <th className={`text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>User Name</th>
                      <th className={`text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Contact</th>
                      <th className={`text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>User ID</th>
                      <th className={`text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                      <th className={`text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      <th className={`text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className={`py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr 
                          key={u._id} 
                          className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                        >
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(u._id)}
                              onChange={() => handleUserSelection(u._id)}
                              className={`rounded w-4 h-4 cursor-pointer ${isDarkMode ? 'text-white' : 'text-black'}`}
                            />
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                                style={isDarkMode ? { backgroundColor: '#ffffff' } : { backgroundColor: '#000000' }}
                              >
                                <span className={`text-xs sm:text-sm font-bold ${isDarkMode ? 'text-black' : 'text-white'}`}>
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className={`font-semibold text-sm sm:text-base truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.name}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {u.role === 'admin' ? 'Admin User' : u.role === 'manager' ? 'Manager User' : 'Regular User'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="space-y-1">
                              {u.email && (
                                <div className={`text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {u.email}
                                </div>
                              )}
                              {u.phone && (
                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {u.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div>
                              <div className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                #{u._id.slice(-8).toUpperCase()}
                              </div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'admin' ? 'bg-red-100 text-red-800' :
                              u.role === 'manager' ? 'bg-indigo-100 text-indigo-800' :
                              isDarkMode ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'User'}
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                u.status === 'pending' ? 'bg-orange-500' :
                                u.isActive ? 'bg-green-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className={`text-xs sm:text-sm font-medium ${
                                u.status === 'pending' ? 'text-orange-600' :
                                u.isActive ? 'text-green-600' :
                                'text-red-600'
                              }`}>
                                {u.status === 'pending' ? 'Pending' : u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                onClick={() => {
                                  alert(`User Details:\nName: ${u.name}\nEmail: ${u.email || 'N/A'}\nRole: ${u.role}\nStatus: ${u.isActive ? 'Active' : 'Inactive'}`);
                                }}
                                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                                  isDarkMode 
                                    ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' 
                                    : 'bg-white hover:bg-gray-100 text-black border border-black'
                                }`}
                                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                              >
                                Details
                              </button>
                              <div className="relative group">
                                <button
                                  className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                                >
                                  <MoreVertical className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10`}>
                                  <div className="py-2">
                                    {u.role === 'user' && (
                                      <button
                                        onClick={() => handleMakeManager(u._id)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                      >
                                        <Crown className="w-4 h-4" />
                                        Make Manager
                                      </button>
                                    )}
                                    {u.role === 'manager' && (
                                      <button
                                        onClick={() => handleMakeUser(u._id)}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                      >
                                        <User className="w-4 h-4" />
                                        Make User
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleToggleUserStatus(u._id)}
                                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                    >
                                      {u.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      {u.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u._id)}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className={`py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div
                        key={u._id}
                        className={`${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg border p-4 space-y-3`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(u._id)}
                              onChange={() => handleUserSelection(u._id)}
                              className={`rounded w-4 h-4 cursor-pointer flex-shrink-0 ${isDarkMode ? 'text-white' : 'text-black'}`}
                            />
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                              <span className={`text-sm font-bold ${isDarkMode ? 'text-black' : 'text-white'}`}>
                                {u.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-base truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.name}</div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {u.role === 'admin' ? 'Admin User' : u.role === 'manager' ? 'Manager User' : 'Regular User'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 pl-14">
                          {u.email && (
                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Email: </span>{u.email}
                            </div>
                          )}
                          {u.phone && (
                            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Phone: </span>{u.phone}
                            </div>
                          )}
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ID: #{u._id.slice(-8).toUpperCase()}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'admin' ? 'bg-red-100 text-red-800' :
                              u.role === 'manager' ? 'bg-indigo-100 text-indigo-800' :
                              isDarkMode ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'User'}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                u.status === 'pending' ? 'bg-orange-500' :
                                u.isActive ? 'bg-green-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className={`text-xs font-medium ${
                                u.status === 'pending' ? 'text-orange-600' :
                                u.isActive ? 'text-green-600' :
                                'text-red-600'
                              }`}>
                                {u.status === 'pending' ? 'Pending' : u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => {
                                alert(`User Details:\nName: ${u.name}\nEmail: ${u.email || 'N/A'}\nRole: ${u.role}\nStatus: ${u.isActive ? 'Active' : 'Inactive'}`);
                              }}
                              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                isDarkMode 
                                  ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' 
                                  : 'bg-white hover:bg-gray-100 text-black border border-black'
                              }`}
                              style={isDarkMode ? { backgroundColor: '#141414' } : {}}
                            >
                              Details
                            </button>
                            <div className="relative group">
                              <button
                                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                              >
                                <MoreVertical className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                              </button>
                              <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10`}>
                                <div className="py-2">
                                  {u.role === 'user' && (
                                    <button
                                      onClick={() => handleMakeManager(u._id)}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <Crown className="w-4 h-4" />
                                      Make Manager
                                    </button>
                                  )}
                                  {u.role === 'manager' && (
                                    <button
                                      onClick={() => handleMakeUser(u._id)}
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <User className="w-4 h-4" />
                                      Make User
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleToggleUserStatus(u._id)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                  >
                                    {u.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u._id)}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Points Chart Section */}
          <div className="mb-6 sm:mb-8" style={{ width: '100%', minHeight: '200px' }}>
            <PointsChart />
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md my-4`}>
              <div className={`${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">Create New User</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-1.5 sm:p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateUser} className="p-4 sm:p-6 md:p-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Username</label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Password</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-sm sm:text-base"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-colors font-bold text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-xl sm:rounded-2xl transition-all font-bold shadow-lg text-sm sm:text-base`}
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default AdminDashboard;