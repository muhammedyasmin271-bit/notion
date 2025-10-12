import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Trash as TrashIcon, Edit2, Mail, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import PageHeader from '../common/PageHeader';

const InviteMembersPage = () => {
  const { user, users, setUsers } = useAppContext();
  const { isDarkMode } = useTheme();
  const [invitations, setInvitations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [editingInvitation, setEditingInvitation] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'user',
    message: ''
  });

  // Initialize with sample invitations if none exist
  useEffect(() => {
    const storedInvitations = localStorage.getItem('invitations');
    if (storedInvitations) {
      setInvitations(JSON.parse(storedInvitations));
    } else {
      const sampleInvitations = [
        {
          id: 1,
          email: "john.doe@company.com",
          name: "John Doe",
          role: "user",
          status: "Pending",
          invitedBy: "Admin",
          invitedAt: "2025-01-15",
          message: "Welcome to our team! We'd love to have you join us.",
          expiresAt: "2025-02-15"
        },
        {
          id: 2,
          email: "sarah.wilson@company.com",
          name: "Sarah Wilson",
          role: "manager",
          status: "Accepted",
          invitedBy: "Admin",
          invitedAt: "2025-01-10",
          message: "We're excited to have you join our management team.",
          acceptedAt: "2025-01-12"
        },
        {
          id: 3,
          email: "mike.brown@company.com",
          name: "Mike Brown",
          role: "user",
          status: "Expired",
          invitedBy: "Admin",
          invitedAt: "2025-01-05",
          message: "Join our growing team and make an impact.",
          expiresAt: "2025-02-05"
        }
      ];
      setInvitations(sampleInvitations);
      localStorage.setItem('invitations', JSON.stringify(sampleInvitations));
    }
  }, []);

  // Save invitations to localStorage whenever they change
  useEffect(() => {
    if (invitations.length > 0) {
      localStorage.setItem('invitations', JSON.stringify(invitations));
    }
  }, [invitations]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'Declined': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invitation.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invitation.status === filterStatus;
    const matchesRole = filterRole === 'all' || invitation.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const sendInvitation = (e) => {
    e.preventDefault();
    
    const newInvitation = {
      id: Date.now(),
      email: inviteForm.email,
      name: inviteForm.name,
      role: inviteForm.role,
      status: "Pending",
      invitedBy: user?.name || "Admin",
      invitedAt: new Date().toISOString().split('T')[0],
      message: inviteForm.message,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    setInvitations([...invitations, newInvitation]);
    setInviteForm({ email: '', name: '', role: 'user', message: '' });
    setShowInviteForm(false);
    
    // In a real app, you would send an email invitation here
    alert(`Invitation sent to ${inviteForm.email}!`);
  };

  const startEditing = (invitation) => {
    setEditingInvitation(invitation.id);
    setEditForm({
      name: invitation.name || '',
      role: invitation.role || 'user',
      message: invitation.message || ''
    });
  };

  const saveEdit = () => {
    const updatedInvitations = invitations.map(invitation => 
      invitation.id === editingInvitation ? { ...invitation, ...editForm } : invitation
    );
    setInvitations(updatedInvitations);
    setEditingInvitation(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingInvitation(null);
    setEditForm({});
  };

  const deleteInvitation = (invitationId) => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      const updatedInvitations = invitations.filter(invitation => invitation.id !== invitationId);
      setInvitations(updatedInvitations);
    }
  };

  const resendInvitation = (invitation) => {
    // In a real app, this would resend the email invitation
    alert(`Invitation resent to ${invitation.email}!`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiresAt) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className={`ml-64 p-8 min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <PageHeader
        title="Invite Members"
        subtitle="Manage team invitations and member access"
        icon={Users}
        rightContent={
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </button>
        }
      />

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Invite New Member</h3>
              <button
                onClick={() => setShowInviteForm(false)}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={sendInvitation} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Full Name"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Personal Message (Optional)</label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  rows={3}
                  placeholder="Add a personal message to your invitation..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`p-4 rounded-lg shadow-sm border mb-6 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Search</label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search invitations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Expired">Expired</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterRole('all');
              }}
              className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invitations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvitations.map((invitation) => {
          const daysUntilExpiry = getDaysUntilExpiry(invitation.expiresAt);
          const isExpiringSoon = daysUntilExpiry <= 7 && invitation.status === 'Pending';
          
          return (
            <div key={invitation.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-200 ${
              isExpiringSoon ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
            }`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isExpiringSoon ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{invitation.name}</h3>
                      <p className="text-xs text-gray-500">{invitation.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(invitation.role)}`}>
                          {invitation.role}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(invitation.status)}`}>
                          {invitation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {editingInvitation === invitation.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Save"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-800 p-1"
                          title="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(invitation)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {editingInvitation === invitation.id ? (
                    <>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                      </select>
                      <textarea
                        value={editForm.message}
                        onChange={(e) => setEditForm({...editForm, message: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">{invitation.message}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Invited By:</span>
                          <span className="font-medium">{invitation.invitedBy}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Invited:</span>
                          <span className="font-medium">{formatDate(invitation.invitedAt)}</span>
                        </div>
                        {invitation.status === 'Accepted' && invitation.acceptedAt && (
                          <div className="flex items-center justify-between">
                            <span>Accepted:</span>
                            <span className="font-medium">{formatDate(invitation.acceptedAt)}</span>
                          </div>
                        )}
                        {invitation.status === 'Pending' && (
                          <div className="flex items-center justify-between">
                            <span>Expires:</span>
                            <span className={`font-medium ${isExpiringSoon ? 'text-yellow-600' : ''}`}>
                              {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                            </span>
                          </div>
                        )}
                      </div>

                      {isExpiringSoon && (
                        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-yellow-800 font-medium">
                              This invitation expires in {daysUntilExpiry} days
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                    {invitation.status === 'Pending' && (
                      <button
                        onClick={() => resendInvitation(invitation)}
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Resend
                      </button>
                    )}
                    {invitation.status === 'Expired' && (
                      <button
                        onClick={() => resendInvitation(invitation)}
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Re-invite
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredInvitations.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {invitations.length === 0 
              ? "No invitations have been sent yet. Start by inviting your first team member." 
              : "No invitations match your current filters."
            }
          </p>
          {invitations.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowInviteForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invitation Statistics */}
      {invitations.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invitation Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{invitations.length}</div>
              <div className="text-sm text-gray-600">Total Invitations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {invitations.filter(inv => inv.status === 'Pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {invitations.filter(inv => inv.status === 'Accepted').length}
              </div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {invitations.filter(inv => inv.status === 'Expired').length}
              </div>
              <div className="text-sm text-gray-600">Expired</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteMembersPage;
