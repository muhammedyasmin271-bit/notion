import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext'; // Added import for AppContext
import { Plus, Search, Calendar, Clock, Users, FileText, Filter, Edit, CheckCircle, Circle, TrendingUp, BarChart2, Tag, Clock as ClockIcon, Newspaper as MeetingNotesIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMeetings, deleteMeeting, completeMeetingActionItem, addMeetingActionItem, updateMeeting } from '../../services/api';


const MeetingNotesPage = () => {
  const { isDarkMode } = useTheme();
  const { user, isManager } = useAppContext(); // Added user and isManager from AppContext
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showDropdown, setShowDropdown] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);


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
        status: meeting.status,
        type: meeting.type,
        notes: meeting.notes || '',
        actionItems: meeting.actionItems || [],
        tags: meeting.tags || [],
        location: meeting.location || '',
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
    return isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
  };

  const getTypeColor = (type) => {
    return isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
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





  const MeetingListItem = ({ meeting }) => {
    return (
      <div 
        className={`border-b last:border-b-0 transition-all duration-200 cursor-pointer ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/60'}`}
        onClick={() => {
          const companyId = user?.companyId || 'default';
          navigate(`/${companyId}/meeting-editor/${meeting.id}`);
        }}
      >
        <div className={`p-3 sm:p-5 ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'} group transition-all duration-200`}>
          {/* Mobile Layout */}
          <div className="block sm:hidden">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'}`}></div>
              <span className={`font-semibold text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>
                {meeting.title}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={meeting.type}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateMeetingField(meeting.id, 'type', e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2 py-1 rounded text-xs font-medium bg-transparent border-none outline-none ${getTypeColor(meeting.type)}`}
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
                <select
                  value={meeting.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateMeetingField(meeting.id, 'status', e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2 py-1 rounded text-xs font-medium bg-transparent border-none outline-none ${getStatusColor(meeting.status)}`}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <input
                  type="date"
                  value={meeting.date}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateMeetingField(meeting.id, 'date', e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none outline-none text-xs"
                />
                <span>•</span>
                <input
                  type="time"
                  value={meeting.time}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateMeetingField(meeting.id, 'time', e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none outline-none text-xs"
                />
                <span>•</span>
                <span className="text-xs">{meeting.attendees ? meeting.attendees.length : 0} people</span>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center">
            <div className="flex items-center gap-6 flex-1">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(meeting.status).includes('green') ? 'bg-emerald-500' : getStatusColor(meeting.status).includes('blue') ? (isDarkMode ? 'bg-white' : 'bg-black') : getStatusColor(meeting.status).includes('yellow') ? 'bg-amber-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1 min-w-0">
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className={`font-semibold text-lg mr-20 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>
                    {meeting.title}
                  </span>
                  <select
                    value={meeting.type}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateMeetingField(meeting.id, 'type', e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-0.5 rounded text-xs font-medium bg-transparent border-none outline-none mr-20 ${getTypeColor(meeting.type)}`}
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
                      updateMeetingField(meeting.id, 'status', e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-0.5 rounded text-xs font-medium bg-transparent border-none outline-none mr-20 ${getStatusColor(meeting.status)}`}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
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
                  <span className="mr-3 w-24">
                    {meeting.location || 'No location'}
                  </span>
                  <span className="mr-3">•</span>
                  <span>{meeting.attendees ? meeting.attendees.length : 0} people</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-3 sm:p-6 ${isDarkMode ? 'bg-[#141414] text-white' : 'bg-gray-50 text-gray-900'}`}
      style={isDarkMode ? { backgroundColor: '#141414' } : {}}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 md:mr-6 flex-shrink-0 ${isDarkMode ? 'bg-white' : 'bg-black'} shadow-xl`}>
              <MeetingNotesIcon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-8 md:h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
            </div>
            <div className="min-w-0">
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'} mb-0.5 sm:mb-1`}>Meeting Notes</h1>
              <p className={`text-xs sm:text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                Manage your meeting notes and schedules
              </p>
            </div>
          </div>
          {/* Conditionally show Create Meeting button only for managers and admins */}
          {isManager() && (
            <button
              onClick={() => {
                const companyId = user?.companyId || 'default';
                navigate(`/${companyId}/meeting-new`);
              }}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all w-full sm:w-auto ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
              style={isDarkMode ? { backgroundColor: '#141414' } : {}}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Meeting</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 rounded-lg border transition-colors text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-white' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-black'} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-white/20' : 'focus:ring-black/20'}`}
            />
          </div>
        </div>

        {/* Stats - Hidden on mobile */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {meetings.length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Meetings</div>
          </div>
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {meetings.filter(m => m.status === 'completed').length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</div>
          </div>
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {meetings.filter(m => m.status === 'scheduled').length}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Scheduled</div>
          </div>
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {stats.percentage}%
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Action Items Done</div>
          </div>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
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
            {/* Conditionally show Create Meeting button in empty state only for managers and admins */}
            {!searchTerm && filterStatus === 'all' && filterType === 'all' && isManager() && (
              <button
                onClick={() => {
                  const companyId = user?.companyId || 'default';
                  navigate(`/${companyId}/meeting-new`);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-[#141414] hover:bg-gray-800 text-white border border-white' : 'bg-white hover:bg-gray-100 text-black border border-black'}`}
                style={isDarkMode ? { backgroundColor: '#141414' } : {}}
              >
                Create Meeting
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MeetingNotesPage;