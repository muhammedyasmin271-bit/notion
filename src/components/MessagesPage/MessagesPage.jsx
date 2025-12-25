import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Archive, 
  CheckCircle, 
  Clock,
  User,
  Phone,
  MessageSquare,
  X,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const MessagesPage = () => {
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, [statusFilter, page]);

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/contact/messages?status=${statusFilter}&page=${page}&limit=20`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch messages');
      }

      setMessages(data.messages || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (messageId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/contact/messages/${messageId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Update local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, status: newStatus, readAt: newStatus === 'read' ? new Date() : msg.readAt, repliedAt: newStatus === 'replied' ? new Date() : msg.repliedAt } : msg
      ));
      
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(data);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      setError(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'https://notion-l9ti.onrender.com'}/api/contact/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete message');
      }

      // Remove from local state
      setMessages(messages.filter(msg => msg._id !== messageId));
      if (selectedMessage && selectedMessage._id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setError(error.message || 'Failed to delete message');
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    
    // Mark as read if it's new
    if (message.status === 'new') {
      await handleStatusChange(message._id, 'read');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-blue-100 text-blue-700 border-blue-300';
      case 'read':
        return isDarkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/50' : 'bg-gray-100 text-gray-700 border-gray-300';
      case 'replied':
        return isDarkMode ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-green-100 text-green-700 border-green-300';
      case 'archived':
        return isDarkMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return isDarkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/50' : 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = searchQuery === '' || 
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-xl`}>
              <Mail size={32} className={isDarkMode ? 'text-black' : 'text-white'} />
            </div>
            <div>
              <h1 className={`text-4xl sm:text-5xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Contact Messages
              </h1>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                View and manage messages from users
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`mb-6 p-4 rounded-2xl border-2 backdrop-blur-sm flex items-center gap-3 ${isDarkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-300'}`}>
            <AlertCircle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={20} />
            <span className={`flex-1 font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{error}</span>
            <button onClick={() => setError('')} className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${isDarkMode ? 'hover:bg-red-800' : 'hover:bg-red-100'}`}>
              <X size={18} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-gray-400'} transition-all`}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'new', 'read', 'replied', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  statusFilter === status
                    ? isDarkMode
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <div className="relative inline-block">
                <div className={`w-20 h-20 border-4 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} rounded-full`}></div>
                <div className={`w-20 h-20 border-4 ${isDarkMode ? 'border-white' : 'border-black'} border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
              </div>
              <p className={`mt-6 text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading messages...</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className={`text-center py-24 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-2 rounded-3xl shadow-2xl`}>
            <div className={`inline-flex p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} mb-6 shadow-lg`}>
              <Mail size={72} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <p className={`text-2xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>No messages found</p>
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchQuery ? 'Try adjusting your search' : 'No contact messages yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1 space-y-3">
              {filteredMessages.map((message) => (
                <div
                  key={message._id}
                  onClick={() => handleViewMessage(message)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedMessage?._id === message._id
                      ? isDarkMode
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-white border-black'
                      : isDarkMode
                      ? 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-lg truncate ${selectedMessage?._id === message._id ? (isDarkMode ? 'text-black' : 'text-white') : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                        {message.name}
                      </h3>
                      <p className={`text-sm truncate ${selectedMessage?._id === message._id ? (isDarkMode ? 'text-gray-700' : 'text-gray-300') : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                        {message.email}
                      </p>
                    </div>
                    {message.status === 'new' && (
                      <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'} flex-shrink-0`}></div>
                    )}
                  </div>
                  <p className={`text-sm line-clamp-2 mb-3 ${selectedMessage?._id === message._id ? (isDarkMode ? 'text-gray-700' : 'text-gray-300') : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`}>
                    {message.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${selectedMessage?._id === message._id ? (isDarkMode ? 'text-gray-600' : 'text-gray-400') : (isDarkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                      {new Date(message.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(message.status)}`}>
                      {message.status}
                    </span>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50 ${
                      isDarkMode
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50 ${
                      isDarkMode
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl p-6 sm:p-8 shadow-2xl`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedMessage.name}
                      </h2>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(selectedMessage.createdAt).toLocaleString()}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(selectedMessage.status)}`}>
                          {selectedMessage.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                    >
                      <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</span>
                      </div>
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                      >
                        {selectedMessage.email}
                      </a>
                    </div>

                    {selectedMessage.phone && (
                      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Phone size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                          <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone</span>
                        </div>
                        <a
                          href={`tel:${selectedMessage.phone}`}
                          className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'} hover:underline`}
                        >
                          {selectedMessage.phone}
                        </a>
                      </div>
                    )}

                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Message</span>
                      </div>
                      <p className={`text-base leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedMessage.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                    {selectedMessage.status !== 'read' && (
                      <button
                        onClick={() => handleStatusChange(selectedMessage._id, 'read')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                          isDarkMode
                            ? 'bg-gray-800 text-white hover:bg-gray-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Eye size={18} />
                        Mark as Read
                      </button>
                    )}
                    {selectedMessage.status !== 'replied' && (
                      <button
                        onClick={() => handleStatusChange(selectedMessage._id, 'replied')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                          isDarkMode
                            ? 'bg-green-800 text-white hover:bg-green-700'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <CheckCircle size={18} />
                        Mark as Replied
                      </button>
                    )}
                    {selectedMessage.status !== 'archived' && (
                      <button
                        onClick={() => handleStatusChange(selectedMessage._id, 'archived')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                          isDarkMode
                            ? 'bg-orange-800 text-white hover:bg-orange-700'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        <Archive size={18} />
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedMessage._id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                        isDarkMode
                          ? 'bg-red-800 text-white hover:bg-red-700'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-2 rounded-3xl p-12 shadow-2xl flex items-center justify-center min-h-[400px]`}>
                  <div className="text-center">
                    <Mail size={64} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-xl font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Select a message to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;

