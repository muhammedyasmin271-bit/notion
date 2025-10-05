import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, Clock, Users, Plus, X, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { getMeetingById, createMeeting, updateMeeting, getUsers } from '../../services/api';

const MeetingEditorPage = () => {
  const { isDarkMode } = useTheme();
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const isNewMeeting = !meetingId || meetingId === 'new';

  const [meeting, setMeeting] = useState({
    title: '',
    type: 'Standup',
    date: '',
    time: '',
    duration: '30',
    attendees: [],
    agenda: '',
    notes: '',
    actionItems: [],
    tags: [],
    location: '',
    meetingLink: '',
    status: 'scheduled'
  });

  const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'text', content: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { users } = await getUsers();
        setUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const updateBlock = (id, content) => {
    setBlocks(prev => prev.map(block =>
      block.id === id ? { ...block, content } : block
    ));
  };

  const removeAttendee = (attendee) => {
    setMeeting(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== attendee)
    }));
  };

  const handleSave = async () => {
    if (!meeting.title.trim()) return;
    setIsSaving(true);
    try {
      const notesContent = blocks.map(block => block.content).join('\n');
      const meetingData = {
        ...meeting,
        notes: notesContent,
        date: new Date(meeting.date).toISOString()
      };

      if (isNewMeeting) {
        await createMeeting(meetingData);
      } else {
        await updateMeeting(meetingId, meetingData);
      }
      navigate('/meeting-notes');
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert('Failed to save meeting. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderBlockContent = (block, index) => {
    const updateBlockContent = (newContent) => {
      const newBlocks = [...blocks];
      newBlocks[index].content = newContent;
      setBlocks(newBlocks);
    };

    return (
      <input
        type="text"
        value={block.content}
        onChange={(e) => updateBlockContent(e.target.value)}
        placeholder={index === 0 ? "Start typing your meeting notes..." : "Continue typing..."}
        className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-base leading-tight"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="w-full h-screen overflow-y-auto bg-gray-900">
        <div className="bg-gray-900 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/meeting-notes')}
                  className="p-2 rounded-lg transition-colors text-gray-400 hover:bg-gray-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !meeting.title.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : (isNewMeeting ? 'Create Meeting' : 'Save Meeting')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-2 pb-6 overflow-y-auto px-6">
          <div className="w-full">
            <div className="rounded-lg pt-0 pb-0 bg-gray-900 px-6">
              <input
                type="text"
                value={meeting.title}
                onChange={(e) => setMeeting(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Untitled"
                className="w-full px-4 py-3 text-4xl ml-8 rounded-lg transition-colors bg-gray-900 text-white placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="rounded-lg bg-gray-900">
              <div className="p-6">
                <div className="flex gap-8 ml-24">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-300">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date
                      </label>
                      <input
                        type="date"
                        value={meeting.date}
                        onChange={(e) => setMeeting(prev => ({ ...prev, date: e.target.value }))}
                        className="px-3 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-300">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Time
                      </label>
                      <input
                        type="time"
                        value={meeting.time}
                        onChange={(e) => setMeeting(prev => ({ ...prev, time: e.target.value }))}
                        className="px-3 py-2 rounded-lg bg-gray-800 text-white focus:outline-none"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 relative">
                        <label className="text-sm font-medium text-gray-300">
                          <Users className="w-4 h-4 inline mr-1" />
                          Participants
                        </label>
                        <button
                          onClick={() => setShowUserDropdown(!showUserDropdown)}
                          className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {showUserDropdown && (
                          <div className="absolute right-0 top-8 w-64 max-h-60 overflow-y-auto rounded-lg shadow-xl border z-50 bg-gray-800 border-gray-700">
                            <div className="p-2">
                              {users.map((user) => {
                                const isSelected = meeting.attendees.includes(user.name);
                                return (
                                  <div
                                    key={user.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setMeeting(prev => ({
                                          ...prev,
                                          attendees: prev.attendees.filter(a => a !== user.name)
                                        }));
                                      } else {
                                        setMeeting(prev => ({
                                          ...prev,
                                          attendees: [...prev.attendees, user.name]
                                        }));
                                      }
                                    }}
                                    className={`w-full flex items-center px-3 py-2 rounded cursor-pointer transition-colors ${
                                      isSelected
                                        ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
                                        : 'hover:bg-gray-700 text-gray-300'
                                    }`}
                                  >
                                    <div className="mr-3">
                                      {isSelected ? (
                                        <CheckCircle className="w-5 h-5 text-blue-400" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-gray-500" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium">{user.name}</div>
                                      <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {meeting.attendees.map((attendee, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm flex items-center gap-1">
                            {attendee}
                            <button onClick={() => removeAttendee(attendee)} className="text-gray-500 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-700 my-4" />

                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-300 mb-2">Notes</div>
                  <div className="p-4 min-h-[300px]">
                    {blocks.map((block, index) => (
                      <div key={block.id} className="flex items-start group relative mb-1 rounded px-2 py-1 transition-all duration-200">
                        <div className="flex-1 relative">
                          <div className="block-content">
                            {renderBlockContent(block, index)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingEditorPage;