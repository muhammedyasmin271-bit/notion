import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, Clock, Users, Plus, X, Bold, Italic, List, Quote, Code, Hash, Type, AlignLeft, CheckCircle, Circle, Tag, Link, Paperclip, Video, Maximize2, Minimize2, GripVertical, Trash2, Copy, ChevronUp, ChevronDown, CheckSquare, Minus, Lightbulb, Table, Image, Sparkles } from 'lucide-react';
import { getMeetingById, createMeeting, updateMeeting, addMeetingActionItem, getUsers } from '../../services/api';

const MeetingEditorPage = () => {
  const { isDarkMode } = useTheme();
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const isNewMeeting = !meetingId || meetingId === 'new';
  const formattingMenuRef = useRef(null);
  const blockMenuRef = useRef(null);
  const blockRefs = useRef({});

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
  const [newAttendee, setNewAttendee] = useState('');
  const [showAttendeeInput, setShowAttendeeInput] = useState(false);
  const [newActionItem, setNewActionItem] = useState({ description: '', assignee: '' });
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFormattingMenu, setShowFormattingMenu] = useState(null);
  const [formattingMenuPosition, setFormattingMenuPosition] = useState({ x: 0, y: 0 });
  const [showBlockMenu, setShowBlockMenu] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [aiInputBlock, setAiInputBlock] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { users } = await getUsers();
        setUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        // API service handles fallbacks, no need for hardcoded users
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  // Add new block
  const addBlock = (index, type = 'text') => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: ''
    };

    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setActiveBlockId(newBlock.id);
  };

  // Update block content
  const updateBlock = (id, content) => {
    setBlocks(prev => prev.map(block =>
      block.id === id ? { ...block, content } : block
    ));
  };

  // Delete block
  const deleteBlock = (id) => {
    if (blocks.length <= 1) return;

    setBlocks(prev => prev.filter(block => block.id !== id));
  };

  // Change block type
  const changeBlockType = (id, type) => {
    setBlocks(prev => prev.map(block =>
      block.id === id ? { ...block, type } : block
    ));
    setShowFormattingMenu(null);
  };

  // Duplicate block
  const duplicateBlock = (id) => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (blockIndex === -1) return;

    const blockToDuplicate = blocks[blockIndex];
    const newBlock = {
      ...blockToDuplicate,
      id: `block-${Date.now()}`,
      content: blockToDuplicate.content
    };

    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    setBlocks(newBlocks);
    setShowBlockMenu(null);
  };

  // Move block up
  const moveBlockUp = (id) => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (blockIndex <= 0) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex - 1], newBlocks[blockIndex]] = [newBlocks[blockIndex], newBlocks[blockIndex - 1]];
    setBlocks(newBlocks);
    setShowBlockMenu(null);
  };

  // Move block down
  const moveBlockDown = (id) => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (blockIndex === -1 || blockIndex === blocks.length - 1) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
    setBlocks(newBlocks);
    setShowBlockMenu(null);
  };

  const addAttendee = () => {
    if (newAttendee.trim() && !meeting.attendees.includes(newAttendee.trim())) {
      setMeeting(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()]
      }));
      setNewAttendee('');
      setShowAttendeeInput(false);
    }
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

  // Render block content based on type
  const renderBlockContent = (block, index) => {
    const updateBlockContent = (newContent) => {
      const newBlocks = [...blocks];
      newBlocks[index].content = newContent;
      setBlocks(newBlocks);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && block.type !== 'code' && block.type !== 'table') {
        e.preventDefault();
        const newBlocks = [...blocks];
        let newBlockType = 'text';

        // Continue list formatting
        if (block.type === 'bulleted' || block.type === 'numbered' || block.type === 'todo') {
          newBlockType = block.type;
        }

        newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: newBlockType, content: '' });
        setBlocks(newBlocks);
      } else if (e.key === '/' && block.content === '' && block.type === 'text') {
        e.preventDefault();
        setShowFormattingMenu(block.id);
      } else if (e.key === ' ' && block.content === '' && block.type === 'text') {
        // Show AI input when space is pressed on empty line
        e.preventDefault();
        setAiInputBlock(block.id);
        setAiQuery('');
      } else if (e.key === 'Backspace' && block.content === '' && index > 0) {
        // Delete empty block and focus previous
        e.preventDefault();
        const newBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(newBlocks);
      } else if (e.key === ' ' && block.type === 'text') {
        // Auto-format markdown shortcuts
        const content = block.content;
        if (content === '#') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'h1';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        } else if (content === '##') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'h2';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        } else if (content === '###') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'h3';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        } else if (content === '-' || content === '*') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'bulleted';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        } else if (content === '1.') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'numbered';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        } else if (content === '[]' || content === '[ ]') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'todo';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        } else if (content === '>') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'quote';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        } else if (content === '```') {
          e.preventDefault();
          const newBlocks = [...blocks];
          newBlocks[index].type = 'code';
          newBlocks[index].content = '';
          setBlocks(newBlocks);
        }
      }
    };

    switch (block.type) {
      case 'h1':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 1"
            className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-3xl font-bold leading-tight"
          />
        );
      case 'h2':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 2"
            className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-2xl font-semibold leading-tight"
          />
        );
      case 'h3':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 3"
            className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-xl font-medium leading-tight"
          />
        );
      case 'bulleted':
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-2">•</span>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="List item"
              className="flex-1 px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-base leading-tight"
            />
          </div>
        );
      case 'numbered':
        const numberedIndex = blocks.filter((b, i) => i <= index && b.type === 'numbered').length;
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-2 min-w-[20px] text-sm">{numberedIndex}.</span>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="List item"
              className="flex-1 px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-base leading-tight"
            />
          </div>
        );
      case 'todo':
        const isCompleted = block.content.startsWith('[x]') || block.content.startsWith('[X]');
        const todoContent = block.content.replace(/^\[[ xX]\]\s*/, '');
        return (
          <div className="flex items-start gap-2">
            <button
              className="mt-2 text-gray-400 hover:text-blue-400"
              onClick={() => {
                const newBlocks = [...blocks];
                const currentIndex = blocks.findIndex(b => b.id === block.id);
                if (isCompleted) {
                  newBlocks[currentIndex].content = todoContent;
                } else {
                  newBlocks[currentIndex].content = `[x] ${todoContent}`;
                }
                setBlocks(newBlocks);
              }}
            >
              {isCompleted ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={todoContent}
              onChange={(e) => {
                const newBlocks = [...blocks];
                const currentIndex = blocks.findIndex(b => b.id === block.id);
                const prefix = isCompleted ? '[x] ' : '';
                newBlocks[currentIndex].content = prefix + e.target.value;
                setBlocks(newBlocks);
              }}
              onKeyDown={handleKeyDown}
              placeholder="To-do item"
              className={`flex-1 px-3 py-2 bg-transparent placeholder-gray-400 focus:outline-none border-none text-base leading-tight ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}
            />
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-gray-600 pl-4 py-2 bg-gray-800/30 rounded-r">
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Quote"
              className="w-full px-3 py-2 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none border-none text-base italic leading-tight"
            />
          </div>
        );
      case 'code':
        return (
          <div className="bg-gray-800 rounded p-3 font-mono text-sm">
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="code"
              className="w-full px-3 py-2 bg-transparent text-green-400 placeholder-gray-500 focus:outline-none border-none font-mono text-sm"
            />
          </div>
        );
      case 'callout':
        return (
          <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-3 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="💡 Callout"
              className="flex-1 px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-base leading-tight"
            />
          </div>
        );
      case 'divider':
        return (
          <div className="flex items-center justify-center py-4">
            <hr className="flex-1 border-gray-700" />
            <span className="px-3 text-gray-500 text-sm">divider</span>
            <hr className="flex-1 border-gray-700" />
          </div>
        );
      case 'table':
        return (
          <div className="bg-gray-800 rounded p-3">
            <textarea
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              placeholder="Header 1 | Header 2&#10;Cell 1 | Cell 2"
              className="w-full px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none font-mono text-sm resize-none"
              rows={3}
            />
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={index === 0 ? "Start typing your meeting notes..." : "Type '/' for commands"}
            className="flex-1 px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none text-base leading-tight"
          />
        );
    }
  };
  const handleAiQuerySubmit = async (e) => {
    if (e.key === 'Enter' && aiQuery.trim()) {
      e.preventDefault();
      try {
        setAiError('');
        setIsGenerating(true);

        const currentBlockIndex = blocks.findIndex(b => b.id === aiInputBlock);
        const contextBlocks = blocks.slice(0, currentBlockIndex);

        const context = contextBlocks.map(block => {
          return block.content;
        }).join('\n');

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1000));
        const content = `AI Response: ${aiQuery}\n\nHere's a helpful response based on your query about "${aiQuery}". This is a simulated AI response that would normally come from an AI service.`;

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
        setAiError('AI assistant failed. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAiInputBlock(null);
      setAiQuery('');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="w-full h-screen overflow-y-auto bg-gray-900">
        {/* Header */}
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
            <div>
              {/* Meeting Title */}
              <div className="rounded-lg pt-0 pb-0 bg-gray-900 px-6">
                <input
                  type="text"
                  value={meeting.title}
                  onChange={(e) => setMeeting(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Untitled"
                  className="w-full px-4 py-3 text-4xl ml-8 rounded-lg transition-colors bg-gray-900 text-white placeholder-gray-400 focus:outline-none"
                />
              </div>

              {/* Details */}
              <div className="rounded-lg bg-gray-900">
                <div className="p-6">
                  <div className="flex gap-8 ml-24">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">
                          <Calendar className="w-4 h-4 inline mr-1" style={{ color: 'white' }} />
                          Date
                        </label>
                        <input
                          type="date"
                          value={meeting.date}
                          onChange={(e) => setMeeting(prev => ({ ...prev, date: e.target.value }))}
                          className="px-3 py-2 rounded-lg transition-colors bg-gray-900 text-white focus:outline-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">
                          <Clock className="w-4 h-4 inline mr-1" style={{ color: 'white' }} />
                          Time
                        </label>
                        <input
                          type="time"
                          value={meeting.time}
                          onChange={(e) => setMeeting(prev => ({ ...prev, time: e.target.value }))}
                          className="px-3 py-2 rounded-lg transition-colors bg-gray-900 text-white focus:outline-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">
                          Duration (minutes)
                        </label>
                        <select
                          value={meeting.duration}
                          onChange={(e) => setMeeting(prev => ({ ...prev, duration: e.target.value }))}
                          className="px-3 py-2 rounded-lg transition-colors bg-gray-900 text-white focus:outline-none"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="45">45 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                          <option value="120">2 hours</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">
                          Meeting Type
                        </label>
                        <select
                          value={meeting.type}
                          onChange={(e) => setMeeting(prev => ({ ...prev, type: e.target.value }))}
                          className="px-3 py-2 rounded-lg transition-colors bg-gray-900 text-white focus:outline-none"
                        >
                          <option value="Standup">Standup</option>
                          <option value="Planning">Planning</option>
                          <option value="Review">Review</option>
                          <option value="Retro">Retrospective</option>
                          <option value="Presentation">Presentation</option>
                          <option value="Brainstorming">Brainstorming</option>
                          <option value="Client Meeting">Client Meeting</option>
                          <option value="Team Sync">Team Sync</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">
                          Meeting Status
                        </label>
                        <select
                          value={meeting.status}
                          onChange={(e) => setMeeting(prev => ({ ...prev, status: e.target.value }))}
                          className="px-3 py-2 rounded-lg transition-colors bg-gray-900 text-white focus:outline-none"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="postponed">Postponed</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">
                          <Video className="w-4 h-4 inline mr-1" />
                          Location / Meeting Link
                        </label>
                        <input
                          type="text"
                          value={meeting.location || meeting.meetingLink}
                          onChange={(e) => {
                            if (e.target.value.startsWith('http')) {
                              setMeeting(prev => ({ ...prev, meetingLink: e.target.value, location: '' }));
                            } else {
                              setMeeting(prev => ({ ...prev, location: e.target.value, meetingLink: '' }));
                            }
                          }}
                          placeholder="Enter location or meeting link..."
                          className="flex-1 px-3 py-2 rounded-lg transition-colors bg-gray-900 text-white focus:outline-none"
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

                  {/* Separator */}
                  <hr className="border-gray-700 my-2" />

                  {/* Notes Section */}
                  <div className="mt-2 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-300">Notes</div>
                      <div className="relative">
                        <button
                          onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                          className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors border border-gray-600"
                        >
                          Template
                        </button>
                        {showTemplateDropdown && (
                          <div className="absolute right-0 top-8 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl border z-50 bg-gray-800 border-gray-700">
                            <div className="p-2">
                              <button
                                onClick={() => {
                                  setBlocks([
                                    { id: 'block-1', type: 'text', content: '📋 Meeting Agenda' },
                                    { id: 'block-2', type: 'text', content: 'Date: [Insert Date] | Time: [Insert Time] | Duration: [Insert Duration]' },
                                    { id: 'block-3', type: 'text', content: 'Attendees: [List Attendees]' },
                                    { id: 'block-4', type: 'text', content: '' },
                                    { id: 'block-5', type: 'text', content: '🎯 Objectives' },
                                    { id: 'block-6', type: 'text', content: '• [Primary objective 1]' },
                                    { id: 'block-7', type: 'text', content: '• [Primary objective 2]' },
                                    { id: 'block-8', type: 'text', content: '' },
                                    { id: 'block-9', type: 'text', content: '📝 Agenda Items' },
                                    { id: 'block-10', type: 'text', content: '1. Welcome & Introductions (5 min)' },
                                    { id: 'block-11', type: 'text', content: '2. Review Previous Action Items (10 min)' },
                                    { id: 'block-12', type: 'text', content: '3. Main Discussion Topics (30 min)' },
                                    { id: 'block-13', type: 'text', content: '4. Decision Points (10 min)' },
                                    { id: 'block-14', type: 'text', content: '5. Next Steps & Action Items (10 min)' },
                                    { id: 'block-15', type: 'text', content: '6. Closing Remarks (5 min)' },
                                    { id: 'block-16', type: 'text', content: '' },
                                    { id: 'block-17', type: 'text', content: '📋 Meeting Notes' },
                                    { id: 'block-18', type: 'text', content: '' },
                                    { id: 'block-19', type: 'text', content: '✅ Action Items' },
                                    { id: 'block-20', type: 'text', content: '• [ ] [Action item 1] - Assigned to: [Name] - Due: [Date]' },
                                    { id: 'block-21', type: 'text', content: '• [ ] [Action item 2] - Assigned to: [Name] - Due: [Date]' },
                                    { id: 'block-22', type: 'text', content: '' },
                                    { id: 'block-23', type: 'text', content: '🔄 Next Meeting' },
                                    { id: 'block-24', type: 'text', content: 'Date: [Next Meeting Date]' }
                                  ]);
                                  setShowTemplateDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-gray-700 text-gray-300"
                              >
                                <div className="font-medium">📋 Standard Meeting</div>
                                <div className="text-xs text-gray-400">Comprehensive meeting structure with detailed agenda and tracking</div>
                              </button>
                              <button
                                onClick={() => {
                                  setBlocks([
                                    { id: 'block-1', type: 'text', content: '🏃 Daily Standup Meeting' },
                                    { id: 'block-2', type: 'text', content: 'Date: [Insert Date] | Time: [Insert Time] | Duration: 15 minutes' },
                                    { id: 'block-3', type: 'text', content: '' },
                                    { id: 'block-4', type: 'text', content: '👥 Team Members Present' },
                                    { id: 'block-5', type: 'text', content: '• [Team Member 1]' },
                                    { id: 'block-6', type: 'text', content: '• [Team Member 2]' },
                                    { id: 'block-7', type: 'text', content: '• [Team Member 3]' },
                                    { id: 'block-8', type: 'text', content: '' },
                                    { id: 'block-9', type: 'text', content: '✅ What did you accomplish yesterday?' },
                                    { id: 'block-10', type: 'text', content: '[Team Member 1]:' },
                                    { id: 'block-11', type: 'text', content: '• Completed task 1' },
                                    { id: 'block-12', type: 'text', content: '• Made progress on task 2' },
                                    { id: 'block-13', type: 'text', content: '' },
                                    { id: 'block-14', type: 'text', content: '🎯 What will you work on today?' },
                                    { id: 'block-15', type: 'text', content: '[Team Member 1]:' },
                                    { id: 'block-16', type: 'text', content: '• Continue work on task 2' },
                                    { id: 'block-17', type: 'text', content: '• Start task 3' },
                                    { id: 'block-18', type: 'text', content: '' },
                                    { id: 'block-19', type: 'text', content: '🚫 Any blockers or impediments?' },
                                    { id: 'block-20', type: 'text', content: '• Waiting for approval on X' },
                                    { id: 'block-21', type: 'text', content: '• Need clarification on Y requirement' },
                                    { id: 'block-22', type: 'text', content: '' },
                                    { id: 'block-23', type: 'text', content: '📋 Action Items' },
                                    { id: 'block-24', type: 'text', content: '• [ ] Follow up on blocker X - [Owner]' },
                                    { id: 'block-25', type: 'text', content: '• [ ] Provide clarification on Y - [Owner]' }
                                  ]);
                                  setShowTemplateDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-gray-700 text-gray-300"
                              >
                                <div className="font-medium">🏃 Daily Standup</div>
                                <div className="text-xs text-gray-400">Detailed standup format with individual team member sections</div>
                              </button>
                              <button
                                onClick={() => {
                                  setBlocks([
                                    { id: 'block-1', type: 'text', content: '🔄 Sprint Retrospective' },
                                    { id: 'block-2', type: 'text', content: 'Sprint: [Sprint Number] | Date: [Date] | Team: [Team Name]' },
                                    { id: 'block-3', type: 'text', content: '' },
                                    { id: 'block-4', type: 'text', content: '📊 Sprint Overview' },
                                    { id: 'block-5', type: 'text', content: '• Sprint Goal: [Insert Goal]' },
                                    { id: 'block-6', type: 'text', content: '• Stories Completed: [X/Y]' },
                                    { id: 'block-7', type: 'text', content: '• Story Points Completed: [X/Y]' },
                                    { id: 'block-8', type: 'text', content: '' },
                                    { id: 'block-9', type: 'text', content: '🟢 What went well?' },
                                    { id: 'block-10', type: 'text', content: '• Good team collaboration' },
                                    { id: 'block-11', type: 'text', content: '• Met sprint commitments' },
                                    { id: 'block-12', type: 'text', content: '• Effective daily standups' },
                                    { id: 'block-13', type: 'text', content: '• [Add more items]' },
                                    { id: 'block-14', type: 'text', content: '' },
                                    { id: 'block-15', type: 'text', content: '🔴 What could be improved?' },
                                    { id: 'block-16', type: 'text', content: '• Better story estimation' },
                                    { id: 'block-17', type: 'text', content: '• Reduce context switching' },
                                    { id: 'block-18', type: 'text', content: '• Improve code review process' },
                                    { id: 'block-19', type: 'text', content: '• [Add more items]' },
                                    { id: 'block-20', type: 'text', content: '' },
                                    { id: 'block-21', type: 'text', content: '🎯 What will we commit to improve?' },
                                    { id: 'block-22', type: 'text', content: '• Use planning poker for estimation' },
                                    { id: 'block-23', type: 'text', content: '• Implement focus time blocks' },
                                    { id: 'block-24', type: 'text', content: '• Set code review SLA to 24 hours' },
                                    { id: 'block-25', type: 'text', content: '' },
                                    { id: 'block-26', type: 'text', content: '📋 Action Items' },
                                    { id: 'block-27', type: 'text', content: '• [ ] Research planning poker tools - [Owner] - Due: [Date]' },
                                    { id: 'block-28', type: 'text', content: '• [ ] Schedule focus time blocks - [Owner] - Due: [Date]' },
                                    { id: 'block-29', type: 'text', content: '• [ ] Create code review guidelines - [Owner] - Due: [Date]' }
                                  ]);
                                  setShowTemplateDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-gray-700 text-gray-300"
                              >
                                <div className="font-medium">🔄 Sprint Retrospective</div>
                                <div className="text-xs text-gray-400">Comprehensive retro with metrics, detailed feedback, and action planning</div>
                              </button>
                              <button
                                onClick={() => {
                                  setBlocks([
                                    { id: 'block-1', type: 'text', content: '🤝 One-on-One Meeting' },
                                    { id: 'block-2', type: 'text', content: 'Manager: [Manager Name] | Employee: [Employee Name] | Date: [Date]' },
                                    { id: 'block-3', type: 'text', content: '' },
                                    { id: 'block-4', type: 'text', content: '💬 Check-in & Well-being' },
                                    { id: 'block-5', type: 'text', content: '• How are you feeling about your workload?' },
                                    { id: 'block-6', type: 'text', content: '• Any personal/professional challenges?' },
                                    { id: 'block-7', type: 'text', content: '• Work-life balance status' },
                                    { id: 'block-8', type: 'text', content: '' },
                                    { id: 'block-9', type: 'text', content: '📊 Current Projects & Progress' },
                                    { id: 'block-10', type: 'text', content: '• Project 1: [Status and Progress]' },
                                    { id: 'block-11', type: 'text', content: '• Project 2: [Status and Progress]' },
                                    { id: 'block-12', type: 'text', content: '• Blockers or challenges' },
                                    { id: 'block-13', type: 'text', content: '' },
                                    { id: 'block-14', type: 'text', content: '🎯 Goals & Development' },
                                    { id: 'block-15', type: 'text', content: '• Progress on quarterly goals' },
                                    { id: 'block-16', type: 'text', content: '• Skills you want to develop' },
                                    { id: 'block-17', type: 'text', content: '• Training or learning opportunities' },
                                    { id: 'block-18', type: 'text', content: '' },
                                    { id: 'block-19', type: 'text', content: '💡 Feedback & Recognition' },
                                    { id: 'block-20', type: 'text', content: '• Recent wins and achievements' },
                                    { id: 'block-21', type: 'text', content: '• Areas for improvement' },
                                    { id: 'block-22', type: 'text', content: '• Feedback for manager/team' },
                                    { id: 'block-23', type: 'text', content: '' },
                                    { id: 'block-24', type: 'text', content: '🚀 Career & Future' },
                                    { id: 'block-25', type: 'text', content: '• Career aspirations discussion' },
                                    { id: 'block-26', type: 'text', content: '• Next steps for growth' },
                                    { id: 'block-27', type: 'text', content: '' },
                                    { id: 'block-28', type: 'text', content: '📋 Action Items' },
                                    { id: 'block-29', type: 'text', content: '• [ ] Manager action: [Description] - Due: [Date]' },
                                    { id: 'block-30', type: 'text', content: '• [ ] Employee action: [Description] - Due: [Date]' },
                                    { id: 'block-31', type: 'text', content: '' },
                                    { id: 'block-32', type: 'text', content: '🔄 Next Meeting' },
                                    { id: 'block-33', type: 'text', content: 'Scheduled for: [Date]' }
                                  ]);
                                  setShowTemplateDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-gray-700 text-gray-300"
                              >
                                <div className="font-medium">🤝 One-on-One</div>
                                <div className="text-xs text-gray-400">Structured 1:1 template covering well-being, goals, feedback, and career development</div>
                              </button>
                              <button
                                onClick={() => {
                                  setBlocks([
                                    { id: 'block-1', type: 'text', content: '💼 Client Meeting' },
                                    { id: 'block-2', type: 'text', content: 'Client: [Client Name] | Date: [Date] | Duration: [Duration]' },
                                    { id: 'block-3', type: 'text', content: 'Meeting Type: [In-person/Virtual]' },
                                    { id: 'block-4', type: 'text', content: '' },
                                    { id: 'block-5', type: 'text', content: '👥 Attendees' },
                                    { id: 'block-6', type: 'text', content: 'Client Side: [Names and Roles]' },
                                    { id: 'block-7', type: 'text', content: 'Our Team: [Names and Roles]' },
                                    { id: 'block-8', type: 'text', content: '' },
                                    { id: 'block-9', type: 'text', content: '🎯 Meeting Objectives' },
                                    { id: 'block-10', type: 'text', content: '• Present project progress' },
                                    { id: 'block-11', type: 'text', content: '• Gather client feedback' },
                                    { id: 'block-12', type: 'text', content: '• Discuss next phase requirements' },
                                    { id: 'block-13', type: 'text', content: '• Address any concerns' },
                                    { id: 'block-14', type: 'text', content: '' },
                                    { id: 'block-15', type: 'text', content: '💬 Discussion Points' },
                                    { id: 'block-16', type: 'text', content: '1. Project Status Update' },
                                    { id: 'block-17', type: 'text', content: '   • Completed deliverables' },
                                    { id: 'block-18', type: 'text', content: '   • Current progress vs timeline' },
                                    { id: 'block-19', type: 'text', content: '   • Upcoming milestones' },
                                    { id: 'block-20', type: 'text', content: '2. Client Feedback & Requirements' },
                                    { id: 'block-21', type: 'text', content: '   • [Notes]' },
                                    { id: 'block-22', type: 'text', content: '3. Budget & Timeline Discussion' },
                                    { id: 'block-23', type: 'text', content: '   • [Notes]' },
                                    { id: 'block-24', type: 'text', content: '' },
                                    { id: 'block-25', type: 'text', content: '✅ Key Decisions Made' },
                                    { id: 'block-26', type: 'text', content: '• [Decision 1]' },
                                    { id: 'block-27', type: 'text', content: '• [Decision 2]' },
                                    { id: 'block-28', type: 'text', content: '' },
                                    { id: 'block-29', type: 'text', content: '📋 Action Items' },
                                    { id: 'block-30', type: 'text', content: '• [ ] Send meeting summary to client - [Owner] - Due: [Date]' },
                                    { id: 'block-31', type: 'text', content: '• [ ] Update project timeline - [Owner] - Due: [Date]' },
                                    { id: 'block-32', type: 'text', content: '' },
                                    { id: 'block-33', type: 'text', content: '🔄 Next Meeting' },
                                    { id: 'block-34', type: 'text', content: 'Scheduled for: [Date and Time]' },
                                    { id: 'block-35', type: 'text', content: 'Agenda: [Brief Description]' }
                                  ]);
                                  setShowTemplateDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 rounded transition-colors hover:bg-gray-700 text-gray-300"
                              >
                                <div className="font-medium">💼 Client Meeting</div>
                                <div className="text-xs text-gray-400">Professional client meeting format with structured agenda and follow-up</div>
                              </button>
                              <button
                                onClick={() => {
                                  setBlocks([
                                    { id: 'block-1', type: 'text', content: '📋 Project Planning Meeting' },
                                    { id: 'block-2', type: 'text', content: 'Project: [Project Name] | Date: [Date] | Duration: [Duration]' },
                                    { id: 'block-3', type: 'text', content: '' },
                                    { id: 'block-4', type: 'text', content: '📊 Project Overview' },
                                    { id: 'block-5', type: 'text', content: '• Project Name: [Insert Name]' },
                                    { id: 'block-6', type: 'text', content: '• Project Manager: [Name]' },
                                    { id: 'block-7', type: 'text', content: '• Start Date: [Date]' },
                                    { id: 'block-8', type: 'text', content: '• Target Completion: [Date]' },
                                    { id: 'block-9', type: 'text', content: '' },
                                    { id: 'block-10', type: 'text', content: '🎯 Project Objectives' },
                                    { id: 'block-11', type: 'text', content: '• Primary Goal: [Insert Goal]' },
                                    { id: 'block-12', type: 'text', content: '• Success Metrics: [Define Metrics]' },
                                    { id: 'block-13', type: 'text', content: '• Budget: [Amount]' },
                                    { id: 'block-14', type: 'text', content: '' },
                                    { id: 'block-15', type: 'text', content: '🏁 Key Milestones' },
                                    { id: 'block-16', type: 'text', content: '• Milestone 1: [Description] - [Date]' },
                                    { id: 'block-17', type: 'text', content: '• Milestone