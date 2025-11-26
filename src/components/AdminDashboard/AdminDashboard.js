import React, { useState, useEffect } from 'react';
import {
  Shield, Users, UserPlus, Settings, BarChart3, Bell,
  FileText, Calendar, MessageSquare, TrendingUp,
  CheckCircle, XCircle, Clock, Search, Filter,
  Eye, EyeOff, Crown, User, Trash2, Edit3, Plus,
  Download, Upload, RefreshCw, AlertTriangle,
  Activity, Database, Server, Zap, PieChart,
  BarChart, LineChart, MapPin, Mail, Phone,
  Lock, Unlock, Ban, Award, Target, CalendarDays, DollarSign
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';
import { useNavigate } from 'react-router-dom';

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
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + (error.message || 'Unknown error'));
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
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const { deleteUser } = await import('../../services/api');
      await deleteUser(userId);
      loadUsers();
      loadStats();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleMakeManager = async (userId) => {
    try {
      const { put } = await import('../../services/api');
      await put(`/auth/admin/users/${userId}/make-manager`, {});
      loadUsers();
      alert('User is now a manager!');
    } catch (error) {
      console.error('Error making user manager:', error);
      alert('Failed to make user manager');
    }
  };

  const handleMakeUser = async (userId) => {
    try {
      const { put } = await import('../../services/api');
      await put(`/auth/admin/users/${userId}/make-user`, {});
      loadUsers();
      alert('Manager is now a regular user!');
    } catch (error) {
      console.error('Error making manager user:', error);
      alert('Failed to make manager user');
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
      alert('Users deleted successfully!');
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Failed to delete users: ' + (error.message || 'Unknown error'));
    }
  };

  const handleBulkActivate = async () => {
    try {
      const { put } = await import('../../services/api');
      await Promise.all(selectedUsers.map(id => put(`/auth/users/${id}/status`, {})));
      setSelectedUsers([]);
      loadUsers();
      alert('Users activated successfully!');
    } catch (error) {
      console.error('Error activating users:', error);
      alert('Failed to activate users: ' + (error.message || 'Unknown error'));
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

  const StatCard = ({ title, value, icon: Icon, gradient, change }) => (
    <div className="group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} group-hover:opacity-20 transition-opacity`}></div>
      <div className="relative p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-4xl font-black text-gray-900 mb-1">{value}</p>
            {change && (
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {change > 0 ? '↗' : '↘'} {Math.abs(change)}% from last month
              </p>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-lg`}>
            <Icon className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <RoleGuard requiredRole="admin" fallback={
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} flex items-center justify-center p-8`}>
        <div className={`text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-12 max-w-md`}>
          <Shield className={`w-20 h-20 mx-auto mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          <h2 className="text-3xl font-black mb-4 text-gray-900">Access Denied</h2>
          <p className="text-gray-600 text-lg">You need admin privileges to access this page.</p>
        </div>
      </div>
    }>
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        {/* Fixed Payment Button */}
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={() => {
              const companyId = user?.companyId;
              navigate(companyId ? `/${companyId}/admin/payments` : '/admin/payments');
            }}
            className={`flex items-center gap-3 px-6 py-4 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-full font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110`}
          >
            <DollarSign className="w-6 h-6" />
            <span className="hidden sm:inline">Payments</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className={`p-4 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-xl`}>
                <Shield className={`w-12 h-12 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <h1 className={`text-6xl font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Admin Center
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Welcome back, {user?.name || 'Admin'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              gradient="from-blue-500 to-blue-600"
              change={stats.growthMetrics.monthly}
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={CheckCircle}
              gradient="from-green-500 to-emerald-600"
              change={5}
            />
            <StatCard
              title="Pending Users"
              value={stats.pendingUsers}
              icon={Clock}
              gradient="from-yellow-500 to-orange-500"
            />
            <StatCard
              title="Managers"
              value={stats.managers}
              icon={Crown}
              gradient="from-purple-500 to-indigo-600"
            />
          </div>

          {/* User Management Section */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden mb-8`}>
            <div className={`${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} p-8`}>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4 mb-6 lg:mb-0">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-black' : 'text-white'}`}>User Management</h2>
                    <p className={isDarkMode ? 'text-black/80' : 'text-white/80'}>Manage your team members and permissions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all duration-300 font-semibold"
                  >
                    <Settings className="w-5 h-5" />
                    Bulk Actions
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-bold shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Add User
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Bulk Actions Panel */}
              {showBulkActions && (
                <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6 mb-8 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="mb-4 lg:mb-0">
                      <span className="text-lg font-bold text-gray-800">{selectedUsers.length} users selected</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleBulkActivate}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
                      >
                        <Unlock className="w-4 h-4" />
                        Activate
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-4 w-full rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-gray-900 font-medium"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-gray-900 font-medium"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all text-gray-900 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                      <tr>
                        <th className="text-left py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                            onChange={handleSelectAll}
                            className="rounded-lg w-5 h-5 text-indigo-600"
                          />
                        </th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">User</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Contact</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Role</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Status</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Joined</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className={`border-t ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-all duration-200`}>
                          <td className="py-4 px-6">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(u._id)}
                              onChange={() => handleUserSelection(u._id)}
                              className="rounded-lg w-5 h-5 text-indigo-600"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-2xl ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center mr-4 shadow-lg`}>
                                <span className="text-lg font-bold">{u.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{u.name}</div>
                                <div className="text-sm text-gray-600">@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              {u.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="w-4 h-4 mr-2" />
                                  {u.email}
                                </div>
                              )}
                              {u.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {u.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              u.role === 'admin' ? 'bg-red-100 text-red-800' :
                              u.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'User'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              u.isActive ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {u.status === 'pending' ? 'Pending' : u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              {u.role === 'user' && (
                                <button
                                  onClick={() => handleMakeManager(u._id)}
                                  className="p-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                                  title="Make Manager"
                                >
                                  <Crown className="w-4 h-4" />
                                </button>
                              )}
                              {u.role === 'manager' && (
                                <button
                                  onClick={() => handleMakeUser(u._id)}
                                  className="p-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                  title="Make User"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleUserStatus(u._id)}
                                className={`p-2 rounded-xl transition-colors ${
                                  u.isActive
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={u.isActive ? 'Deactivate User' : 'Activate User'}
                              >
                                {u.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl w-full max-w-md`}>
              <div className={`${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} p-6 rounded-t-3xl`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Create New User</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateUser} className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-6 py-3 ${isDarkMode ? 'bg-white hover:bg-gray-200 text-black' : 'bg-black hover:bg-gray-800 text-white'} rounded-2xl transition-all font-bold shadow-lg`}
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