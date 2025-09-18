import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  CheckCircle,
  Calendar,
  Tag,
  ClipboardCheck,
  AlertCircle,
  ArrowLeft,
  Save,
  Plus,
  GripVertical,
  Search,
  Sparkles,
  MoreHorizontal,
  Pin,
  Eye,
  Share2,
  Star,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Zap,
  Lightbulb,
  HelpCircle,
  Send,
  X,
  Hash,
  Type,
  List,
  CheckSquare,
  Quote,
  Minus,
  Code,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Maximize,
  Minimize,
  Target,
  BarChart3
} from "lucide-react";
import { useAppContext } from '../../context/AppContext';
import ProjectsPage from '../ProjectsPage/ProjectsPage';
import { useTheme } from '../../context/ThemeContext';
import { aiAssist } from '../../services/api';
import '../../styles/animations.css';


const ProjectDetailPage = ({ isNewProject = false }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'text', content: '' }]);
  const [title, setTitle] = useState('');
  const [showFormattingMenu, setShowFormattingMenu] = useState(null);
  const [formattingMenuPosition, setFormattingMenuPosition] = useState({ x: 0, y: 0 });
  const [showBlockMenu, setShowBlockMenu] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [aiInputBlock, setAiInputBlock] = useState(null);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [aiPopupQuery, setAiPopupQuery] = useState('');

  const formattingMenuRef = useRef(null);
  const userPickerRef = useRef(null);
  const blockMenuRef = useRef(null);
  const blockRefs = useRef({});
  const titleInputRef = useRef(null);


  const blockOptions = [
    { id: 'text', label: 'Text', icon: <Type className="w-5 h-5" />, prefix: '' },
    { id: 'heading1', label: 'Heading 1', icon: <Hash className="w-5 h-5" />, prefix: '# ' },
    { id: 'heading2', label: 'Heading 2', icon: <Hash className="w-5 h-5" />, prefix: '## ' },
    { id: 'heading3', label: 'Heading 3', icon: <Hash className="w-5 h-5" />, prefix: '### ' },
    { id: 'todo', label: 'To-do list', icon: <CheckSquare className="w-5 h-5" />, prefix: '- [ ] ' },
    { id: 'bullet', label: 'Bulleted list', icon: <List className="w-5 h-5" />, prefix: '• ' },
    { id: 'number', label: 'Numbered list', icon: <List className="w-5 h-5" />, prefix: '1. ' },
    { id: 'toggle', label: 'Toggle list', icon: <ChevronDown className="w-5 h-5" />, prefix: '▶ ' },
    { id: 'quote', label: 'Quote', icon: <Quote className="w-5 h-5" />, prefix: '> ' },
    { id: 'callout', label: 'Callout', icon: <MessageSquare className="w-5 h-5" />, prefix: '💡 ' },
    { id: 'divider', label: 'Divider', icon: <Minus className="w-5 h-5" />, prefix: '---' },
    { id: 'code', label: 'Code', icon: <Code className="w-5 h-5" />, prefix: '```\n' },
    { id: 'table', label: 'Table', icon: <Hash className="w-5 h-5" />, prefix: '| Column 1 | Column 2 |\n|----------|----------|\n|          |          |' },
    { id: 'columns', label: 'Columns', icon: <GripVertical className="w-5 h-5" />, prefix: '' },
    { id: 'image', label: 'Image', icon: <FileText className="w-5 h-5" />, prefix: '![Image](url)' },
    { id: 'video', label: 'Video', icon: <FileText className="w-5 h-5" />, prefix: '[Video](url)' },
    { id: 'bookmark', label: 'Bookmark', icon: <Star className="w-5 h-5" />, prefix: '[Bookmark](url)' },
    { id: 'embed', label: 'Embed', icon: <Share2 className="w-5 h-5" />, prefix: '<iframe src=""></iframe>' },
    { id: 'math', label: 'Math', icon: <Hash className="w-5 h-5" />, prefix: '$$\n\n$$' },
    { id: 'template', label: 'Template', icon: <Copy className="w-5 h-5" />, prefix: '' }
  ];

  useEffect(() => {
    if (isNewProject || projectId === 'new') {
      const newProject = {
        id: 'new',
        name: '',
        status: 'Not started',
        priority: 'Medium',
        isFavorite: false,
        forPerson: user?.name || '',
        notes: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
        ownerName: user?.name || '',
        createdAt: new Date().toISOString()
      };
      setProject(newProject);
      setTitle('');
      setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
      setLoading(false);
    } else if (projectId) {
      fetchProject();
    }
  }, [projectId, isNewProject, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formattingMenuRef.current && !formattingMenuRef.current.contains(event.target)) {
        setShowFormattingMenu(null);
      }
      if (blockMenuRef.current && !blockMenuRef.current.contains(event.target)) {
        setShowBlockMenu(null);
      }
      if (userPickerRef.current && !userPickerRef.current.contains(event.target)) {
        setShowUserPicker(false);
      }

    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return 'No due date';
    const today = new Date();
    const dueDate = new Date(endDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAIQuery = (e) => {
    setAiQuery(e.target.value);
    if (e.target.value.length > 0) {
      setShowAIAssistant(true);
    }
  };

  const executeAIAction = async (action) => {
    try {
      setAiError('');
      setIsGenerating(true);
      const mode = action?.type || 'summarize';
      // Convert current blocks to plain text prompt
      const prompt = blocks.map(block => {
        switch (block.type) {
          case 'h1': return `# ${block.content}`;
          case 'h2': return `## ${block.content}`;
          case 'h3': return `### ${block.content}`;
          case 'todo': return `- [ ] ${block.content}`;
          case 'bullet': return `• ${block.content}`;
          case 'number': return `1. ${block.content}`;
          case 'quote': return `> ${block.content}`;
          case 'divider': return '---';
          default: return block.content;
        }
      }).join('\n');

      const { content } = await aiAssist(prompt, mode);
      const lines = (content || '').split('\n');
      const toBlocks = lines.map((line, idx) => {
        const l = line.trim();
        if (l.startsWith('- [ ] ')) return { id: `block-${Date.now()}-${idx}`, type: 'todo', content: l.replace(/^- \[ \]\s*/, '') };
        if (l.startsWith('• ')) return { id: `block-${Date.now()}-${idx}`, type: 'bullet', content: l.replace(/^•\s*/, '') };
        if (l.startsWith('### ')) return { id: `block-${Date.now()}-${idx}`, type: 'h3', content: l.replace(/^###\s*/, '') };
        if (l.startsWith('## ')) return { id: `block-${Date.now()}-${idx}`, type: 'h2', content: l.replace(/^##\s*/, '') };
        if (l.startsWith('# ')) return { id: `block-${Date.now()}-${idx}`, type: 'h1', content: l.replace(/^#\s*/, '') };
        if (l.startsWith('> ')) return { id: `block-${Date.now()}-${idx}`, type: 'quote', content: l.replace(/^>\s*/, '') };
        if (l === '---') return { id: `block-${Date.now()}-${idx}`, type: 'divider', content: '' };
        return { id: `block-${Date.now()}-${idx}`, type: 'text', content: l };
      });
      if (toBlocks.length > 0) setBlocks(toBlocks);
    } catch (e) {
      console.error('AI assist failed:', e);
      setAiError('AI assistant failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setShowAIAssistant(false);
      setAiQuery('');
    }
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setTitle(data.name);
        // Convert notes to blocks if they exist
        if (data.notes) {
          const noteBlocks = data.notes.split('\n').map((line, index) => ({
            id: `block-${index + 1}`,
            type: getBlockTypeFromLine(line),
            content: getContentFromLine(line)
          }));
          setBlocks(noteBlocks.length > 0 ? noteBlocks : [{ id: 'block-1', type: 'text', content: '' }]);
        } else {
          setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBlockTypeFromLine = (line) => {
    if (/^\s*- \[ \]\s/.test(line)) return 'todo';
    if (/^\s*- \[x\]\s/i.test(line)) return 'todo';
    if (/^\s*(?:\d+)\.\s/.test(line)) return 'number';
    if (/^\s*(?:•|-|\*)\s/.test(line)) return 'bullet';
    if (/^\s*▶\s/.test(line)) return 'toggle';
    if (/^\s*###\s/.test(line)) return 'h3';
    if (/^\s*##\s/.test(line)) return 'h2';
    if (/^\s*#\s/.test(line)) return 'h1';
    if (/^\s*>\s/.test(line)) return 'quote';
    if (/^\s*💡\s/.test(line)) return 'callout';
    if (/^\|.*\|/.test(line)) return 'table';
    if (/^!\[.*\]\(.*\)/.test(line)) return 'image';
    if (/^\[Video\]\(.*\)/.test(line)) return 'video';
    if (/^\[Bookmark\]\(.*\)/.test(line)) return 'bookmark';
    if (/^<iframe/.test(line)) return 'embed';
    if (/^\$\$/.test(line)) return 'math';
    if (/^---/.test(line)) return 'divider';
    return 'text';
  };

  const getContentFromLine = (line) => {
    if (/^\s*- \[ \]\s/.test(line)) return line.replace(/^\s*- \[ \]\s/, '');
    if (/^\s*- \[x\]\s/i.test(line)) return line.replace(/^\s*- \[x\]\s/i, '');
    if (/^\s*(?:\d+)\.\s/.test(line)) return line.replace(/^\s*(?:\d+)\.\s/, '');
    if (/^\s*(?:•|-|\*)\s/.test(line)) return line.replace(/^\s*(?:•|-|\*)\s/, '');
    if (/^\s*▶\s/.test(line)) return line.replace(/^\s*▶\s/, '');
    if (/^\s*###\s/.test(line)) return line.replace(/^\s*###\s/, '');
    if (/^\s*##\s/.test(line)) return line.replace(/^\s*##\s/, '');
    if (/^\s*#\s/.test(line)) return line.replace(/^\s*#\s/, '');
    if (/^\s*>\s/.test(line)) return line.replace(/^\s*>\s/, '');
    if (/^\s*💡\s/.test(line)) return line.replace(/^\s*💡\s/, '');
    if (/^\|.*\|/.test(line)) return line;
    if (/^!\[.*\]\(.*\)/.test(line)) return line;
    if (/^\[Video\]\(.*\)/.test(line)) return line;
    if (/^\[Bookmark\]\(.*\)/.test(line)) return line;
    if (/^<iframe/.test(line)) return line;
    if (/^\$\$/.test(line)) return line;
    if (/^---/.test(line)) return '';
    return line;
  };

  const handleSave = async () => {
    if (!project || !title.trim()) return;
    setSaving(true);

    // Convert blocks back to notes string
    const notesContent = blocks.map(block => {
      switch (block.type) {
        case 'h1': return `# ${block.content}`;
        case 'h2': return `## ${block.content}`;
        case 'h3': return `### ${block.content}`;
        case 'todo': return `- [ ] ${block.content}`;
        case 'bullet': return `• ${block.content}`;
        case 'number': return `1. ${block.content}`;
        case 'toggle': return `▶ ${block.content}`;
        case 'quote': return `> ${block.content}`;
        case 'callout': return `💡 ${block.content}`;
        case 'table': return block.content;
        case 'image': return block.content;
        case 'video': return block.content;
        case 'bookmark': return block.content;
        case 'embed': return block.content;
        case 'math': return block.content;
        case 'columns': return block.content;
        case 'template': return block.content;
        case 'divider': return '---';
        default: return block.content;
      }
    }).join('\n');

    const projectData = {
      ...project,
      name: title,
      notes: notesContent
    };

    try {
      if (project.id === 'new') {
        const response = await fetch('http://localhost:5000/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify(projectData)
        });
        if (response.ok) {
          const newProject = await response.json();
          setProject(newProject);
        }
      } else {
        const response = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify(projectData)
        });
        if (response.ok) {
          const updatedProject = await response.json();
          setProject(updatedProject);
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateProject = (field, value) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users.filter(u => u.status === 'approved'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to localStorage users
      const loginUsers = JSON.parse(localStorage.getItem('loginUsers') || '[]');
      setAvailableUsers(loginUsers);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePickUser = async () => {
    if (!showUserPicker) {
      await fetchUsers();
    }
    setShowUserPicker(!showUserPicker);
  };

  const selectUser = (user) => {
    updateProject('forPerson', user.name || user.username);
    setShowUserPicker(false);
  };

  const handleAISubmit = async () => {
    if (aiPopupQuery.trim()) {
      try {
        setIsGenerating(true);
        const { content } = await aiAssist(aiPopupQuery, 'custom');
        const lines = (content || '').split('\n').filter(line => line.trim());
        const newBlocks = lines.map((line, idx) => ({
          id: `ai-popup-${Date.now()}-${idx}`,
          type: 'text',
          content: line.trim()
        }));
        if (newBlocks.length > 0) {
          setBlocks(prev => [...prev, ...newBlocks]);
        }
        setShowAIPopup(false);
        setAiPopupQuery('');
      } catch (e) {
        setAiError('AI assistant failed. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

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

    // Focus the new block after a short delay
    setTimeout(() => {
      if (blockRefs.current[newBlock.id]) {
        blockRefs.current[newBlock.id].focus();
      }
    }, 10);
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

  // Handle key down in block
  const handleBlockKeyDown = (id, e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const index = blocks.findIndex(block => block.id === id);
      addBlock(index);
    } else if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      deleteBlock(id);
    } else if (e.key === '/' || e.key === '+') {
      e.preventDefault();
      setActiveBlockId(id);
      // Position menu at the end of the current block for slash command
      if (e.key === '/') {
        const blockElement = blockRefs.current[id];
        if (blockElement) {
          const rect = blockElement.getBoundingClientRect();
          setFormattingMenuPosition({ x: rect.left, y: rect.bottom });
        }
        setShowFormattingMenu(id);
      }
    } else if (e.key === ' ' && e.target.value === '') {
      // Show AI input when space is pressed on empty line
      e.preventDefault();
      setAiInputBlock(id);
      setAiQuery('');
    } else if (e.key === 'Escape') {
      // Hide AI input on escape
      setAiInputBlock(null);
      setAiQuery('');
    }
  };

  // Handle click on plus button to show formatting menu
  const handlePlusButtonClick = (e, blockId) => {
    e.stopPropagation();
    setActiveBlockId(blockId);

    // Get the position of the clicked plus button
    const rect = e.target.getBoundingClientRect();
    setFormattingMenuPosition({ x: rect.left, y: rect.bottom });

    // Toggle the menu for this block
    setShowFormattingMenu(showFormattingMenu === blockId ? null : blockId);
  };

  // Handle key down in title
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  // Apply formatting to selected text
  const applyFormatting = (format) => {
    const block = blocks.find(b => b.id === activeBlockId);
    if (!block) return;

    // For simplicity, we'll just change the block type
    switch (format) {
      case 'text':
        changeBlockType(activeBlockId, 'text');
        break;
      case 'heading1':
        changeBlockType(activeBlockId, 'h1');
        break;
      case 'heading2':
        changeBlockType(activeBlockId, 'h2');
        break;
      case 'heading3':
        changeBlockType(activeBlockId, 'h3');
        break;
      case 'bullet':
        changeBlockType(activeBlockId, 'bullet');
        break;
      case 'number':
        changeBlockType(activeBlockId, 'number');
        break;
      case 'toggle':
        changeBlockType(activeBlockId, 'toggle');
        break;
      case 'todo':
        changeBlockType(activeBlockId, 'todo');
        break;
      case 'quote':
        changeBlockType(activeBlockId, 'quote');
        break;
      case 'callout':
        changeBlockType(activeBlockId, 'callout');
        break;
      case 'table':
        changeBlockType(activeBlockId, 'table');
        break;
      case 'columns':
        changeBlockType(activeBlockId, 'columns');
        break;
      case 'image':
        changeBlockType(activeBlockId, 'image');
        break;
      case 'video':
        changeBlockType(activeBlockId, 'video');
        break;
      case 'bookmark':
        changeBlockType(activeBlockId, 'bookmark');
        break;
      case 'embed':
        changeBlockType(activeBlockId, 'embed');
        break;
      case 'math':
        changeBlockType(activeBlockId, 'math');
        break;
      case 'template':
        changeBlockType(activeBlockId, 'template');
        break;
      case 'divider':
        addBlock(blocks.findIndex(b => b.id === activeBlockId), 'divider');
        break;
      case 'code':
        changeBlockType(activeBlockId, 'code');
        break;
      default:
        break;
    }

    // Close the formatting menu
    setShowFormattingMenu(null);
  };

  // Handle AI query submission
  const handleAiQuerySubmit = async (e) => {
    if (e.key === 'Enter' && aiQuery.trim()) {
      e.preventDefault();
      try {
        setAiError('');
        setIsGenerating(true);

        const currentBlockIndex = blocks.findIndex(b => b.id === aiInputBlock);
        const contextBlocks = blocks.slice(0, currentBlockIndex);

        const context = contextBlocks.map(block => {
          switch (block.type) {
            case 'h1': return `# ${block.content}`;
            case 'h2': return `## ${block.content}`;
            case 'h3': return `### ${block.content}`;
            case 'todo': return `- [ ] ${block.content}`;
            case 'bullet': return `• ${block.content}`;
            case 'number': return `1. ${block.content}`;
            case 'quote': return `> ${block.content}`;
            case 'divider': return '---';
            default: return block.content;
          }
        }).join('\n');

        const { content } = await aiAssist(`${context}\n\nUser request: ${aiQuery}`, 'custom');

        const lines = (content || '').split('\n').filter(line => line.trim());
        const newBlocks = lines.map((line, idx) => {
          const l = line.trim();
          if (l.startsWith('- [ ] ')) return { id: `ai-block-${Date.now()}-${idx}`, type: 'todo', content: l.replace(/^- \[ \]\s*/, '') };
          if (l.startsWith('• ')) return { id: `ai-block-${Date.now()}-${idx}`, type: 'bullet', content: l.replace(/^•\s*/, '') };
          if (l.startsWith('### ')) return { id: `ai-block-${Date.now()}-${idx}`, type: 'h3', content: l.replace(/^###\s*/, '') };
          if (l.startsWith('## ')) return { id: `ai-block-${Date.now()}-${idx}`, type: 'h2', content: l.replace(/^##\s*/, '') };
          if (l.startsWith('# ')) return { id: `ai-block-${Date.now()}-${idx}`, type: 'h1', content: l.replace(/^#\s*/, '') };
          if (l.startsWith('> ')) return { id: `ai-block-${Date.now()}-${idx}`, type: 'quote', content: l.replace(/^>\s*/, '') };
          if (l === '---') return { id: `ai-block-${Date.now()}-${idx}`, type: 'divider', content: '' };
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

  // Get placeholder text for block
  const getBlockPlaceholder = (type) => {
    switch (type) {
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      case 'bullet': return 'List item';
      case 'number': return 'List item';
      case 'toggle': return 'Toggle list';
      case 'todo': return 'To-do item';
      case 'quote': return 'Quote';
      case 'callout': return 'Callout';
      case 'table': return 'Table content';
      case 'columns': return 'Column content';
      case 'image': return 'Image URL or upload';
      case 'video': return 'Video URL';
      case 'bookmark': return 'Bookmark URL';
      case 'embed': return 'Embed code';
      case 'math': return 'Math equation';
      case 'template': return 'Template content';
      case 'code': return 'Code';
      default: return 'Type \'/\' for commands';
    }
  };

  // Render block based on type
  const renderBlock = (block, index) => {
    const commonProps = {
      ref: (el) => blockRefs.current[block.id] = el,
      key: block.id,
      className: "w-full outline-none resize-none border-none bg-transparent py-1 px-2 rounded text-gray-800",
      value: block.content,
      onChange: (e) => updateBlock(block.id, e.target.value),
      onKeyDown: (e) => handleBlockKeyDown(block.id, e),
      onFocus: () => setActiveBlockId(block.id),
      placeholder: getBlockPlaceholder(block.type)
    };

    switch (block.type) {
      case 'h1':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input
              {...commonProps}
              className={`${commonProps.className} text-4xl font-bold`}
            />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className="absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border bg-white border-gray-200 z-10"
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'h2':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input
              {...commonProps}
              className={`${commonProps.className} text-3xl font-bold`}
            />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className="absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border bg-white border-gray-200 z-10"
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'h3':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input
              {...commonProps}
              className={`${commonProps.className} text-2xl font-bold`}
            />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className="absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border bg-white border-gray-200 z-10"
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'bullet':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <span className="mr-2">•</span>
              <input {...commonProps} />
            </div>
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className="absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border bg-white border-gray-200 z-10"
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'number':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{index + 1}.</span>
              <input {...commonProps} />
            </div>
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className="absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border bg-white border-gray-200 z-10"
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'todo':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2 mt-1" />
              <input {...commonProps} />
            </div>
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden"
              >
                <div className="py-1.5">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-gray-800">Duplicate</span>
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-gray-800">Move up</span>
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'quote':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="border-l-4 border-gray-400 pl-4 py-1">
              <input {...commonProps} />
            </div>
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden"
              >
                <div className="py-1.5">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-gray-800">Duplicate</span>
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-gray-800">Move up</span>
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'toggle':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <ChevronDown className="w-4 h-4 mr-2 text-gray-500" />
              <input {...commonProps} />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" />Duplicate
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" />Move up
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" />Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" />Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'callout':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg flex-1">
              <div className="flex items-center">
                <span className="mr-2 text-lg">💡</span>
                <input {...commonProps} className="bg-transparent border-none outline-none flex-1" />
              </div>
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" />Duplicate
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" />Move up
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" />Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" />Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'table':
        return (
          <div className="flex items-start group relative">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden flex-1">
              <textarea
                {...commonProps}
                className="w-full p-3 border-none outline-none resize-none font-mono text-sm"
                rows="3"
              />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" />Duplicate
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" />Move up
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" />Move down
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" />Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'columns':
return (
  <div className="flex items-start group relative">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => handlePlusButtonClick(e, block.id)}>
        <Plus className="w-4 h-4" />
      </button>
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4 flex-1 border border-gray-200 rounded-lg p-4">
      <div className="border-r border-gray-200 pr-4">
        <input {...commonProps} placeholder="Column 1" />
      </div>
      <div>
        <input {...commonProps} placeholder="Column 2" />
      </div>
    </div>
  </div>
);
      case 'image':
return (
  <div className="flex items-start group relative">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => handlePlusButtonClick(e, block.id)}>
        <Plus className="w-4 h-4" />
      </button>
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex-1 text-center">
      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
      <input {...commonProps} placeholder="Paste image URL or click to upload" className="text-center" />
    </div>
  </div>
);
      case 'video':
return (
  <div className="flex items-start group relative">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => handlePlusButtonClick(e, block.id)}>
        <Plus className="w-4 h-4" />
      </button>
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="border border-gray-300 rounded-lg p-4 flex-1 bg-gray-50">
      <div className="flex items-center mb-2">
        <FileText className="w-5 h-5 mr-2 text-gray-500" />
        <span className="text-sm text-gray-600">Video</span>
      </div>
      <input {...commonProps} placeholder="Paste video URL (YouTube, Vimeo, etc.)" />
    </div>
  </div>
);
      case 'bookmark':
return (
  <div className="flex items-start group relative">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => handlePlusButtonClick(e, block.id)}>
        <Plus className="w-4 h-4" />
      </button>
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="border border-gray-300 rounded-lg p-4 flex-1 bg-yellow-50">
      <div className="flex items-center mb-2">
        <Star className="w-5 h-5 mr-2 text-yellow-500" />
        <span className="text-sm text-gray-600">Bookmark</span>
      </div>
      <input {...commonProps} placeholder="Paste any link to create a bookmark" />
    </div>
  </div>
);
      case 'embed':
return (
  <div className="flex items-start group relative">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => handlePlusButtonClick(e, block.id)}>
        <Plus className="w-4 h-4" />
      </button>
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="border border-gray-300 rounded-lg overflow-hidden flex-1">
      <textarea {...commonProps} className="w-full p-3 border-none outline-none resize-none font-mono text-sm" rows="4" placeholder="Paste embed code (iframe, script, etc.)" />
    </div>
  </div>
);
      case 'math':
return (
  <div className="flex items-start group relative">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => handlePlusButtonClick(e, block.id)}>
        <Plus className="w-4 h-4" />
      </button>
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="border border-gray-300 rounded-lg p-4 flex-1 bg-purple-50">
      <div className="flex items-center mb-2">
        <Hash className="w-5 h-5 mr-2 text-purple-500" />
        <span className="text-sm text-gray-600">Math Equation</span>
      </div>
      <textarea {...commonProps} className="w-full border-none outline-none resize-none font-mono" rows="2" placeholder="Enter LaTeX math equation" />
    </div>
  </div>
);
      case 'template':
return (
  <div className="flex items-start group relative">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => handlePlusButtonClick(e, block.id)}>
        <Plus className="w-4 h-4" />
      </button>
      <button className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6" onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="border border-gray-300 rounded-lg p-4 flex-1 bg-green-50">
      <div className="flex items-center mb-2">
        <Copy className="w-5 h-5 mr-2 text-green-500" />
        <span className="text-sm text-gray-600">Template</span>
      </div>
      <textarea {...commonProps} className="w-full border-none outline-none resize-none" rows="3" placeholder="Create a reusable template" />
    </div>
  </div>
);
      case 'divider':
return (
  <div className="flex items-center my-4 relative group">
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button
        className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
        onClick={(e) => handlePlusButtonClick(e, block.id)}
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
        onClick={(e) => {
          e.stopPropagation();
          setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
        }}
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="flex-grow border-t border-gray-300"></div>
    {showBlockMenu === block.id && (
      <div
        ref={blockMenuRef}
        className="absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border bg-white border-gray-200 z-10"
      >
        <div className="py-1">
          <button
            onClick={() => duplicateBlock(block.id)}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </button>
          <button
            onClick={() => moveBlockUp(block.id)}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Move up
          </button>
          <button
            onClick={() => moveBlockDown(block.id)}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Move down
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={() => deleteBlock(block.id)}
            className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
    )}
  </div>
);
      default: // text
return (
  <div className={`flex items-start group relative ${aiInputBlock === block.id ? 'bg-blue-50/30 rounded-lg p-2' : ''} transition-all duration-200`}>
    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1">
      <button
        className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
        onClick={(e) => handlePlusButtonClick(e, block.id)}
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        className="p-1 rounded hover:bg-gray-200 flex items-center justify-center w-6 h-6"
        onClick={(e) => {
          e.stopPropagation();
          setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
        }}
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
    <div className="flex-1 relative">
      {aiInputBlock === block.id ? (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'} transition-all duration-200`}>
          <div className={`p-1 rounded ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
            <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={handleAiQuerySubmit}
            placeholder="Ask AI anything... (Press Enter to submit, Esc to cancel)"
            className={`flex-1 outline-none bg-transparent text-sm font-medium ${isDarkMode ? 'text-purple-200 placeholder-purple-400' : 'text-purple-700 placeholder-purple-500'}`}
            autoFocus
          />
        </div>
      ) : (
        <input {...commonProps} />
      )}
    </div>
    {showBlockMenu === block.id && (
      <div
        ref={blockMenuRef}
        className="absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border bg-white border-gray-200 z-10"
      >
        <div className="py-1">
          <button
            onClick={() => duplicateBlock(block.id)}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </button>
          <button
            onClick={() => moveBlockUp(block.id)}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Move up
          </button>
          <button
            onClick={() => moveBlockDown(block.id)}
            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Move down
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            onClick={() => deleteBlock(block.id)}
            className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>
    )}
  </div>
);
    }
  };

if (loading) {
  return (
    <div className={`${isDarkMode ? 'bg-black text-gray-100' : 'bg-white text-black'} min-h-screen font-sans flex items-center justify-center`}>
      <div className="text-xl">Loading...</div>
    </div>
  );
}

if (!project) {
  return (
    <div className={`${isDarkMode ? 'bg-black text-gray-100' : 'bg-white text-black'} min-h-screen font-sans flex items-center justify-center`}>
      <div className="text-xl">Project not found</div>
    </div>
  );
}

return (
  <>
    {/* Show ProjectsPage at full size when not in fullscreen mode */}
    {!isFullscreen && (
      <div className={`fixed top-0 left-0 w-full h-screen ${isDarkMode ? 'bg-black' : 'bg-white'} z-0`}>
        <ProjectsPage />
        {/* Overlay to detect clicks on ProjectsPage and close detail page */}
        <div
          className="absolute top-0 left-0 w-1/2 h-full cursor-pointer"
          onClick={() => navigate('/projects')}
        />
      </div>
    )}

    <div className={`${isDarkMode ? 'bg-gradient-to-br from-slate-950 via-gray-950 to-black text-gray-100 border-l border-gray-800/80' : 'bg-gradient-to-br from-white via-gray-50 to-blue-50/30 text-black border-l border-gray-200/50'} font-sans antialiased fixed top-0 z-10 transition-all duration-300 h-screen overflow-y-auto shadow-2xl ${isFullscreen ? 'left-0 w-full' : 'right-0 w-full md:w-1/2'
      }`}>
      <div className={`sticky top-0 z-40 backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-gray-900/70 border-b border-gray-800/80' : 'bg-white/80 border-b border-gray-200/50'} ${isFullscreen ? 'px-4 sm:px-10 md:px-64' : 'px-4 sm:px-6'
        }`}>
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-500 hover:bg-gray-100'}`}
              title={isFullscreen ? 'Half screen' : 'Full screen'}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                </svg>
              )}
            </button>

            <button
              onClick={() => navigate('/projects')}
              className={`p-2 rounded-lg transition-all duration-200 border ${isDarkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20 hover:border-red-900/40' : 'text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200'}`}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none mr-4 ${isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-700 disabled:to-gray-800' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400'} text-white`}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </div>
            )}
          </button>
        </div>
      </div>

      <div className={`flex-1 ${isFullscreen
        ? 'flex justify-center'
        : ''
        }`}>

        <div className={`w-full ${isFullscreen
          ? 'max-w-5xl px-5 sm:px-12 lg:px-20 py-8 sm:py-12'
          : 'px-4 sm:px-8 md:px-12 py-8 sm:py-12'
          }`}>
          <div className="mb-10 ml-8">
            {project.id === 'new' || user?.role === 'manager' ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled Project"
                className={`text-3xl sm:text-5xl font-bold bg-transparent border-none outline-none w-full ${isDarkMode ? 'text-gray-100 placeholder-gray-500 hover:bg-gray-800/50' : 'text-gray-900 placeholder-gray-400 hover:bg-gray-50/50'} leading-tight focus:placeholder-gray-500 transition-all duration-200 rounded-lg px-2 py-1 -ml-2`}
              />
            ) : (
              <h1 className={`text-3xl sm:text-5xl font-bold leading-tight bg-clip-text ${isDarkMode ? 'text-gray-100' : 'bg-gradient-to-r from-gray-900 to-gray-700 text-transparent'}`}>{title}</h1>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-10 text-sm ml-8">
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 border shadow-sm ${isDarkMode ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-blue-900/40' : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200/30 hover:from-blue-100 hover:to-blue-200/50'}`}>
              <User className="h-4 w-4 text-blue-500" />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>{project.creatorName || project.ownerName || 'Unknown'}</span>
            </div>

            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 border shadow-sm ${isDarkMode ? 'bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-900/40' : 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-200/30 hover:from-green-100 hover:to-green-200/50'}`}>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm ${getStatusColor(project.status)}`}>
                {project.status === 'Completed' ? '✓ Done' : project.status}
              </span>
            </div>

            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 border shadow-sm ${isDarkMode ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-900/40' : 'bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200/30 hover:from-purple-100 hover:to-purple-200/50'}`}>
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'} font-semibold`}>{getDaysLeft(project.endDate)}</span>
            </div>
          </div>

          <div className="mb-8 ml-8">
            <div className={`p-6 sm:p-8 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border ${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium">Status</span>
                    </div>
                    <select
                      value={project.status}
                      onChange={(e) => updateProject('status', e.target.value)}
                      className="px-2 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-black focus:outline-none"
                    >
                      <option value="Not started">Not started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium">Priority</span>
                    </div>
                    <select
                      value={project.priority}
                      onChange={(e) => updateProject('priority', e.target.value)}
                      className="px-2 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-black focus:outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium">Start Day</span>
                    </div>
                    <input
                      type="date"
                      value={project.startDate}
                      onChange={(e) => updateProject('startDate', e.target.value)}
                      className="px-2 py-1 rounded text-xs bg-white border border-gray-300 text-black focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium text-sm">End Day</span>
                    </div>
                    <input
                      type="date"
                      value={project.endDate}
                      onChange={(e) => updateProject('endDate', e.target.value)}
                      className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 text-black focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium text-sm">Created Day</span>
                    </div>
                    <span className="text-gray-600 font-medium text-sm min-w-[140px] text-right">{formatDate(project.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium text-sm">Assign To</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={project.forPerson}
                        onChange={(e) => updateProject('forPerson', e.target.value)}
                        placeholder="Enter name"
                        className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 text-black focus:outline-none text-right min-w-[100px]"
                      />
                      <button
                        type="button"
                        onClick={handlePickUser}
                        className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Pick
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-20 ml-8">
            <div className={`${isDarkMode ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200/50'} backdrop-blur-sm p-6 sm:p-8 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300`}>
              <div className="space-y-2 min-h-96">
                {blocks.map((block, index) => renderBlock(block, index))}
              </div>

              {/* Add block button */}
              <button
                onClick={() => addBlock(blocks.length - 1)}
                className={`flex items-center mt-4 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add block
              </button>
              {isGenerating && (
                <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-800/30' : 'bg-purple-50 border border-purple-200'}`}>
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full border-purple-500 border-t-transparent animate-spin"></div>
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-purple-200' : 'text-purple-700'}`}>AI is generating...</div>
                    <div className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>This may take a few moments</div>
                  </div>
                </div>
              )}
              {aiError && (
                <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'}`}>
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{aiError}</span>
                </div>
              )}
            </div>
          </div>

          {showAIAssistant && (
            <div className={`mt-6 rounded-xl border transition-all duration-200 ${isDarkMode ? 'bg-gray-900/80 border-gray-700/50 backdrop-blur-lg' : 'bg-white border-gray-200 backdrop-blur-sm'} shadow-lg`}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <Sparkles className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>AI Suggestions</span>
                </div>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => executeAIAction(suggestion.action)}
                      className={`flex items-center gap-3 w-full p-3 text-left rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'} group`}
                    >
                      <Lightbulb className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300 group-hover:text-gray-100' : 'text-gray-700 group-hover:text-gray-900'}`}>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

    {/* User Picker Dropdown */}
    {showUserPicker && (
      <div
        ref={userPickerRef}
        className="fixed w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-80 overflow-y-auto"
        style={{
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)'
        }}
      >
        <div className="p-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">Select User</span>
        </div>
        {loadingUsers ? (
          <div className="p-6 text-center text-gray-500">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-sm">Loading users...</span>
          </div>
        ) : availableUsers.length > 0 ? (
          <div className="py-1.5">
            {availableUsers.map((user) => (
              <button
                key={user.id || user.username}
                onClick={() => selectUser(user)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {(user.name || user.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.username}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email} • {user.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No users available
          </div>
        )}
      </div>
    )}

    {/* Action Buttons - Top Right Corner */}
    {isFullscreen && (
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => navigate('/tasks')}
          className={`flex flex-col items-center px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 border ${isDarkMode ? 'text-gray-200 hover:bg-gray-800/60 hover:border-gray-700 border-gray-800 bg-gray-900/80' : 'text-gray-700 hover:bg-blue-50 hover:border-blue-200 border-gray-200 bg-white/80'} hover:shadow-sm backdrop-blur-sm`}
        >
          <CheckSquare className="w-5 h-5 mb-1" />
          <span>Tasks</span>
        </button>

        <button
          onClick={() => navigate('/goals')}
          className={`flex flex-col items-center px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 border ${isDarkMode ? 'text-gray-200 hover:bg-gray-800/60 hover:border-gray-700 border-gray-800 bg-gray-900/80' : 'text-gray-700 hover:bg-blue-50 hover:border-blue-200 border-gray-200 bg-white/80'} hover:shadow-sm backdrop-blur-sm`}
        >
          <Target className="w-5 h-5 mb-1" />
          <span>Goal</span>
        </button>

        <button
          onClick={() => navigate('/inbox')}
          className={`flex flex-col items-center px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 border ${isDarkMode ? 'text-gray-200 hover:bg-gray-800/60 hover:border-gray-700 border-gray-800 bg-gray-900/80' : 'text-gray-700 hover:bg-blue-50 hover:border-blue-200 border-gray-200 bg-white/80'} hover:shadow-sm backdrop-blur-sm`}
        >
          <MessageSquare className="w-5 h-5 mb-1" />
          <span>Comment</span>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className={`flex flex-col items-center px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 border ${isDarkMode ? 'text-gray-200 hover:bg-gray-800/60 hover:border-gray-700 border-gray-800 bg-gray-900/80' : 'text-gray-700 hover:bg-blue-50 hover:border-blue-200 border-gray-200 bg-white/80'} hover:shadow-sm backdrop-blur-sm`}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span>Report</span>
        </button>
      </div>
    )}

    {/* AI Button - Bottom Right Corner */}
    <button
      onClick={() => setShowAIPopup(true)}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'} text-white`}
    >
      <Sparkles className="w-6 h-6" />
    </button>

  {/* AI Input - Notion Style */ }
{
  showAIPopup && (
    <div className={`fixed bottom-24 right-6 z-[9999] w-96 rounded-xl shadow-2xl border transition-all duration-200 transform animate-in slide-in-from-bottom-2 ${isDarkMode ? 'bg-gray-900/95 border-gray-700/80 backdrop-blur-xl' : 'bg-white border-gray-200 backdrop-blur-lg'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Ask AI</span>
          </div>
          <button
            onClick={() => setShowAIPopup(false)}
            className={`p-1 rounded-md hover:opacity-75 transition-opacity ${isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiPopupQuery}
            onChange={(e) => setAiPopupQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && aiPopupQuery.trim()) {
                e.preventDefault();
                handleAISubmit();
              } else if (e.key === 'Escape') {
                setShowAIPopup(false);
                setAiPopupQuery('');
              }
            }}
            placeholder="Ask anything..."
            className={`flex-1 px-4 py-3 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all ${isDarkMode ? 'bg-gray-800/80 border-gray-700 text-gray-100 placeholder-gray-500 focus:bg-gray-800' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'}`}
            autoFocus
          />
          <button
            onClick={handleAISubmit}
            disabled={!aiPopupQuery.trim() || isGenerating}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center min-w-[42px] ${isDarkMode ?
              'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-800 text-white shadow-lg shadow-purple-900/20' :
              'bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-md shadow-purple-500/20'}`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className={`mt-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Press Enter to submit · Esc to close
        </div>
      </div>
    </div>
  )
}

{/* Formatting Menu - Notion Style */ }
{
  showFormattingMenu && (
    <div
      ref={formattingMenuRef}
      className="absolute z-50 mt-1 rounded-xl shadow-xl border bg-white border-gray-200 overflow-hidden"
      style={{
        minWidth: '280px',
        maxHeight: '400px',
        left: `${formattingMenuPosition.x}px`,
        top: `${formattingMenuPosition.y}px`,
        transform: 'translateY(5px)'
      }}
    >
      <div className="py-2 overflow-y-auto max-h-80">
        {/* Basic blocks */}
        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Basic blocks
        </div>
        {blockOptions.slice(0, 13).map(option => (
          <button
            key={option.id}
            onClick={() => applyFormatting(option.id)}
            className="w-full flex items-center px-3 py-2.5 text-left hover:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-6 mr-3 text-gray-600 flex items-center justify-center">
              {option.icon}
            </div>
            <div>
              <div className="font-medium text-gray-900">{option.label}</div>
            </div>
          </button>
        ))}

        {/* Media & Advanced */}
        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
          Media & Advanced
        </div>
        {blockOptions.slice(13).map(option => (
          <button
            key={option.id}
            onClick={() => applyFormatting(option.id)}
            className="w-full flex items-center px-3 py-2.5 text-left hover:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-6 mr-3 text-gray-600 flex items-center justify-center">
              {option.icon}
            </div>
            <div>
              <div className="font-medium text-gray-900">{option.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}


    </>
  );
};

export default ProjectDetailPage;