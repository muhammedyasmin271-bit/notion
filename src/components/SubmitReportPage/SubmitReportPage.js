import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, X, Bug, Lightbulb, Shield, Zap, MessageSquare, CheckCircle, Upload, FileText, Plus, Sparkles, GripVertical, Type, Hash, List, Quote, Code, Trash2, Copy, ArrowUp, ArrowDown, ArrowRight, CheckSquare, Table, Minus, AlertCircle, Star, Tag, MapPin, Mail, ListOrdered, Calendar, Clock, Target, BarChart3, Info, AlertTriangle, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Palette, Link, Image, Video, FileIcon, Bookmark, Flag, Users, Settings, Eye, EyeOff, Lock, Unlock, Share2, ChevronDown } from 'lucide-react';

// Share Report Component
const ShareReportSection = ({ reportData, selectedUsers, setSelectedUsers }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const apiService = (await import('../../services/api')).default;
        const response = await apiService.getUsers();
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Filter out current user and only show active users
        const teamMembers = response.users
          .filter(user => user._id !== currentUser.id && user.isActive)
          .map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }));
        
        setUsers(teamMembers);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setUsers([]);
      }
    };
    
    fetchTeamMembers();
  }, []);

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsSharing(true);
    try {
      const token = localStorage.getItem('token');
      // Get current report ID
      const reportId = new URLSearchParams(window.location.search).get('edit') || 'new';
      
      const response = await fetch(`http://localhost:9000/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          userIds: selectedUsers
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to share report');
      }
      
      setShowDropdown(false);
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share report. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const getSelectedUserNames = () => {
    return selectedUsers.map(id => users.find(u => u._id === id)?.name).filter(Boolean);
  };

  return (
    <div className="space-y-4">
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {getSelectedUserNames().map(name => (
            <span key={name} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full flex items-center gap-2">
              {name}
              <button
                type="button"
                onClick={() => {
                  const userId = users.find(u => u.name === name)?._id;
                  if (userId) {
                    setSelectedUsers(prev => prev.filter(id => id !== userId));
                  }
                }}
                className="hover:bg-blue-700 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium"
        >
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <span>Select team members to share with</span>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
            <div className="p-3 border-b border-gray-700">
              <div className="text-sm font-medium text-gray-300">Team Members</div>
              <div className="text-xs text-gray-400 mt-1">Select who to share this report with</div>
            </div>
            <div className="p-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {users.map(user => {
                const isSelected = selectedUsers.includes(user._id);
                return (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => {
                      setSelectedUsers(prev => 
                        isSelected 
                          ? prev.filter(id => id !== user._id)
                          : [...prev, user._id]
                      );
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-600/20 border border-blue-500/30' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                      isSelected 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}>
                      {isSelected ? '✓' : user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email} • {user.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {selectedUsers.length > 0 && (
        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-200 font-medium"
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {isSharing ? 'Sharing...' : `Share with ${selectedUsers.length} member(s)`}
        </button>
      )}
    </div>
  );
};

const SubmitReportPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [report, setReport] = useState({
    type: 'bug',
    priority: 'medium',
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    environment: '',
    email: JSON.parse(localStorage.getItem('user') || '{}').email || '',
    phone: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'text', content: '', style: {} }]);
  const [tableData, setTableData] = useState({});
  const [showBlockMenu, setShowBlockMenu] = useState(null);
  const [showLineMenu, setShowLineMenu] = useState(null);
  const [aiInputBlock, setAiInputBlock] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const inputRefs = useRef({});

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      const savedReports = JSON.parse(localStorage.getItem('submittedReports') || '[]');
      const reportToEdit = savedReports.find(r => r.id === editId);
      if (reportToEdit) {
        setIsEditMode(true);
        setReport(reportToEdit);
        setBlocks(reportToEdit.blocks || [{ id: 'block-1', type: 'text', content: '', style: {} }]);
        setTableData(reportToEdit.tableData || {});
        setAttachments(reportToEdit.attachments || []);
        // Load shared users from localStorage
        const savedSharedUsers = localStorage.getItem(`sharedUsers_${editId}`);
        if (savedSharedUsers) {
          setSelectedUsers(JSON.parse(savedSharedUsers));
        } else {
          setSelectedUsers(reportToEdit.sharedWith || []);
        }
      }
    }
  }, [searchParams]);

  const reportTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-400' },
    { value: 'performance', label: 'Performance Issue', icon: Zap, color: 'text-orange-400' },
    { value: 'security', label: 'Security Concern', icon: Shield, color: 'text-purple-400' },
    { value: 'feedback', label: 'General Feedback', icon: MessageSquare, color: 'text-blue-400' }
  ];

  const priorities = [
    { value: 'critical', label: 'Critical', color: 'bg-red-600' },
    { value: 'high', label: 'High', color: 'bg-orange-600' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-600' },
    { value: 'low', label: 'Low', color: 'bg-green-600' }
  ];

  const templates = {
    bug: {
      title: 'Bug: [Brief description]',
      description: 'Describe the bug you encountered...',
      stepsToReproduce: '1. Go to...\n2. Click on...\n3. See error',
      expectedBehavior: 'What you expected to happen...',
      actualBehavior: 'What actually happened...'
    },
    feature: {
      title: 'Feature Request: [Feature name]',
      description: 'Describe the feature you would like to see...',
      stepsToReproduce: '',
      expectedBehavior: 'How this feature would work...',
      actualBehavior: ''
    },
    performance: {
      title: 'Performance Issue: [Area affected]',
      description: 'Describe the performance problem...',
      stepsToReproduce: '1. Navigate to...\n2. Perform action...\n3. Notice slowness',
      expectedBehavior: 'Expected response time...',
      actualBehavior: 'Actual response time...'
    }
  };

  const handleTypeChange = (type) => {
    const template = templates[type];
    if (template) {
      setReport(prev => ({
        ...prev,
        type,
        ...template
      }));
    } else {
      setReport(prev => ({ ...prev, type }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
      if (e.key === 'Enter' && !e.shiftKey) {
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
      const baseClass = "w-full px-3 py-2 bg-transparent text-white placeholder-gray-400 focus:outline-none border-none leading-tight";
      const styleClass = `${block.style?.bold ? 'font-bold ' : ''
        }${block.style?.italic ? 'italic ' : ''
        }${block.style?.underline ? 'underline ' : ''
        }${block.style?.strikethrough ? 'line-through ' : ''
        }${block.style?.align === 'center' ? 'text-center ' :
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
            <div className={`border rounded-lg overflow-hidden shadow-sm bg-gray-800 border-gray-700`}>
              <table className="border-collapse w-full table-auto">
                <tbody>
                  {table.data.map((row, rowIndex) => {
                    const rowHeight = table.cellHeights?.[rowIndex] || {};
                    return (
                      <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-700' : 'hover:bg-gray-700/50'}>
                        {row.map((cell, colIndex) => {
                          const savedHeight = rowHeight[colIndex] || Math.max(32, cell.split('\n').length * 20 + 12);
                          return (
                            <td key={`${rowIndex}-${colIndex}`} className={`border-r border-b p-0 align-top border-gray-600`}>
                              <textarea
                                value={cell}
                                onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                placeholder={rowIndex === 0 ? `Column ${colIndex + 1}` : ''}
                                rows={Math.max(1, cell.split('\n').length)}
                                className={`w-full h-full min-h-[32px] border-none outline-none bg-transparent text-sm resize-none overflow-hidden p-2 ${rowIndex === 0 ? 'font-semibold text-gray-200' : 'text-gray-300'
                                  } focus:bg-blue-900/20`}
                                style={{
                                  height: savedHeight + 'px',
                                  minHeight: '32px',
                                  lineHeight: '1.4'
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
              <button onClick={addColumn} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white`} title="Add column">
                <Plus className="w-3 h-3" />
              </button>
              {table.cols > 1 && (
                <button onClick={deleteColumn} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all bg-red-600 hover:bg-red-700 text-white`} title="Remove column">
                  <Minus className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Row controls - Bottom */}
            <div className="absolute left-1/2 -bottom-6 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={addRow} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white`} title="Add row">
                <Plus className="w-3 h-3" />
              </button>
              {table.rows > 1 && (
                <button onClick={deleteRow} className={`w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all bg-red-600 hover:bg-red-700 text-white`} title="Remove row">
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
            placeholder="Highlighted text..."
            className={`w-full bg-transparent ${highlight.text} placeholder-gray-400 focus:outline-none font-medium`}
          />
        </div>
      );
    }

    if (block.type === 'link') {
      return (
        <div className="flex items-center gap-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
          <Link className="w-4 h-4 text-blue-400" />
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Link text..."
            className="flex-1 bg-transparent text-blue-300 placeholder-gray-400 focus:outline-none"
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
            className="flex-1 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none text-sm"
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
        <div className="p-3 bg-gray-800/30 border border-gray-600 rounded">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <input
              ref={(el) => inputRefs.current[block.id] = el}
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Progress description..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            />
            <span className="text-sm text-gray-400">{block.progress || 50}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2">
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

    if (block.type === 'mention') {
      return (
        <div className="flex items-center gap-2 p-2 bg-cyan-900/20 border border-cyan-500/30 rounded">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400">@</span>
          <input
            ref={(el) => inputRefs.current[block.id] = el}
            type="text"
            value={block.content}
            onChange={(e) => updateBlockContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="username or email..."
            className="flex-1 bg-transparent text-cyan-300 placeholder-gray-400 focus:outline-none"
          />
        </div>
      );
    }

    if (block.type === 'hidden') {
      return (
        <div className={`p-3 border rounded ${block.visible ? 'bg-gray-800/30 border-gray-600' : 'bg-gray-900/50 border-gray-700 opacity-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                const newBlocks = [...blocks];
                newBlocks[index].visible = !block.visible;
                setBlocks(newBlocks);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <span className="text-xs text-gray-500">{block.visible ? 'Visible' : 'Hidden'}</span>
          </div>
          {block.visible && (
            <input
              ref={(el) => inputRefs.current[block.id] = el}
              type="text"
              value={block.content}
              onChange={(e) => updateBlockContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hidden content..."
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
            />
          )}
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
          placeholder={index === 0 ? "Start typing your report... (Try markdown shortcuts)" : "Continue typing..."}
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
        
        // Import the AI chat function
        const { aiChat } = await import('../../services/api');
        
        // Call the AI API
        const response = await aiChat([
          { role: 'user', content: aiQuery }
        ]);
        
        const content = response.reply?.content || 'AI service is currently unavailable.';
        
        // Update the current block with AI response instead of creating new blocks
        const updatedBlocks = [...blocks];
        updatedBlocks[currentBlockIndex].content = content;
        updatedBlocks[currentBlockIndex].type = 'text';
        setBlocks(updatedBlocks);

        setAiInputBlock(null);
        setAiQuery('');
      } catch (error) {
        console.error('AI assist failed:', error);
        // Fallback response in the same block
        const currentBlockIndex = blocks.findIndex(b => b.id === aiInputBlock);
        const fallbackContent = 'AI service is currently unavailable. Please check your configuration.';
        
        const updatedBlocks = [...blocks];
        updatedBlocks[currentBlockIndex].content = fallbackContent;
        updatedBlocks[currentBlockIndex].type = 'text';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      // Convert blocks to description text
      const description = blocks.map(block => {
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

      const token = localStorage.getItem('token');
      const editId = searchParams.get('edit');
      
      const reportData = {
        reportId: editId && editId !== 'new' ? editId : null,
        title: report.title,
        description,
        blocks,
        tableData,
        attachments: attachments.map(file => ({ name: file.name, size: file.size })),
        sharedWith: selectedUsers
      };
      
      const response = await fetch('http://localhost:9000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(reportData)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save report');
      }
      
      navigate('/reports');
    } catch (error) {
      alert(isEditMode ? 'Failed to update report. Please try again.' : 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <button
            onClick={() => navigate('/')}
            className="p-3 rounded-xl hover:bg-gray-800/50 transition-all duration-200 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{isEditMode ? 'Edit Report' : 'Submit Report'}</h1>
            <p className="text-gray-400 mt-2 text-lg">{isEditMode ? 'View and edit your report content' : 'Help us improve by reporting issues or suggesting features'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Templates"
              >
                <FileText className="w-4 h-4" />
                Templates
              </button>
                {showTemplateDropdown && (
                  <div className="absolute right-0 top-12 w-96 max-h-96 overflow-hidden bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-gray-700">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <FileText className="w-4 h-4" />
                    Professional Templates
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Choose a template to get started quickly
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  <div className="p-2 space-y-1">
                    <div className="text-xs text-gray-400 px-2 py-1 font-medium">BUSINESS REPORTS</div>
                    <button type="button" onClick={() => { if (!report.title) setReport(prev => ({ ...prev, title: 'Quarterly Business Review - Q4 2024' })); const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: 'Executive Summary', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'This quarterly review covers our performance metrics, key achievements, and strategic initiatives for Q4 2024.', style: {} }, { id: `block-${Date.now()}-3`, type: 'heading2', content: 'Key Performance Indicators', style: {} }, { id: `block-${Date.now()}-4`, type: 'bullet', content: '• Revenue: $2.4M (12% increase from Q3)', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Customer Acquisition: 450 new customers (28% growth)', style: {} }, { id: `block-${Date.now()}-6`, type: 'bullet', content: '• Customer Satisfaction: 4.8/5.0 rating', style: {} }, { id: `block-${Date.now()}-7`, type: 'heading2', content: 'Major Achievements', style: {} }, { id: `block-${Date.now()}-8`, type: 'numbered', content: '1. Successfully launched new product line', style: {} }, { id: `block-${Date.now()}-9`, type: 'numbered', content: '2. Expanded to European markets', style: {} }, { id: `block-${Date.now()}-10`, type: 'numbered', content: '3. Achieved SOC 2 compliance certification', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(false); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <BarChart3 className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Quarterly Business Review</div>
                        <div className="text-xs text-gray-400 mt-0.5">Comprehensive quarterly performance analysis with KPIs and achievements</div>
                      </div>
                    </button>
                    <button type="button" onClick={() => { if (!report.title) setReport(prev => ({ ...prev, title: 'Project Status Report - [Project Name]' })); const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: 'Project Overview', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Project Name: [Enter project name]', style: {} }, { id: `block-${Date.now()}-3`, type: 'text', content: 'Project Manager: [Enter name]', style: {} }, { id: `block-${Date.now()}-4`, type: 'text', content: 'Timeline: [Start date] - [End date]', style: {} }, { id: `block-${Date.now()}-5`, type: 'heading2', content: 'Current Status', style: {} }, { id: `block-${Date.now()}-6`, type: 'bullet', content: '• Overall Progress: 75% complete', style: {} }, { id: `block-${Date.now()}-7`, type: 'bullet', content: '• Budget Utilization: 68% of allocated budget', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• Timeline Status: On track', style: {} }, { id: `block-${Date.now()}-9`, type: 'heading2', content: 'Key Milestones Completed', style: {} }, { id: `block-${Date.now()}-10`, type: 'todo', content: '☑ Requirements gathering and analysis', style: {} }, { id: `block-${Date.now()}-11`, type: 'todo', content: '☑ System design and architecture', style: {} }, { id: `block-${Date.now()}-12`, type: 'todo', content: '☑ Development phase 1', style: {} }, { id: `block-${Date.now()}-13`, type: 'todo', content: '☐ User acceptance testing', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(false); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <Target className="w-4 h-4 text-green-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Project Status Report</div>
                        <div className="text-xs text-gray-400 mt-0.5">Detailed project progress with milestones and budget tracking</div>
                      </div>
                    </button>
                    <button type="button" onClick={() => { if (!report.title) setReport(prev => ({ ...prev, title: 'Monthly Financial Report - [Month Year]' })); const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: 'Financial Summary', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Reporting Period: [Month Year]', style: {} }, { id: `block-${Date.now()}-3`, type: 'text', content: 'Prepared by: Finance Department', style: {} }, { id: `block-${Date.now()}-4`, type: 'heading2', content: 'Revenue Analysis', style: {} }, { id: `block-${Date.now()}-5`, type: 'bullet', content: '• Total Revenue: $[Amount]', style: {} }, { id: `block-${Date.now()}-6`, type: 'bullet', content: '• Month-over-Month Growth: [%]', style: {} }, { id: `block-${Date.now()}-7`, type: 'bullet', content: '• Year-over-Year Growth: [%]', style: {} }, { id: `block-${Date.now()}-8`, type: 'heading2', content: 'Expense Breakdown', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Operating Expenses: $[Amount]', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Marketing Expenses: $[Amount]', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• Personnel Costs: $[Amount]', style: {} }, { id: `block-${Date.now()}-12`, type: 'heading2', content: 'Key Financial Metrics', style: {} }, { id: `block-${Date.now()}-13`, type: 'bullet', content: '• Gross Margin: [%]', style: {} }, { id: `block-${Date.now()}-14`, type: 'bullet', content: '• Net Profit Margin: [%]', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(false); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <BarChart3 className="w-4 h-4 text-yellow-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Monthly Financial Report</div>
                        <div className="text-xs text-gray-400 mt-0.5">Complete financial analysis with revenue, expenses, and key metrics</div>
                      </div>
                    </button>
                    
                    <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-3">INCIDENT REPORTS</div>
                    <button type="button" onClick={() => { if (!report.title) setReport(prev => ({ ...prev, title: 'Security Incident Report - [Incident ID]' })); const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: 'Incident Details', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Incident ID: [Auto-generated ID]', style: {} }, { id: `block-${Date.now()}-3`, type: 'text', content: 'Date/Time: [Incident timestamp]', style: {} }, { id: `block-${Date.now()}-4`, type: 'text', content: 'Severity Level: [Critical/High/Medium/Low]', style: {} }, { id: `block-${Date.now()}-5`, type: 'text', content: 'Reported by: [Name and role]', style: {} }, { id: `block-${Date.now()}-6`, type: 'heading2', content: 'Incident Description', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: 'Provide a detailed description of what occurred, including any security breaches, system compromises, or data exposure.', style: {} }, { id: `block-${Date.now()}-8`, type: 'heading2', content: 'Impact Assessment', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Systems Affected: [List affected systems]', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Data Compromised: [Yes/No - Details]', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• Users Impacted: [Number and type of users]', style: {} }, { id: `block-${Date.now()}-12`, type: 'heading2', content: 'Immediate Actions Taken', style: {} }, { id: `block-${Date.now()}-13`, type: 'numbered', content: '1. [First response action]', style: {} }, { id: `block-${Date.now()}-14`, type: 'numbered', content: '2. [Second response action]', style: {} }, { id: `block-${Date.now()}-15`, type: 'numbered', content: '3. [Third response action]', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(false); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <Shield className="w-4 h-4 text-red-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Security Incident Report</div>
                        <div className="text-xs text-gray-400 mt-0.5">Comprehensive security incident documentation with impact assessment</div>
                      </div>
                    </button>
                    <button type="button" onClick={() => { if (!report.title) setReport(prev => ({ ...prev, title: 'System Outage Report - [Date]' })); const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: 'Outage Summary', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Outage Start Time: [Timestamp]', style: {} }, { id: `block-${Date.now()}-3`, type: 'text', content: 'Outage End Time: [Timestamp]', style: {} }, { id: `block-${Date.now()}-4`, type: 'text', content: 'Total Duration: [Hours/Minutes]', style: {} }, { id: `block-${Date.now()}-5`, type: 'text', content: 'Affected Services: [List of services]', style: {} }, { id: `block-${Date.now()}-6`, type: 'heading2', content: 'Root Cause Analysis', style: {} }, { id: `block-${Date.now()}-7`, type: 'text', content: 'Primary Cause: [Detailed explanation of what caused the outage]', style: {} }, { id: `block-${Date.now()}-8`, type: 'text', content: 'Contributing Factors: [Any secondary factors that contributed]', style: {} }, { id: `block-${Date.now()}-9`, type: 'heading2', content: 'Impact Assessment', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Users Affected: [Number of users impacted]', style: {} }, { id: `block-${Date.now()}-11`, type: 'bullet', content: '• Revenue Impact: $[Estimated loss]', style: {} }, { id: `block-${Date.now()}-12`, type: 'bullet', content: '• SLA Breach: [Yes/No - Details]', style: {} }, { id: `block-${Date.now()}-13`, type: 'heading2', content: 'Resolution Steps', style: {} }, { id: `block-${Date.now()}-14`, type: 'numbered', content: '1. [First resolution step taken]', style: {} }, { id: `block-${Date.now()}-15`, type: 'numbered', content: '2. [Second resolution step taken]', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(false); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">System Outage Report</div>
                        <div className="text-xs text-gray-400 mt-0.5">Detailed outage analysis with root cause and resolution steps</div>
                      </div>
                    </button>
                    
                    <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-3">PERFORMANCE REPORTS</div>
                    <button type="button" onClick={() => { if (!report.title) setReport(prev => ({ ...prev, title: 'Team Performance Review - [Team Name]' })); const templateBlocks = [{ id: `block-${Date.now()}-1`, type: 'heading2', content: 'Team Overview', style: {} }, { id: `block-${Date.now()}-2`, type: 'text', content: 'Team Name: [Enter team name]', style: {} }, { id: `block-${Date.now()}-3`, type: 'text', content: 'Review Period: [Start date] - [End date]', style: {} }, { id: `block-${Date.now()}-4`, type: 'text', content: 'Team Lead: [Manager name]', style: {} }, { id: `block-${Date.now()}-5`, type: 'text', content: 'Team Size: [Number of members]', style: {} }, { id: `block-${Date.now()}-6`, type: 'heading2', content: 'Key Performance Metrics', style: {} }, { id: `block-${Date.now()}-7`, type: 'bullet', content: '• Project Completion Rate: [%]', style: {} }, { id: `block-${Date.now()}-8`, type: 'bullet', content: '• Quality Score: [Rating/10]', style: {} }, { id: `block-${Date.now()}-9`, type: 'bullet', content: '• Customer Satisfaction: [Rating/5]', style: {} }, { id: `block-${Date.now()}-10`, type: 'bullet', content: '• Team Productivity: [Metric]', style: {} }, { id: `block-${Date.now()}-11`, type: 'heading2', content: 'Major Accomplishments', style: {} }, { id: `block-${Date.now()}-12`, type: 'numbered', content: '1. [First major accomplishment]', style: {} }, { id: `block-${Date.now()}-13`, type: 'numbered', content: '2. [Second major accomplishment]', style: {} }, { id: `block-${Date.now()}-14`, type: 'numbered', content: '3. [Third major accomplishment]', style: {} }, { id: `block-${Date.now()}-15`, type: 'heading2', content: 'Areas for Improvement', style: {} }, { id: `block-${Date.now()}-16`, type: 'bullet', content: '• [Area needing improvement]', style: {} }, { id: `block-${Date.now()}-17`, type: 'bullet', content: '• [Another area for development]', style: {} }]; setBlocks([...blocks, ...templateBlocks]); setShowTemplateDropdown(false); }} className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                      <Users className="w-4 h-4 text-purple-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Team Performance Review</div>
                        <div className="text-xs text-gray-400 mt-0.5">Comprehensive team evaluation with metrics and accomplishments</div>
                      </div>
                    </button>
                  </div>
                </div>
                    <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                      <div className="text-xs text-gray-400">
                        Templates will replace your current content
                      </div>
                    </div>
                  </div>
                )}
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                    const editId = searchParams.get('edit');
                    const savedReports = JSON.parse(localStorage.getItem('submittedReports') || '[]');
                    const updatedReports = savedReports.filter(r => r.id !== editId);
                    localStorage.setItem('submittedReports', JSON.stringify(updatedReports));
                    navigate('/reports');
                  }
                }}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="Delete Report"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">




          {/* Title and Description - Connected */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl">
            <div className="bg-gray-700/50 border border-gray-600 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 min-h-[800px]">
              <input
                type="text"
                value={report.title}
                onChange={(e) => setReport(prev => ({ ...prev, title: e.target.value }))}
                placeholder="TITLE"
                className="w-full px-4 py-4 bg-transparent border-none focus:outline-none text-3xl border-b border-gray-600 rounded-t-xl rounded-b-none"
                required
              />
              <div className="p-4">
                {blocks.map((block, index) => (
                  <div key={block.id} className={`flex items-start group relative mb-1 rounded px-2 py-1 ${aiInputBlock === block.id ? 'bg-purple-50/30 rounded-lg p-2' : ''} transition-all duration-200`}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                          className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
                          title="Add block"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {showBlockMenu === block.id && (
                          <div className="absolute left-0 top-8 w-72 max-h-96 overflow-hidden bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                            <div className="p-3 border-b border-gray-700">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <Plus className="w-4 h-4" />
                                Add Block
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Choose a block type to add content
                              </div>
                            </div>
                            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                              <div className="p-2 space-y-1">
                                {/* TEXT BLOCKS HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium">TEXT BLOCKS</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'text', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-700 rounded-lg text-gray-300 transition-colors">
                                  <Type className="w-4 h-4" /> Text
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks[index] = { ...block, type: 'heading1' }; setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Hash className="w-4 h-4" /> Heading 1
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks[index] = { ...block, type: 'heading2' }; setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Hash className="w-4 h-4" /> Heading 2
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks[index] = { ...block, type: 'heading3' }; setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Hash className="w-4 h-4" /> Heading 3
                                </button>

                                {/* LIST BLOCKS HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">LIST BLOCKS</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'bullet', content: '• ', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <List className="w-4 h-4" /> Bullet List
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'numbered', content: '1. ', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <ListOrdered className="w-4 h-4" /> Numbered List
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'todo', content: '☐ ', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <CheckSquare className="w-4 h-4" /> To-do List
                                </button>

                                {/* MEDIA & ADVANCED HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">MEDIA & ADVANCED</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'quote', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Quote className="w-4 h-4" /> Quote
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'divider', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Minus className="w-4 h-4" /> Divider
                                </button>
                                <button type="button" onClick={() => {
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

                                {/* FUNCTIONAL BLOCKS HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">FUNCTIONAL BLOCKS</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'date', content: new Date().toISOString().split('T')[0], style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Calendar className="w-4 h-4 text-blue-400" /> Date
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; const now = new Date(); const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'); newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'time', content: timeStr, style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Clock className="w-4 h-4 text-green-400" /> Time
                                </button>

                                {/* CALLOUT BLOCKS HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">CALLOUT BLOCKS</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'info', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Info className="w-4 h-4 text-blue-400" /> Info Callout
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'warning', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <AlertTriangle className="w-4 h-4 text-yellow-400" /> Warning Callout
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'error', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <AlertCircle className="w-4 h-4 text-red-400" /> Error Callout
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'success', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <CheckCircle className="w-4 h-4 text-green-400" /> Success Callout
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'callout', calloutType: 'tip', content: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Lightbulb className="w-4 h-4 text-purple-400" /> Tip Callout
                                </button>

                                {/* FORMATTING BLOCKS HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">FORMATTING & STYLE</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'highlight', content: '', highlightColor: 'yellow', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Palette className="w-4 h-4 text-yellow-400" /> Highlight Text
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'link', content: '', url: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Link className="w-4 h-4 text-blue-400" /> Link
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'bookmark', content: '', url: '', title: '', description: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Bookmark className="w-4 h-4 text-indigo-400" /> Bookmark
                                </button>



                                {/* ORGANIZATIONAL BLOCKS HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">ORGANIZATIONAL</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'tag', content: '', tagColor: 'blue', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Tag className="w-4 h-4 text-blue-400" /> Tag
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'flag', content: '', flagColor: 'red', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Flag className="w-4 h-4 text-red-400" /> Flag
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'mention', content: '', mentionType: 'user', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Users className="w-4 h-4 text-cyan-400" /> Mention
                                </button>

                                {/* ADVANCED BLOCKS HEADING */}
                                <div className="text-xs text-gray-400 px-2 py-1 font-medium mt-2">ADVANCED BLOCKS</div>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'progress', content: '', progress: 50, style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <BarChart3 className="w-4 h-4 text-orange-400" /> Progress Bar
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'location', content: '', address: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <MapPin className="w-4 h-4 text-pink-400" /> Location
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'email', content: '', emailAddress: '', style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <Mail className="w-4 h-4 text-teal-400" /> Email
                                </button>
                                <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'hidden', content: '', visible: false, style: {} }); setBlocks(newBlocks); setShowBlockMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <EyeOff className="w-4 h-4 text-gray-400" /> Hidden Block
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('GripVertical clicked for block:', block.id);
                            setShowLineMenu(showLineMenu === block.id ? null : block.id);
                          }}
                          className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
                          title="Line options"
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        {showLineMenu === block.id && (
                          <div className="absolute left-0 top-8 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                            <div className="p-2">
                              <button type="button" onClick={() => { const newBlocks = [...blocks]; newBlocks.splice(index + 1, 0, { id: `block-${Date.now()}`, type: 'text', content: '', style: {} }); setBlocks(newBlocks); setShowLineMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <Plus className="w-4 h-4" /> Add Line
                              </button>
                              {index > 0 && (
                                <button type="button" onClick={() => { const newBlocks = [...blocks];[newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]]; setBlocks(newBlocks); setShowLineMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <ArrowUp className="w-4 h-4" /> Move Up
                                </button>
                              )}
                              {index < blocks.length - 1 && (
                                <button type="button" onClick={() => { const newBlocks = [...blocks];[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]; setBlocks(newBlocks); setShowLineMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                  <ArrowDown className="w-4 h-4" /> Move Down
                                </button>
                              )}
                              <button type="button" onClick={() => { const newBlocks = [...blocks]; const duplicated = { ...block, id: `block-${Date.now()}` }; newBlocks.splice(index + 1, 0, duplicated); setBlocks(newBlocks); setShowLineMenu(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-gray-300">
                                <Copy className="w-4 h-4" /> Duplicate
                              </button>
                              {blocks.length > 1 && (
                                <button type="button" onClick={() => {
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
                                }} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700 rounded text-red-400">
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



          {/* Attachments */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl">
            <label className="block text-sm font-semibold mb-4 text-gray-300">Attachments</label>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-blue-500 transition-all duration-300 group">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.txt,.log"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center gap-3 cursor-pointer text-gray-400 hover:text-white transition-all duration-200"
              >
                <div className="p-4 rounded-full bg-gray-700/50 group-hover:bg-blue-500/20 transition-all duration-300">
                  <Upload className="w-8 h-8 group-hover:text-blue-400" />
                </div>
                <div className="text-center">
                  <div className="font-medium">Click to upload files</div>
                  <div className="text-sm text-gray-500 mt-1">Images, PDFs, logs (Max 10MB each)</div>
                </div>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="mt-6 space-y-3">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700/50 p-4 rounded-xl border border-gray-600 hover:bg-gray-700/70 transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        const url = URL.createObjectURL(file);
                        window.open(url, '_blank');
                      }}
                      className="flex items-center gap-3 flex-1 text-left hover:text-blue-300 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <FileText className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Share Report */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl">
            <h3 className="text-xl font-bold mb-6 text-gray-200">Share Report</h3>
            <ShareReportSection reportData={report} selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? (isEditMode ? 'Updating Report...' : 'Submitting Report...') : (isEditMode ? 'Update Report' : 'Submit Management Report')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReportPage;