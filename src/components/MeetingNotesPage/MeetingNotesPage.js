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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'Standup',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '30 min',
    status: 'Scheduled',
    description: '',
    location: '',
    participants: []
  });
  
  const [availableUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Developer' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'Designer' },
    { id: 3, name: 'Mike Johnson', email: 'mike@company.com', role: 'Manager' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Product Manager' },
    { id: 5, name: 'David Brown', email: 'david@company.com', role: 'Developer' }
  ]);

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
    setShowCreateModal(true);
  };

  const handleCreateMeeting = () => {
    if (!createForm.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }
    const newNote = {
      id: Date.now(),
      title: createForm.title,
      type: createForm.type,
      date: createForm.date,
      time: createForm.time,
      duration: createForm.duration,
      status: createForm.status,
      description: createForm.description,
      location: createForm.location,
      participants: createForm.participants,
      actionItems: [],
      createdBy: user?.name || 'Unknown User',
      summary: createForm.description || 'No content',
    };
    setMeetingNotes([newNote, ...meetingNotes]);
    setShowCreateModal(false);
    setCreateForm({
      title: '',
      type: 'Standup',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: '30 min',
      status: 'Scheduled',
      description: '',
      location: ''
    });
  };

  const cancelCreate = () => {
    setShowCreateModal(false);
    setCreateForm({
      title: '',
      type: 'Standup',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: '30 min',
      status: 'Scheduled',
      description: '',
      location: '',
      participants: []
    });
  };

  const addParticipant = (user) => {
    const currentParticipants = (createForm.participants && Array.isArray(createForm.participants)) ? createForm.participants : [];
    if (!currentParticipants.find(p => p.id === user.id)) {
      setCreateForm({
        ...createForm,
        participants: [...currentParticipants, user]
      });
    }
  };

  const removeParticipant = (userId) => {
    setCreateForm({
      ...createForm,
      participants: (createForm.participants && Array.isArray(createForm.participants)) 
        ? createForm.participants.filter(p => p.id !== userId) 
        : []
    });
  };

  const openUserPicker = () => {
    // Save current form state
    localStorage.setItem('meetingFormState', JSON.stringify(createForm));
    localStorage.setItem('meetingPickerSource', 'create-meeting');
    // Navigate to users page
    window.location.href = '/users?picker=1';
  };

  // Handle return from user picker
  useEffect(() => {
    const checkPickerResult = () => {
      const pickerResult = localStorage.getItem('peoplePickerResult');
      const pickerSource = localStorage.getItem('meetingPickerSource');
      const savedFormState = localStorage.getItem('meetingFormState');
      
      if (pickerResult && pickerSource === 'create-meeting' && savedFormState) {
        try {
          const selectedUsers = JSON.parse(pickerResult);
          const formState = JSON.parse(savedFormState);
          
          // Update form with selected participants
          setCreateForm({
            ...formState,
            participants: selectedUsers.selected || []
          });
          
          // Show modal again
          setShowCreateModal(true);
          
          // Clean up
          localStorage.removeItem('peoplePickerResult');
          localStorage.removeItem('meetingPickerSource');
          localStorage.removeItem('meetingFormState');
        } catch (error) {
          console.error('Error processing picker result:', error);
        }
      }
    };
    
    checkPickerResult();
  }, []);

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
    <div className={`content p-6 lg:p-8 font-sans min-h-screen ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-6 shadow-lg transition-all duration-300 ${
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

        {/* Statistics */}
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

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
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

      {/* Meeting List */}
      <div className={`rounded-xl shadow-lg border overflow-hidden ${
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className={`divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`group flex items-center justify-between p-6 transition-all duration-200 hover:scale-105 cursor-pointer ${
                isDarkMode ? 'hover:bg-gray-900/40' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedMeeting(note)}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`}>
                  <Calendar className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`font-semibold text-lg truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {note.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {note.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      note.status === 'Completed' 
                        ? (isDarkMode ? 'bg-green-900 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-300')
                        : note.status === 'Scheduled'
                        ? (isDarkMode ? 'bg-blue-900 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300')
                        : (isDarkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200')
                    }`}>
                      {note.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {formatDate(note.date)} at {note.time || 'No time'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {(note.participants && Array.isArray(note.participants) && note.participants.length > 0)
                          ? `${note.participants.length} participants`
                          : 'No participants'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 opacity-50" />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {note.createdBy}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button 
                  title="Edit" 
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                    isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(note);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  title="Delete" 
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                    isDarkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMeetingNote(note.id);
                  }}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

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

      {/* Beautiful Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl border-2 ${
            isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`}>
                  <Calendar className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                </div>
                <div>
                  <h3 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New Meeting</h3>
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Schedule and organize your team meeting</p>
                </div>
              </div>
              <button
                onClick={cancelCreate}
                className={`p-3 rounded-2xl transition-all duration-200 hover:scale-110 ${
                  isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-8">
              {/* Meeting Details Section */}
              <div className={`p-6 rounded-2xl border-2 ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <FileText className="w-5 h-5 mr-2" />
                  Meeting Details
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Meeting Title *</label>
                    <input
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Enter meeting title"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Meeting Type</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Standup">🏃 Standup</option>
                      <option value="Planning">📅 Planning</option>
                      <option value="Review">🔍 Review</option>
                      <option value="Retro">🔄 Retro</option>
                      <option value="Presentation">📊 Presentation</option>
                      <option value="One-on-One">👥 One-on-One</option>
                      <option value="All-Hands">🙌 All-Hands</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scheduling Section */}
              <div className={`p-6 rounded-2xl border-2 ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Clock className="w-5 h-5 mr-2" />
                  Schedule & Duration
                </h4>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Date *</label>
                    <input
                      type="date"
                      value={createForm.date}
                      onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Time *</label>
                    <input
                      type="time"
                      value={createForm.time}
                      onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Duration</label>
                    <select
                      value={createForm.duration}
                      onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="15 min">⏱️ 15 minutes</option>
                      <option value="30 min">⏱️ 30 minutes</option>
                      <option value="45 min">⏱️ 45 minutes</option>
                      <option value="1 hour">⏰ 1 hour</option>
                      <option value="1.5 hours">⏰ 1.5 hours</option>
                      <option value="2 hours">⏰ 2 hours</option>
                      <option value="3 hours">⏰ 3 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Participants Section */}
              <div className={`p-6 rounded-2xl border-2 ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-lg font-semibold flex items-center ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Users className="w-5 h-5 mr-2" />
                    Participants ({(createForm.participants && Array.isArray(createForm.participants)) ? createForm.participants.length : 0})
                  </h4>
                  <button
                    onClick={openUserPicker}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    Pick
                  </button>
                </div>
                
                {/* Selected Participants */}
                {(createForm.participants && Array.isArray(createForm.participants) && createForm.participants.length > 0) ? (
                  <div className="grid grid-cols-2 gap-3">
                    {createForm.participants.map((participant) => (
                      <div
                        key={participant.id || participant._id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                          isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
                            isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                          }`}>
                            {(participant.name || participant.username || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {participant.name || participant.username}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {participant.email || participant.role || 'Team Member'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeParticipant(participant.id || participant._id)}
                          className={`p-2 rounded-full hover:scale-110 transition-all duration-200 ${
                            isDarkMode ? 'hover:bg-red-900 text-red-400' : 'hover:bg-red-100 text-red-600'
                          }`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No participants selected</p>
                    <p className="text-sm mt-1">Click "Pick" to add team members</p>
                  </div>
                )}
              </div>

              {/* Additional Details Section */}
              <div className={`p-6 rounded-2xl border-2 ${
                isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white/50 border-gray-200'
              }`}>
                <h4 className={`text-lg font-semibold mb-4 flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Additional Details
                </h4>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Status</label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 cursor-pointer ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Scheduled">⏰ Scheduled</option>
                      <option value="In Progress">▶️ In Progress</option>
                      <option value="Completed">✅ Completed</option>
                      <option value="Cancelled">❌ Cancelled</option>
                      <option value="Postponed">⏸️ Postponed</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Location</label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="📍 Meeting room, Zoom link, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Description / Agenda</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none ${
                      isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows={5}
                    placeholder="📝 Meeting agenda, topics to discuss, objectives, key points to cover..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-10 pt-6 border-t-2 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }">
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                📝 Fill in the details to create your meeting
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={cancelCreate}
                  className={`px-8 py-3 text-base font-semibold rounded-2xl transition-all duration-200 hover:scale-105 ${
                    isDarkMode ? 'text-gray-300 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMeeting}
                  className="px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  🎉 Create Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className={`rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl border ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* Professional Header */}
            <div className={`px-8 py-6 border-b ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                    isDarkMode ? 'bg-white' : 'bg-black'
                  }`}>
                    <Calendar className={`w-10 h-10 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedMeeting.title}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${
                        selectedMeeting.status === 'Completed' 
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : selectedMeeting.status === 'Scheduled'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}>
                        {selectedMeeting.status}
                      </span>
                      <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedMeeting.type} Meeting
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className={`p-4 rounded-2xl transition-all duration-200 hover:scale-110 ${
                    isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Professional Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Schedule Information */}
                  <div className={`p-6 rounded-2xl border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className={`text-xl font-bold mb-6 flex items-center ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <Clock className="w-6 h-6 mr-3" />
                      Schedule & Timing
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className={`p-4 rounded-xl mb-3 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {new Date(selectedMeeting.date).getDate()}
                          </div>
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {new Date(selectedMeeting.date).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date</div>
                      </div>
                      <div className="text-center">
                        <div className={`p-4 rounded-xl mb-3 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedMeeting.time || '--:--'}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Time</div>
                      </div>
                      <div className="text-center">
                        <div className={`p-4 rounded-xl mb-3 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <div className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedMeeting.duration || 'TBD'}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration</div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={`p-6 rounded-2xl border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 flex items-center ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <FileText className="w-6 h-6 mr-3" />
                      Meeting Agenda
                    </h3>
                    <div className={`p-4 rounded-xl border min-h-[120px] ${
                      isDarkMode ? 'bg-gray-900 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'
                    }`}>
                      {selectedMeeting.description || selectedMeeting.summary || 'No agenda or description provided for this meeting.'}
                    </div>
                  </div>
                </div>

                {/* Right Column - Participants & Details */}
                <div className="space-y-8">

                  {/* Participants */}
                  <div className={`p-6 rounded-2xl border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 flex items-center justify-between ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center">
                        <Users className="w-6 h-6 mr-3" />
                        Attendees
                      </div>
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {selectedMeeting.participants?.length || 0} people
                      </span>
                    </h3>
                    {(selectedMeeting.participants && Array.isArray(selectedMeeting.participants) && selectedMeeting.participants.length > 0) ? (
                      <div className="space-y-3">
                        {selectedMeeting.participants.map((participant, index) => (
                          <div
                            key={participant.id || participant._id || index}
                            className={`flex items-center p-3 rounded-xl border ${
                              isDarkMode ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 text-sm font-bold ${
                              isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                            }`}>
                              {(participant.name || participant.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {participant.name || participant.username}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {participant.email || participant.role || 'Team Member'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center py-8 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No attendees added</p>
                        <p className="text-sm">Participants will be listed here</p>
                      </div>
                    )}
                  </div>

                  {/* Meeting Details */}
                  <div className={`p-6 rounded-2xl border ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 flex items-center ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <CheckCircle className="w-6 h-6 mr-3" />
                      Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                        <div className={`px-4 py-3 rounded-xl border font-medium ${
                          isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}>
                          {selectedMeeting.location || 'Location not specified'}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Organizer</label>
                        <div className={`px-4 py-3 rounded-xl border font-medium ${
                          isDarkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}>
                          {selectedMeeting.createdBy}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Professional Footer */}
            <div className={`px-8 py-6 border-t ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Meeting created on {new Date(selectedMeeting.date).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      startEditing(selectedMeeting);
                      setSelectedMeeting(null);
                    }}
                    className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    Edit Meeting
                  </button>
                  <button
                    onClick={() => setSelectedMeeting(null)}
                    className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingNotesPage;