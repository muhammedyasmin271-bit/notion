import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import './MeetingEditorPage.css';
import { Save, ArrowLeft, Calendar, Clock, Users, Plus, X, CheckCircle, Circle, Sparkles, GripVertical, Type, Hash, List, Quote, Code, Trash2, Copy, ArrowUp, ArrowDown, ArrowRight, CheckSquare, Table, Minus, AlertCircle, Star, Tag, MapPin, Mail, ListOrdered, FileText, Lightbulb, Info, AlertTriangle, Target, BarChart3, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Palette, Link, Image, Video, FileIcon, Bookmark, Flag, Eye, EyeOff } from 'lucide-react';
import { getMeetingById, createMeeting, updateMeeting, addMeetingActionItem, getUsers, deleteMeeting } from '../../services/api';


const MeetingEditorPage = () => {
  const { isDarkMode } = useTheme();
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const isNewMeeting = !meetingId || meetingId === 'new';

  const [meeting, setMeeting] = useState({
    title: '',
    type: 'Standup',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: '30',
    attendees: [],
    agenda: '',
    notes: '',
    actionItems: [],
    tags: [],
    location: '',
    meetingLink: '',
    status: 'Scheduled'
  });

  const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'text', content: '', style: {} }]);
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
  const [loadingError, setLoadingError] = useState(null);
  const [canEdit, setCanEdit] = useState(true);
  const [isOwner, setIsOwner] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'offline'
  const [serverStatus, setServerStatus] = useState('unknown'); // 'online', 'offline', 'unknown'


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

  useEffect(() => {
    const loadMeeting = async () => {
      if (!isNewMeeting && meetingId) {
        try {
          console.log('Loading meeting with ID:', meetingId);
          setLoadingError(null);
          const meetingData = await getMeetingById(meetingId);
          console.log('Received meeting data:', meetingData);
          console.log('Meeting data subMeetings field:', meetingData.subMeetings);
          console.log('Meeting data keys:', Object.keys(meetingData));

          // Transform the meeting data to match our state structure
          const transformedMeeting = {
            title: meetingData.title || '',
            type: meetingData.type || 'Standup',
            date: meetingData.date ? new Date(meetingData.date).toISOString().split('T')[0] : '',
            time: meetingData.time || '',
            duration: meetingData.duration || '30',
            attendees: meetingData.attendees || [],
            agenda: meetingData.agenda || '',
            notes: meetingData.notes || '',
            actionItems: meetingData.actionItems || [],
            tags: meetingData.tags || [],
            location: meetingData.location || '',
            meetingLink: meetingData.meetingLink || '',
            status: meetingData.status || 'scheduled'
          };

          setMeeting(transformedMeeting);
          
          // Set edit permissions
          setCanEdit(meetingData.canEdit !== false);
          setIsOwner(meetingData.isOwner !== false);

          // Use localStorage to persist blocks
          const savedBlocks = localStorage.getItem(`meeting-blocks-${meetingId}`);
          if (savedBlocks) {
            console.log('Loading blocks from localStorage');
            setBlocks(JSON.parse(savedBlocks));
          } else if (meetingData.blocks && Array.isArray(meetingData.blocks) && meetingData.blocks.length > 0) {
            console.log('Loading blocks from meeting data:', meetingData.blocks);
            const loadedBlocks = meetingData.blocks.map((block, idx) => ({
              ...block,
              id: block.id || `block-${idx + 1}`
            }));
            setBlocks(loadedBlocks);
          } else {
            console.log('No blocks found, creating default block');
            setBlocks([{ id: 'block-1', type: 'text', content: '', style: {} }]);
          }

          // Use localStorage to persist table data
          const savedTableData = localStorage.getItem(`meeting-tableData-${meetingId}`);
          if (savedTableData) {
            console.log('Loading table data from localStorage');
            setTableData(JSON.parse(savedTableData));
          } else if (meetingData.tableData && typeof meetingData.tableData === 'object') {
            console.log('Loading table data:', meetingData.tableData);
            setTableData(meetingData.tableData);
          } else {
            setTableData({});
          }
          

        } catch (error) {
          console.error('Error loading meeting:', error);
          setLoadingError(error.message || 'Failed to load meeting data');
          // Fallback: try to load from localStorage for offline support
          try {
            const savedMeeting = localStorage.getItem(`meeting-${meetingId}`);
            if (savedMeeting) {
              const meetingData = JSON.parse(savedMeeting);
              setMeeting(meetingData);
              if (meetingData.blocks && Array.isArray(meetingData.blocks)) {
                const loadedBlocks = meetingData.blocks.map((block, idx) => ({
                  ...block,
                  id: block.id || `block-${idx + 1}`
                }));
                setBlocks(loadedBlocks);
              }
              if (meetingData.tableData && typeof meetingData.tableData === 'object') {
                setTableData(meetingData.tableData);
              }
            }
          } catch (storageError) {
            console.error('Error loading from localStorage:', storageError);
          }
        }
      }
    };

    loadMeeting();
  }, [meetingId, isNewMeeting]);

  // Auto-save to localStorage
  // Auto-save to localStorage every 5 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (meetingId && meetingId !== 'new') {
        setSaveStatus('saving');
        localStorage.setItem(`meeting-blocks-${meetingId}`, JSON.stringify(blocks));
        localStorage.setItem(`meeting-tableData-${meetingId}`, JSON.stringify(tableData));
        localStorage.setItem(`meeting-autosave-${meetingId}`, JSON.stringify({
          meeting,
          blocks,
          tableData,
          timestamp: new Date().toISOString()
        }));
        setTimeout(() => setSaveStatus('saved'), 500);
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(autoSaveInterval);
  }, [blocks, tableData, meetingId, meeting]);

  // Check server connectivity
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/health`, {
          method: 'GET',
          timeout: 5000
        });
        if (response.ok) {
          setServerStatus('online');
          // Try to sync any offline data
          await syncOfflineData();
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }
    };

    // Check immediately
    checkServerStatus();
    
    // Check every 30 seconds
    const statusInterval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(statusInterval);
  }, [meetingId]);

  // Sync offline data when server comes back online
  const syncOfflineData = async () => {
    if (serverStatus !== 'online') return;
    
    try {
      // Check for backup data
      const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('meeting-backup-'));
      
      for (const key of backupKeys) {
        try {
          const backupData = JSON.parse(localStorage.getItem(key));
          if (backupData) {
            console.log('Syncing offline data:', backupData);
            
            if (key.includes('new')) {
              await createMeeting(backupData);
            } else {
              const meetingId = key.replace('meeting-backup-', '');
              await updateMeeting(meetingId, backupData);
            }
            
            // Remove backup after successful sync
            localStorage.removeItem(key);
            console.log('Successfully synced offline data');
          }
        } catch (syncError) {
          console.error('Failed to sync backup data:', syncError);
        }
      }
    } catch (error) {
      console.error('Error during offline data sync:', error);
    }
  };

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

  // Fix textarea height on mobile to show full content
  useEffect(() => {
    const adjustTextareaHeights = () => {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        if (textarea.scrollHeight > textarea.clientHeight) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      });
    };

    // Adjust heights after component mounts and when blocks change
    adjustTextareaHeights();
    
    // Also adjust on window resize (orientation change)
    window.addEventListener('resize', adjustTextareaHeights);
    
    return () => {
      window.removeEventListener('resize', adjustTextareaHeights);
    };
  }, [blocks]);

  // Helper function to adjust textarea height
  const adjustTextareaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const removeAttendee = (attendee) => {
    setMeeting(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== attendee)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create a notes string from all block contents
      const notesContent = blocks.map(block => {
        if (block.type === 'heading1') {
          return `# ${block.content}`;
        } else if (block.type === 'heading2') {
          return `## ${block.content}`;
        } else if (block.type === 'heading3') {
          return `### ${block.content}`;
        } else if (block.type === 'bullet') {
          return `- ${block.content.replace(/^•\s*/, '')}`;
        } else if (block.type === 'numbered') {
          return `${block.content}`;
        } else if (block.type === 'todo') {
          const isChecked = block.content.includes('☑');
          return `- [${isChecked ? 'x' : ' '}] ${block.content.replace(/^[☐☑]\s*/, '')}`;
        } else if (block.type === 'quote') {
          return `> ${block.content}`;
        } else if (block.type === 'code') {
          return `\`\`\`\n${block.content}\n\`\`\``;
        } else if (block.type === 'divider') {
          return `---`;
        } else {
          return block.content;
        }
      }).join('\n\n');

      const meetingData = {
        title: meeting.title || 'Untitled Meeting',
        type: meeting.type || 'Team Sync',
        date: meeting.date || new Date().toISOString(),
        time: meeting.time || '09:00',
        duration: meeting.duration || '30',
        attendees: meeting.attendees || [],
        notes: notesContent,
        status: meeting.status || 'scheduled',
        location: meeting.location || '',
        blocks: blocks || [],
        tableData: tableData || {}
      };
      
      console.log('Saving meeting data:', meetingData);
      console.log('Blocks being saved:', blocks);
      console.log('TableData being saved:', tableData);
      
      // Save to localStorage first for backup
      const backupKey = isNewMeeting ? `meeting-backup-${Date.now()}` : `meeting-backup-${meetingId}`;
      localStorage.setItem(backupKey, JSON.stringify({ ...meetingData, blocks, tableData }));
      localStorage.setItem(`meeting-blocks-${meetingId || 'new'}`, JSON.stringify(blocks));
      localStorage.setItem(`meeting-tableData-${meetingId || 'new'}`, JSON.stringify(tableData));
      
      let result;
      try {
        setSaveStatus('saving');
        if (isNewMeeting) {
          result = await createMeeting(meetingData);
          console.log('Created meeting result:', result);
        } else {
          result = await updateMeeting(meetingId, meetingData);
          console.log('Updated meeting result:', result);
        }
        
        // Clear backup after successful save
        localStorage.removeItem(backupKey);
        setSaveStatus('saved');
        
        console.log('Save completed successfully');
        alert(`Meeting ${isNewMeeting ? 'created' : 'updated'} successfully!`);
        
        // Stay on the current page after saving
      } catch (serverError) {
        console.error('Server save failed, data saved locally:', serverError);
        setSaveStatus('offline');
        setServerStatus('offline');
        alert(`Server unavailable. Meeting data saved locally and will sync when server is available.\n\nYou can continue working - your data is safe!`);
        // Don't navigate away, let user continue editing
      }
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert(`Failed to save meeting: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNewMeeting) {
      navigate('/meeting-notes');
      return;
    }

    if (window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      try {
        await deleteMeeting(meetingId);
        alert('Meeting deleted successfully!');
        navigate('/meeting-notes');
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert(`Failed to delete meeting: ${error.message}`);
      }
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
        const input = e.target;
        const cursorPos = input.selectionStart;
        const currentContent = block.content;
        const beforeCursor = currentContent.slice(0, cursorPos);
        const afterCursor = currentContent.slice(cursorPos);
        
        const newBlocks = [...blocks];
        let newBlockType = 'text';
        let newBlockContent = afterCursor;
        
        // Update current block with content before cursor
        newBlocks[index].content = beforeCursor;
        
        if (block.type === 'bullet') {
          newBlockType = 'bullet';
          newBlockContent = '• ' + afterCursor;
        } else if (block.type === 'numbered') {
          newBlockType = 'numbered';
          const currentNum = parseInt(beforeCursor.match(/^(\d+)\./)?.[1] || '1');
          newBlockContent = `${currentNum + 1}. ` + afterCursor;
        } else if (block.type === 'todo') {
          newBlockType = 'todo';
          newBlockContent = '☐ ' + afterCursor;
        } else if (block.type === 'toggle') {
          newBlockType = 'toggle';
          newBlockContent = '▶ ' + afterCursor;
        }

        const newBlockId = `block-${Date.now()}`;
        newBlocks.splice(index + 1, 0, { id: newBlockId, type: newBlockType, content: newBlockContent, style: {} });
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
        } else if (content === '``' && block.type === 'text') {
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
      } else if (e.key === 'Backspace' && index > 0 && e.target.selectionStart === 0) {
        e.preventDefault();
        const prevBlock = blocks[index - 1];
        const currentContent = block.content;
        const newBlocks = [...blocks];
        
        // Merge content with previous block if both are text
        if (prevBlock.type === 'text' && block.type === 'text') {
          newBlocks[index - 1].content += currentContent;
        }
        
        // Remove current block
        newBlocks.splice(index, 1);
        setBlocks(newBlocks);
        
        // Focus previous block at the end
        setTimeout(() => {
          if (prevBlock && inputRefs.current[prevBlock.id]) {
            const input = inputRefs.current[prevBlock.id];
            input.focus();
            const endPos = prevBlock.content.length;
            input.setSelectionRange(endPos, endPos);
          }
        }, 0);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (blocks.length > 1) {
          const targetIndex = index > 0 ? index - 1 : 0;
          const targetBlock = blocks[targetIndex];
          const newBlocks = blocks.filter((_, i) => i !== index);
          setBlocks(newBlocks);
          // Focus previous block
          setTimeout(() => {
            if (targetBlock && inputRefs.current[targetBlock.id]) {
              inputRefs.current[targetBlock.id].focus();
            }
          }, 0);
        }
      } else if (e.key === 'Delete' && e.shiftKey) {
        e.preventDefault();
        if (blocks.length > 1) {
          const targetIndex = index < blocks.length - 1 ? index : index - 1;
          const targetBlock = blocks[targetIndex === index ? index + 1 : targetIndex];
          const newBlocks = blocks.filter((_, i) => i !== index);
          setBlocks(newBlocks);
          // Focus next or previous block
          setTimeout(() => {
            if (targetBlock && inputRefs.current[targetBlock.id]) {
              inputRefs.current[targetBlock.id].focus();
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
      const baseClass = `w-full px-0 sm:px-3 py-2 bg-transparent ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'} focus:outline-none border-none leading-relaxed font-inter`;
      const styleClass = `${block.style?.bold ? 'font-bold ' : ''
        }${block.style?.italic ? 'italic ' : ''
        }${block.style?.underline ? 'underline ' : ''
        }${block.style?.strikethrough ? 'line-through ' : ''
        }${block.style?.align === 'center' ? 'text-center ' :
          block.style?.align === 'right' ? 'text-right ' : 'text-left '
        }`;

      switch (block.type) {
        case 'heading1':
          return `${baseClass} ${styleClass} text-2xl sm:text-3xl font-bold`;
        case 'heading2':
          return `${baseClass} ${styleClass} text-xl sm:text-2xl font-semibold`;
        case 'heading3':
          return `${baseClass} ${styleClass} text-lg sm:text-xl font-medium`;
        case 'code':
          return `${baseClass} ${styleClass} font-mono rounded px-2 py-1 ${isDarkMode ? 'bg-gray-800 text-green-400' : 'bg-gray-200 text-green-700'}`;
        default:
          return `${baseClass} ${styleClass} text-base`;
      }
    };

    if (block.type === 'table') {
      const table = tableData[block.id] || { 
        rows: 2, 
        cols: 2, 
        data: [['Header 1', 'Header 2'], ['Row 1', 'Row 2']],
        colWidths: [120, 120],
        rowHeights: [32, 32],
        cellHeights: {}
      };

      // Ensure table.data exists and is an array
      if (!table.data || !Array.isArray(table.data)) {
        table.data = Array(table.rows || 2).fill().map(() => Array(table.cols || 2).fill(''));
      }
      // Ensure colWidths and rowHeights exist
      if (!table.colWidths || table.colWidths.length !== table.cols) {
        table.colWidths = Array(table.cols).fill(120);
      }
      if (!table.rowHeights || table.rowHeights.length !== table.rows) {
        table.rowHeights = Array(table.rows).fill(32);
      }

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
          const newRowHeights = [...(newTable.rowHeights || Array(newTable.rows - 1).fill(32)), 32];
          newTable.rowHeights = newRowHeights;
          return { ...prev, [block.id]: newTable };
        });
      };

      const addColumn = () => {
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data = newTable.data.map(row => [...row, '']);
          newTable.cols += 1;
          const newColWidths = [...(newTable.colWidths || Array(newTable.cols - 1).fill(120)), 120];
          newTable.colWidths = newColWidths;
          return { ...prev, [block.id]: newTable };
        });
      };

      const deleteRow = () => {
        if (table.rows <= 1) return;
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data.pop();
          newTable.rows -= 1;
          const newRowHeights = (newTable.rowHeights || Array(newTable.rows + 1).fill(32)).slice(0, -1);
          newTable.rowHeights = newRowHeights;
          return { ...prev, [block.id]: newTable };
        });
      };

      const deleteColumn = () => {
        if (table.cols <= 1) return;
        setTableData(prev => {
          const newTable = { ...prev[block.id] };
          newTable.data = newTable.data.map(row => row.slice(0, -1));
          newTable.cols -= 1;
          const newColWidths = (newTable.colWidths || Array(newTable.cols + 1).fill(120)).slice(0, -1);
          newTable.colWidths = newColWidths;
          return { ...prev, [block.id]: newTable };
        });
      };

      return (
        <div className="flex items-start group relative mb-8 mr-8">
          <div className="flex-1 relative">
            <div className={`border rounded-lg overflow-hidden shadow-sm ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
              <table className="border-collapse w-full table-auto">
                <tbody>
                  {table.data.map((row, rowIndex) => {
                    const rowHeight = table.cellHeights?.[rowIndex] || {};
                    return (
                      <tr key={rowIndex} className={rowIndex === 0 ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : (isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/50')}>
                        {row.map((cell, colIndex) => {
                          const savedHeight = rowHeight[colIndex] || Math.max(32, cell.split('\n').length * 20 + 12);
                          return (
                            <td key={`${rowIndex}-${colIndex}`} className={`border-r border-b p-0 align-top ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                              <textarea
                                value={cell}
                                onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                placeholder={rowIndex === 0 ? `Column ${colIndex + 1}` : ''}
                                rows={Math.max(1, cell.split('\n').length)}
                                className={`w-full h-full min-h-[32px] border-none outline-none bg-transparent text-sm resize-none overflow-hidden p-0 sm:p-3 ${rowIndex === 0 ? (isDarkMode ? 'font-semibold text-gray-200' : 'font-semibold text-gray-800') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                                  } ${isDarkMode ? 'focus:bg-blue-900/20' : 'focus:bg-blue-100/30'}`}
                                style={{
                                  height: savedHeight + 'px',
                                  minHeight: '32px',
                                  lineHeight: '1.0'
                                }}
                                onInput={(e) => {
                                  e.target.style.height = 'auto';
                                  const newHeight = Math.max(32, e.target.scrollHeight);
                                  e.target.style.height = newHeight + 'px';
                                  // Save cell height
                                  setTableData(prev => ({
                                    ...prev,
                                    [block.id]: {
                                      ...prev[block.id],
                                      cellHeights: {
                                        ...prev[block.id]?.cellHeights,
                                        [rowIndex]: {
                                          ...prev[block.id]?.cellHeights?.[rowIndex],
                                          [colIndex]: newHeight
                                        }
                                      }
                                    }
                                  }));
                                }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Column controls - Right side */}
            <div className="absolute top-1/2 -right-6 transform -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={addColumn} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`} title="Add column">
                <Plus className="w-3 h-3" />
              </button>
              {table.cols > 1 && (
                <button onClick={deleteColumn} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`} title="Remove column">
                  <Minus className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Row controls - Bottom */}
            <div className="absolute left-1/2 -bottom-6 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={addRow} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`} title="Add row">
                <Plus className="w-3 h-3" />
              </button>
              {table.rows > 1 && (
                <button onClick={deleteRow} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`} title="Remove row">
                  <Minus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (block.type === 'quote') {
      return (
        <div className={`border-l-4 pl-6 py-4 rounded-r-md ${isDarkMode ? 'border-gray-400 bg-gray-800/30' : 'border-gray-500 bg-gray-200/50'}`}>
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onFocus={() => setCurrentBlockId(block.id)}
            className={`w-full bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} text-base italic placeholder-gray-400 focus:outline-none border-none`}
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
            onFocus={() => setCurrentBlockId(block.id)}
            placeholder="Callout text..."
            className={`flex-1 bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} placeholder-gray-400 focus:outline-none border-none`}
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
          <span className={`mt-2 text-lg leading-none ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>•</span>
          <textarea
            ref={(el) => inputRefs.current[block.id] = el}
            value={block.content.replace(/^• /, '')}
            onChange={(e) => updateBlockContent(`• ${e.target.value}`)}
            onKeyDown={handleKeyDown}
            placeholder="List item..."
            className={`${getInputClassName()} resize-none overflow-hidden`}
            rows={Math.max(1, ((block.content || '').match(/\n/g) || []).length + 1)}
            style={{ minHeight: '1.5rem', lineHeight: '1.0', wordWrap: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', height: 'auto' }}
            onInput={(e) => adjustTextareaHeight(e.target)}
            onFocus={(e) => {
              setCurrentBlockId(block.id);
              adjustTextareaHeight(e.target);
            }}
          />
        </div>
      );
    }

    if (block.type === 'numbered') {
      const number = block.content.match(/^(\d+)\./)?.[1] || '1';
      return (
        <div className="flex items-start gap-2">
          <span className={`mt-2 min-w-[20px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{number}.</span>
          <textarea
            ref={(el) => inputRefs.current[block.id] = el}
            value={block.content.replace(/^\d+\. /, '')}
            onChange={(e) => updateBlockContent(`${number}. ${e.target.value}`)}
            onKeyDown={handleKeyDown}
            placeholder="List item..."
            className={`${getInputClassName()} resize-none overflow-hidden`}
            rows={Math.max(1, ((block.content || '').match(/\n/g) || []).length + 1)}
            style={{ minHeight: '1.5rem', lineHeight: '1.0', wordWrap: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', height: 'auto' }}
            onInput={(e) => adjustTextareaHeight(e.target)}
            onFocus={(e) => {
              setCurrentBlockId(block.id);
              adjustTextareaHeight(e.target);
            }}
          />
        </div>
      );
    }

    if (block.type === 'todo') {
      const isChecked = block.content.includes('☑');
      return (
        <div className="flex items-start gap-2">
          <input 
            type="checkbox" 
            className="mr-2 mt-1 flex-shrink-0"
            checked={isChecked}
            onChange={() => {
              const newContent = isChecked
                ? block.content.replace('☑', '☐')
                : block.content.replace('☐', '☑');
              updateBlockContent(newContent);
            }}
          />
          <textarea
            ref={(el) => inputRefs.current[block.id] = el}
            value={block.content.replace(/^[☐☑] /, '')}
            onChange={(e) => updateBlockContent(`${isChecked ? '☑' : '☐'} ${e.target.value}`)}
            onKeyDown={handleKeyDown}
            placeholder="To-do item..."
            className={`${getInputClassName()} ${isChecked ? 'line-through text-gray-500' : ''} resize-none overflow-hidden`}
            rows={Math.max(1, ((block.content || '').match(/\n/g) || []).length + 1)}
            style={{ minHeight: '1.5rem', lineHeight: '1.0', wordWrap: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', height: 'auto' }}
            onInput={(e) => adjustTextareaHeight(e.target)}
            onFocus={(e) => {
              setCurrentBlockId(block.id);
              adjustTextareaHeight(e.target);
            }}
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
              className={`mt-2 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <input
              ref={(el) => inputRefs.current[block.id] = el}
              type="text"
              value={block.content.replace(/^[▶▼] /, '')}
              onChange={(e) => updateBlockContent(`${isExpanded ? '▼' : '▶'} ${e.target.value}`)}
              onKeyDown={handleKeyDown}
              onFocus={() => setCurrentBlockId(block.id)}
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

    if (block.type === 'date') {
      const formatDate = (dateStr) => {
        if (!dateStr) return 'mm/dd/yyyy';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}/${year}`;
      };

      return (
        <div className={`flex items-center gap-2 p-2 border rounded ${isDarkMode ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-100/50 border-blue-300/50'}`}>
          <Calendar className="w-4 h-4 text-blue-400" />
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="date"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} focus:outline-none`}
            style={{ colorScheme: 'dark' }}
          />
          <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{formatDate(block.content)}</span>
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
        <div className={`flex items-center gap-2 p-2 border rounded ${isDarkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-100/50 border-green-300/50'}`}>
          <Clock className="w-4 h-4 text-green-400" />
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="time"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} focus:outline-none`}
            style={{ colorScheme: 'dark' }}
          />
          <span className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>{formatTime(block.content)}</span>
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
            className={`bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} focus:outline-none`}
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
            onFocus={() => setCurrentBlockId(block.id)}
            placeholder="Priority item..."
            className={`flex-1 bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} placeholder-gray-400 focus:outline-none`}
          />
        </div>
      );
    }



    // Handle new block types
    if (block.type === 'highlight') {
      const highlightColors = {
        yellow: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', text: 'text-yellow-200' },
        green: { bg: 'bg-green-900/30', border: 'border-green-500/50', text: 'text-green-200' },
        blue: { bg: 'bg-blue-900/30', border: 'border-blue-500/50', text: 'text-blue-200' },
        red: { bg: 'bg-red-900/30', border: 'border-red-500/50', text: 'text-red-200' },
        purple: { bg: 'bg-purple-900/30', border: 'border-purple-500/50', text: 'text-purple-200' }
      };
      const highlight = highlightColors[block.highlightColor || 'yellow'];

      return (
        <div className={`${highlight.bg} border ${highlight.border} rounded-lg p-3`}>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-yellow-400" />
            <select
              value={block.highlightColor || 'yellow'}
              onChange={(e) => {
                const newBlocks = [...blocks];
                newBlocks[index].highlightColor = e.target.value;
                setBlocks(newBlocks);
              }}
              className="bg-transparent text-white focus:outline-none text-sm"
            >
              <option value="yellow" className="bg-gray-800">Yellow</option>
              <option value="green" className="bg-gray-800">Green</option>
              <option value="blue" className="bg-gray-800">Blue</option>
              <option value="red" className="bg-gray-800">Red</option>
              <option value="purple" className="bg-gray-800">Purple</option>
            </select>
          </div>
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setCurrentBlockId(block.id)}
            placeholder="Highlighted text..."
            className={`w-full bg-transparent ${highlight.text} placeholder-gray-400 focus:outline-none font-medium`}
          />
        </div>
      );
    }

    if (block.type === 'link') {
      return (
        <div className={`flex items-center gap-2 p-2 border rounded ${isDarkMode ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-100/50 border-blue-300/50'}`}>
          <Link className="w-4 h-4 text-blue-400" />
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Link text..."
            className={`flex-1 bg-transparent focus:outline-none ${isDarkMode ? 'text-blue-300 placeholder-gray-400' : 'text-blue-700 placeholder-gray-500'}`}
          />
          <input
            type="url"
            value={block.url || ''}
            onChange={(e) => {
              const newBlocks = [...blocks];
              newBlocks[index].url = e.target.value;
              setBlocks(newBlocks);
            }}
            placeholder="https://..."
            className={`flex-1 bg-transparent focus:outline-none text-sm ${isDarkMode ? 'text-gray-300 placeholder-gray-500' : 'text-gray-700 placeholder-gray-600'}`}
          />
        </div>
      );
    }

    if (block.type === 'tag') {
      const tagColors = {
        blue: { bg: 'bg-blue-900/30', border: 'border-blue-500/50', text: 'text-blue-300' },
        green: { bg: 'bg-green-900/30', border: 'border-green-500/50', text: 'text-green-300' },
        red: { bg: 'bg-red-900/30', border: 'border-red-500/50', text: 'text-red-300' },
        yellow: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', text: 'text-yellow-300' },
        purple: { bg: 'bg-purple-900/30', border: 'border-purple-500/50', text: 'text-purple-300' }
      };
      const tag = tagColors[block.tagColor || 'blue'];

      return (
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1 px-2 py-1 ${tag.bg} border ${tag.border} rounded-full`}>
            <Tag className={`w-3 h-3 ${tag.text}`} />
            <input
              ref={(el) => inputRefs.current[block.id] = el}
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tag name..."
              className={`bg-transparent ${tag.text} placeholder-gray-400 focus:outline-none text-sm min-w-[60px]`}
            />
          </div>
          <select
            value={block.tagColor || 'blue'}
            onChange={(e) => {
              const newBlocks = [...blocks];
              newBlocks[index].tagColor = e.target.value;
              setBlocks(newBlocks);
            }}
            className="bg-transparent text-gray-400 focus:outline-none text-xs"
          >
            <option value="blue" className="bg-gray-800">Blue</option>
            <option value="green" className="bg-gray-800">Green</option>
            <option value="red" className="bg-gray-800">Red</option>
            <option value="yellow" className="bg-gray-800">Yellow</option>
            <option value="purple" className="bg-gray-800">Purple</option>
          </select>
        </div>
      );
    }

    if (block.type === 'progress') {
      return (
        <div className={`p-3 border rounded ${isDarkMode ? 'bg-gray-800/30 border-gray-600' : 'bg-gray-200/30 border-gray-400'}`}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <input
              ref={(el) => inputRefs.current[block.id] = el}
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Progress description..."
              className={`flex-1 bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} placeholder-gray-400 focus:outline-none`}
            />
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{block.progress || 50}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex-1 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <div 
                className="bg-orange-400 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${block.progress || 50}%` }}
              ></div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={block.progress || 50}
              onChange={(e) => {
                const newBlocks = [...blocks];
                newBlocks[index].progress = parseInt(e.target.value);
                setBlocks(newBlocks);
              }}
              className="w-20"
            />
          </div>
        </div>
      );
    }

    if (block.type === 'hidden') {
      return (
        <div className={`p-3 border rounded ${block.visible ? `${isDarkMode ? 'bg-gray-800/30 border-gray-600' : 'bg-gray-100/30 border-gray-300'}` : `${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-200/50 border-gray-400'} opacity-50`}`}>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                const newBlocks = [...blocks];
                newBlocks[index].visible = !block.visible;
                setBlocks(newBlocks);
              }}
              className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>{block.visible ? 'Visible' : 'Hidden'}</span>
          </div>
          {block.visible && (
            <input
              ref={(el) => inputRefs.current[block.id] = el}
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hidden content..."
              className={`w-full bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} placeholder-gray-400 focus:outline-none`}
            />
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <textarea
          ref={(el) => inputRefs.current[block.id] = el}
          value={block.content}
          onChange={(e) => updateBlockContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setCurrentBlockId(block.id);
            adjustTextareaHeight(e.target);
          }}
          onBlur={(e) => {
            // Delay hiding toolbar to allow clicking on toolbar buttons
            setTimeout(() => {
              if (!document.activeElement?.closest('.formatting-toolbar')) {
                setCurrentBlockId(null);
              }
            }, 150);
          }}
          placeholder={index === 0 ? "Start typing your meeting notes... " : "Continue typing... (Try markdown shortcuts)"}
          className={`${getInputClassName()} resize-none overflow-hidden`}
          rows={Math.max(1, ((block.content || '').match(/\n/g) || []).length + 1)}
          style={{ minHeight: '1.5rem', lineHeight: '1.0', wordWrap: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', height: 'auto' }}
          onInput={(e) => adjustTextareaHeight(e.target)}
        />

      </div>
    );
  };

  const handleAiQuerySubmit = async (e) => {
    if (e.key === 'Enter' && aiQuery.trim()) {
      e.preventDefault();
      try {
        const currentBlockIndex = blocks.findIndex(b => b.id === aiInputBlock);
        
        // Get context from current meeting content
        const context = `Meeting: ${meeting.title}\nType: ${meeting.type}\nAttendees: ${meeting.attendees.join(', ')}\nCurrent notes: ${blocks.map(b => b.content).join(' ').slice(0, 500)}`;
        
        const { askAI } = await import('../../services/aiService');
        const aiResponse = await askAI(aiQuery, context);

        // Split response into paragraphs and create blocks
        const paragraphs = aiResponse.split('\n').filter(p => p.trim());
        const newBlocks = paragraphs.map((paragraph, idx) => ({
          id: `ai-block-${Date.now()}-${idx}`,
          type: 'text',
          content: paragraph.trim(),
          style: {}
        }));

        if (newBlocks.length > 0) {
          const updatedBlocks = [...blocks];
          updatedBlocks.splice(currentBlockIndex + 1, 0, ...newBlocks);
          setBlocks(updatedBlocks);
        }

        setAiInputBlock(null);
        setAiQuery('');
      } catch (error) {
        console.error('AI assist failed:', error);
        // Add error message as a block
        const errorBlock = {
          id: `error-block-${Date.now()}`,
          type: 'text',
          content: 'AI is currently unavailable. Please try again later.',
          style: {}
        };
        const currentBlockIndex = blocks.findIndex(b => b.id === aiInputBlock);
        const updatedBlocks = [...blocks];
        updatedBlocks.splice(currentBlockIndex + 1, 0, errorBlock);
        setBlocks(updatedBlocks);
        setAiInputBlock(null);
        setAiQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAiInputBlock(null);
      setAiQuery('');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white' : 'bg-white text-gray-900'}`}>
      <div className={`w-full min-h-screen overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-900/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/meeting-notes')}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {!isOwner && (
                  <div className={`px-4 py-2 rounded-lg text-xs sm:text-sm text-center ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                    {canEdit ? 'Participant - View Only' : 'Read Only - You are a participant'}
                  </div>
                )}
                {/* Desktop Action Buttons */}
                {isOwner && (
                  <div className="hidden sm:flex gap-3">
                    {!isNewMeeting && (
                      <button
                        onClick={handleDelete}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? 'Saving...' : (isNewMeeting ? 'Create Meeting' : 'Save Changes')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-2 pb-20 sm:pb-6 overflow-y-auto px-0 sm:px-6">
          {loadingError && (
            <div className={`mb-6 p-4 border rounded ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-100 border-red-400 text-red-700'}`}>
              <strong>Error loading meeting:</strong> {loadingError}
              <p className="mt-2 text-sm">Please try refreshing the page or contact support if the issue persists.</p>
            </div>
          )}
          <div className="w-full">
            <div>
              <div className={`rounded-lg pt-0 pb-0 px-0 sm:px-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <input
                  type="text"
                  value={meeting.title}
                  onChange={isOwner ? (e) => setMeeting(prev => ({ ...prev, title: e.target.value })) : undefined}
                  placeholder="Untitled"
                  readOnly={!isOwner}
                  className={`w-full px-0 sm:px-4 py-3 text-2xl sm:text-4xl ml-0 sm:ml-8 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} placeholder-gray-400 focus:outline-none ${!isOwner ? 'cursor-not-allowed opacity-75' : ''}`}
                />
                <div className="ml-0 sm:ml-12 mt-2">
                  <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created 9/28/2025</span>
                </div>
              </div>

              <div className={`rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 ml-2 sm:ml-8 lg:ml-24">
                    <div className="flex-1 space-y-1">
                      <div className="p-2 sm:p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <label className={`text-sm font-medium min-w-[70px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Date
                            </label>
                            <input
                              type="date"
                              value={meeting.date}
                              onChange={isOwner ? (e) => setMeeting(prev => ({ ...prev, date: e.target.value })) : undefined}
                              readOnly={!isOwner}
                              className={`px-3 py-2 rounded-lg text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} ${!isOwner ? 'cursor-not-allowed opacity-75' : ''}`}
                              style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                            />

                          </div>

                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-green-400" />
                            <label className={`text-sm font-medium min-w-[70px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Time
                            </label>
                            <input
                              type="time"
                              value={meeting.time}
                              onChange={isOwner ? (e) => setMeeting(prev => ({ ...prev, time: e.target.value })) : undefined}
                              readOnly={!isOwner}
                              className={`px-3 py-2 rounded-lg text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} ${!isOwner ? 'cursor-not-allowed opacity-75' : ''}`}
                              style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                            />

                          </div>

                          <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <label className={`text-sm font-medium min-w-[70px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Duration
                            </label>
                            <input
                              type="number"
                              value={meeting.duration}
                              onChange={isOwner ? (e) => setMeeting(prev => ({ ...prev, duration: e.target.value })) : undefined}
                              readOnly={!isOwner}
                              className={`px-3 py-2 rounded-lg text-sm focus:outline-none w-20 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                              min="5"
                              max="480"
                            />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>min</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Circle className={`w-4 h-4 ${meeting.status === 'active' ? 'text-green-400' :
                                meeting.status === 'completed' ? 'text-blue-400' :
                                  meeting.status === 'cancelled' ? 'text-red-400' :
                                    'text-gray-400'
                              }`} />
                            <label className={`text-sm font-medium min-w-[70px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Status
                            </label>
                            <select
                              value={meeting.status}
                              onChange={isOwner ? (e) => setMeeting(prev => ({ ...prev, status: e.target.value })) : undefined}
                              disabled={!isOwner}
                              className={`px-3 py-2 rounded-lg text-sm focus:outline-none flex-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-orange-400" />
                            <label className={`text-sm font-medium min-w-[70px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Type
                            </label>
                            <select
                              value={meeting.type}
                              onChange={isOwner ? (e) => setMeeting(prev => ({ ...prev, type: e.target.value })) : undefined}
                              disabled={!isOwner}
                              className={`px-3 py-2 rounded-lg text-sm focus:outline-none flex-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
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

                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-yellow-400" />
                            <label className={`text-sm font-medium min-w-[70px] ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Location
                            </label>
                            <input
                              type="text"
                              value={meeting.location || ''}
                              onChange={isOwner ? (e) => setMeeting(prev => ({ ...prev, location: e.target.value })) : undefined}
                              readOnly={!isOwner}
                              placeholder="Conference Room A"
                              className={`px-3 py-2 rounded-lg text-sm focus:outline-none flex-1 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex-1 lg:max-w-md">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 relative">
                            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                              <div className={`absolute right-0 top-8 w-72 sm:w-80 max-h-80 overflow-hidden rounded-lg shadow-xl border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <div className="flex items-center justify-between">
                                    <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      <Users className="w-4 h-4" />
                                      Select Participants
                                    </div>
                                    <button
                                      onClick={() => setShowUserDropdown(false)}
                                      className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}
                                      title="Close"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {meeting.attendees.length} selected
                                  </div>
                                </div>
                                <div className={`max-h-64 overflow-y-auto scrollbar-thin ${isDarkMode ? 'scrollbar-thumb-gray-600 scrollbar-track-gray-800' : 'scrollbar-thumb-gray-400 scrollbar-track-gray-200'}`}>
                                  <div className="p-2 space-y-1">
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
                                          className={`w-full flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                                            ? `${isDarkMode ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' : 'bg-blue-100 border border-blue-300 text-blue-700'} shadow-sm`
                                            : `${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'} hover:shadow-sm`
                                            }`}
                                        >
                                          <div className="mr-3">
                                            {isSelected ? (
                                              <CheckCircle className="w-5 h-5 text-blue-400" />
                                            ) : (
                                              <Circle className="w-5 h-5 text-gray-500" />
                                            )}
                                          </div>
                                          <div className="flex items-center flex-1">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium mr-3">
                                              {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                              <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.name}</div>
                                              <div className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <Mail className="w-3 h-3" />
                                                {user.email}
                                              </div>
                                              <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                                  user.role === 'manager' ? (isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700') :
                                                  user.role === 'admin' ? (isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700') :
                                                  (isDarkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-200 text-gray-600')
                                                }`}>
                                                  {user.role}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                                  <div className="text-xs text-gray-400">
                                    Click to select/deselect participants
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className={`rounded-lg p-2 sm:p-3 border mt-2 max-h-48 overflow-y-auto ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-300'}`}>
                            {meeting.attendees.length > 0 ? (
                              <div className="space-y-2">
                                {meeting.attendees.map((attendeeName, index) => {
                                  const user = users.find(u => u.name === attendeeName);
                                  return (
                                    <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'}`}>
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                          {attendeeName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{attendeeName}</div>
                                          {user && (
                                            <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                              <Mail className="w-3 h-3" />
                                              {user.email}
                                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                                user.role === 'manager' ? (isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700') :
                                                user.role === 'admin' ? (isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700') :
                                                (isDarkMode ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-200 text-gray-600')
                                              }`}>
                                                {user.role}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => removeAttendee(attendeeName)} 
                                        className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-red-600/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-100 text-gray-500 hover:text-red-600'}`}
                                        title="Remove participant"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No participants added yet</p>
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Click the + button to add participants</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />

                  <div className="mt-2 relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</div>
                      <div className="relative">
                        <button
                          onClick={() => setShowTemplateDropdown(showTemplateDropdown === 'notes-header' ? null : 'notes-header')}
                          className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}
                          title="Templates"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {showTemplateDropdown === 'notes-header' && (
                          <div className={`absolute right-0 top-8 w-80 max-h-96 overflow-hidden border rounded-lg shadow-xl z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FileText className="w-4 h-4" />
                                Meeting Templates
                              </div>
                              <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Choose a template to get started quickly
                              </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                              <div className="p-2 space-y-1">
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium">MEETING TYPES</div>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '📋 Strategic Planning Meeting Agenda', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Meeting Information:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Date: [Meeting Date] | Time: [Start Time] - [End Time] | Duration: [X] hours', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Location: [Conference Room / Virtual Link] | Facilitator: [Name]', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Required Attendees: [List] | Optional: [List] | Recording: [Yes/No]', style: {} }, { id: `block-${Date.now()}-6`, type: 'divider', content: '', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: 'Meeting Objectives & Success Criteria:', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• Review Q3 performance metrics and KPI achievements (Target: 95% completion)', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Finalize Q4 strategic initiatives and budget allocation ($X approved)', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Identify and mitigate top 3 project risks with action plans', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• Align cross-functional teams on delivery timelines and dependencies', style: {} }, { id: `block-${Date.now()}-12`, type: 'text', content: 'Detailed Agenda (Time-boxed):', style: {} }, { id: `block-${Date.now()}-13`, type: 'numbered', content: '1. Opening & Introductions (5 min) - Welcome, agenda review, ground rules', style: {} }, { id: `block-${Date.now()}-14`, type: 'numbered', content: '2. Executive Summary Presentation (15 min) - Q3 performance dashboard review', style: {} }, { id: `block-${Date.now()}-15`, type: 'numbered', content: '3. Financial Performance Analysis (20 min) - Revenue, costs, ROI metrics', style: {} }, { id: `block-${Date.now()}-16`, type: 'numbered', content: '4. Strategic Initiative Deep Dive (30 min) - Priority projects, resource needs', style: {} }, { id: `block-${Date.now()}-17`, type: 'numbered', content: '5. Risk Assessment & Mitigation (20 min) - Risk register review, action plans', style: {} }, { id: `block-${Date.now()}-18`, type: 'numbered', content: '6. Cross-Team Dependencies (15 min) - Integration points, timeline alignment', style: {} }, { id: `block-${Date.now()}-19`, type: 'numbered', content: '7. Decision Points & Next Steps (10 min) - Action items, owners, deadlines', style: {} }, { id: `block-${Date.now()}-20`, type: 'numbered', content: '8. Closing & Follow-up (5 min) - Summary, next meeting, feedback', style: {} }, { id: `block-${Date.now()}-21`, type: 'text', content: 'Pre-Meeting Preparation Required:', style: {} }, { id: `block-${Date.now()}-22`, type: 'todo', content: '☐ Review Q3 performance dashboard and metrics report', style: {} }, { id: `block-${Date.now()}-23`, type: 'todo', content: '☐ Prepare department budget proposals and justifications', style: {} }, { id: `block-${Date.now()}-24`, type: 'todo', content: '☐ Update project status reports and risk assessments', style: {} }, { id: `block-${Date.now()}-25`, type: 'todo', content: '☐ Review cross-team dependency mapping document', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <FileText className="w-4 h-4 text-blue-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Strategic Meeting Agenda</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Comprehensive agenda with time-boxing and preparation</div>
                                  </div>
                                </button>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '✅ Action Items & Accountability Matrix', style: {} }, { id: `block-${Date.now()}-2`, type: 'callout', calloutType: 'info', content: 'All action items include: Owner, Due Date, Success Criteria, Dependencies, and Status Tracking', style: {} }, { id: `block-${Date.now()}-3`, type: 'text', content: 'CRITICAL PRIORITY (Complete within 48 hours):', style: {} }, { id: `block-${Date.now()}-4`, type: 'todo', content: '☐ [URGENT] Resolve production database performance issue | Owner: DevOps Team | Due: [Date] | Impact: 10K+ users affected', style: {} }, { id: `block-${Date.now()}-5`, type: 'todo', content: '☐ [CRITICAL] Complete security vulnerability patch deployment | Owner: Security Team | Due: [Date] | Compliance: SOC2 requirement', style: {} }, { id: `block-${Date.now()}-6`, type: 'todo', content: '☐ [BLOCKER] Finalize client contract terms for Q4 project | Owner: Legal/Sales | Due: [Date] | Revenue Impact: $500K', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: 'HIGH PRIORITY (Complete within 1 week):', style: {} }, { id: `block-${Date.now()}-8`, type: 'todo', content: '☐ Complete user authentication module with OAuth 2.0 integration | Owner: Backend Team | Due: [Date] | Dependencies: API Gateway setup', style: {} }, { id: `block-${Date.now()}-9`, type: 'todo', content: '☐ Conduct comprehensive design review for mobile app UI/UX | Owner: Design Team | Due: [Date] | Stakeholders: Product, Engineering', style: {} }, { id: `block-${Date.now()}-10`, type: 'todo', content: '☐ Finalize API documentation with interactive examples | Owner: Technical Writers | Due: [Date] | Review: Engineering Lead', style: {} }, { id: `block-${Date.now()}-11`, type: 'todo', content: '☐ Set up automated CI/CD pipeline for staging environment | Owner: DevOps | Due: [Date] | Testing: QA Team validation', style: {} }, { id: `block-${Date.now()}-12`, type: 'text', content: 'MEDIUM PRIORITY (Complete within 2 weeks):', style: {} }, { id: `block-${Date.now()}-13`, type: 'todo', content: '☐ Update comprehensive project documentation and architecture diagrams | Owner: Tech Lead | Due: [Date]', style: {} }, { id: `block-${Date.now()}-14`, type: 'todo', content: '☐ Schedule and conduct client feedback session with key stakeholders | Owner: Product Manager | Due: [Date]', style: {} }, { id: `block-${Date.now()}-15`, type: 'todo', content: '☐ Prepare and configure comprehensive testing environment | Owner: QA Team | Due: [Date]', style: {} }, { id: `block-${Date.now()}-16`, type: 'text', content: 'ADMINISTRATIVE & FOLLOW-UP ITEMS:', style: {} }, { id: `block-${Date.now()}-17`, type: 'todo', content: '☐ Distribute detailed meeting summary with decisions and action items | Owner: Meeting Facilitator | Due: 24 hours', style: {} }, { id: `block-${Date.now()}-18`, type: 'todo', content: '☐ Schedule follow-up review meeting with all stakeholders | Owner: Project Manager | Due: [Date]', style: {} }, { id: `block-${Date.now()}-19`, type: 'todo', content: '☐ Update project management tool with new tasks and dependencies | Owner: Scrum Master | Due: [Date]', style: {} }, { id: `block-${Date.now()}-20`, type: 'text', content: 'ESCALATION & RISK ITEMS:', style: {} }, { id: `block-${Date.now()}-21`, type: 'todo', content: '☐ Escalate resource allocation concerns to executive team | Owner: Department Head | Due: [Date]', style: {} }, { id: `block-${Date.now()}-22`, type: 'todo', content: '☐ Review and update risk register with new identified risks | Owner: Risk Manager | Due: [Date]', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <CheckSquare className="w-4 h-4 text-green-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Professional Action Items</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Detailed accountability matrix with owners and deadlines</div>
                                  </div>
                                </button>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '📝 Executive Meeting Minutes & Strategic Discussion', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Meeting Context & Participants:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Meeting Type: [Strategic Planning / Board Review / Executive Briefing]', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Attendees: [List with titles] | Absent: [List] | Guests: [List]', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Meeting Facilitator: [Name] | Note Taker: [Name] | Timekeeper: [Name]', style: {} }, { id: `block-${Date.now()}-6`, type: 'divider', content: '', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: 'STRATEGIC DISCUSSION HIGHLIGHTS:', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• Q3 Performance Analysis: Revenue exceeded targets by 12% ($2.4M vs $2.1M target), customer acquisition up 28%', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Market Expansion Initiative: European market entry approved with $5M budget allocation for Q1 2024', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Technology Modernization: Cloud migration project 75% complete, expected cost savings of $300K annually', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• Competitive Analysis: New competitor launched similar product, need to accelerate feature development timeline', style: {} }, { id: `block-${Date.now()}-12`, type: 'bullet', content: '• Talent Acquisition: Approved hiring of 15 additional engineers and 5 sales representatives for Q4', style: {} }, { id: `block-${Date.now()}-13`, type: 'text', content: 'CRITICAL BUSINESS DECISIONS MADE:', style: {} }, { id: `block-${Date.now()}-14`, type: 'numbered', content: '1. Approved $8M Series B funding round with lead investor participation confirmed', style: {} }, { id: `block-${Date.now()}-15`, type: 'numbered', content: '2. Authorized acquisition of AI startup TechCorp for $12M to enhance product capabilities', style: {} }, { id: `block-${Date.now()}-16`, type: 'numbered', content: '3. Implemented new remote work policy with hybrid model (3 days office, 2 days remote)', style: {} }, { id: `block-${Date.now()}-17`, type: 'numbered', content: '4. Established new customer success team with dedicated account managers for enterprise clients', style: {} }, { id: `block-${Date.now()}-18`, type: 'text', content: 'OPERATIONAL UPDATES & ANNOUNCEMENTS:', style: {} }, { id: `block-${Date.now()}-19`, type: 'bullet', content: '• Leadership Changes: Sarah Johnson promoted to VP of Engineering, effective [Date]', style: {} }, { id: `block-${Date.now()}-20`, type: 'bullet', content: '• Office Expansion: New 15,000 sq ft facility in Austin opening Q1 2024, capacity for 200 employees', style: {} }, { id: `block-${Date.now()}-21`, type: 'bullet', content: '• Security Compliance: SOC 2 Type II certification completed, GDPR compliance audit scheduled for [Date]', style: {} }, { id: `block-${Date.now()}-22`, type: 'bullet', content: '• Partnership Announcement: Strategic alliance with Microsoft Azure for enterprise cloud solutions', style: {} }, { id: `block-${Date.now()}-23`, type: 'text', content: 'RISK ASSESSMENT & MITIGATION STRATEGIES:', style: {} }, { id: `block-${Date.now()}-24`, type: 'bullet', content: '• Supply Chain Risk: Identified alternative vendors for critical components, diversification plan approved', style: {} }, { id: `block-${Date.now()}-25`, type: 'bullet', content: '• Cybersecurity Concerns: Implemented zero-trust architecture, mandatory security training for all staff', style: {} }, { id: `block-${Date.now()}-26`, type: 'bullet', content: '• Market Volatility: Established contingency budget of $2M for economic uncertainty scenarios', style: {} }, { id: `block-${Date.now()}-27`, type: 'text', content: 'QUESTIONS RAISED & FOLLOW-UP REQUIRED:', style: {} }, { id: `block-${Date.now()}-28`, type: 'bullet', content: '• Regulatory Compliance: Need legal review of new data privacy regulations in EU markets', style: {} }, { id: `block-${Date.now()}-29`, type: 'bullet', content: '• Resource Allocation: Clarification needed on Q4 marketing budget distribution across channels', style: {} }, { id: `block-${Date.now()}-30`, type: 'bullet', content: '• Timeline Concerns: Engineering team capacity constraints may impact Q1 2024 product launch', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <FileText className="w-4 h-4 text-purple-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Executive Meeting Minutes</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Detailed strategic discussion with business metrics</div>
                                  </div>
                                </button>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '🎯 Strategic Decisions & Business Outcomes', style: {} }, { id: `block-${Date.now()}-2`, type: 'callout', calloutType: 'success', content: 'All decisions include: Rationale, Financial Impact, Implementation Timeline, Success Metrics, and Accountability', style: {} }, { id: `block-${Date.now()}-3`, type: 'text', content: 'MAJOR STRATEGIC DECISIONS (Board/Executive Level):', style: {} }, { id: `block-${Date.now()}-4`, type: 'numbered', content: '1. APPROVED: $15M budget increase for Q4 product development and market expansion | Rationale: Competitive advantage | ROI: 300% projected | Owner: CEO', style: {} }, { id: `block-${Date.now()}-5`, type: 'numbered', content: '2. APPROVED: Implementation of enterprise-grade security framework (SOC 2 Type II) | Investment: $2M | Timeline: 6 months | Compliance: Required for Fortune 500 clients', style: {} }, { id: `block-${Date.now()}-6`, type: 'numbered', content: '3. APPROVED: Acquisition of AI/ML startup for $8M to enhance product capabilities | Due Diligence: Complete | Integration: Q1 2024 | Expected Revenue: $20M annually', style: {} }, { id: `block-${Date.now()}-7`, type: 'numbered', content: '4. APPROVED: International expansion into European markets | Investment: $12M | Timeline: 18 months | Target: 25% revenue growth', style: {} }, { id: `block-${Date.now()}-8`, type: 'text', content: 'OPERATIONAL & PROCESS DECISIONS:', style: {} }, { id: `block-${Date.now()}-9`, type: 'numbered', content: '1. IMPLEMENTED: Agile transformation with Scrum methodology across all development teams | Training: 2 weeks | Coach: External consultant | Metrics: Velocity tracking', style: {} }, { id: `block-${Date.now()}-10`, type: 'numbered', content: '2. UPDATED: Code review process with mandatory security scanning and performance testing | Tools: SonarQube, OWASP | Timeline: Immediate | Training: Required', style: {} }, { id: `block-${Date.now()}-11`, type: 'numbered', content: '3. REVISED: Deployment schedule to include comprehensive staging environment testing | Frequency: Bi-weekly | Rollback: Automated | Monitoring: 24/7', style: {} }, { id: `block-${Date.now()}-12`, type: 'numbered', content: '4. ESTABLISHED: Cross-functional DevOps team with dedicated infrastructure engineers | Headcount: 5 new hires | Budget: $750K annually | Start: [Date]', style: {} }, { id: `block-${Date.now()}-13`, type: 'text', content: 'ORGANIZATIONAL & HR DECISIONS:', style: {} }, { id: `block-${Date.now()}-14`, type: 'numbered', content: '1. APPROVED: Hybrid work model (3 days office, 2 days remote) with flexible hours | Policy: Effective [Date] | Equipment: $2K budget per employee', style: {} }, { id: `block-${Date.now()}-15`, type: 'numbered', content: '2. IMPLEMENTED: Comprehensive diversity and inclusion program with measurable goals | Target: 40% diverse hires | Training: Mandatory | Budget: $500K', style: {} }, { id: `block-${Date.now()}-16`, type: 'numbered', content: '3. ESTABLISHED: Employee stock option program for retention | Eligibility: All full-time | Vesting: 4 years | Pool: 10% of company equity', style: {} }, { id: `block-${Date.now()}-17`, type: 'text', content: 'TECHNOLOGY & INFRASTRUCTURE DECISIONS:', style: {} }, { id: `block-${Date.now()}-18`, type: 'numbered', content: '1. APPROVED: Migration to cloud-native architecture (AWS/Kubernetes) | Timeline: 12 months | Cost Savings: $400K annually | Scalability: 10x improvement', style: {} }, { id: `block-${Date.now()}-19`, type: 'numbered', content: '2. IMPLEMENTED: Zero-trust security model with multi-factor authentication | Rollout: Phased over 3 months | Training: Required | Compliance: SOC 2', style: {} }, { id: `block-${Date.now()}-20`, type: 'numbered', content: '3. SELECTED: Salesforce as CRM platform with custom integrations | Implementation: 4 months | Training: 40 hours per user | ROI: 250%', style: {} }, { id: `block-${Date.now()}-21`, type: 'text', content: 'IMPLEMENTATION ROADMAP & ACCOUNTABILITY:', style: {} }, { id: `block-${Date.now()}-22`, type: 'bullet', content: '• Document all decisions in corporate governance system with version control and audit trail', style: {} }, { id: `block-${Date.now()}-23`, type: 'bullet', content: '• Communicate strategic changes through all-hands meeting and detailed department briefings', style: {} }, { id: `block-${Date.now()}-24`, type: 'bullet', content: '• Update project management systems with new timelines, budgets, and resource allocations', style: {} }, { id: `block-${Date.now()}-25`, type: 'bullet', content: '• Establish monthly review meetings to track implementation progress and adjust as needed', style: {} }, { id: `block-${Date.now()}-26`, type: 'bullet', content: '• Create dashboard for executive team to monitor key performance indicators and decision outcomes', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <CheckCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Strategic Decisions & Outcomes</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Executive-level decisions with financial impact and accountability</div>
                                  </div>
                                </button>

                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '🚀 Sprint Planning Session - Sprint 24 (Q4 2024)', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Sprint Overview & Context:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Sprint Duration: 2 weeks ([Start Date] - [End Date]) | Sprint Goal: Deliver core user management features', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Team Velocity: 42 points (average) | Available Capacity: 38 points (holidays/PTO considered)', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Product Owner: [Name] | Scrum Master: [Name] | Development Team: 7 members', style: {} }, { id: `block-${Date.now()}-6`, type: 'divider', content: '', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: 'SPRINT GOALS & SUCCESS CRITERIA:', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• PRIMARY: Complete user dashboard redesign with 95% user satisfaction score in usability testing', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• SECONDARY: Implement secure payment integration with PCI DSS compliance validation', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• TERTIARY: Enhance mobile responsiveness to achieve 100% compatibility across iOS/Android devices', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• QUALITY: Maintain 90%+ code coverage and zero critical security vulnerabilities', style: {} }, { id: `block-${Date.now()}-12`, type: 'text', content: 'USER STORIES & ACCEPTANCE CRITERIA:', style: {} }, { id: `block-${Date.now()}-13`, type: 'numbered', content: '1. [US-101] User Authentication Module (8 pts) | As a user, I can securely log in with OAuth 2.0 | AC: Multi-factor auth, session management, audit logging', style: {} }, { id: `block-${Date.now()}-14`, type: 'numbered', content: '2. [US-102] Dashboard UI Components (13 pts) | As a user, I can view personalized analytics dashboard | AC: Real-time data, responsive design, accessibility compliance', style: {} }, { id: `block-${Date.now()}-15`, type: 'numbered', content: '3. [US-103] Payment Gateway Integration (5 pts) | As a customer, I can make secure payments | AC: Stripe integration, error handling, receipt generation', style: {} }, { id: `block-${Date.now()}-16`, type: 'numbered', content: '4. [US-104] Mobile Optimization (8 pts) | As a mobile user, I can access all features seamlessly | AC: Touch-friendly UI, offline capability, performance optimization', style: {} }, { id: `block-${Date.now()}-17`, type: 'numbered', content: '5. [US-105] API Documentation (3 pts) | As a developer, I can integrate with comprehensive API docs | AC: Interactive examples, versioning, authentication guide', style: {} }, { id: `block-${Date.now()}-18`, type: 'numbered', content: '6. [US-106] Performance Monitoring (3 pts) | As an admin, I can monitor system performance | AC: Real-time metrics, alerting, historical data', style: {} }, { id: `block-${Date.now()}-19`, type: 'text', content: 'TEAM CAPACITY & RESOURCE ALLOCATION:', style: {} }, { id: `block-${Date.now()}-20`, type: 'bullet', content: '• Total Available Points: 38 | Committed Points: 40 | Buffer: -2 points (acceptable risk)', style: {} }, { id: `block-${Date.now()}-21`, type: 'bullet', content: '• Frontend Team: 18 points | Backend Team: 15 points | DevOps: 5 points | QA: 2 points', style: {} }, { id: `block-${Date.now()}-22`, type: 'bullet', content: '• Key Personnel: John (Frontend Lead) - available | Sarah (Backend) - 3 days PTO | Mike (DevOps) - full availability', style: {} }, { id: `block-${Date.now()}-23`, type: 'text', content: 'DEPENDENCIES & EXTERNAL FACTORS:', style: {} }, { id: `block-${Date.now()}-24`, type: 'bullet', content: '• CRITICAL: Third-party API documentation from PaymentCorp (due [Date]) - BLOCKER if delayed', style: {} }, { id: `block-${Date.now()}-25`, type: 'bullet', content: '• MEDIUM: Design system updates from UX team (due [Date]) - affects UI components', style: {} }, { id: `block-${Date.now()}-26`, type: 'bullet', content: '• LOW: Security audit results (due [Date]) - may require minor adjustments', style: {} }, { id: `block-${Date.now()}-27`, type: 'text', content: 'RISK ASSESSMENT & MITIGATION:', style: {} }, { id: `block-${Date.now()}-28`, type: 'bullet', content: '• HIGH RISK: Payment integration complexity | Mitigation: Dedicated pair programming, early prototype', style: {} }, { id: `block-${Date.now()}-29`, type: 'bullet', content: '• MEDIUM RISK: Mobile testing device availability | Mitigation: Cloud testing platform backup', style: {} }, { id: `block-${Date.now()}-30`, type: 'bullet', content: '• LOW RISK: Team member availability | Mitigation: Cross-training completed, knowledge sharing sessions', style: {} }, { id: `block-${Date.now()}-31`, type: 'text', content: 'DEFINITION OF DONE CHECKLIST:', style: {} }, { id: `block-${Date.now()}-32`, type: 'todo', content: '☐ Code review completed by 2+ team members with approval', style: {} }, { id: `block-${Date.now()}-33`, type: 'todo', content: '☐ Unit tests written with 90%+ coverage, integration tests passing', style: {} }, { id: `block-${Date.now()}-34`, type: 'todo', content: '☐ Security scan completed with zero critical/high vulnerabilities', style: {} }, { id: `block-${Date.now()}-35`, type: 'todo', content: '☐ Performance testing meets SLA requirements (< 2s load time)', style: {} }, { id: `block-${Date.now()}-36`, type: 'todo', content: '☐ Documentation updated (API docs, user guides, technical specs)', style: {} }, { id: `block-${Date.now()}-37`, type: 'todo', content: '☐ Accessibility compliance verified (WCAG 2.1 AA standards)', style: {} }, { id: `block-${Date.now()}-38`, type: 'todo', content: '☐ Product Owner acceptance and stakeholder sign-off obtained', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <Calendar className="w-4 h-4 text-indigo-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Professional Sprint Planning</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Comprehensive planning with capacity, risks, and DoD</div>
                                  </div>
                                </button>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '🔄 Sprint 23 Retrospective - Continuous Improvement Analysis', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Sprint Metrics & Performance Overview:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Sprint Goal Achievement: 95% (19/20 story points completed) | Velocity: 42 points (vs 38 planned)', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Quality Metrics: 0 production bugs, 94% code coverage, 2.1s avg response time', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Team Satisfaction: 8.2/10 (survey results) | Stakeholder Satisfaction: 9.1/10', style: {} }, { id: `block-${Date.now()}-6`, type: 'divider', content: '', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: '✅ WHAT WENT WELL (Continue Doing):', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• COLLABORATION: Cross-functional pairing between frontend/backend teams reduced integration issues by 60%', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• CODE QUALITY: New automated code review process caught 15 potential issues before production', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• DELIVERY: Successfully delivered all user-facing features 2 days ahead of schedule', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• COMMUNICATION: Daily async updates in Slack improved transparency and reduced meeting time by 30%', style: {} }, { id: `block-${Date.now()}-12`, type: 'bullet', content: '• INNOVATION: Team-initiated performance optimization resulted in 40% faster page load times', style: {} }, { id: `block-${Date.now()}-13`, type: 'bullet', content: '• STAKEHOLDER ENGAGEMENT: Weekly demo sessions increased product owner engagement and feedback quality', style: {} }, { id: `block-${Date.now()}-14`, type: 'text', content: '⚠️ WHAT COULD BE IMPROVED (Stop/Start Doing):', style: {} }, { id: `block-${Date.now()}-15`, type: 'bullet', content: '• ESTIMATION: Story point estimates were 15% off on average, need better historical data analysis', style: {} }, { id: `block-${Date.now()}-16`, type: 'bullet', content: '• TECHNICAL DEBT: Accumulated 8 hours of tech debt, need dedicated time allocation in next sprint', style: {} }, { id: `block-${Date.now()}-17`, type: 'bullet', content: '• TESTING: Manual testing bottleneck caused 1-day delay, need more automated test coverage', style: {} }, { id: `block-${Date.now()}-18`, type: 'bullet', content: '• DOCUMENTATION: API documentation lagged behind development, impacting integration team', style: {} }, { id: `block-${Date.now()}-19`, type: 'bullet', content: '• RISK MANAGEMENT: Late identification of third-party API changes caused scope adjustment', style: {} }, { id: `block-${Date.now()}-20`, type: 'text', content: '📊 TEAM FEEDBACK & INSIGHTS:', style: {} }, { id: `block-${Date.now()}-21`, type: 'bullet', content: '• "Pair programming sessions were highly effective for knowledge transfer" - 6/7 team members', style: {} }, { id: `block-${Date.now()}-22`, type: 'bullet', content: '• "Need better tooling for performance monitoring during development" - DevOps team', style: {} }, { id: `block-${Date.now()}-23`, type: 'bullet', content: '• "Client feedback loop is much faster now, helps with requirement clarity" - Product Owner', style: {} }, { id: `block-${Date.now()}-24`, type: 'bullet', content: '• "Would benefit from dedicated time for learning new technologies" - Development team', style: {} }, { id: `block-${Date.now()}-25`, type: 'text', content: '🎯 SPECIFIC ACTION ITEMS FOR NEXT SPRINT:', style: {} }, { id: `block-${Date.now()}-26`, type: 'todo', content: '☐ Implement historical velocity tracking dashboard for better estimation | Owner: Scrum Master | Due: Sprint 24 Day 3', style: {} }, { id: `block-${Date.now()}-27`, type: 'todo', content: '☐ Allocate 20% sprint capacity for technical debt reduction | Owner: Tech Lead | Due: Sprint Planning', style: {} }, { id: `block-${Date.now()}-28`, type: 'todo', content: '☐ Increase automated test coverage from 70% to 85% | Owner: QA Lead | Due: Sprint 24 End', style: {} }, { id: `block-${Date.now()}-29`, type: 'todo', content: '☐ Establish API-first development with documentation automation | Owner: Backend Team | Due: Sprint 25', style: {} }, { id: `block-${Date.now()}-30`, type: 'todo', content: '☐ Create early warning system for external dependency changes | Owner: DevOps | Due: Sprint 24 Mid', style: {} }, { id: `block-${Date.now()}-31`, type: 'todo', content: '☐ Schedule monthly "Innovation Friday" for learning and experimentation | Owner: Engineering Manager | Due: Next Week', style: {} }, { id: `block-${Date.now()}-32`, type: 'text', content: '📈 PROCESS IMPROVEMENTS & EXPERIMENTS:', style: {} }, { id: `block-${Date.now()}-33`, type: 'bullet', content: '• EXPERIMENT: Try "Definition of Ready" checklist for user stories to improve sprint planning', style: {} }, { id: `block-${Date.now()}-34`, type: 'bullet', content: '• PROCESS: Implement "Three Amigos" sessions (Dev, QA, PO) for acceptance criteria refinement', style: {} }, { id: `block-${Date.now()}-35`, type: 'bullet', content: '• TOOL: Evaluate GitHub Copilot for code completion to increase development velocity', style: {} }, { id: `block-${Date.now()}-36`, type: 'bullet', content: '• METRIC: Track "Time to First Feedback" to optimize review cycles', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <ArrowRight className="w-4 h-4 text-pink-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Professional Sprint Retrospective</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Data-driven analysis with metrics and actionable improvements</div>
                                  </div>
                                </button>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '⚡ Daily Standup - [Date] | Sprint 24 Day 7', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Sprint Progress Overview:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Sprint Burndown: 18/40 points completed (45%) | Days Remaining: 7 | Velocity: On Track', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Sprint Goal Status: 🟢 On Track | Critical Path: Payment Integration | Risk Level: Medium', style: {} }, { id: `block-${Date.now()}-5`, type: 'divider', content: '', style: {} }, { id: `block-${Date.now()}-6`, type: 'text', content: '💼 TEAM MEMBER UPDATES (Yesterday → Today → Blockers):', style: {} }, { id: `block-${Date.now()}-7`, type: 'bullet', content: '• 👨‍💻 John (Frontend Lead): Completed OAuth integration & unit tests → Working on dashboard components & responsive design → ⚠️ Waiting for UX approval on mobile layouts', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• 👩‍💻 Sarah (Backend): Fixed payment gateway timeout issue, deployed hotfix → Implementing webhook handlers & error recovery → ✅ No blockers', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• 👨‍🔧 Mike (DevOps): Completed CI/CD pipeline optimization, 40% faster builds → Setting up monitoring dashboards & alerts → ✅ No blockers', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• 👩‍🔬 Lisa (QA): Automated 15 test cases, found 3 minor bugs → Performance testing & accessibility audit → ⚠️ Need staging environment reset', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• 👨‍🎨 Alex (UI/UX): Finalized mobile wireframes, conducted user testing → Creating design system components → ✅ No blockers', style: {} }, { id: `block-${Date.now()}-12`, type: 'bullet', content: '• 👩‍💼 Emma (Product): Reviewed user feedback, updated acceptance criteria → Stakeholder demo prep & backlog refinement → ✅ No blockers', style: {} }, { id: `block-${Date.now()}-13`, type: 'text', content: '🚫 ACTIVE BLOCKERS & IMPEDIMENTS:', style: {} }, { id: `block-${Date.now()}-14`, type: 'bullet', content: '• 🔴 HIGH: UX approval needed for mobile layouts (John blocked) | Owner: Alex | ETA: Today 2 PM | Escalation: Design Director if delayed', style: {} }, { id: `block-${Date.now()}-15`, type: 'bullet', content: '• 🟡 MEDIUM: Staging environment needs reset for QA testing (Lisa blocked) | Owner: Mike | ETA: 30 minutes | Impact: Testing delayed 2 hours', style: {} }, { id: `block-${Date.now()}-16`, type: 'bullet', content: '• 🟢 LOW: Third-party API rate limits affecting development testing | Owner: Sarah | Workaround: Mock service | Impact: Minimal', style: {} }, { id: `block-${Date.now()}-17`, type: 'text', content: '🎯 TODAY\'S SPRINT COMMITMENTS & FOCUS:', style: {} }, { id: `block-${Date.now()}-18`, type: 'bullet', content: '• 🔥 CRITICAL: Complete payment integration testing and security review (Sarah + Lisa)', style: {} }, { id: `block-${Date.now()}-19`, type: 'bullet', content: '• 📱 HIGH: Finalize mobile responsive components for user dashboard (John + Alex)', style: {} }, { id: `block-${Date.now()}-20`, type: 'bullet', content: '• 📈 MEDIUM: Set up production monitoring and alerting system (Mike)', style: {} }, { id: `block-${Date.now()}-21`, type: 'bullet', content: '• 📝 LOW: Update API documentation with new endpoints (Sarah)', style: {} }, { id: `block-${Date.now()}-22`, type: 'text', content: '📅 UPCOMING EVENTS & DEPENDENCIES:', style: {} }, { id: `block-${Date.now()}-23`, type: 'bullet', content: '• 11:00 AM - Architecture review meeting (Sarah, Mike, Tech Lead)', style: {} }, { id: `block-${Date.now()}-24`, type: 'bullet', content: '• 2:00 PM - Client demo preparation session (Emma, John, Alex)', style: {} }, { id: `block-${Date.now()}-25`, type: 'bullet', content: '• 4:00 PM - Security audit results review (All team)', style: {} }, { id: `block-${Date.now()}-26`, type: 'text', content: '📊 SPRINT HEALTH INDICATORS:', style: {} }, { id: `block-${Date.now()}-27`, type: 'bullet', content: '• Velocity Trend: 🟢 On track (18/40 points, 7 days remaining)', style: {} }, { id: `block-${Date.now()}-28`, type: 'bullet', content: '• Quality Metrics: 🟢 Good (0 critical bugs, 92% test coverage)', style: {} }, { id: `block-${Date.now()}-29`, type: 'bullet', content: '• Team Morale: 🟢 High (8.5/10 in daily pulse check)', style: {} }, { id: `block-${Date.now()}-30`, type: 'bullet', content: '• Stakeholder Satisfaction: 🟢 Excellent (9.2/10 from yesterday\'s demo)', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <Clock className="w-4 h-4 text-orange-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Professional Daily Standup</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Comprehensive team sync with metrics and health indicators</div>
                                  </div>
                                </button>

                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-3">SUB-MEETINGS & BREAKOUTS</div>


                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-3">CLIENT & STAKEHOLDER</div>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '🤝 Strategic Client Partnership Meeting - [Client Name]', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Meeting Context & Relationship Overview:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Client: [Company Name] - Fortune 500 Technology Leader | Contract Value: $2.5M annually | Relationship: 3 years', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Meeting Type: Quarterly Business Review | Duration: 2 hours | Location: Client HQ / Virtual Hybrid', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Client Attendees: John Smith (CTO), Sarah Johnson (VP Engineering), Mike Chen (Product Director)', style: {} }, { id: `block-${Date.now()}-6`, type: 'bullet', content: '• Our Team: [Account Manager], [Technical Lead], [Project Manager], [Sales Director]', style: {} }, { id: `block-${Date.now()}-7`, type: 'divider', content: '', style: {} }, { id: `block-${Date.now()}-8`, type: 'text', content: '📈 PROJECT STATUS & PERFORMANCE METRICS:', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Overall Progress: 78% complete (ahead of schedule by 2 weeks) | Budget Utilization: 65% ($1.625M of $2.5M)', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Key Milestones Achieved: API integration (100%), User dashboard (95%), Mobile app (80%), Security audit (completed)', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• Performance KPIs: 99.9% uptime, 1.2s avg response time, 0 critical security incidents, 4.8/5 user satisfaction', style: {} }, { id: `block-${Date.now()}-12`, type: 'bullet', content: '• Upcoming Deliverables: Advanced analytics module (Dec 15), Third-party integrations (Jan 10), Go-live preparation (Feb 1)', style: {} }, { id: `block-${Date.now()}-13`, type: 'text', content: '🗣️ CLIENT FEEDBACK & STRATEGIC INPUT:', style: {} }, { id: `block-${Date.now()}-14`, type: 'bullet', content: '• 🟢 POSITIVE: "Dashboard redesign exceeded expectations, 40% improvement in user engagement metrics"', style: {} }, { id: `block-${Date.now()}-15`, type: 'bullet', content: '• 🟢 POSITIVE: "API performance is outstanding, handling 10x more traffic than projected"', style: {} }, { id: `block-${Date.now()}-16`, type: 'bullet', content: '• 🟢 POSITIVE: "Team communication and transparency has been exceptional throughout the project"', style: {} }, { id: `block-${Date.now()}-17`, type: 'bullet', content: '• 🟡 REQUEST: Additional advanced reporting features for executive dashboard (estimated 3-week effort)', style: {} }, { id: `block-${Date.now()}-18`, type: 'bullet', content: '• 🟡 REQUEST: Integration with Salesforce and HubSpot for unified customer view (new scope)', style: {} }, { id: `block-${Date.now()}-19`, type: 'bullet', content: '• 🟠 CONCERN: Mobile app performance on older Android devices needs optimization', style: {} }, { id: `block-${Date.now()}-20`, type: 'text', content: '💼 BUSINESS IMPACT & VALUE REALIZATION:', style: {} }, { id: `block-${Date.now()}-21`, type: 'bullet', content: '• Cost Savings: $800K annually through process automation and efficiency gains', style: {} }, { id: `block-${Date.now()}-22`, type: 'bullet', content: '• Revenue Impact: 25% increase in customer conversion rate, $2.1M additional revenue projected', style: {} }, { id: `block-${Date.now()}-23`, type: 'bullet', content: '• Operational Efficiency: 60% reduction in manual processes, 4 FTE hours saved daily', style: {} }, { id: `block-${Date.now()}-24`, type: 'bullet', content: '• User Adoption: 85% active user rate (target was 70%), 4.8/5 satisfaction score', style: {} }, { id: `block-${Date.now()}-25`, type: 'text', content: '🔮 FUTURE ROADMAP & EXPANSION OPPORTUNITIES:', style: {} }, { id: `block-${Date.now()}-26`, type: 'bullet', content: '• Phase 2 Expansion: AI/ML analytics module with predictive capabilities ($1.2M additional scope)', style: {} }, { id: `block-${Date.now()}-27`, type: 'bullet', content: '• International Rollout: European and APAC markets (compliance requirements, localization)', style: {} }, { id: `block-${Date.now()}-28`, type: 'bullet', content: '• Enterprise Features: Advanced security, audit trails, custom workflows ($800K scope)', style: {} }, { id: `block-${Date.now()}-29`, type: 'bullet', content: '• Partnership Opportunities: White-label solution for client\'s customers (revenue sharing model)', style: {} }, { id: `block-${Date.now()}-30`, type: 'text', content: '⚙️ TECHNICAL DISCUSSIONS & ARCHITECTURE:', style: {} }, { id: `block-${Date.now()}-31`, type: 'bullet', content: '• Scalability Planning: Current architecture supports 10x growth, cloud-native design future-proof', style: {} }, { id: `block-${Date.now()}-32`, type: 'bullet', content: '• Security Posture: SOC 2 Type II compliant, penetration testing completed, zero critical vulnerabilities', style: {} }, { id: `block-${Date.now()}-33`, type: 'bullet', content: '• Integration Capabilities: RESTful APIs, webhook support, real-time data synchronization', style: {} }, { id: `block-${Date.now()}-34`, type: 'bullet', content: '• Disaster Recovery: 99.99% availability SLA, automated backups, multi-region deployment', style: {} }, { id: `block-${Date.now()}-35`, type: 'text', content: '🎯 STRATEGIC ACTION ITEMS & COMMITMENTS:', style: {} }, { id: `block-${Date.now()}-36`, type: 'todo', content: '☐ Provide detailed proposal for advanced reporting features with timeline and cost | Owner: Sales Director | Due: [Date + 5 days]', style: {} }, { id: `block-${Date.now()}-37`, type: 'todo', content: '☐ Conduct mobile performance audit and optimization plan | Owner: Technical Lead | Due: [Date + 1 week]', style: {} }, { id: `block-${Date.now()}-38`, type: 'todo', content: '☐ Schedule technical deep-dive session for Salesforce/HubSpot integration | Owner: Solutions Architect | Due: [Date + 3 days]', style: {} }, { id: `block-${Date.now()}-39`, type: 'todo', content: '☐ Prepare Phase 2 business case with ROI analysis and implementation roadmap | Owner: Account Manager | Due: [Date + 2 weeks]', style: {} }, { id: `block-${Date.now()}-40`, type: 'todo', content: '☐ Organize executive stakeholder meeting for contract renewal discussions | Owner: Sales Director | Due: [Date + 1 month]', style: {} }, { id: `block-${Date.now()}-41`, type: 'text', content: '📅 NEXT STEPS & FOLLOW-UP SCHEDULE:', style: {} }, { id: `block-${Date.now()}-42`, type: 'bullet', content: '• Weekly Status Calls: Every Tuesday 10 AM EST with project team', style: {} }, { id: `block-${Date.now()}-43`, type: 'bullet', content: '• Monthly Executive Review: First Friday of each month with C-level stakeholders', style: {} }, { id: `block-${Date.now()}-44`, type: 'bullet', content: '• Next QBR Meeting: [Date + 3 months] - Focus on Phase 2 planning and expansion', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <Users className="w-4 h-4 text-cyan-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Strategic Client Partnership</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Comprehensive client review with business metrics and roadmap</div>
                                  </div>
                                </button>
                                <button onClick={() => { const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: '📊 Executive Project Portfolio Review - Q4 2024', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Portfolio Overview & Strategic Context:', style: {} }, { id: `block-${Date.now()}-3`, type: 'bullet', content: '• Portfolio Value: $15.2M total investment | Active Projects: 12 | Completed: 8 | Pipeline: 5', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Strategic Alignment: Digital transformation (60%), Market expansion (25%), Operational efficiency (15%)', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Review Period: Q4 2024 | Stakeholders: Executive Team, PMO, Department Heads', style: {} }, { id: `block-${Date.now()}-6`, type: 'divider', content: '', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: '🎯 FLAGSHIP PROJECT: Enterprise Digital Platform', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• Budget: $4.2M allocated | Spent: $2.8M (67%) | Remaining: $1.4M | Forecast: On budget', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Timeline: Jan 2024 - Mar 2025 (15 months) | Progress: 72% complete | Status: 🟢 On Track', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Team: 25 FTE (15 internal, 10 contractors) | Key Roles: Tech Lead, Product Manager, UX Director', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• Milestones: 11/15 completed | Current Phase: Integration & Testing | Next: User Acceptance Testing', style: {} }, { id: `block-${Date.now()}-12`, type: 'text', content: '📈 KEY PERFORMANCE INDICATORS & METRICS:', style: {} }, { id: `block-${Date.now()}-13`, type: 'bullet', content: '• Schedule Performance Index (SPI): 1.08 (8% ahead of schedule) | Cost Performance Index (CPI): 1.05 (5% under budget)', style: {} }, { id: `block-${Date.now()}-14`, type: 'bullet', content: '• Quality Metrics: 0 critical defects, 94% test coverage, 2 minor security findings (resolved)', style: {} }, { id: `block-${Date.now()}-15`, type: 'bullet', content: '• Stakeholder Satisfaction: 9.2/10 (executive survey) | Team Morale: 8.7/10 (monthly pulse)', style: {} }, { id: `block-${Date.now()}-16`, type: 'bullet', content: '• Business Value: $2.1M annual cost savings projected, 40% process efficiency improvement', style: {} }, { id: `block-${Date.now()}-17`, type: 'text', content: '🏆 MAJOR ACHIEVEMENTS & DELIVERABLES:', style: {} }, { id: `block-${Date.now()}-18`, type: 'bullet', content: '• ✅ Successfully launched beta platform with 500+ active users, 4.6/5 satisfaction rating', style: {} }, { id: `block-${Date.now()}-19`, type: 'bullet', content: '• ✅ Completed SOC 2 Type II audit with zero findings, achieved enterprise security compliance', style: {} }, { id: `block-${Date.now()}-20`, type: 'bullet', content: '• ✅ Integrated with 8 critical business systems, achieved 99.9% uptime SLA', style: {} }, { id: `block-${Date.now()}-21`, type: 'bullet', content: '• ✅ Delivered mobile application ahead of schedule, supporting iOS and Android platforms', style: {} }, { id: `block-${Date.now()}-22`, type: 'bullet', content: '• ✅ Established automated CI/CD pipeline, reduced deployment time from 4 hours to 15 minutes', style: {} }, { id: `block-${Date.now()}-23`, type: 'text', content: '⚠️ RISK ASSESSMENT & MITIGATION STRATEGIES:', style: {} }, { id: `block-${Date.now()}-24`, type: 'bullet', content: '• 🔴 HIGH RISK: Third-party API vendor stability concerns | Mitigation: Alternative vendor identified, POC completed', style: {} }, { id: `block-${Date.now()}-25`, type: 'bullet', content: '• 🟡 MEDIUM RISK: Key developer departure (2 team members) | Mitigation: Knowledge transfer completed, contractors onboarded', style: {} }, { id: `block-${Date.now()}-26`, type: 'bullet', content: '• 🟢 LOW RISK: Regulatory compliance changes | Mitigation: Legal review scheduled, compliance officer engaged', style: {} }, { id: `block-${Date.now()}-27`, type: 'bullet', content: '• 🟢 LOW RISK: Hardware procurement delays | Mitigation: Cloud-first strategy, vendor diversification', style: {} }, { id: `block-${Date.now()}-28`, type: 'text', content: '💰 FINANCIAL PERFORMANCE & ROI ANALYSIS:', style: {} }, { id: `block-${Date.now()}-29`, type: 'bullet', content: '• Total Investment: $4.2M | Projected 3-year ROI: 285% | Break-even: Month 18 post-launch', style: {} }, { id: `block-${Date.now()}-30`, type: 'bullet', content: '• Cost Avoidance: $800K annually through automation | Revenue Generation: $1.2M new business opportunities', style: {} }, { id: `block-${Date.now()}-31`, type: 'bullet', content: '• Operational Savings: 15 FTE hours daily, $450K annual labor cost reduction', style: {} }, { id: `block-${Date.now()}-32`, type: 'bullet', content: '• Market Impact: 25% faster time-to-market for new products, competitive advantage established', style: {} }, { id: `block-${Date.now()}-33`, type: 'text', content: '🔮 STRATEGIC RECOMMENDATIONS & NEXT PHASE:', style: {} }, { id: `block-${Date.now()}-34`, type: 'bullet', content: '• APPROVED: Proceed with Phase 2 - AI/ML integration ($2.5M additional investment)', style: {} }, { id: `block-${Date.now()}-35`, type: 'bullet', content: '• RECOMMENDED: Accelerate international rollout timeline by 3 months (market opportunity)', style: {} }, { id: `block-${Date.now()}-36`, type: 'bullet', content: '• PROPOSED: Establish Center of Excellence for digital transformation (5 FTE team)', style: {} }, { id: `block-${Date.now()}-37`, type: 'bullet', content: '• CONSIDERATION: Strategic partnership with technology vendor for co-innovation', style: {} }, { id: `block-${Date.now()}-38`, type: 'text', content: '🎯 EXECUTIVE ACTION ITEMS & GOVERNANCE:', style: {} }, { id: `block-${Date.now()}-39`, type: 'todo', content: '☐ Approve Phase 2 budget allocation and resource planning | Owner: CFO | Due: [Date + 1 week] | Impact: $2.5M investment', style: {} }, { id: `block-${Date.now()}-40`, type: 'todo', content: '☐ Finalize vendor contract renegotiation for API stability | Owner: Procurement | Due: [Date + 2 weeks] | Risk: High', style: {} }, { id: `block-${Date.now()}-41`, type: 'todo', content: '☐ Establish project governance board for Phase 2 oversight | Owner: PMO Director | Due: [Date + 10 days]', style: {} }, { id: `block-${Date.now()}-42`, type: 'todo', content: '☐ Conduct comprehensive security audit for production readiness | Owner: CISO | Due: [Date + 3 weeks]', style: {} }, { id: `block-${Date.now()}-43`, type: 'todo', content: '☐ Develop change management strategy for organization-wide rollout | Owner: HR Director | Due: [Date + 1 month]', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(null); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <BarChart3 className="w-4 h-4 text-emerald-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-sm">Executive Portfolio Review</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Comprehensive project analysis with financial metrics and ROI</div>
                                  </div>
                                </button>
                              </div>
                            </div>
                            <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                              <div className="text-xs text-gray-400">
                                Templates will be added to your current notes
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />

                    <div className="p-0 sm:p-4 min-h-[300px] pb-8">
                      {blocks.map((block, index) => (
                        <div key={block.id} className={`flex items-start group relative mb-2 rounded px-0 sm:px-3 py-2 ${aiInputBlock === block.id ? 'bg-purple-50/30 rounded-lg p-2' : ''} transition-all duration-200`}>
                          <div className={`flex items-center gap-1 transition-opacity duration-200 mr-1 sm:mr-2 ${currentBlockId === block.id ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'}`}>
                            <div className="relative">
                              <button
                                onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                                className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}
                                title="Add block"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              {showBlockMenu === block.id && (
                                <div className={`absolute left-0 top-8 w-64 sm:w-72 max-h-96 overflow-hidden border rounded-lg shadow-xl z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                  <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                      <Plus className="w-4 h-4" />
                                      Add Block
                                    </div>
                                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Choose a block type to add content
                                    </div>
                                  </div>
                                  <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                    <div className="p-2 space-y-1">
                                      <div className="text-xs text-gray-400 px-2 py-1 font-medium">BASIC BLOCKS</div>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'text', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
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
                                      <Minus className="w-4 h-4" /> Divider
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
                                        [tableId]: { 
                                          rows: 2, 
                                          cols: 2, 
                                          data: [['Header 1', 'Header 2'], ['Row 1', 'Row 2']],
                                          colWidths: [120, 120],
                                          rowHeights: [32, 32],
                                          cellHeights: {}
                                        }
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

                                      <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">FORMATTING</div>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'highlight', content: '', highlightColor: 'yellow', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <Palette className="w-4 h-4 text-yellow-400" /> Highlight
                                      </button>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'link', content: '', url: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <Link className="w-4 h-4 text-blue-400" /> Link
                                      </button>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'tag', content: '', tagColor: 'blue', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <Tag className="w-4 h-4 text-blue-400" /> Tag
                                      </button>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'flag', content: '', flagColor: 'red', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <Flag className="w-4 h-4 text-red-400" /> Flag
                                      </button>

                                      <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">MEDIA</div>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'image', content: '', url: '', alt: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <Image className="w-4 h-4 text-green-400" /> Image
                                      </button>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'video', content: '', url: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <Video className="w-4 h-4 text-red-400" /> Video
                                      </button>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'file', content: '', fileName: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <FileIcon className="w-4 h-4 text-gray-400" /> File
                                      </button>

                                      <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">SPECIAL</div>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'progress', content: '', progress: 50, style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <BarChart3 className="w-4 h-4 text-orange-400" /> Progress
                                      </button>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'location', content: '', address: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <MapPin className="w-4 h-4 text-pink-400" /> Location
                                      </button>
                                      <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'hidden', content: '', visible: false, style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                        <EyeOff className="w-4 h-4 text-gray-400" /> Hidden
                                      </button>
                                    </div>
                                  </div>
                                  <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                                    <div className="text-xs text-gray-400">
                                      Use keyboard shortcuts for faster editing
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('GripVertical clicked for block:', block.id);
                                  setShowLineMenu(showLineMenu === block.id ? null : block.id);
                                }}
                                className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}
                                title="Line options"
                              >
                                <GripVertical className="w-4 h-4" />
                              </button>
                              {showLineMenu === block.id && (
                                <div className={`absolute left-0 top-8 w-36 sm:w-40 border rounded-lg shadow-xl z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                  <div className="p-2">
                                    <button onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'text', content: '', style: {} }); setBlocks(newBlocks); setShowLineMenu(null); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                                      <Plus className="w-4 h-4" /> Add Line
                                    </button>
                                    {index > 0 && (
                                      <button onClick={() => { const newBlocks = [...blocks]; [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]]; setBlocks(newBlocks); setShowLineMenu(null); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                                        <ArrowUp className="w-4 h-4" /> Move Up
                                      </button>
                                    )}
                                    {index < blocks.length - 1 && (
                                      <button onClick={() => { const newBlocks = [...blocks]; [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]; setBlocks(newBlocks); setShowLineMenu(null); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                                        <ArrowDown className="w-4 h-4" /> Move Down
                                      </button>
                                    )}
                                    <button onClick={() => { const newBlocks = [...blocks]; const duplicated = { ...block, id: `block-${Date.now()}` }; newBlocks.splice(index + 1, 0, duplicated); setBlocks(newBlocks); setShowLineMenu(null); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                                      <Copy className="w-4 h-4" /> Duplicate
                                    </button>
                                    {blocks.length > 1 && (
                                      <button onClick={() => { 
                                        const targetIndex = index > 0 ? index - 1 : (blocks.length > 1 ? 1 : 0);
                                        const targetBlock = blocks[targetIndex];
                                        const newBlocks = blocks.filter((_, i) => i !== index); 
                                        setBlocks(newBlocks); 
                                        setShowLineMenu(null);
                                        // Focus previous block
                                        setTimeout(() => {
                                          if (targetBlock && inputRefs.current[targetBlock.id]) {
                                            inputRefs.current[targetBlock.id].focus();
                                          }
                                        }, 0);
                                      }} className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded transition-colors ${isDarkMode ? 'hover:bg-red-700 text-red-300' : 'hover:bg-red-100 text-red-700'}`}>
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
                              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-200 ${isDarkMode ? 'bg-purple-900/20 border-purple-800/30' : 'bg-purple-100/50 border-purple-300/50'}`}>
                                <div className={`p-1 rounded ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-200/60'}`}>
                                  <Sparkles className="w-4 h-4 text-purple-400" />
                                </div>
                                <input
                                  type="text"
                                  value={aiQuery}
                                  onChange={(e) => setAiQuery(e.target.value)}
                                  onKeyDown={handleAiQuerySubmit}
                                  placeholder="Ask me anything about this meeting... (Press Enter)"
                                  className={`flex-1 outline-none bg-transparent text-sm font-medium ${isDarkMode ? 'text-purple-200 placeholder-purple-400' : 'text-purple-800 placeholder-purple-500'}`}
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    setAiInputBlock(null);
                                    setAiQuery('');
                                  }}
                                  className={`p-1 rounded-full transition-colors text-purple-400 hover:text-purple-300 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
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

        {/* Mobile Bottom Action Bar */}
        {isOwner && (
          <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-20 border-t ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="max-w-6xl mx-auto px-3 py-3">
              <div className="flex gap-3 justify-end">
                {!isNewMeeting && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white flex-1"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Saving...' : (isNewMeeting ? 'Create Meeting' : 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingEditorPage;