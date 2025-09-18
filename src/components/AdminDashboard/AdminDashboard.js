import React, { useState } from 'react';
import { Shield, Users, Settings, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import RoleGuard from '../common/RoleGuard';

const AdminDashboard = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [pendingManagers, setPendingManagers] = useState([
    { id: 1, name: 'John Manager', email: 'john@example.com', status: 'pending' },
    { id: 2, name: 'Sarah Lead', email: 'sarah@example.com', status: 'pending' }
  ]);

  const approveManager = (id) => {
    setPendingManagers(prev => 
      prev.map(manager => 
        manager.id === id ? { ...manager, status: 'approved' } : manager
      )
    );
  };

  const rejectManager = (id) => {
    setPendingManagers(prev => 
      prev.filter(manager => manager.id !== id)
    );
  };

  return (
    <RoleGuard requiredRole="admin" fallback={
      <div className="p-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access this page.</p>
      </div>
    }>
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 mr-3 text-blue-500" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">Welcome back, {user?.name || 'Admin'}. Manage your organization here.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold">42</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Approvals</p>
                  <p className="text-2xl font-bold">{pendingManagers.filter(m => m.status === 'pending').length}</p>
                </div>
                <Settings className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Manager Approval Requests</h2>
            <div className="space-y-4">
              {pendingManagers.filter(m => m.status === 'pending').map(manager => (
                <div key={manager.id} className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{manager.name}</h3>
                      <p className="text-sm text-gray-500">{manager.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveManager(manager.id)}
                        className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => rejectManager(manager.id)}
                        className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingManagers.filter(m => m.status === 'pending').length === 0 && (
                <p className="text-gray-500 text-center py-8">No pending manager approvals</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default AdminDashboard;