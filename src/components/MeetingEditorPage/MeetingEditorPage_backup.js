import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, Clock, Users, Plus, X, CheckCircle, Circle, Sparkles, GripVertical, Type, Hash, List, Quote, Code, Trash2, Copy, ArrowUp, ArrowDown, ArrowRight, CheckSquare, Table, Minus, AlertCircle, Star, Tag, MapPin, Mail, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, ListOrdered, FileText, Lightbulb, Info, AlertTriangle } from 'lucide-react';
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

  const updateMeetingState = (meetingData) => {
    setMeeting(meetingData);
    if (meetingData.blocks && Array.isArray(meetingData.blocks)) {
      setBlocks(meetingData.blocks);
    } else {
      setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
    }
    if (meetingData.tableData) {
      setTableData(meetingData.tableData);
    }
  };

  const fetchFromServer = async (id) => {
    try {
      const response = await getMeetingById(id);
      return response.meeting || response;
    } catch (error) {
      console.error('Error fetching meeting from server:', error);
      return null;
    }
  };

  const loadMeeting = useCallback(async () => {
    if (!meetingId || isNewMeeting) {
      setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const serverData = await fetchFromServer(meetingId);
      
      if (serverData) {
        updateMeetingState(serverData);
        localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(serverData));
      } else {
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

  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);

  const handleSave = async () => {
    if (!meeting.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }
    
    setIsSaving(true);
    
    try {
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
        blocks: blocks,
        tableData: tableData || {},
        actionItems: meeting.actionItems || [],
        tags: meeting.tags || [],
        createdBy: meeting.createdBy || 'current-user',
        createdAt: isNewMeeting ? new Date().toISOString() : meeting.createdAt,
        updatedAt: new Date().toISOString()
      };

      let savedMeeting;
      if (isNewMeeting) {
        savedMeeting = await createMeeting(meetingData);
        localStorage.setItem(`meeting-${savedMeeting._id || savedMeeting.id}`, JSON.stringify(savedMeeting));
      } else {
        savedMeeting = await updateMeeting(meetingId, meetingData);
        localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(savedMeeting));
      }

      alert(`Meeting ${isNewMeeting ? 'created' : 'updated'} successfully!`);
      navigate('/meeting-notes');
      
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert('Failed to save meeting. Please try again.');
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
        setTimeout(() => {
          if (inputRefs.current[newBlockId]) {
            inputRefs.current[newBlockId].focus();
          }
        }, 0);
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

    return (
      <div className="relative">
        <input
          ref={(el) => inputRefs.current[block.id] = el}
          type="text"
          value={block.content}
          onChange={(e) => updateBlockContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setCurrentBlockId(block.id)}
          placeholder={index === 0 ? "Start typing your meeting notes... " : "Continue typing..."}
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