import React, { useState, useEffect } from 'react';
import {
  Shield, Users, UserPlus, Settings, BarChart3, Bell,
  FileText, Calendar, MessageSquare, TrendingUp,
  CheckCircle, XCircle, Clock, Search, Filter,
  Eye, EyeOff, Crown, User, Trash2, Edit3, Plus,
  Download, Upload, RefreshCw, AlertTriangle,
  Activity, Database, Server, Zap, PieChart,
  BarChart, LineChart, MapPin, Mail, Phone,
  Lock, Unlock, Ban, Award, Target, CalendarDays
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
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 32,
    uptime: '12 days',
    activeSessions: 24
  });
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, user: 'John Doe', action: 'Created new project', time: '2 minutes ago', type: 'project' },
    { id: 2, user: 'Jane Smith', action: 'Completed meeting', time: '15 minutes ago', type: 'meeting' },
    { id: 3, user: 'Mike Johnson', action: 'Uploaded document', time: '1 hour ago', type: 'document' },
    { id: 4, user: 'Sarah Wilson', action: 'Added team member', time: '3 hours ago', type: 'user' }
  ]);

  // Load users and stats
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

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className={`p-6 rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
          <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const SystemStatCard = ({ title, value, icon: Icon, color, percentage }) => (
    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
      </div>
      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</h3>
      {percentage && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );

  return (
    <RoleGuard requiredRole="admin" fallback={
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access this page.</p>
      </div>
    }>
      <div className={`min-h-screen p-3 sm:p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center min-w-0 flex-1">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Admin Dashboard</h1>
              </div>
              <button
                onClick={() => navigate('/admin/settings')}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex-shrink-0"
              >
                Settings
              </button>
            </div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base`}>Welcome back, {user?.name || 'Admin'}.</p>
          </div>

          {/* User Management Section */}
          <div className={`rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold mb-4 md:mb-0">User Management</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Bulk Actions
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New User
                </button>
              </div>
            </div>

            {/* Bulk Actions Panel */}
            {showBulkActions && (
              <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex flex-wrap items-center justify-between">
                  <div className="mb-2 md:mb-0">
                    <span className="font-medium">{selectedUsers.length} users selected</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkActivate}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Unlock className="w-4 h-4 mr-1" />
                      Activate
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 w-full rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Contact</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Joined</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-100'}`}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u._id)}
                          onChange={() => handleUserSelection(u._id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          {u.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-4 h-4 mr-2" />
                              {u.email}
                            </div>
                          )}
                          {u.phone && (
                            <div className="flex items-center text-sm mt-1">
                              <Phone className="w-4 h-4 mr-2" />
                              {u.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-800' :
                            u.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                          }`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'User'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            u.isActive ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {u.status === 'pending' ? 'Pending' : u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {u.role === 'user' && (
                            <button
                              onClick={() => handleMakeManager(u._id)}
                              className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
                              title="Make Manager"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          )}
                          {u.role === 'manager' && (
                            <button
                              onClick={() => handleMakeUser(u._id)}
                              className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                              title="Make User"
                            >
                              <User className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleUserStatus(u._id)}
                            className={`p-2 rounded-lg ${u.isActive
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            title={u.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
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

          {/* Additional Admin Tools */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <button
              onClick={() => navigate('/admin/settings')}
              className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-transform hover:scale-105 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <Settings className="w-8 h-8 text-blue-500 mb-3" />
              <span className="font-medium">System Settings</span>
            </button>
            <button
              onClick={() => navigate('/admin/audit-log')}
              className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-transform hover:scale-105 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <FileText className="w-8 h-8 text-green-500 mb-3" />
              <span className="font-medium">Audit Log</span>
            </button>
            <button
              onClick={() => navigate('/admin/security')}
              className={`p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-transform hover:scale-105 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <Shield className="w-8 h-8 text-purple-500 mb-3" />
              <span className="font-medium">Security Center</span>
            </button>
          </div>

        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl w-full max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Create New User</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 rounded-lg hover:bg-gray-200"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateUser} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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