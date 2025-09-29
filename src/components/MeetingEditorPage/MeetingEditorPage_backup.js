import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, Clock, Users, Plus, X, CheckCircle, Circle, Video, Sparkles, GripVertical, Type, Hash, List, Quote, Code, Image, Trash2, Copy, ArrowUp, ArrowDown, ArrowRight, CheckSquare, Table, Calendar as CalendarIcon, Link2 as Link, Minus, Minus as Divider, AlertCircle, Star, Tag, MapPin, Phone, Mail, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, ListOrdered, FileText, Bookmark, Lightbulb, Info, AlertTriangle, Zap, Heart, Smile, Eye, Lock, Globe, Download, Upload, Search, Filter, Settings, MoreHorizontal } from 'lucide-react';
import { getMeetingById, createMeeting, updateMeeting, addMeetingActionItem, getUsers, deleteMeeting } from '../../services/api';

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

  const [blocks, setBlocks] = useState([]);
  const [tableData, setTableData] = useState({});
  const [selectedText, setSelectedText] = useState('');
  const [showFormattingBar, setShowFormattingBar] = useState(false);
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const inputRefs = useRef({});
  const [users, setUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(null);
  const [showLineMenu, setShowLineMenu] = useState(null);
  const [aiInputBlock, setAiInputBlock] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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


  

  

  
  // Function to load meeting data
  const loadMeeting = useCallback(async () => {
    if (!meetingId || isNewMeeting) {
      setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load from server first
      const serverData = await fetchFromServer(meetingId);
      
      if (serverData) {
        // If we got data from server, use it and save to localStorage
        updateMeetingState(serverData);
        localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(serverData));
      } else {
        // Fallback to localStorage if server fetch fails
        const savedMeeting = localStorage.getItem(`meeting-${meetingId}`);
        if (savedMeeting) {
          const meetingData = JSON.parse(savedMeeting);
          console.log('Falling back to localStorage version');
          updateMeetingState(meetingData);
        } else {
          setError('Failed to load meeting. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('Error in loadMeeting:', error);
      setError('An error occurred while loading the meeting');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, isNewMeeting]);
  
  // Load meeting when component mounts or meetingId changes
  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);
  
  // Function to fetch meeting data from the server
  const fetchFromServer = async (id) => {
    try {
      const response = await getMeetingById(id);
      return response.meeting || response;
    } catch (error) {
      console.error('Error fetching meeting from server:', error);
      return null;
    }
  };
  
  // Function to handle saving the meeting
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare the meeting data to save
      const meetingToSave = {
        ...meeting,
        blocks: blocks,
        updatedAt: new Date().toISOString()
      };
      
      if (isNewMeeting) {
        // Create new meeting
        const newMeeting = await createMeeting(meetingToSave);
        navigate(`/meetings/${newMeeting._id}`);
        toast.success('Meeting created successfully');
      } else {
        // Update existing meeting
        await updateMeeting(meetingId, meetingToSave);
        toast.success('Meeting updated successfully');
      }
      
      // Save to localStorage as well
      localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(meetingToSave));
      
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error('Failed to save meeting. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle block content changes
  const handleBlockChange = (blockId, newContent) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, content: newContent } : block
    ));
  };
  
  // Function to add a new block
  const addBlock = (index, type = 'text', content = '') => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      style: {}
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };
  
  // Function to remove a block
  const removeBlock = (blockId) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== blockId));
    }
  };
  
  // Function to handle meeting field changes
  const handleMeetingChange = (field, value) => {
    setMeeting(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Function to add an attendee
  const addAttendee = (attendee) => {
    if (attendee.trim() && !meeting.attendees.includes(attendee.trim())) {
      handleMeetingChange('attendees', [...meeting.attendees, attendee.trim()]);
    }
  };
  
  // Function to remove an attendee
  const removeAttendee = (index) => {
    const newAttendees = [...meeting.attendees];
    newAttendees.splice(index, 1);
    handleMeetingChange('attendees', newAttendees);
  };
  
  // Function to add a tag
  const addTag = (tag) => {
    if (tag.trim() && !meeting.tags.includes(tag.trim())) {
      handleMeetingChange('tags', [...meeting.tags, tag.trim()]);
    }
  };
  
  // Function to remove a tag
  const removeTag = (index) => {
    const newTags = [...meeting.tags];
    newTags.splice(index, 1);
    handleMeetingChange('tags', newTags);
  };
  
  // Function to handle date changes
  const handleDateChange = (date) => {
    handleMeetingChange('date', formatDate(date));
  };
  
  // Function to handle time changes
  const handleTimeChange = (time) => {
    handleMeetingChange('time', time);
  };
  
  // Function to handle duration changes
  const handleDurationChange = (duration) => {
    handleMeetingChange('duration', duration);
  };
  
  // Function to handle status changes
  const handleStatusChange = (status) => {
    handleMeetingChange('status', status);
  };
  
  // Function to handle meeting link changes
  const handleMeetingLinkChange = (link) => {
    handleMeetingChange('meetingLink', link);
  };
  
  // Function to handle location changes
  const handleLocationChange = (location) => {
    handleMeetingChange('location', location);
  };
  
  // Function to fetch meeting data from the server
  const fetchFromServer = async (id) => {
    try {
      const response = await getMeetingById(id);
      return response.meeting || response;
    } catch (error) {
      console.error('Error fetching meeting from server:', error);
      return null;
    }
  };
  
  // Function to load meeting data
  const loadMeeting = useCallback(async () => {
    if (!meetingId || isNewMeeting) {
      setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to load from server first
      const serverData = await fetchFromServer(meetingId);
      
      if (serverData) {
        // If we got data from server, use it and save to localStorage
        updateMeetingState(serverData);
        localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(serverData));
      } else {
        // Fallback to localStorage if server fetch fails
        const savedMeeting = localStorage.getItem(`meeting-${meetingId}`);
        if (savedMeeting) {
          const meetingData = JSON.parse(savedMeeting);
          console.log('Falling back to localStorage version');
          updateMeetingState(meetingData);
        } else {
          setError('Failed to load meeting. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('Error in loadMeeting:', error);
      setError('An error occurred while loading the meeting');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, isNewMeeting]);
  
  // Load meeting when component mounts or meetingId changes
  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);
  
  // Function to render the meeting editor UI
  const renderMeetingEditor = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Meeting details form */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {isNewMeeting ? 'Create New Meeting' : 'Edit Meeting'}
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              {/* Meeting title */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Title</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="text"
                    value={meeting.title}
                    onChange={(e) => handleMeetingChange('title', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter meeting title"
                  />
                </dd>
              </div>
              
              {/* Meeting type */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <select
                    value={meeting.type}
                    onChange={(e) => handleMeetingChange('type', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="Standup">Standup</option>
                    <option value="Sprint Planning">Sprint Planning</option>
                    <option value="Retrospective">Retrospective</option>
                    <option value="Review">Review</option>
                    <option value="One-on-One">One-on-One</option>
                    <option value="Team Meeting">Team Meeting</option>
                    <option value="Other">Other</option>
                  </select>
                </dd>
              </div>
              
              {/* Date and time */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 space-y-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={meeting.date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        value={meeting.time}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={meeting.duration}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </dd>
              </div>
              
              {/* Status */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <select
                    value={meeting.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </dd>
              </div>
              
              {/* Location */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="text"
                    value={meeting.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter meeting location"
                  />
                </dd>
              </div>
              
              {/* Meeting Link */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Meeting Link</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <input
                    type="url"
                    value={meeting.meetingLink}
                    onChange={(e) => handleMeetingLinkChange(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="https://meet.google.com/..."
                  />
                </dd>
              </div>
              
              {/* Attendees */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Attendees</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {meeting.attendees.map((attendee, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {attendee}
                        <button
                          type="button"
                          onClick={() => removeAttendee(index)}
                          className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                        >
                          <span className="sr-only">Remove attendee</span>
                          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addAttendee(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          addAttendee(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add attendee and press Enter"
                    />
                  </div>
                </dd>
              </div>
              
              {/* Tags */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {meeting.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500 focus:outline-none focus:bg-green-500 focus:text-white"
                        >
                          <span className="sr-only">Remove tag</span>
                          <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addTag(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          addTag(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add tag and press Enter"
                    />
                  </div>
                </dd>
              </div>
              
              {/* Agenda */}
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Agenda</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <textarea
                    rows={3}
                    value={meeting.agenda}
                    onChange={(e) => handleMeetingChange('agenda', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Meeting agenda and key discussion points"
                  />
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Meeting'}
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isNewMeeting ? 'New Meeting' : 'Edit Meeting'}
        </h2>
      </div>
      
      {renderMeetingEditor()}
      
      {/* Meeting notes editor */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Meeting Notes</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => addBlock(blocks.length - 1, 'text')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-0.5 mr-1.5 h-4 w-4" />
              Add Block
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {blocks.map((block, index) => (
              <div key={block.id} className="group flex items-start mb-4">
                <div className="flex-1">
                  {block.type === 'text' && (
                    <textarea
                      rows="1"
                      value={block.content}
                      onChange={(e) => handleBlockChange(block.id, e.target.value)}
                      className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                      placeholder="Type / for commands"
                    />
                  )}
                  {/* Add other block types here */}
                </div>
                <div className="ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
          } else {
            // No notes, create default empty block
            setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
          }
          
          // Load table data if available
          if (meetingData.tableData) {
            setTableData(meetingData.tableData);
          }
        } catch (error) {
          console.error('Error loading meeting from server:', error);
          
          // If we have a saved version in localStorage, use that
          const savedMeeting = localStorage.getItem(`meeting-${meetingId}`);
          if (savedMeeting) {
            try {
              const meetingData = JSON.parse(savedMeeting);
              console.log('Falling back to localStorage version');
              setMeeting(meetingData);
              
              if (meetingData.blocks) {
                setBlocks(meetingData.blocks);
              } else if (meetingData.notes) {
                // Parse notes into blocks if we have notes but no blocks
                const noteLines = meetingData.notes.split('\n');
                const noteBlocks = noteLines
                  .filter(line => line.trim() !== '')
                  .map((line, index) => ({
                    id: `block-${Date.now()}-${index}`,
                    type: 'text',
                    content: line.trim(),
                    style: {}
                  }));
                setBlocks(noteBlocks);
              } else {
                setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
              }
              
              return;
            } catch (parseError) {
              console.error('Error parsing saved meeting:', parseError);
            }
          }
          
          // If we get here, we couldn't load the meeting
          setError('Failed to load meeting. You may not have permission to view this meeting or you might be offline.');
          setIsLoading(false);
          
          // Set default empty state
          setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
        }
      } else if (isNewMeeting) {
        // For new meetings, ensure we have an empty block and don't show loading
        setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
        setIsLoading(false);
      }
    };
    
    loadMeeting();
  }, [meetingId, isNewMeeting]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.formatting-toolbar') && !event.target.closest('input')) {
        setCurrentBlockId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b':
            event.preventDefault();
            if (currentBlockId) {
              const block = blocks.find(b => b.id === currentBlockId);
              if (block) {
                updateBlockStyle(currentBlockId, { bold: !block.style?.bold });
              }
            }
            break;
          case 'i':
            event.preventDefault();
            if (currentBlockId) {
              const block = blocks.find(b => b.id === currentBlockId);
              if (block) {
                updateBlockStyle(currentBlockId, { italic: !block.style?.italic });
              }
            }
            break;
          case 'u':
            event.preventDefault();
            if (currentBlockId) {
              const block = blocks.find(b => b.id === currentBlockId);
              if (block) {
                updateBlockStyle(currentBlockId, { underline: !block.style?.underline });
              }
            }
            break;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentBlockId, blocks]);

  const removeAttendee = (attendee) => {
    setMeeting(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== attendee)
    }));
  };

  const handleSave = async () => {
    if (!meeting.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Convert blocks to structured notes content
      const notesContent = blocks.map(block => {
        switch (block.type) {
          case 'heading1': return `# ${block.content}`;
          case 'heading2': return `## ${block.content}`;
          case 'heading3': return `### ${block.content}`;
          case 'bullet': return `• ${block.content}`;
          case 'numbered': return `1. ${block.content}`;
          case 'todo': return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
          case 'toggle': return `▶ ${block.content}`;
          case 'quote': return `> ${block.content}`;
          case 'code': return `\`\`\`\n${block.content}\n\`\`\``;
          case 'callout': return `💡 ${block.content}`;
          case 'date': return `📅 ${block.content}`;
          case 'time': return `🕐 ${block.content}`;
          case 'priority': return `⭐ ${block.priorityLevel}: ${block.content}`;
          case 'divider': return '---';
          case 'table': return '[Table Data]';
          default: return block.content;
        }
      }).join('\n');

      // Comprehensive meeting data structure
      const meetingData = {
        title: meeting.title.trim(),
        type: meeting.type || 'Standup',
        date: meeting.date ? new Date(meeting.date).toISOString() : new Date().toISOString(),
        time: meeting.time || '',
        duration: parseInt(meeting.duration) || 30,
        attendees: meeting.attendees || [],
        location: meeting.location || '',
        meetingLink: meeting.meetingLink || '',
        status: meeting.status || 'scheduled',
        agenda: meeting.agenda || '',
        notes: notesContent,
        blocks: blocks.map(block => ({
          id: block.id,
          type: block.type,
          content: block.content,
          checked: block.checked || false,
          priorityLevel: block.priorityLevel || null,
          expanded: block.expanded || false,
          toggleContent: block.toggleContent || '',
          metadata: block.metadata || {}
        })),
        tableData: tableData || {},
        actionItems: meeting.actionItems || [],
        tags: meeting.tags || [],
        createdBy: meeting.createdBy || 'current-user',
        createdAt: isNewMeeting ? new Date().toISOString() : meeting.createdAt,
        updatedAt: new Date().toISOString(),
        version: (meeting.version || 0) + 1,
        wordCount: notesContent.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: notesContent.length,
        blockCount: blocks.length,
        attendeeCount: meeting.attendees ? meeting.attendees.length : 0
      };

      console.log('Saving comprehensive meeting data:', meetingData);

      let savedMeeting;
      if (isNewMeeting) {
        savedMeeting = await createMeeting(meetingData);
        console.log('Created new meeting:', savedMeeting);
        // Store locally for offline access
        localStorage.setItem(`meeting-${savedMeeting._id || savedMeeting.id}`, JSON.stringify(savedMeeting));
      } else {
        savedMeeting = await updateMeeting(meetingId, meetingData);
        console.log('Updated existing meeting:', savedMeeting);
        // Update local storage
        localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(savedMeeting));
      }

      // Show success message
      const successMessage = isNewMeeting 
        ? `Meeting "${meeting.title}" created successfully with ${blocks.length} blocks and ${meeting.attendees?.length || 0} attendees`
        : `Meeting "${meeting.title}" updated successfully`;
      
      // Create a temporary success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="font-medium">${successMessage}</span>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);

      // Navigate back to meeting list
      setTimeout(() => {
        navigate('/meeting-notes');
      }, 1000);
      
    } catch (error) {
      console.error('Error saving meeting:', error);
      
      // Show error notification
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      errorNotification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="font-medium">Failed to save meeting. Please try again.</span>
        </div>
      `;
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        errorNotification.style.opacity = '0';
        errorNotification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 300);
      }, 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateBlockStyle = (blockId, styleUpdates) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, style: { ...block.style, ...styleUpdates } }
        : block
    ));
  };

  const renderBlockContent = (block, index) => {
    const updateBlockContent = (newContent) => {
      const newBlocks = [...blocks];
      newBlocks[index].content = newContent;
      setBlocks(newBlocks);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newBlocks = [...blocks];
        let newBlockType = 'text';
        let newBlockContent = '';

        if (block.type === 'bullet') {
          newBlockType = 'bullet';
          newBlockContent = '• ';
        } else if (block.type === 'numbered') {
          newBlockType = 'numbered';
          const currentNum = parseInt(block.content.match(/^(\d+)\./)?.[1] || '1');
          newBlockContent = `${currentNum + 1}. `;
        } else if (block.type === 'todo') {
          newBlockType = 'todo';
          newBlockContent = '☐ ';
        } else if (block.type === 'toggle') {
          newBlockType = 'toggle';
          newBlockContent = '▶ ';
        }

        const newBlockId = `block-${Date.now()}`;
        newBlocks.splice(index + 1, 0, { id: newBlockId, type: newBlockType, content: newBlockContent });
        setBlocks(newBlocks);
        // Focus new block
        setTimeout(() => {
          if (inputRefs.current[newBlockId]) {
            inputRefs.current[newBlockId].focus();
          }
        }, 0);
      } else if (e.key === ' ') {
        // Markdown shortcuts
        const content = block.content.trim();
        if (content === '#' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'heading1', content: '' };
          setBlocks(newBlocks);
        } else if (content === '##' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'heading2', content: '' };
          setBlocks(newBlocks);
        } else if (content === '###' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'heading3', content: '' };
          setBlocks(newBlocks);
        } else if (content === '>' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'quote', content: '' };
          setBlocks(newBlocks);
        } else if (content === '-' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'bullet', content: '• ' };
          setBlocks(newBlocks);
        } else if (content === '1.' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'numbered', content: '1. ' };
          setBlocks(newBlocks);
        } else if (content === '[]' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'todo', content: '☐ ' };
          setBlocks(newBlocks);
        } else if (content === '```' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'code', content: '' };
          setBlocks(newBlocks);
        } else if (content === '---' && block.type === 'text') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index] = { ...block, type: 'divider', content: '' };
          setBlocks(newBlocks);
        } else if (block.content === '' && block.type === 'text') {
          e.preventDefault();
          setAiInputBlock(block.id);
          setAiQuery('');
        }
      } else if (e.key === 'Backspace' && block.content === '' && index > 0) {
        e.preventDefault();
        const newBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(newBlocks);
        // Focus previous block
        setTimeout(() => {
          const prevBlock = newBlocks[index - 1];
          if (prevBlock && inputRefs.current[prevBlock.id]) {
            inputRefs.current[prevBlock.id].focus();
          }
        }, 0);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (blocks.length > 1) {
          const newBlocks = blocks.filter((_, i) => i !== index);
          setBlocks(newBlocks);
          // Focus next or previous block
          setTimeout(() => {
            const targetIndex = index < newBlocks.length ? index : index - 1;
            const targetBlock = newBlocks[targetIndex];
            if (targetBlock && inputRefs.current[targetBlock.id]) {
              inputRefs.current[targetBlock.id].focus();
            }
          }, 0);
        }
      } else if (e.key === 'Delete' && e.shiftKey) {
        e.preventDefault();
        if (blocks.length > 1) {
          const newBlocks = blocks.filter((_, i) => i !== index);
          setBlocks(newBlocks);
          // Focus next or previous block
          setTimeout(() => {
            const targetIndex = index < newBlocks.length ? index : index - 1;
            const targetBlock = newBlocks[targetIndex];
            if (targetBlock && inputRefs.current[targetBlock.id]) {
              targetBlock.focus();
            }
          }, 0);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Indent functionality for lists
        if (block.type === 'bullet' || block.type === 'numbered' || block.type === 'todo') {
          updateBlockContent('  ' + block.content);
        }
      }
    };

    const getInputClassName = () => {
      const baseClass = "w-full px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none leading-tight";
      const styleClass = `${
        block.style?.bold ? 'font-bold ' : ''
      }${
        block.style?.italic ? 'italic ' : ''
      }${
        block.style?.underline ? 'underline ' : ''
      }${
        block.style?.strikethrough ? 'line-through ' : ''
      }${
        block.style?.align === 'center' ? 'text-center ' : 
        block.style?.align === 'right' ? 'text-right ' : 'text-left '
      }`;

      switch (block.type) {
        case 'heading1':
          return `${baseClass} ${styleClass} text-3xl font-bold`;
        case 'heading2':
          return `${baseClass} ${styleClass} text-2xl font-semibold`;
        case 'heading3':
          return `${baseClass} ${styleClass} text-xl font-medium`;
        case 'code':
          return `${baseClass} ${styleClass} font-mono bg-gray-800 rounded px-2 py-1 text-green-400`;
        default:
          return `${baseClass} ${styleClass} text-base`;
      }
    };

    if (block.type === 'table') {
      const table = tableData[block.id] || { rows: 2, cols: 2, data: [['Header 1', 'Header 2'], ['Row 1', 'Row 2']] };
      
      const updateCell = (rowIndex, colIndex, value) => {
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data[rowIndex][colIndex] = value;
          return { ...prev, [block.id]: newTable };
        });
      };
      
      const addRow = () => {
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data.push(Array(newTable.cols).fill(''));
          newTable.rows += 1;
          return { ...prev, [block.id]: newTable };
        });
      };
      
      const addColumn = () => {
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data = newTable.data.map(row => [...row, '']);
          newTable.cols += 1;
          return { ...prev, [block.id]: newTable };
        });
      };
      
      const deleteRow = () => {
        if (table.rows <= 1) return;
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data.pop();
          newTable.rows -= 1;
          return { ...prev, [block.id]: newTable };
        });
      };
      
      const deleteColumn = () => {
        if (table.cols <= 1) return;
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data = newTable.data.map(row => row.slice(0, -1));
          newTable.cols -= 1;
          return { ...prev, [block.id]: newTable };
        });
      };
      
      return (
        <div className="flex items-start group relative" style={{ marginRight: '40px', marginBottom: '40px' }}>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
            <button className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200 flex items-center justify-center w-6 h-6" onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}>
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200 flex items-center justify-center w-6 h-6" onClick={() => setShowLineMenu(showLineMenu === block.id ? null : block.id)}>
              <GripVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 relative">
            <div className="border border-gray-700 rounded-lg overflow-hidden shadow-sm bg-gray-800">
              <table className="w-full border-collapse">
                <tbody>
                  {table.data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-700' : 'hover:bg-gray-700/50'}>
                      {row.map((cell, colIndex) => (
                        <td key={`${rowIndex}-${colIndex}`} className="border-r border-b p-0 relative group/cell border-gray-600">  
                          <textarea
                            value={cell}
                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                            placeholder={rowIndex === 0 ? `Column ${colIndex + 1}` : ''}
                            className={`w-full min-h-[24px] px-2 py-1 border-none outline-none resize-none bg-transparent text-xs leading-tight ${
                              rowIndex === 0 ? 'font-semibold text-gray-200' : 'text-gray-300'
                            } focus:bg-blue-900/20 focus:ring-1 focus:ring-blue-700 focus:ring-inset`}
                            rows={1}
                            onInput={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = Math.max(24, e.target.scrollHeight) + 'px';
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Add column button */}
            <button
              onClick={addColumn}
              className="absolute top-1/2 -right-8 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 bg-gray-800 border-gray-600"
              title="Add column"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {/* Delete column button */}
            {table.cols > 1 && (
              <button
                onClick={deleteColumn}
                className="absolute top-1/2 -right-16 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-red-500 hover:text-white hover:border-red-500 bg-gray-800 border-gray-600"
                title="Delete column"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Add row button */}
            <button
              onClick={addRow}
              className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 bg-gray-800 border-gray-600"
              title="Add row"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {/* Delete row button */}
            {table.rows > 1 && (
              <button
                onClick={deleteRow}
                className="absolute left-1/2 -bottom-16 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-red-500 hover:text-white hover:border-red-500 bg-gray-800 border-gray-600"
                title="Delete row"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );
    }

    if (block.type === 'quote') {
      return (
        <div className="border-l-4 border-gray-400 bg-gray-800/30 pl-6 py-4 rounded-r-md">
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quote text..."
            className="w-full bg-transparent text-white text-base italic placeholder-gray-400 focus:outline-none border-none"
          />
        </div>
      );
    }

    if (block.type === 'callout') {
      const calloutTypes = {
        info: { bg: 'bg-blue-900/20', border: 'border-blue-500/30', icon: Info, color: 'text-blue-400' },
        warning: { bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', icon: AlertTriangle, color: 'text-yellow-400' },
        error: { bg: 'bg-red-900/20', border: 'border-red-500/30', icon: AlertCircle, color: 'text-red-400' },
        success: { bg: 'bg-green-900/20', border: 'border-green-500/30', icon: CheckCircle, color: 'text-green-400' },
        tip: { bg: 'bg-purple-900/20', border: 'border-purple-500/30', icon: Lightbulb, color: 'text-purple-400' }
      };
      const callout = calloutTypes[block.calloutType || 'info'];
      const IconComponent = callout.icon;
      
      return (
        <div className={`${callout.bg} ${callout.border} border rounded-lg p-4 flex items-start gap-3`}>
          <IconComponent className={`w-5 h-5 ${callout.color} mt-0.5 flex-shrink-0`} />
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Callout text..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none"
          />
        </div>
      );
    }

    if (block.type === 'divider') {
      return (
        <div className="py-4">
          <hr className="border-gray-600" />
        </div>
      );
    }

    if (block.type === 'bullet') {
      return (
        <div className="flex items-start gap-2">
          <span className="text-gray-400 mt-2 text-lg leading-none">•</span>
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content.replace(/^• /, '')}
            onChange={(e) => updateBlockContent(`• ${e.target.value}`)}
            onKeyDown={handleKeyDown}
            placeholder="List item..."
            className={getInputClassName()}
          />
        </div>
      );
    }

    if (block.type === 'numbered') {
      const number = block.content.match(/^(\d+)\./)?.[1] || '1';
      return (
        <div className="flex items-start gap-2">
          <span className="text-gray-400 mt-2 min-w-[20px]">{number}.</span>
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content.replace(/^\d+\. /, '')}
            onChange={(e) => updateBlockContent(`${number}. ${e.target.value}`)}
            onKeyDown={handleKeyDown}
            placeholder="List item..."
            className={getInputClassName()}
          />
        </div>
      );
    }

    if (block.type === 'todo') {
      const isChecked = block.content.includes('☑');
      return (
        <div className="flex items-start gap-2">
          <button
            onClick={() => {
              const newContent = isChecked 
                ? block.content.replace('☑', '☐')
                : block.content.replace('☐', '☑');
              updateBlockContent(newContent);
            }}
            className="mt-2 text-gray-400 hover:text-white transition-colors"
          >
            {isChecked ? <CheckSquare className="w-4 h-4 text-green-400" /> : <CheckSquare className="w-4 h-4" />}
          </button>
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content.replace(/^[☐☑] /, '')}
            onChange={(e) => updateBlockContent(`${isChecked ? '☑' : '☐'} ${e.target.value}`)}
            onKeyDown={handleKeyDown}
            placeholder="To-do item..."
            className={`${getInputClassName()} ${isChecked ? 'line-through text-gray-500' : ''}`}
          />
        </div>
      );
    }

    if (block.type === 'toggle') {
      const isExpanded = block.expanded || false;
      return (
        <div>
          <div className="flex items-start gap-2">
            <button
              onClick={() => {
                const newBlocks = [...blocks];
                newBlocks[index].expanded = !isExpanded;
                setBlocks(newBlocks);
              }}
              className="mt-2 text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <input
              ref={(el) => inputRefs.current[block.id] = el}
              type="text"
              value={block.content.replace(/^[▶▼] /, '')}
              onChange={(e) => updateBlockContent(`${isExpanded ? '▼' : '▶'} ${e.target.value}`)}
              onKeyDown={handleKeyDown}
              placeholder="Toggle item..."
              className={getInputClassName()}
            />
          </div>
          {isExpanded && (
            <div className="ml-6 mt-2 p-3 bg-gray-800/30 rounded border-l-2 border-gray-600">
              <input
                type="text"
                placeholder="Toggle content... (nested content)"
                onChange={(e) => {
                  const newBlocks = [...blocks];
                  if (!newBlocks[index].toggleContent) newBlocks[index].toggleContent = '';
                  newBlocks[index].toggleContent = e.target.value;
                  setBlocks(newBlocks);
                }}
                value={block.toggleContent || ''}
                className="w-full bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      );
    }

    if (block.type === 'code') {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs text-gray-400">Code Block</span>
            <button className="text-xs text-gray-400 hover:text-white">
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <textarea
            ref={(el) => inputRefs.current[block.id] = el}
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your code..."
            className="w-full p-3 bg-transparent text-green-400 font-mono text-sm placeholder-gray-500 focus:outline-none resize-none min-h-[100px]"
          />
        </div>
      );
    }

    if (block.type === 'date') {
      const formatDate = (dateStr) => {
        if (!dateStr) return 'mm/dd/yyyy';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US');
      };
      
      return (
        <div className="flex items-center gap-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
          <Calendar className="w-4 h-4 text-blue-400" />
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="date"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-white focus:outline-none"
            style={{ colorScheme: 'dark' }}
          />
          <span className="text-blue-300 text-sm">{formatDate(block.content)}</span>
        </div>
      );
    }

    if (block.type === 'time') {
      const formatTime = (timeStr) => {
        if (!timeStr) return '09:11 AM';
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      };
      
      return (
        <div className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-500/30 rounded">
          <Clock className="w-4 h-4 text-green-400" />
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="time"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-white focus:outline-none"
            style={{ colorScheme: 'dark' }}
          />
          <span className="text-green-300 text-sm">{formatTime(block.content)}</span>
        </div>
      );
    }

    if (block.type === 'priority') {
      const priorities = {
        high: { color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30', label: 'High Priority' },
        medium: { color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', label: 'Medium Priority' },
        low: { color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-500/30', label: 'Low Priority' }
      };
      const priority = priorities[block.priorityLevel || 'medium'];
      
      return (
        <div className={`flex items-center gap-2 p-2 ${priority.bg} border ${priority.border} rounded`}>
          <Star className={`w-4 h-4 ${priority.color}`} />
          <select
            value={block.priorityLevel || 'medium'}
            onChange={(e) => {
              const newBlocks = [...blocks];
              newBlocks[index].priorityLevel = e.target.value;
              setBlocks(newBlocks);
            }}
            className="bg-transparent text-white focus:outline-none"
          >
            <option value="high" className="bg-gray-800">High Priority</option>
            <option value="medium" className="bg-gray-800">Medium Priority</option>
            <option value="low" className="bg-gray-800">Low Priority</option>
          </select>
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Priority item..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
        </div>
      );
    }

    return (
      <div className="relative">
        <input
          ref={(el) => inputRefs.current[block.id] = el}
          type="text"
          value={block.content}
          onChange={(e) => updateBlockContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setCurrentBlockId(block.id)}
          onBlur={(e) => {
            // Delay hiding toolbar to allow clicking on toolbar buttons
            setTimeout(() => {
              if (!document.activeElement?.closest('.formatting-toolbar')) {
                setCurrentBlockId(null);
              }
            }, 150);
          }}
          placeholder={index === 0 ? "Start typing your meeting notes... " : "Continue typing.."}
          className={getInputClassName()}
        />

      </div>
    );
  };

  const handleAiQuerySubmit = async (e) => {
    if (e.key === 'Enter' && aiQuery.trim()) {
      e.preventDefault();
      try {
        const currentBlockIndex = blocks.findIndex(b => b.id === aiInputBlock);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const content = `AI Response: ${aiQuery}\n\nHere's a helpful response based on your query about "${aiQuery}". This is a simulated AI response.`;

        const lines = content.split('\n').filter(line => line.trim());
        const newBlocks = lines.map((line, idx) => {
          const l = line.trim();
          return { id: `ai-block-${Date.now()}-${idx}`, type: 'text', content: l };
        });

        if (newBlocks.length > 0) {
          const updatedBlocks = [...blocks];
          updatedBlocks.splice(currentBlockIndex + 1, 0, ...newBlocks);
          setBlocks(updatedBlocks);
        }

        setAiInputBlock(null);
        setAiQuery('');
      } catch (e) {
        console.error('AI assist failed:', e);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAiInputBlock(null);
      setAiQuery('');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading meeting data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Meeting</h2>
          <p className="mb-6 text-gray-300">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/meeting-notes')}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Meetings
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                {!isNewMeeting && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this meeting?')) {
                        try {
                          await deleteMeeting(meetingId);
                          navigate('/meeting-notes');
                        } catch (error) {
                          console.error('Error deleting meeting:', error);
                          alert('Failed to delete meeting. Please try again.');
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
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
                  {isSaving ? 'Saving...' : (isNewMeeting ? 'Create Meeting' : 'Update Meeting')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-2 pb-6 overflow-y-auto px-6">
          <div className="w-full">
            <div>
              <div className="rounded-lg pt-0 pb-0 bg-gray-900 px-6">
                <input
                  type="text"
                  value={meeting.title}
                  onChange={(e) => setMeeting(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Untitled"
                  className="w-full px-4 py-3 text-4xl ml-8 rounded-lg transition-colors bg-gray-900 text-white placeholder-gray-400 focus:outline-none"
                />
                <div className="ml-12 mt-2">
                  <span className="text-sm text-gray-400">
                    {meeting.createdAt 
                      ? `Created ${new Date(meeting.createdAt).toLocaleDateString('en-US')}` 
                      : 'Created today'
                    }
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-gray-900">
                <div className="p-6">
                  <div className="flex gap-8 ml-24">
                    <div className="flex-1 space-y-1">
                      <div className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <label className="text-sm font-medium text-gray-300 min-w-[70px]">
                              Date
                            </label>
                            <input
                              type="date"
                              value={meeting.date}
                              onChange={(e) => setMeeting(prev => ({ ...prev, date: e.target.value }))}
                              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none"
                              style={{ colorScheme: 'dark' }}
                            />
                            <span className="text-sm text-gray-400">
                              {meeting.date ? new Date(meeting.date).toLocaleDateString('en-US') : 'mm/dd/yyyy'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-green-400" />
                            <label className="text-sm font-medium text-gray-300 min-w-[70px]">
                              Time
                            </label>
                            <input
                              type="time"
                              value={meeting.time}
                              onChange={(e) => setMeeting(prev => ({ ...prev, time: e.target.value }))}
                              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none"
                              style={{ colorScheme: 'dark' }}
                            />
                            <span className="text-sm text-gray-400">
                              {meeting.time ? (() => {
                                const [hours, minutes] = meeting.time.split(':');
                                const hour = parseInt(hours);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const displayHour = hour % 12 || 12;
                                return `${displayHour}:${minutes} ${ampm}`;
                              })() : '09:32 PM'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <label className="text-sm font-medium text-gray-300 min-w-[70px]">
                              Duration
                            </label>
                            <input
                              type="number"
                              value={meeting.duration}
                              onChange={(e) => setMeeting(prev => ({ ...prev, duration: e.target.value }))}
                              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none w-20"
                              min="5"
                              max="480"
                            />
                            <span className="text-sm text-gray-400">min</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Circle className={`w-4 h-4 ${
                              meeting.status === 'active' ? 'text-green-400' :
                              meeting.status === 'completed' ? 'text-blue-400' :
                              meeting.status === 'cancelled' ? 'text-red-400' :
                              'text-gray-400'
                            }`} />
                            <label className="text-sm font-medium text-gray-300 min-w-[70px]">
                              Status
                            </label>
                            <select
                              value={meeting.status}
                              onChange={(e) => setMeeting(prev => ({ ...prev, status: e.target.value }))}
                              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none flex-1"
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-orange-400" />
                            <label className="text-sm font-medium text-gray-300 min-w-[70px]">
                              Type
                            </label>
                            <select
                              value={meeting.type}
                              onChange={(e) => setMeeting(prev => ({ ...prev, type: e.target.value }))}
                              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none flex-1"
                            >
                              <option value="Standup">Standup</option>
                              <option value="Planning">Planning</option>
                              <option value="Review">Review</option>
                              <option value="Retrospective">Retrospective</option>
                              <option value="One-on-One">One-on-One</option>
                              <option value="All-Hands">All-Hands</option>
                              <option value="Client Meeting">Client Meeting</option>
                              <option value="Interview">Interview</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-yellow-400" />
                            <label className="text-sm font-medium text-gray-300 min-w-[70px]">
                              Location
                            </label>
                            <input
                              type="text"
                              value={meeting.location}
                              onChange={(e) => setMeeting(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="Conference Room A"
                              className="px-3 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none flex-1"
                            />
                          </div>
                        </div>
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
                            <div className="absolute right-0 top-8 w-64 max-h-screen overflow-y-auto rounded-lg shadow-xl border z-50 bg-gray-800 border-gray-700">
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
                                      className={`w-full flex items-center px-3 py-2 rounded cursor-pointer transition-colors ${isSelected
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
                                      <div className="flex items-center">
                                        <Users className="w-4 h-4 mr-2" />
                                        <div>
                                          <div className="font-medium">{user.name}</div>
                                          <div className="text-xs text-gray-400">{user.email} • {user.role}</div>
                                        </div>
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

                  <hr className="border-gray-700 my-2" />

                  <div className="mt-2 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-300">Notes</div>
                      <div className="relative">
                        <button
                          onClick={() => setShowTemplateDropdown(showTemplateDropdown === 'notes-header' ? null : 'notes-header')}
                          className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
                          title="Templates"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {showTemplateDropdown === 'notes-header' && (
                          <div className="absolute right-0 top-8 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                            <div className="p-2">
                              <div className="text-xs text-gray-400 px-2 py-1 font-medium">MEETING TEMPLATES</div>
                              <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '📋 Meeting Agenda', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Meeting Objectives:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Review project progress and milestones', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Discuss upcoming deadlines and deliverables', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Address any blockers or challenges', style: {} }, { id: `block-${Date.now()}-6`, type: 'text', content: 'Discussion Topics:', style: {} }, { id: `block-${Date.now()}-7`, type: 'numbered', content: '1. Sprint review and retrospective', style: {} }, { id: `block-${Date.now()}-8`, type: 'numbered', content: '2. Resource allocation and team capacity', style: {} }, { id: `block-${Date.now()}-9`, type: 'numbered', content: '3. Next sprint planning and priorities', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <FileText className="w-4 h-4 text-blue-400" /> Meeting Agenda
                              </button>
                              <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '✅ Action Items', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'High Priority:', style: {} }, { id: `block-${Date.now()}-3`, type: 'todo', content: '☐ Complete user authentication module by Friday', style: {} }, { id: `block-${Date.now()}-4`, type: 'todo', content: '☐ Review and approve design mockups', style: {} }, { id: `block-${Date.now()}-5`, type: 'text', content: 'Medium Priority:', style: {} }, { id: `block-${Date.now()}-6`, type: 'todo', content: '☐ Update project documentation', style: {} }, { id: `block-${Date.now()}-7`, type: 'todo', content: '☐ Schedule client feedback session', style: {} }, { id: `block-${Date.now()}-8`, type: 'text', content: 'Follow-up Items:', style: {} }, { id: `block-${Date.now()}-9`, type: 'todo', content: '☐ Send meeting summary to stakeholders', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <CheckSquare className="w-4 h-4 text-green-400" /> Action Items
                              </button>
                              <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '📝 Meeting Notes', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Key Discussion Points:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Team velocity has improved by 15% this sprint', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• New feature requests from client feedback', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Technical debt prioritization discussion', style: {} }, { id: `block-${Date.now()}-6`, type: 'text', content: 'Important Announcements:', style: {} }, { id: `block-${Date.now()}-7`, type: 'bullet', content: '• New team member joining next week', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• Office relocation scheduled for next month', style: {} }, { id: `block-${Date.now()}-9`, type: 'text', content: 'Questions & Concerns:', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Clarification needed on API requirements', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <FileText className="w-4 h-4 text-purple-400" /> Meeting Notes
                              </button>
                              <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '🎯 Decisions Made', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Strategic Decisions:', style: {} }, { id: `block-${Date.now()}-3`, type: 'numbered', content: '1. Approved budget increase for Q2 development', style: {} }, { id: `block-${Date.now()}-4`, type: 'numbered', content: '2. Decided to implement new testing framework', style: {} }, { id: `block-${Date.now()}-5`, type: 'text', content: 'Process Changes:', style: {} }, { id: `block-${Date.now()}-6`, type: 'numbered', content: '1. Weekly standup time changed to 9:30 AM', style: {} }, { id: `block-${Date.now()}-7`, type: 'numbered', content: '2. Code review process updated with new guidelines', style: {} }, { id: `block-${Date.now()}-8`, type: 'text', content: 'Next Steps:', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Document decisions in project wiki', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Communicate changes to all team members', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <CheckCircle className="w-4 h-4 text-yellow-400" /> Decisions
                              </button>
                              <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '🚀 Sprint Planning', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Sprint Goals:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Complete user dashboard redesign', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Implement payment integration', style: {} }, { id: `block-${Date.now()}-5`, type: 'text', content: 'Story Points Estimation:', style: {} }, { id: `block-${Date.now()}-6`, type: 'numbered', content: '1. User authentication (8 points)', style: {} }, { id: `block-${Date.now()}-7`, type: 'numbered', content: '2. Dashboard UI components (13 points)', style: {} }, { id: `block-${Date.now()}-8`, type: 'numbered', content: '3. API integration (5 points)', style: {} }, { id: `block-${Date.now()}-9`, type: 'text', content: 'Team Capacity: 26 points', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <Calendar className="w-4 h-4 text-indigo-400" /> Sprint Planning
                              </button>
                              <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '🔄 Retrospective', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'What Went Well:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Great team collaboration on complex features', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Improved code quality with new review process', style: {} }, { id: `block-${Date.now()}-5`, type: 'text', content: 'What Could Be Improved:', style: {} }, { id: `block-${Date.now()}-6`, type: 'bullet', content: '• Better estimation accuracy needed', style: {} }, { id: `block-${Date.now()}-7`, type: 'bullet', content: '• More frequent client communication', style: {} }, { id: `block-${Date.now()}-8`, type: 'text', content: 'Action Items for Next Sprint:', style: {} }, { id: `block-${Date.now()}-9`, type: 'todo', content: '☐ Implement story point tracking', style: {} }, { id: `block-${Date.now()}-10`, type: 'todo', content: '☐ Schedule weekly client check-ins', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <ArrowRight className="w-4 h-4 text-pink-400" /> Retrospective
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <hr className="border-gray-700 my-1" />

                    <div className="p-4 min-h-[300px]">
                      {blocks.map((block, index) => (
                        <div key={block.id} className={`flex items-start group relative mb-1 rounded px-2 py-1 ${aiInputBlock === block.id ? 'bg-purple-50/30 rounded-lg p-2' : ''} transition-all duration-200`}>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-2">
                            <div className="relative">
                              <button
                                onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                                className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
                                title="Add block"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              {showBlockMenu === block.id && (
                                <div className="absolute left-0 top-8 w-64 max-h-96 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                                  <div className="p-2">
                                    <div className="text-xs text-gray-400 px-2 py-1 font-medium">BASIC BLOCKS</div>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'text', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Type className="w-4 h-4" /> Text
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks[index] = { ...block, type: 'heading1' }; setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Hash className="w-4 h-4" /> Heading 1
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks[index] = { ...block, type: 'heading2' }; setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Hash className="w-4 h-4" /> Heading 2
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks[index] = { ...block, type: 'heading3' }; setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Hash className="w-4 h-4" /> Heading 3
                                    </button>
                                    
                                    <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">LISTS</div>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'bullet', content: '• ', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <List className="w-4 h-4" /> Bullet List
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'numbered', content: '1. ', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <ListOrdered className="w-4 h-4" /> Numbered List
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'todo', content: '☐ ', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <CheckSquare className="w-4 h-4" /> To-do List
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'toggle', content: '▶ ', style: {}, expanded: false }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <ArrowRight className="w-4 h-4" /> Toggle List
                                    </button>
                                    
                                    <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">MEDIA</div>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'quote', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Quote className="w-4 h-4" /> Quote
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'code', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Code className="w-4 h-4" /> Code Block
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'divider', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Divider className="w-4 h-4" /> Divider
                                    </button>
                                    
                                    <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">FUNCTIONAL</div>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'date', content: new Date().toISOString().split('T')[0], style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Calendar className="w-4 h-4 text-blue-400" /> Date
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; const now = new Date(); const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'); newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'time', content: timeStr, style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Clock className="w-4 h-4 text-green-400" /> Time
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'priority', content: '', priorityLevel: 'medium', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Star className="w-4 h-4 text-yellow-400" /> Priority
                                    </button>
                                    
                                    <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">ADVANCED</div>
                                    <button onClick={() => {
                                      const tableId = `block-${Date.now()}`;
                                      const newBlocks = [...blocks];
                                      newBlocks.splice(index + 1, 0, { id: tableId, type: 'table', style: {} });
                                      setBlocks(newBlocks);
                                      setTableData(prev => ({
                                        ...prev,
                                        [tableId]: { rows: 2, cols: 2, data: [['Header 1', 'Header 2'], ['Row 1', 'Row 2']] }
                                      }));
                                      setShowBlockMenu(null);
                                    }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Table className="w-4 h-4" /> Table
                                    </button>
                                    
                                    <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">CALLOUTS</div>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'info', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Info className="w-4 h-4 text-blue-400" /> Info Callout
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'warning', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <AlertTriangle className="w-4 h-4 text-yellow-400" /> Warning Callout
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'error', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <AlertCircle className="w-4 h-4 text-red-400" /> Error Callout
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'success', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <CheckCircle className="w-4 h-4 text-green-400" /> Success Callout
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'tip', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Lightbulb className="w-4 h-4 text-purple-400" /> Tip Callout
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                onClick={() => setShowLineMenu(showLineMenu === block.id ? null : block.id)}
                                className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
                                title="Line options"
                              >
                                <GripVertical className="w-4 h-4" />
                              </button>
                              {showLineMenu === block.id && (
                                <div className="absolute left-0 top-8 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                                  <div className="p-2">
                                    <button onClick={() => { const newBlocks = [...blocks]; const duplicated = { ...block, id: `block-${Date.now()}` }; newBlocks.splice(index + 1, 0, duplicated); setBlocks(newBlocks); setShowLineMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Copy className="w-4 h-4" /> Duplicate
                                    </button>
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.push({ id: `block-${Date.now()}`, type: 'text', content: '', style: {} }); setBlocks(newBlocks); setShowLineMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                      <Plus className="w-4 h-4" /> Add Line
                                    </button>
                                    {blocks.length > 1 && (
                                      <button onClick={() => { const newBlocks = blocks.filter((_, i) => i !== index); setBlocks(newBlocks); setShowLineMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-red-400">
                                        <Trash2 className="w-4 h-4" /> Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 relative">
                            {aiInputBlock === block.id ? (
                              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-900/20 border border-purple-800/30 transition-all duration-200">
                                <div className="p-1 rounded bg-purple-900/40">
                                  <Sparkles className="w-4 h-4 text-purple-400" />
                                </div>
                                <input
                                  type="text"
                                  value={aiQuery}
                                  onChange={(e) => setAiQuery(e.target.value)}
                                  onKeyDown={handleAiQuerySubmit}
                                  placeholder="Ask AI anything... (Press Enter to submit)"
                                  className="flex-1 outline-none bg-transparent text-sm font-medium text-purple-200 placeholder-purple-400"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    setAiInputBlock(null);
                                    setAiQuery('');
                                  }}
                                  className="p-1 rounded-full hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="block-content">
                                {renderBlockContent(block, index)}
                              </div>
                            )}
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
    </div>
  );
};

export default MeetingEditorPage;