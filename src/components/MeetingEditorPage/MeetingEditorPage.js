import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, Clock, Users, Plus, X, CheckCircle, Circle, Video, Sparkles, GripVertical, Type, Hash, List, Quote, Code, Image, Trash2, Copy, ArrowUp, ArrowDown, ArrowRight, CheckSquare, Table, Calendar as CalendarIcon, Link2 as Link, Minus as Divider, AlertCircle, Star, Tag, MapPin, Phone, Mail, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, ListOrdered, FileText, Bookmark, Lightbulb, Info, AlertTriangle, Zap, Heart, Smile, Eye, Lock, Globe, Download, Upload, Search, Filter, Settings, MoreHorizontal } from 'lucide-react';
import { getMeetingById, createMeeting, updateMeeting, addMeetingActionItem, getUsers } from '../../services/api';

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
          const meetingData = await getMeetingById(meetingId);
          setMeeting({
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
            status: meetingData.status || 'scheduled',
            createdAt: meetingData.createdAt
          });
          
          // Load blocks structure if available
          if (meetingData.blocks && meetingData.blocks.length > 0) {
            setBlocks(meetingData.blocks);
          } else if (meetingData.notes) {
            const noteLines = meetingData.notes.split('\n').filter(line => line.trim());
            if (noteLines.length > 0) {
              const noteBlocks = noteLines.map((line, idx) => ({
                id: `block-${idx + 1}`,
                type: 'text',
                content: line,
                style: {}
              }));
              setBlocks(noteBlocks);
            }
          }
          
          // Load table data if available
          if (meetingData.tableData) {
            setTableData(meetingData.tableData);
          }
        } catch (error) {
          console.error('Error loading meeting:', error);
          // Fallback: try to load from localStorage for offline support
          const savedMeeting = localStorage.getItem(`meeting-${meetingId}`);
          if (savedMeeting) {
            const meetingData = JSON.parse(savedMeeting);
            setMeeting(meetingData);
            if (meetingData.blocks) {
              setBlocks(meetingData.blocks);
            }
            if (meetingData.tableData) {
              setTableData(meetingData.tableData);
            }
          }
        }
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
    if (!meeting.title.trim()) return;
    setIsSaving(true);
    try {
      const notesContent = blocks.map(block => block.content).join('\n');
      const meetingData = {
        ...meeting,
        notes: notesContent,
        blocks: blocks,
        tableData: tableData,
        date: meeting.date ? new Date(meeting.date).toISOString() : new Date().toISOString(),
        createdAt: isNewMeeting ? new Date().toISOString() : meeting.createdAt,
        updatedAt: new Date().toISOString()
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
        <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800/50 group relative">
          <div className="flex items-center justify-between p-2 bg-gray-700 border-b border-gray-600">
            <div className="flex items-center gap-2">
              <button onClick={addRow} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">
                + Row
              </button>
              <button onClick={addColumn} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">
                + Column
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={deleteRow} className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded">
                - Row
              </button>
              <button onClick={deleteColumn} className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded">
                - Column
              </button>
            </div>
          </div>
          <table className="w-full">
            <tbody>
              {table.data.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-700' : 'hover:bg-gray-800/30'}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border-r border-gray-600 last:border-r-0">
                      <textarea
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        className={`w-full px-3 py-2 bg-transparent text-white text-sm resize-none focus:outline-none min-h-[40px] ${
                          rowIndex === 0 ? 'font-medium' : ''
                        }`}
                        placeholder={rowIndex === 0 ? `Header ${colIndex + 1}` : 'Cell data'}
                        rows={1}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
          placeholder={index === 0 ? "Start typing your meeting notes... " : "Continue typing... (Try markdown shortcuts)"}
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
                  <span className="text-sm text-gray-400">Created 9/28/2025</span>
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