import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Edit2, Trash as TrashIcon, Users, Clock, FileText, CheckCircle, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const MeetingNotesPage = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [editingNote, setEditingNote] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Initialize with sample meeting notes
  useEffect(() => {
    const storedNotes = localStorage.getItem('meetingNotes');
    if (storedNotes) {
      setMeetingNotes(JSON.parse(storedNotes));
    } else {
      const sampleNotes = [
        {
          id: 1,
          title: "Weekly team sync",
          type: "Standup",
          date: "2025-02-13",
          time: "09:00",
          duration: "30 min",
          status: "Scheduled",
          participants: [],
          actionItems: ["Follow up on database migration", "Review PR for user authentication"],
          createdBy: "A Aymen Arega",
          summary: "No content",
        },
        {
          id: 2,
          title: "Product release post-mortem",
          type: "Retro",
          date: "2025-02-13",
          time: "14:00",
          duration: "2 hours",
          status: "Completed",
          participants: [],
          actionItems: ["Create user stories", "Define acceptance criteria"],
          createdBy: "A Aymen Arega",
          summary: "Discussion agenda includes notes and action items.",
        },
        {
          id: 3,
          title: "GTM strategy presentation",
          type: "Presentation",
          date: "2025-02-13",
          time: "16:00",
          duration: "1 hour",
          status: "Scheduled",
          participants: [],
          actionItems: ["Review Q4 goals", "Plan team building event"],
          createdBy: "A Aymen Arega",
          summary: "No content",
        }
      ];
      setMeetingNotes(sampleNotes);
      localStorage.setItem('meetingNotes', JSON.stringify(sampleNotes));
    }
  }, []);

  // Save to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('meetingNotes', JSON.stringify(meetingNotes));
  }, [meetingNotes]);

  const filteredNotes = meetingNotes.filter(note => {
    const matchesSearch = note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesStatus = filterStatus === 'all' || note.status === filterStatus;
    const matchesType = filterType === 'all' || note.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const createNewMeeting = () => {
    if (user?.role !== 'manager') {
      alert('Only managers can create meetings');
      return;
    }
    const newNote = {
      id: Date.now(),
      title: 'New Meeting',
      type: 'Standup',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: '30 min',
      status: 'Scheduled',
      participants: [],
      actionItems: [],
      createdBy: user?.name || 'Unknown User',
      summary: 'No content',
    };
    setMeetingNotes([newNote, ...meetingNotes]);
  };

  const startEditing = (note) => {
    setEditingNote(note.id);
    setEditForm({
      title: note.title || '',
      type: note.type || 'Standup',
      date: note.date || '',
      time: note.time || '',
      status: note.status || 'Scheduled',
    });
  };

  const saveEdit = () => {
    const updatedNotes = meetingNotes.map(note =>
      note.id === editingNote
        ? { ...note, ...editForm, updatedAt: new Date().toISOString() }
        : note
    );
    setMeetingNotes(updatedNotes);
    setEditingNote(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditForm({});
  };

  const deleteMeetingNote = (noteId) => {
    if (window.confirm('Delete this meeting?')) {
      const updatedNotes = meetingNotes.filter(note => note.id !== noteId);
      setMeetingNotes(updatedNotes);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`content p-4 lg:p-6 font-sans min-h-screen ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg ${
              isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <Calendar className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Meeting Notes</h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Schedule and manage team meetings</p>
            </div>
          </div>
          <button
            onClick={createNewMeeting}
            className={`flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
              isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </button>
        </div>

        {/* Professional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{filteredNotes.length}</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Meetings</p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                <Calendar className={`h-8 w-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {meetingNotes.filter(n => n.status === 'Scheduled').length}
                </p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Scheduled</p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <Clock className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {meetingNotes.filter(n => n.status === 'Completed').length}
                </p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Search and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80 text-sm border ${
                  isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Types</option>
              <option value="Standup">Standup</option>
              <option value="Planning">Planning</option>
              <option value="Review">Review</option>
              <option value="Retro">Retro</option>
              <option value="Presentation">Presentation</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm border ${
                isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Postponed">Postponed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filteredNotes.length} meetings
            </span>
          </div>
        </div>
      </div>

      {/* Professional Table View */}
      <div className={`rounded-xl shadow-lg border overflow-hidden ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        {/* Professional Table Header */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-gray-50 border-b border-gray-200'} sticky top-0 z-10`}>
          <div className={`grid grid-cols-8 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <div className="col-span-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Meeting Name
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Date
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Participants
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Status
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Time
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Created By
            </div>
            <div className="flex items-center justify-end">Actions</div>
          </div>
        </div>

        {/* Professional Table Body */}
        <div className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`group grid grid-cols-8 gap-4 px-6 py-4 transition-all duration-200 cursor-pointer hover:scale-105 ${
                isDarkMode ? 'hover:bg-gray-900/40' : 'hover:bg-gray-50'
              }`}
            >
              <div className="col-span-2 flex items-center">
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{note.title}</span>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatDate(note.date)}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {Array.isArray(note.participants) && note.participants.length > 0
                  ? note.participants.map(p => p.name || p.username || '').filter(Boolean).join(', ')
                  : '-'}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                  isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-200 text-black border-gray-300'
                }`}>
                  {note.status}
                </span>
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {note.time || '-'}
              </div>
              <div className={`text-sm max-w-xs truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {note.summary || 'No content'}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {note.createdBy}
              </div>
              <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button 
                  title="Edit" 
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                    isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`} 
                  onClick={() => startEditing(note)}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  title="Delete" 
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                    isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`} 
                  onClick={() => deleteMeetingNote(note.id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Professional Empty State */}
          {filteredNotes.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Calendar className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mx-auto h-12 w-12 mb-4`} />
              <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No meetings found</h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Get started by creating your first meeting.</p>
              {user?.role === 'manager' ? (
                <button
                  onClick={createNewMeeting}
                  className={`inline-flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                    isDarkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Meeting
                </button>
              ) : (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Only managers can create meetings</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edit Meeting</h3>
              <button
                onClick={cancelEdit}
                className={`transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Time</label>
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Postponed">Postponed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={cancelEdit}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingNotesPage;