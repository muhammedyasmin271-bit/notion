import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  Send,
  User,
  Crown,
  MessageCircle,
  Phone,
  Mail,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const InboxPage = () => {
  const { user, users, setCurrentPage } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Separate managers and regular users
  const managers = users.filter(u => u.role === 'manager' && u.id !== user?.id);
  const regularUsers = users.filter(u => u.role === 'user' && u.id !== user?.id);

  const handleStartChat = (userData) => {
    setSelectedUser(userData);
    // Load chat history from localStorage
    const chatKey = `chat:${user.id}:${userData.id}`;
    const chatHistory = JSON.parse(localStorage.getItem(chatKey) || '[]');
    setChatMessages(chatHistory);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: user.id,
      receiver: selectedUser.id,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    const updatedMessages = [...chatMessages, message];
    setChatMessages(updatedMessages);
    
    // Save to localStorage
    const chatKey = `chat:${user.id}:${selectedUser.id}`;
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    
    // Clear input
    setNewMessage('');
  };

  const handleContactUser = (userData, contactType) => {
    switch (contactType) {
      case 'email':
        window.open(`mailto:${userData.email}`, '_blank');
        break;
      case 'phone':
        window.open(`tel:${userData.phone || ''}`, '_blank');
        break;
      default:
        break;
    }
  };

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = regularUsers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilteredUsers = () => {
    if (filterRole === 'managers') return filteredManagers;
    if (filterRole === 'users') return filteredUsers;
    return [...filteredManagers, ...filteredUsers];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="ml-64 p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen text-gray-900 font-sans">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Inbox</h1>
              <p className="text-lg text-gray-600 mt-1">Connect and chat with your team members</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{managers.length}</div>
              <div className="text-sm text-gray-500">Managers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{regularUsers.length}</div>
              <div className="text-sm text-gray-500">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{users.length - 1}</div>
              <div className="text-sm text-gray-500">Total Team</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="managers">Managers</option>
                  <option value="users">Members</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Users List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFilteredUsers().map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleStartChat(member)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    selectedUser?.id === member.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      member.role === 'manager' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                        : 'bg-gradient-to-r from-blue-400 to-indigo-400'
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{member.name}</h3>
                        {member.role === 'manager' && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{member.role === 'manager' ? 'Manager' : 'Team Member'}</p>
                    </div>
                    <div className="flex space-x-1">
                      {member.email && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactUser(member, 'email');
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                          title="Send Email"
                        >
                          <Mail className="w-3 h-3" />
                        </button>
                      )}
                      {member.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactUser(member, 'phone');
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                          title="Call"
                        >
                          <Phone className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredUsers().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <User className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No team members found</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-96 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        selectedUser.role === 'manager' 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                          : 'bg-gradient-to-r from-blue-400 to-indigo-400'
                      }`}>
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedUser.email && (
                        <button
                          onClick={() => handleContactUser(selectedUser, 'email')}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      {selectedUser.phone && (
                        <button
                          onClick={() => handleContactUser(selectedUser, 'phone')}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender === user.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.text}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === user.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a team member</h3>
                  <p className="text-sm">Choose someone from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxPage;