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
  ChevronRight,
  Copy,
  Trash2,
  Maximize,
  Minimize,
  Target,
  BarChart3,
  Menu
} from "lucide-react";
import { useAppContext } from '../../context/AppContext';
import ProjectsPage from '../ProjectsPage/ProjectsPage';

import { useTheme } from '../../context/ThemeContext';
import { aiAssist } from '../../services/api';
import '../../styles/animations.css';


const ProjectDetailPage = ({ isNewProject = false }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, canCreateProjects, users } = useAppContext();
  const { isDarkMode } = useTheme();

  // Priority Selector Component
  const PrioritySelector = ({ priority, onChange, isFullscreen, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const priorityOptions = [
      { value: 'Critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-500', hoverColor: 'hover:bg-red-500/20' },
      { value: 'High', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-500', hoverColor: 'hover:bg-orange-500/20' },
      { value: 'Medium', label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500', hoverColor: 'hover:bg-yellow-500/20' },
      { value: 'Low', label: 'Low', color: 'bg-green-500', textColor: 'text-green-500', hoverColor: 'hover:bg-green-500/20' }
    ];

    const currentPriority = priorityOptions.find(option => option.value === priority) || priorityOptions[2]; // Default to Medium

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded font-medium flex items-center gap-1.5 bg-transparent focus:outline-none ${isFullscreen ? 'min-w-[120px]' : 'min-w-[100px]'}`}
        >
          <span className={`${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{currentPriority.label}</span>
          <ChevronDown className={`h-3 w-3 ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </button>

        {isOpen && (
          <div className={`absolute right-0 mt-1 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl bg-transparent w-full`}>
            <div className="py-1">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left ${option.hoverColor} transition-colors`}
                >
                  <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
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
  const [showViewerPicker, setShowViewerPicker] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pickerType, setPickerType] = useState('assign'); // 'assign' or 'viewer'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [aiInputBlock, setAiInputBlock] = useState(null);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [aiPopupQuery, setAiPopupQuery] = useState('');
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [toggleStates, setToggleStates] = useState({});
  const [tableData, setTableData] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);

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
    { id: 'callout', label: 'Callout', icon: <MessageSquare className="w-5 h-5" />, prefix: '💡 ' },
    { id: 'divider', label: 'Divider', icon: <Minus className="w-5 h-5" />, prefix: '---' },
    { id: 'table', label: 'Table', icon: <Hash className="w-5 h-5" />, prefix: '' },
    { id: 'columns', label: 'Columns', icon: <GripVertical className="w-5 h-5" />, prefix: '' },
    { id: 'image', label: 'Image', icon: <FileText className="w-5 h-5" />, prefix: '' },
    { id: 'bookmark', label: 'Bookmark', icon: <Star className="w-5 h-5" />, prefix: '' },
    { id: 'embed', label: 'Embed', icon: <Share2 className="w-5 h-5" />, prefix: '' },
    { id: 'math', label: 'Math', icon: <Hash className="w-5 h-5" />, prefix: '' },
    { id: 'template', label: 'Template', icon: <Copy className="w-5 h-5" />, prefix: '' }
  ];

  useEffect(() => {
    console.log('ProjectDetailPage useEffect - projectId:', projectId, 'isNewProject:', isNewProject);
    if (isNewProject || projectId === 'new') {
      const newProject = {
        id: 'new',
        name: '',
        status: 'Not started',
        priority: 'Medium',
        isFavorite: false,
        forPerson: '',
        viewers: '',
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
      // Store project ID for other pages to use
      localStorage.setItem('currentProjectId', projectId);
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
      // Clear auto-save timeout on cleanup
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
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
      case 'Done': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
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
      console.log('Fetching project with ID:', projectId);
      // First fetch the basic project data
      const projectResponse = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        console.log('Fetched project data:', projectData);
        console.log('Project viewers field:', projectData.viewers);
        
        // Initialize viewers field if it doesn't exist
        if (!projectData.viewers) {
          // Try to get viewers from localStorage backup
          const storedViewers = localStorage.getItem(`project_${projectId}_viewers`);
          projectData.viewers = storedViewers || '';
        }
        
        setProject(projectData);
        setTitle(projectData.name || projectData.title || '');
        
        // Fetch the project's tasks and other data
        const dataResponse = await fetch(`http://localhost:5000/api/projects/${projectId}/data`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        
        if (dataResponse.ok) {
          // Don't convert tasks to blocks - keep tasks separate from notes
          const content = projectData.notes || projectData.description || '';
          if (content) {
            const noteBlocks = content.split('\n').map((line, index) => ({
              id: `block-${index + 1}`,
              type: getBlockTypeFromLine(line),
              content: getContentFromLine(line)
            }));
            setBlocks(noteBlocks.length > 0 ? noteBlocks : [{ id: 'block-1', type: 'text', content: '' }]);
          } else {
            setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
          }
        } else {
          console.error('Failed to fetch project data:', dataResponse.status);
          const content = projectData.notes || projectData.description || '';
          if (content) {
            const noteBlocks = content.split('\n').map((line, index) => ({
              id: `block-${index + 1}`,
              type: getBlockTypeFromLine(line),
              content: getContentFromLine(line)
            }));
            setBlocks(noteBlocks.length > 0 ? noteBlocks : [{ id: 'block-1', type: 'text', content: '' }]);
          } else {
            setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
          }
        }
        
        // Set initial last saved time
        setLastSaved(new Date(projectData.updatedAt || projectData.createdAt));
      } else {
        console.error('Failed to fetch project:', projectResponse.status);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
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

  const saveTasks = async (projectId) => {
    try {
      console.log('Saving tasks for project:', projectId);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      // Get all todo blocks
      const todoBlocks = blocks.filter(block => block.type === 'todo');
      console.log('Current todo blocks:', todoBlocks);
      
      // First, get existing tasks to compare
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/data`, {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch existing tasks:', response.status);
        return;
      }
      
      const { tasks: existingTasks = [] } = await response.json();
      console.log('Existing tasks from server:', existingTasks);
      
      const existingTaskMap = new Map(existingTasks.map(task => [task.id, task]));
      const processedTaskIds = new Set();
      
      // Update or create tasks
      for (const block of todoBlocks) {
        const taskData = {
          text: block.content,
          completed: block.checked || false,
          priority: 'Medium',
          dueDate: new Date().toISOString().split('T')[0],
          createdBy: user?.id || 'system',
          updatedAt: new Date().toISOString()
        };
        
        if (block.taskId) {
          // Update existing task
          console.log('Updating task:', block.taskId, 'with data:', taskData);
          const updateResponse = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks/${block.taskId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify(taskData)
          });
          
          if (updateResponse.ok) {
            console.log('Successfully updated task:', block.taskId);
            processedTaskIds.add(block.taskId);
          } else {
            console.error('Failed to update task:', block.taskId, updateResponse.status);
          }
        } else {
          // Create new task
          console.log('Creating new task with data:', taskData);
          const createResponse = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify(taskData)
          });
          
          if (createResponse.ok) {
            const newTask = await createResponse.json();
            console.log('Created new task:', newTask);
            // Update the block with the new task ID
            setBlocks(prev => prev.map(b => 
              b.id === block.id ? { ...b, taskId: newTask.id } : b
            ));
            processedTaskIds.add(newTask.id);
          } else {
            console.error('Failed to create task:', createResponse.status);
          }
        }
      }
      
      // Delete tasks that were removed from the UI
      const tasksToDelete = existingTasks.filter(task => !processedTaskIds.has(task.id));
      console.log('Tasks to delete:', tasksToDelete);
      
      for (const task of tasksToDelete) {
        console.log('Deleting task:', task.id);
        const deleteResponse = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks/${task.id}`, {
          method: 'DELETE',
          headers: { 'x-auth-token': token }
        });
        
        if (!deleteResponse.ok) {
          console.error('Failed to delete task:', task.id, deleteResponse.status);
        }
      }
      
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!project || project.id === 'new') return;
    
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to delete projects');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });

      if (response.ok) {
        alert('Project deleted successfully!');
        navigate('/projects');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        alert(`Failed to delete project: ${errorData.message || response.status}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!canCreateProjects()) {
      alert('You do not have permission to save projects. Only managers can create and edit projects.');
      return;
    }
    
    if (!project || !title.trim()) {
      alert('Please enter a project title');
      return;
    }
    
    setSaving(true);
    
    // Convert blocks to notes string
    const notesContent = blocks.map(block => {
      switch (block.type) {
        case 'h1': return `# ${block.content}`;
        case 'h2': return `## ${block.content}`;
        case 'h3': return `### ${block.content}`;
        case 'todo': return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
        case 'bullet': return `• ${block.content}`;
        case 'number': return `1. ${block.content}`;
        case 'toggle': return `▶ ${block.content}`;
        case 'quote': return `> ${block.content}`;
        case 'callout': return `💡 ${block.content}`;
        default: return block.content;
      }
    }).join('\n');

    const projectData = {
      title: title,
      description: notesContent,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      forPerson: project.forPerson || '',
      viewers: project.viewers || ''
    };
    
    console.log('Sending project data:', projectData);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to save projects');
        return;
      }

      if (project.id === 'new') {
        console.log('Creating new project...');
        const response = await fetch('http://localhost:5000/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(projectData)
        });
        
        if (response.ok) {
          const newProject = await response.json();
          console.log('Created project response:', newProject);
          console.log('Created project viewers:', newProject.viewers);
          
          // Preserve viewers field if server doesn't return it
          if (!newProject.viewers && project.viewers) {
            newProject.viewers = project.viewers;
            // Store in localStorage for persistence
            localStorage.setItem(`project_${newProject._id || newProject.id}_viewers`, project.viewers);
          }
          
          setProject(newProject);
          
          // Save tasks after project is created
          try {
            await saveTasks(newProject._id || newProject.id);
          } catch (error) {
            console.error('Error saving tasks for new project:', error);
          }
          
          alert('Project created successfully!');
          navigate(`/projects/${newProject._id || newProject.id}`);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          alert(`Failed to create project: ${errorData.message || response.status}`);
        }
      } else {
        console.log('Updating existing project...');
        const response = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          body: JSON.stringify(projectData)
        });
        
        if (response.ok) {
          const updatedProject = await response.json();
          console.log('Updated project response:', updatedProject);
          console.log('Updated project viewers:', updatedProject.viewers);
          
          // Preserve viewers field if server doesn't return it
          if (!updatedProject.viewers && project.viewers) {
            updatedProject.viewers = project.viewers;
            // Store in localStorage for persistence
            localStorage.setItem(`project_${project.id}_viewers`, project.viewers);
          }
          
          setProject(updatedProject);
          
          // Save tasks after project is updated
          try {
            await saveTasks(updatedProject._id || updatedProject.id);
          } catch (error) {
            console.error('Error saving tasks:', error);
            alert('Project was saved, but there was an error saving tasks.');
          }
          
          alert('Project updated successfully!');
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Update failed with status:', response.status, 'Response:', errorText);
          alert(`Failed to update project: Server error (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('An error occurred while saving the project.');
    } finally {
      setSaving(false);
    }
  };

  const updateProject = (field, value) => {
    setProject(prev => ({ ...prev, [field]: value }));
    
    // Store viewers in localStorage as backup
    if (field === 'viewers' && projectId && projectId !== 'new') {
      localStorage.setItem(`project_${projectId}_viewers`, value);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to update project status');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/projects/${project.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setProject(prev => ({ ...prev, status: newStatus }));
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update status' }));
        alert(`Error updating status: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Failed to update project status. Please try again.');
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch users from database API
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      
      if (response.ok) {
        const allUsers = await response.json();
        // Filter out current user and demo users
        const filteredUsers = allUsers.filter(u => 
          u.email !== 'john@company.com' &&
          u.email !== 'jane@company.com' &&
          u.email !== 'admin@example.com' &&
          u._id !== user?.id && 
          u.username !== user?.username &&
          u.name !== user?.name
        );
        setAvailableUsers(filteredUsers);
      } else {
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePickUser = async (type) => {
    setPickerType(type);
    if (!showUserPicker && !showViewerPicker) {
      await fetchUsers();
    }
    if (type === 'assign') {
      setShowUserPicker(!showUserPicker);
      setShowViewerPicker(false);
    } else {
      setShowViewerPicker(!showViewerPicker);
      setShowUserPicker(false);
    }
  };

  const selectUser = (selectedUser) => {
    const userName = selectedUser.name || selectedUser.username;
    
    if (pickerType === 'assign') {
      // Multi-selection for assign
      const currentAssigned = project.forPerson ? project.forPerson.split(', ').filter(v => v) : [];
      const isSelected = currentAssigned.includes(userName);
      
      let newAssigned;
      if (isSelected) {
        newAssigned = currentAssigned.filter(v => v !== userName);
      } else {
        newAssigned = [...currentAssigned, userName];
      }
      
      updateProject('forPerson', newAssigned.join(', '));
    } else {
      // Multi-selection for viewers
      const currentViewers = project.viewers ? project.viewers.split(', ').filter(v => v) : [];
      const isSelected = currentViewers.includes(userName);
      
      let newViewers;
      if (isSelected) {
        newViewers = currentViewers.filter(v => v !== userName);
      } else {
        newViewers = [...currentViewers, userName];
      }
      
      updateProject('viewers', newViewers.join(', '));
    }
  };

  const handleAISubmit = async () => {
    if (aiPopupQuery.trim()) {
      try {
        setIsGenerating(true);
        
        // Add the question as a block first
        const questionBlock = {
          id: `ai-question-${Date.now()}`,
          type: 'text',
          content: `Q: ${aiPopupQuery}`
        };
        
        const { content } = await aiAssist(aiPopupQuery, 'custom');
        const lines = (content || '').split('\n').filter(line => line.trim());
        const answerBlocks = lines.map((line, idx) => ({
          id: `ai-answer-${Date.now()}-${idx}`,
          type: 'text',
          content: line.trim()
        }));
        
        // Add question block followed by answer blocks
        const newBlocks = [questionBlock, ...answerBlocks];
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
  const addBlock = (index, type = 'text', content = '') => {
    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      ...(type === 'todo' ? { checked: false } : {})
    };

    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      
      // Trigger auto-save with debounce
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveNotes(newBlocks);
      }, 1000);
      
      return newBlocks;
    });
    
    setActiveBlockId(newBlock.id);

    // Focus the new block after a short delay
    setTimeout(() => {
      if (blockRefs.current[newBlock.id]) {
        blockRefs.current[newBlock.id].focus();
      }
    }, 10);
    
    // Auto-save if this is a new todo
    if (type === 'todo' && project?.id && project.id !== 'new') {
      saveTasks(project.id);
    }
  };

  // Auto-save notes to database
  const autoSaveNotes = async (blocksToSave) => {
    if (!project || project.id === 'new') return;
    
    try {
      setAutoSaving(true);
      
      // Convert blocks to notes string
      const notesContent = blocksToSave.map(block => {
        switch (block.type) {
          case 'h1': return `# ${block.content}`;
          case 'h2': return `## ${block.content}`;
          case 'h3': return `### ${block.content}`;
          case 'todo': return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
          case 'bullet': return `• ${block.content}`;
          case 'number': return `1. ${block.content}`;
          case 'toggle': return `▶ ${block.content}`;
          case 'quote': return `> ${block.content}`;
          case 'callout': return `💡 ${block.content}`;
          case 'divider': return '---';
          default: return block.content;
        }
      }).join('\n');

      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/projects/${project.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ notes: notesContent })
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  // Update block content
  const updateBlock = (id, updates) => {
    setBlocks(prev => {
      const newBlocks = prev.map(block => {
        if (block.id === id) {
          // Handle todo checked state separately
          if (updates.checked !== undefined && block.type === 'todo') {
            return { ...block, checked: updates.checked };
          }
          // Handle content/text updates
          if (updates.content !== undefined || updates.text !== undefined) {
            const content = updates.content !== undefined ? updates.content : updates.text;
            return { ...block, content };
          }
          // Handle other updates
          return { ...block, ...updates };
        }
        return block;
      });
      
      // Trigger auto-save with debounce
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveNotes(newBlocks);
      }, 1000); // Auto-save after 1 second of inactivity
      
      return newBlocks;
    });
  };

  // Delete block
  const deleteBlock = (id) => {
    if (blocks.length <= 1) return;

    setBlocks(prev => {
      const newBlocks = prev.filter(block => block.id !== id);
      
      // Trigger auto-save with debounce
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveNotes(newBlocks);
      }, 1000);
      
      return newBlocks;
    });
  };

  // Change block type
  const changeBlockType = (id, type) => {
    setBlocks(prev => {
      const newBlocks = prev.map(block =>
        block.id === id ? { ...block, type } : block
      );
      
      // Trigger auto-save with debounce
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveNotes(newBlocks);
      }, 1000);
      
      return newBlocks;
    });
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
      const currentBlock = blocks[index];
      // For lists, create same type of block
      if (['bullet', 'number', 'todo', 'toggle'].includes(currentBlock.type)) {
        addBlock(index, currentBlock.type);
      } else {
        addBlock(index);
      }
    } else if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      const currentIndex = blocks.findIndex(block => block.id === id);
      if (currentIndex > 0) {
        // Focus on the previous block
        const previousBlockId = blocks[currentIndex - 1].id;
        setTimeout(() => {
          if (blockRefs.current[previousBlockId]) {
            blockRefs.current[previousBlockId].focus();
          }
        }, 10);
      }
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

  // Table functions
  const addTableRow = (blockId) => {
    setTableData(prev => {
      const table = prev[blockId] || { rows: 3, cols: 3, data: Array(3).fill().map(() => Array(3).fill('')) };
      const newData = [...table.data, Array(table.cols).fill('')];
      return { ...prev, [blockId]: { ...table, rows: table.rows + 1, data: newData } };
    });
  };

  const addTableCol = (blockId) => {
    setTableData(prev => {
      const table = prev[blockId] || { rows: 3, cols: 3, data: Array(3).fill().map(() => Array(3).fill('')) };
      const newData = table.data.map(row => [...row, '']);
      return { ...prev, [blockId]: { ...table, cols: table.cols + 1, data: newData } };
    });
  };

  const updateTableCell = (blockId, row, col, value) => {
    setTableData(prev => {
      const table = prev[blockId];
      if (!table) return prev;
      const newData = table.data.map((r, i) =>
        i === row ? r.map((c, j) => j === col ? value : c) : r
      );
      return { ...prev, [blockId]: { ...table, data: newData } };
    });
  };

  const deleteTableRow = (blockId) => {
    setTableData(prev => {
      const table = prev[blockId] || { rows: 3, cols: 3, data: Array(3).fill().map(() => Array(3).fill('')) };
      if (table.rows <= 1) return prev;
      const newData = table.data.slice(0, -1);
      return { ...prev, [blockId]: { ...table, rows: table.rows - 1, data: newData } };
    });
  };

  const deleteTableCol = (blockId) => {
    setTableData(prev => {
      const table = prev[blockId] || { rows: 3, cols: 3, data: Array(3).fill().map(() => Array(3).fill('')) };
      if (table.cols <= 1) return prev;
      const newData = table.data.map(row => row.slice(0, -1));
      return { ...prev, [blockId]: { ...table, cols: table.cols - 1, data: newData } };
    });
  };

  const toggleBlock = (blockId) => {
    setToggleStates(prev => ({ ...prev, [blockId]: !prev[blockId] }));
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
      case 'callout':
        changeBlockType(activeBlockId, 'callout');
        break;
      case 'table':
        const tableId = activeBlockId;
        changeBlockType(tableId, 'table');
        setTableData(prev => ({ ...prev, [tableId]: { rows: 3, cols: 3, data: Array(3).fill().map(() => Array(3).fill('')) } }));
        break;
      case 'columns':
        changeBlockType(activeBlockId, 'columns');
        break;
      case 'image':
        changeBlockType(activeBlockId, 'image');
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
  const getBlockPlaceholder = (type, index) => {
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
      default: return index === 0 ? 'Type \'/\' for commands' : '';
    }
  };

  // Render block based on type
  const renderBlock = (block, index) => {
    const commonProps = {
      ref: (el) => blockRefs.current[block.id] = el,
      className: `w-full outline-none resize-none border-none bg-transparent py-1 px-2 rounded ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`,
      value: block.content,
      onChange: (e) => updateBlock(block.id, { content: e.target.value }),
      onKeyDown: (e) => handleBlockKeyDown(block.id, e),
      onFocus: () => setActiveBlockId(block.id),
      placeholder: getBlockPlaceholder(block.type, index)
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
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className={`flex items-center w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => { const newBlocks = [...blocks]; newBlocks.push({ id: `block-${Date.now()}`, type: 'text', content: '' }); setBlocks(newBlocks); setShowBlockMenu(null); }}
                    className={`flex items-center w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className={`flex items-center w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className={`flex items-center w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className={`flex items-center w-full px-4 py-2 text-left text-red-600 ${isDarkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
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
              <span className="mr-2 font-bold text-gray-600 text-lg leading-none">•</span>
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
      case 'number':
        const getNumberedIndex = () => {
          let count = 1;
          for (let i = 0; i < index; i++) {
            if (blocks[i].type === 'number') count++;
          }
          return count;
        };
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
              <span className="mr-2 font-medium text-gray-600 min-w-[20px]">{getNumberedIndex()}.</span>
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
              <input 
                type="checkbox" 
                checked={block.checked || false}
                onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
                className="mr-2 mt-1" 
              />
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
        const isToggleOpen = toggleStates[block.id] || false;
        return (
          <div className="flex flex-col group relative">
            <div className="flex items-start">
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
              <div className="flex items-center flex-1">
                <button
                  onClick={() => toggleBlock(block.id)}
                  className="mr-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {isToggleOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </button>
                <input {...commonProps} />
              </div>
            </div>
            {isToggleOpen && (
              <div className={`ml-8 mt-2 p-3 border-l-2 rounded ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <textarea
                  placeholder="Toggle content..."
                  className={`w-full p-2 border-none outline-none bg-transparent resize-none ${isDarkMode ? 'text-gray-200 placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'}`}
                  rows="3"
                />
              </div>
            )}
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
            <div className={`border-l-4 border-blue-400 p-4 rounded-r-lg flex-1 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
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
        const table = tableData[block.id] || { rows: 3, cols: 3, data: Array(3).fill().map(() => Array(3).fill('')) };
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
            <div className="flex-1 relative" style={{ marginRight: '40px', marginBottom: '40px' }}>
              <div className={`border rounded-lg overflow-hidden shadow-sm ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                <table className="w-full border-collapse">
                  <tbody>
                    {table.data.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-50') : (isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/50')}>
                        {row.map((cell, colIndex) => (
                          <td key={`${rowIndex}-${colIndex}`} className={`border-r border-b p-0 relative group/cell ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <textarea
                              value={cell}
                              onChange={(e) => updateTableCell(block.id, rowIndex, colIndex, e.target.value)}
                              className={`w-full min-h-[24px] px-2 py-1 border-none outline-none resize-none bg-transparent text-xs leading-tight ${rowIndex === 0 ? (isDarkMode ? 'font-semibold text-gray-200' : 'font-semibold text-gray-800') : (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                                } ${isDarkMode ? 'focus:bg-blue-900/20 focus:ring-1 focus:ring-blue-700 focus:ring-inset' : 'focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 focus:ring-inset'}`}
                              placeholder={rowIndex === 0 ? `Column ${colIndex + 1}` : ''}
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
                onClick={() => addTableCol(block.id)}
                className={`absolute top-1/2 -right-8 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                title="Add column"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {/* Delete column button */}
              {table.cols > 1 && (
                <button
                  onClick={() => deleteTableCol(block.id)}
                  className={`absolute top-1/2 -right-16 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-red-500 hover:text-white hover:border-red-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                  title="Delete column"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Add row button */}
              <button
                onClick={() => addTableRow(block.id)}
                className={`absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                title="Add row"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {/* Delete row button */}
              {table.rows > 1 && (
                <button
                  onClick={() => deleteTableRow(block.id)}
                  className={`absolute left-1/2 -bottom-16 transform -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 shadow-lg hover:bg-red-500 hover:text-white hover:border-red-500 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                  title="Delete row"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              )}
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
            <div className={`grid grid-cols-2 gap-4 flex-1 border rounded-lg p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`border-r pr-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <input {...commonProps} placeholder="Column 1" />
              </div>
              <div>
                <input {...commonProps} placeholder="Column 2" />
              </div>
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Duplicate</span>
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move up</span>
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" /><span>Delete</span>
                  </button>
                </div>
              </div>
            )}
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
            <div className={`border-2 border-dashed rounded-lg p-3 flex-1 text-center ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
              {block.content ? (
                <img src={block.content} alt="Uploaded" className="max-w-full h-auto rounded max-h-48" onError={(e) => e.target.style.display = 'none'} />
              ) : (
                <div>
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 mb-2 text-sm">Add an image</p>
                  <button
                    onClick={() => document.getElementById(`image-${block.id}`).click()}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mb-2"
                  >
                    Choose File
                  </button>
                  <input
                    id={`image-${block.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => updateBlock(block.id, e.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              )}
              <input {...commonProps} placeholder="Or paste image URL" className="text-center bg-transparent text-xs" />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Duplicate</span>
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move up</span>
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" /><span>Delete</span>
                  </button>
                </div>
              </div>
            )}
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
            <div className={`border rounded-lg p-4 flex-1 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
              {block.content && (block.content.includes('youtube.com') || block.content.includes('youtu.be') || block.content.startsWith('data:video')) ? (
                <div className="aspect-video max-h-48">
                  {block.content.startsWith('data:video') ? (
                    <video src={block.content} controls className="w-full h-full rounded" />
                  ) : (
                    <iframe
                      src={block.content.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full rounded"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : (
                <div className="text-center mb-3">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 mb-2 text-sm">Add a video</p>
                  <button
                    onClick={() => document.getElementById(`video-${block.id}`).click()}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mb-2"
                  >
                    Choose File
                  </button>
                  <input
                    id={`video-${block.id}`}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => updateBlock(block.id, e.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              )}
              <input {...commonProps} placeholder="Or paste video URL (YouTube, Vimeo, etc.)" className="text-xs" />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Duplicate</span>
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move up</span>
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" /><span>Delete</span>
                  </button>
                </div>
              </div>
            )}
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
            <div className={`border rounded-lg p-4 flex-1 ${isDarkMode ? 'border-gray-700 bg-yellow-900/20' : 'border-gray-300 bg-yellow-50'}`}>
              {block.content ? (
                <a href={block.content} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-white rounded border hover:shadow-md transition-shadow">
                  <Star className="w-5 h-5 mr-3 text-yellow-500" />
                  <div>
                    <div className="font-medium text-gray-900">{block.content}</div>
                    <div className="text-sm text-gray-500">Click to visit</div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center mb-2">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  <span className="text-sm text-gray-600">Bookmark</span>
                </div>
              )}
              <input {...commonProps} placeholder="Paste any link to create a bookmark" className="mt-2" />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Duplicate</span>
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move up</span>
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" /><span>Delete</span>
                  </button>
                </div>
              </div>
            )}
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
            <div className={`border rounded-lg overflow-hidden flex-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              {block.content && block.content.includes('<iframe') ? (
                <div dangerouslySetInnerHTML={{ __html: block.content }} className="w-full" />
              ) : (
                <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <Share2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-center text-gray-500 mb-2">Embed content</p>
                </div>
              )}
              <textarea {...commonProps} className="w-full p-3 border-none outline-none resize-none font-mono text-sm" rows="3" placeholder="Paste embed code (iframe, script, etc.)" />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Duplicate</span>
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move up</span>
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" /><span>Delete</span>
                  </button>
                </div>
              </div>
            )}
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
            <div className={`border rounded-lg p-4 flex-1 ${isDarkMode ? 'border-gray-700 bg-purple-900/20' : 'border-gray-300 bg-purple-50'}`}>
              <div className="flex items-center mb-2">
                <Hash className="w-5 h-5 mr-2 text-purple-500" />
                <span className="text-sm text-gray-600">Math Equation</span>
              </div>
              <textarea {...commonProps} className="w-full border-none outline-none resize-none font-mono" rows="2" placeholder="Enter LaTeX math equation" />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Duplicate</span>
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move up</span>
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" /><span>Delete</span>
                  </button>
                </div>
              </div>
            )}
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
            <div className={`border rounded-lg p-4 flex-1 ${isDarkMode ? 'border-gray-700 bg-green-900/20' : 'border-gray-300 bg-green-50'}`}>
              <div className="flex items-center mb-2">
                <Copy className="w-5 h-5 mr-2 text-green-500" />
                <span className="text-sm text-gray-600">Template</span>
              </div>
              <textarea {...commonProps} className="w-full border-none outline-none resize-none" rows="3" placeholder="Create a reusable template" />
            </div>
            {showBlockMenu === block.id && (
              <div ref={blockMenuRef} className="absolute left-0 top-0 mt-8 w-52 rounded-xl shadow-lg border bg-white border-gray-200 z-10 overflow-hidden">
                <div className="py-1.5">
                  <button onClick={() => duplicateBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Duplicate</span>
                  </button>
                  <button onClick={() => moveBlockUp(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronUp className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move up</span>
                  </button>
                  <button onClick={() => moveBlockDown(block.id)} className="flex items-center w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors">
                    <ChevronDown className="w-4 h-4 mr-3 text-gray-600" /><span className="text-gray-800">Move down</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 mr-3" /><span>Delete</span>
                  </button>
                </div>
              </div>
            )}
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
            <div className={`flex-grow border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
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

      <div className={`${isDarkMode ? 'bg-gradient-to-br from-slate-950 via-gray-950 to-black text-gray-100 border-l border-gray-800/80' : isFullscreen ? 'bg-gradient-to-br from-white via-gray-50 to-blue-50/30 text-black border-l border-gray-200/50' : 'bg-white text-black border-l border-gray-200/50'} font-sans antialiased fixed top-0 z-10 transition-all duration-300 h-screen overflow-y-auto shadow-2xl ${isFullscreen ? 'left-0 w-full' : 'right-0 w-full md:w-1/2'
        }`}>
        <div className={`sticky top-0 z-40 backdrop-blur-sm transition-all duration-300 border-b ${isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} ${isFullscreen ? 'px-4 sm:px-10 md:px-64' : 'px-4 sm:px-6'
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

            <div className="flex items-center gap-2">
              {canCreateProjects() && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'} text-white shadow-sm hover:shadow-md disabled:shadow-none`}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {project.id === 'new' ? 'Creating...' : 'Updating...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {project.id === 'new' ? 'Create' : 'Update'}
                    </div>
                  )}
                </button>
              )}
              {project.id !== 'new' && canCreateProjects() && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDarkMode ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-700' : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'} text-white shadow-sm hover:shadow-md disabled:shadow-none`}
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`flex-1 ${isFullscreen
          ? 'flex justify-center'
          : ''
          }`}>

          <div className={`w-full ${isFullscreen
            ? 'max-w-5xl px-5 sm:px-12 lg:px-20 py-8 sm:py-12'
            : 'px-3 sm:px-4 py-4 sm:py-6'
            }`}>
            <div className={`${isFullscreen ? 'mb-8 ml-16' : 'mb-3 ml-4'}`}>
              {project.id === 'new' || canCreateProjects() ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  placeholder="Untitled Project"
                  className={`${isFullscreen ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'} font-bold bg-transparent border-none outline-none w-full ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'} leading-tight mb-1`}
                />
              ) : (
                <h1 className={`${isFullscreen ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'} font-bold leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
              )}
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Created by {project.creatorName || project.ownerName || 'Unknown'}
              </p>
              {!canCreateProjects() && project.id !== 'new' && (
                <div className={`mt-1 px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-800/30' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                  <span className="font-medium">View Mode:</span> You can view this project and update its status, but only managers can edit project details.
                </div>
              )}
            </div>

            <div className={`flex flex-wrap items-center gap-1 ${isFullscreen ? 'mb-1 ml-16' : 'mb-1 ml-4'} ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
              <div className={`flex items-center gap-1.5 ${isFullscreen ? 'px-4 py-2' : 'px-2 py-1'} rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
                <CheckCircle className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'} text-green-500`} />
                <span className={`px-1.5 py-0.5 rounded ${isFullscreen ? 'text-xs' : 'text-[10px]'} font-medium ${getStatusColor(project.status)}`}>
                  {project.status === 'Done' ? '✓ Done' : project.status}
                </span>
              </div>

              <div className={`flex items-center gap-1.5 ${isFullscreen ? 'px-4 py-2' : 'px-2 py-1'} rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
                <Calendar className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'} text-blue-500`} />
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-black'} font-medium ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{getDaysLeft(project.endDate)}</span>
              </div>

              <div className={`flex items-center gap-1.5 ${isFullscreen ? 'px-4 py-2' : 'px-2 py-1'} rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-sm`}>
                <Tag className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'} text-orange-500`} />
                <span className={`px-1.5 py-0.5 rounded ${isFullscreen ? 'text-xs' : 'text-[10px]'} font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
            </div>

            <div className={`${isFullscreen ? 'mb-2 ml-16' : 'mb-2 ml-4'}`}>
              <div className={`${isFullscreen ? 'p-6' : 'p-2'}`}>
                <div className={`grid grid-cols-1 ${isFullscreen ? 'gap-3' : 'gap-2'} ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <div className="flex items-center gap-3 w-32">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">Status</span>
                      </div>
                      <select
                        value={project.status}
                        onChange={(e) => {
                          if (canCreateProjects()) {
                            updateProject('status', e.target.value);
                          } else {
                            handleStatusUpdate(e.target.value);
                          }
                        }}
                        className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded font-medium bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} focus:outline-none ${isFullscreen ? 'min-w-[120px]' : ''}`}
                      >
                        <option value="Not started">Not started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On hold">On Hold</option>
                        <option value="Done">Completed</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center gap-3 w-32">
                        <Tag className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">Priority</span>
                      </div>
                      {canCreateProjects() ? (
                        <PrioritySelector
                          priority={project.priority}
                          onChange={(value) => updateProject('priority', value)}
                          isFullscreen={isFullscreen}
                          isDarkMode={isDarkMode}
                        />
                      ) : (
                        <span className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded font-medium flex items-center gap-1.5`}>
                          <span className={`w-2 h-2 rounded-full ${
                            project.priority === 'Critical' ? 'bg-red-500' :
                            project.priority === 'High' ? 'bg-orange-500' :
                            project.priority === 'Medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></span>
                          <span className={`${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{project.priority}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center gap-3 w-32">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">Start Day</span>
                      </div>
                      {canCreateProjects() ? (
                        <input
                          type="date"
                          value={project.startDate}
                          onChange={(e) => updateProject('startDate', e.target.value)}
                          className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} focus:outline-none`}
                        />
                      ) : (
                        <span className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {formatDate(project.startDate)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center gap-3 w-32">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">End Day</span>
                      </div>
                      {canCreateProjects() ? (
                        <input
                          type="date"
                          value={project.endDate}
                          onChange={(e) => updateProject('endDate', e.target.value)}
                          className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded bg-transparent ${isDarkMode ? 'text-white' : 'text-black'} focus:outline-none`}
                        />
                      ) : (
                        <span className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {formatDate(project.endDate)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center gap-3 w-32">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">Assign To</span>
                      </div>
                      {canCreateProjects() ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1 min-w-[100px]">
                            {project.forPerson && project.forPerson !== 'None' ? (
                              project.forPerson.split(', ').map((person, index) => (
                                <span key={index} className={`${isFullscreen ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-xs'} bg-blue-100 text-blue-800 rounded`}>
                                  {person}
                                </span>
                              ))
                            ) : (
                              <span className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} text-gray-500`}>None</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePickUser('assign')}
                            className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors`}
                          >
                            Pick
                          </button>
                        </div>
                      ) : (
                        <span className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {project.forPerson || 'None'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center gap-3 w-32">
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">Viewers</span>
                      </div>
                      {canCreateProjects() ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1 min-w-[100px]">
                            {(() => {
                              console.log('Viewers value:', project.viewers);
                              return project.viewers && project.viewers !== 'None' && project.viewers.trim() !== '' ? (
                                project.viewers.split(', ').filter(v => v.trim()).map((viewer, index) => (
                                  <span key={index} className={`${isFullscreen ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-xs'} bg-green-100 text-green-800 rounded`}>
                                    {viewer.trim()}
                                  </span>
                                ))
                              ) : (
                                <span className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} text-gray-500`}>None</span>
                              );
                            })()}
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePickUser('viewer')}
                            className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors`}
                          >
                            Pick
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {project.viewers && project.viewers !== 'None' && project.viewers.trim() !== '' ? (
                            project.viewers.split(', ').filter(v => v.trim()).map((viewer, index) => (
                              <span key={index} className={`${isFullscreen ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-xs'} bg-green-100 text-green-800 rounded`}>
                                {viewer.trim()}
                              </span>
                            ))
                          ) : (
                            <span className={`${isFullscreen ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              None
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center gap-3 w-32">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">Created Day</span>
                      </div>
                      <span className={`${isDarkMode ? 'text-white' : 'text-black'} font-medium ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className={`${isFullscreen ? 'mb-20 ml-16 mr-16' : 'mb-4 ml-4 mr-4'}`}>
              <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} mb-2`}></div>
              <h3 className={`${isFullscreen ? 'text-lg' : 'text-base'} font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Project Notes</h3>
              <div className={`${isFullscreen ? 'p-6' : 'p-2'}`}>
                <div className={`space-y-0 ${isFullscreen ? 'min-h-96' : 'min-h-32'}`}>
                  {blocks.map((block, index) => (
                    <div key={block.id}>
                      {renderBlock(block, index)}
                    </div>
                  ))}
                </div>

                {/* Add block button */}
                <button
                  onClick={() => addBlock(blocks.length - 1)}
                  className={`flex items-center ${isFullscreen ? 'mt-4 px-4 py-2' : 'mt-2 px-3 py-1'} rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <Plus className={`${isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
                  <span className={`${isFullscreen ? 'text-sm' : 'text-xs'}`}>Add block</span>
                </button>
                
                {/* Auto-save indicator */}
                {(autoSaving || lastSaved) && (
                  <div className={`mt-2 flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {autoSaving ? (
                      <>
                        <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : lastSaved ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                      </>
                    ) : null}
                  </div>
                )}
                
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
      {(showUserPicker || showViewerPicker) && (
        <div
          ref={userPickerRef}
          className={`fixed w-72 border rounded-xl shadow-xl z-[9999] max-h-64 overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {pickerType === 'assign' ? 'Select Worker' : 'Select Viewer'}
            </span>
          </div>
          {loadingUsers ? (
            <div className={`p-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span className="text-sm">Loading users...</span>
            </div>
          ) : availableUsers.length > 0 ? (
            <div className="py-1.5">
              {availableUsers.map((user) => {
                const userName = user.name || user.username;
                const isSelected = pickerType === 'viewer' 
                  ? (project.viewers && project.viewers.split(', ').includes(userName))
                  : (project.forPerson && project.forPerson.split(', ').includes(userName));
                
                return (
                  <button
                    key={user.id || user.username}
                    onClick={() => selectUser(user)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      isSelected 
                        ? (isDarkMode ? 'bg-blue-900/30 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500')
                        : (isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                    }`}
                  >
                    <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {userName}
                      </div>
                      <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.email} • {user.role}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-blue-500">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
              <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Click to select/deselect multiple {pickerType === 'assign' ? 'workers' : 'viewers'}
                </div>
                <button
                  onClick={() => {
                    if (pickerType === 'assign') {
                      setShowUserPicker(false);
                    } else {
                      setShowViewerPicker(false);
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                >
                  Confirm
                </button>
              </div>
            </div>
          ) : (
            <div className={`p-6 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No users available
            </div>
          )}
        </div>
      )}



      {/* AI Button - Bottom Right Corner */}
      <button
        onClick={() => setShowAIPopup(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-xl hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'} text-white`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* AI Input - Notion Style */}
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

      {/* Formatting Menu - Notion Style */}
      {
        showFormattingMenu && (
          <div
            ref={formattingMenuRef}
            className={`absolute z-50 mt-1 rounded-xl shadow-xl border overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
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
              <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Basic blocks
              </div>
              {blockOptions.slice(0, 10).map(option => (
                <button
                  key={option.id}
                  onClick={() => applyFormatting(option.id)}
                  className={`w-full flex items-center px-3 py-2.5 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <div className={`w-6 h-6 mr-3 flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.icon}
                  </div>
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{option.label}</div>
                  </div>
                </button>
              ))}

              {/* Media & Advanced */}
              <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Media & Advanced
              </div>
              {blockOptions.slice(10).map(option => (
                <button
                  key={option.id}
                  onClick={() => applyFormatting(option.id)}
                  className={`w-full flex items-center px-3 py-2.5 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <div className={`w-6 h-6 mr-3 flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.icon}
                  </div>
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{option.label}</div>
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