import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Search, Calendar, Clock, Users, FileText, Filter, MoreHorizontal, Edit, Trash2, Copy, CheckCircle, Circle, TrendingUp, BarChart2, Tag, Clock as ClockIcon, ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMeetings, deleteMeeting, completeMeetingActionItem, addMeetingActionItem, updateMeeting } from '../../services/api';
import ServerStatus from '../ServerStatus/ServerStatus';

const MeetingNotesPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showDropdown, setShowDropdown] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeetings, setExpandedMeetings] = useState(new Set());
  const [subMeetings, setSubMeetings] = useState({});

  // Load meetings from API
  useEffect(() => {
    loadMeetings();

    // Sample templates
    setTemplates([
      { id: 1, name: 'Weekly Standup', type: 'Standup', description: 'Daily team sync meeting' },
      { id: 2, name: 'Project Planning', type: 'Planning', description: 'Project kickoff meeting' },
      { id: 3, name: 'Retrospective', type: 'Retro', description: 'Team retrospective meeting' }
    ]);
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      console.log('Attempting to load meetings from API...');
      const data = await getMeetings();
      console.log('Received meetings data:', data);
      
      // Transform data to match our component structure
      const transformedMeetings = data.map(meeting => ({
        id: meeting._id,
        title: meeting.title,
        date: new Date(meeting.date).toISOString().split('T')[0],
        time: meeting.time,
        duration: meeting.duration,
        attendees: meeting.attendees || [],
        status: meeting.status.toLowerCase(),
        type: meeting.type,
        notes: meeting.notes || '',
        actionItems: meeting.actionItems || [],
        tags: meeting.tags || [],
        createdAt: meeting.createdAt
      }));
      
      console.log('Transformed meetings:', transformedMeetings);
      setMeetings(transformedMeetings);
    } catch (error) {
      console.error('Error loading meetings:', error);
      console.error('Error details:', error.message);
      // Show empty list instead of fallback data
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.attendees.some(attendee => attendee.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (meeting.tags && meeting.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = filterStatus === 'all' || meeting.status === filterStatus;
    const matchesType = filterType === 'all' || meeting.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Standup': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Planning': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'Review': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      case 'Retro': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    try {
      await deleteMeeting(meetingId);
      setMeetings(meetings.filter(m => m.id !== meetingId));
      setShowDropdown(null);
    } catch (error) {
      console.error('Error deleting meeting:', error);
      // Fallback to local state update
      setMeetings(meetings.filter(m => m.id !== meetingId));
      setShowDropdown(null);
    }
  };

  const handleDuplicateMeeting = (meeting) => {
    const newMeeting = {
      ...meeting,
      id: Date.now(),
      title: `${meeting.title} (Copy)`,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    setMeetings([newMeeting, ...meetings]);
    setShowDropdown(null);
  };

  const toggleActionItem = async (meetingId, actionItemId) => {
    try {
      // Find the meeting and action item
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) return;

      const actionItem = meeting.actionItems.find(item => item.id === actionItemId);
      if (!actionItem) return;

      // Update locally first for immediate feedback
      setMeetings(meetings.map(m => {
        if (m.id === meetingId) {
          const updatedActionItems = m.actionItems.map(item =>
            item.id === actionItemId ? { ...item, completed: !item.completed } : item
          );
          return { ...m, actionItems: updatedActionItems };
        }
        return m;
      }));

      // Update on server
      await completeMeetingActionItem(meetingId, actionItemId);
    } catch (error) {
      console.error('Error toggling action item:', error);
      // Revert local change on error
      setMeetings(meetings.map(m => {
        if (m.id === meetingId) {
          const updatedActionItems = m.actionItems.map(item =>
            item.id === actionItemId ? { ...item, completed: !item.completed } : item
          );
          return { ...m, actionItems: updatedActionItems };
        }
        return m;
      }));
    }
  };

  const getCompletionStats = () => {
    const totalActionItems = meetings.reduce((total, meeting) => total + (meeting.actionItems ? meeting.actionItems.length : 0), 0);
    const completedActionItems = meetings.reduce((completed, meeting) =>
      completed + (meeting.actionItems ? meeting.actionItems.filter(item => item.completed).length : 0), 0);

    return {
      total: totalActionItems,
      completed: completedActionItems,
      percentage: totalActionItems > 0 ? Math.round((completedActionItems / totalActionItems) * 100) : 0
    };
  };

  const stats = getCompletionStats();

  const updateMeetingField = async (meetingId, field, value) => {
    try {
      const meetingData = { [field]: value };
      await updateMeeting(meetingId, meetingData);
      
      // Update local state
      setMeetings(meetings.map(m => 
        m.id === meetingId ? { ...m, [field]: value } : m
      ));
    } catch (error) {
      console.error('Error updating meeting:', error);
      // Revert local change on error
      loadMeetings();
    }
  };

  const toggleMeetingExpansion = (meetingId) => {
    const newExpanded = new Set(expandedMeetings);
    if (newExpanded.has(meetingId)) {
      newExpanded.delete(meetingId);
    } else {
      newExpanded.add(meetingId);
    }
    setExpandedMeetings(newExpanded);
  };

  const addSubMeeting = (parentMeetingId) => {
    const newSubMeeting = {
      id: Date.now(),
      title: 'New Sub-Meeting',
      type: 'breakout',
      duration: '30',
      agenda: '',
      participants: []
    };
    
    setSubMeetings(prev => ({
      ...prev,
      [parentMeetingId]: [...(prev[parentMeetingId] || []), newSubMeeting]
    }));
  };

  const updateSubMeeting = (parentMeetingId, subMeetingId, field, value) => {
    setSubMeetings(prev => ({
      ...prev,
      [parentMeetingId]: prev[parentMeetingId].map(sub =>
        sub.id === subMeetingId ? { ...sub, [field]: value } : sub
      )
    }));
  };

  const deleteSubMeeting = (parentMeetingId, subMeetingId) => {
    setSubMeetings(prev => ({
      ...prev,
      [parentMeetingId]: prev[parentMeetingId].filter(sub => sub.id !== subMeetingId)
    }));
  };

  const MeetingListItem = ({ meeting }) => {
    const isExpanded = expandedMeetings.has(meeting.id);
    const meetingSubMeetings = subMeetings[meeting.id] || [];

    return (
      <div className={`border-b last:border-b-0 transition-all duration-200 ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/60'}`}>
        <div className={`p-5 hover:bg-gradient-to-r ${isDarkMode ? 'hover:from-gray-800/30 hover:to-gray-800/10' : 'hover:from-blue-50/30 hover:to-purple-50/20'} group transition-all duration-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 flex-1">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(meeting.status).includes('green') ? 'bg-emerald-500' : getStatusColor(meeting.status).includes('blue') ? 'bg-blue-500' : getStatusColor(meeting.status).includes('yellow') ? 'bg-amber-500' : 'bg-gray-500'}`}></div>
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/meeting-editor/${meeting.id}`)}
              >
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={`font-semibold text-lg mr-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                    {meeting.title}
                  </span>
                  <span className="mr-3">•</span>
                  <select
                    value={meeting.type}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateMeetingField(meeting.id, 'type', e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-0.5 rounded text-xs font-medium bg-transparent border-none outline-none mr-3 ${getTypeColor(meeting.type)}`}
                  >
                    <option value="Standup">Standup</option>
                    <option value="Planning">Planning</option>
                    <option value="Review">Review</option>
                    <option value="Retro">Retro</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Brainstorming">Brainstorming</option>
                    <option value="Client Meeting">Client Meeting</option>
                    <option value="Team Sync">Team Sync</option>
                  </select>
                  <span className="mr-3">•</span>
                  <select
                    value={meeting.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateMeetingField(meeting.id, 'status', e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-0.5 rounded text-xs font-medium bg-gray-800 border border-gray-600 outline-none mr-3 ${getStatusColor(meeting.status)}`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <span className="mr-3">•</span>
                  <input
                    type="date"
                    value={meeting.date}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateMeetingField(meeting.id, 'date', e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium bg-transparent border-none outline-none mr-3"
                  />
                  <span className="mr-3">•</span>
                  <input
                    type="time"
                    value={meeting.time}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateMeetingField(meeting.id, 'time', e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none outline-none mr-3"
                  />
                  <span className="mr-3">•</span>
                  <span>{meeting.attendees ? meeting.attendees.length : 0} people</span>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMeetingExpansion(meeting.id);
              }}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
              title="Toggle sub-meetings"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className={`px-5 pb-5 ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <GitBranch className="w-4 h-4 inline mr-2" />
                Sub-Meetings ({meetingSubMeetings.length})
              </h4>
              <button
                onClick={() => addSubMeeting(meeting.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                <Plus className="w-3 h-3" />
                Add Sub-Meeting
              </button>
            </div>
            
            {meetingSubMeetings.length > 0 ? (
              <div className="space-y-2">
                {meetingSubMeetings.map(subMeeting => (
                  <div key={subMeeting.id} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <select
                        value={subMeeting.type}
                        onChange={(e) => updateSubMeeting(meeting.id, subMeeting.id, 'type', e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                      >
                        <option value="breakout">Breakout</option>
                        <option value="followup">Follow-up</option>
                        <option value="technical">Technical</option>
                        <option value="executive">Executive</option>
                      </select>
                      <input
                        type="text"
                        value={subMeeting.title}
                        onChange={(e) => updateSubMeeting(meeting.id, subMeeting.id, 'title', e.target.value)}
                        placeholder="Sub-meeting title..."
                        className={`flex-1 px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                      />
                      <input
                        type="number"
                        value={subMeeting.duration}
                        onChange={(e) => updateSubMeeting(meeting.id, subMeeting.id, 'duration', e.target.value)}
                        className={`w-16 px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                        min="5"
                        max="240"
                      />
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>min</span>
                      <button
                        onClick={() => deleteSubMeeting(meeting.id, subMeeting.id)}
                        className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-100 text-red-500'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <textarea
                      value={subMeeting.agenda}
                      onChange={(e) => updateSubMeeting(meeting.id, subMeeting.id, 'agenda', e.target.value)}
                      placeholder="Agenda, objectives, or notes..."
                      className={`w-full px-2 py-1 rounded text-sm resize-none ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                      rows="2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sub-meetings yet. Add one to organize breakout sessions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meeting Notes</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage your meeting notes and schedules
            </p>
          </div>
          <button
            onClick={() => navigate('/meeting-new')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            <Plus className="w-4 h-4" />
            Create Meeting
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search meetings, attendees, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">All Types</option>
              <option value="Standup">Standup</option>
              <option value="Planning">Planning</option>
              <option value="Review">Review</option>
              <option value="Retro">Retro</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {meetings.length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Meetings</div>
          </div>
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {meetings.filter(m => m.status === 'completed').length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</div>
          </div>
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {meetings.filter(m => m.status === 'scheduled').length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Scheduled</div>
          </div>
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {stats.percentage}%
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Action Items Done</div>
          </div>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredMeetings.length > 0 ? (
          <div className={`rounded-2xl border shadow-lg ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200/60 backdrop-blur-sm'}`}>
            {filteredMeetings.map(meeting => (
              <MeetingListItem key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Calendar className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' ? 'No meetings found' : 'No meetings yet'}
            </h3>
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mb-4`}>
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first meeting to get started'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
              <button
                onClick={() => navigate('/meeting-new')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                Create Meeting
              </button>
            )}
          </div>
        )}
        <ServerStatus />
      </div>
    </div>
  );
};

export default MeetingNotesPage;