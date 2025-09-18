// ProjectDetailPage.jsx
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
  X
} from "lucide-react";
import { useAppContext } from '../../context/AppContext';
import ProjectsPage from '../ProjectsPage/ProjectsPage';

const ProjectDetailPage = ({ isNewProject = false }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const notesRef = useRef(null);
  const lineRefs = useRef([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(null);
  const [showBlockActions, setShowBlockActions] = useState(null);
  const blockOptions = [
    { id: 'text', label: 'Text', prefix: '' },
    { id: 'heading1', label: 'Heading 1', prefix: '# ' },
    { id: 'heading2', label: 'Heading 2', prefix: '## ' },
    { id: 'heading3', label: 'Heading 3', prefix: '### ' },
    { id: 'todo', label: 'To-do list', prefix: '- [ ] ' },
    { id: 'bullet', label: 'Bulleted list', prefix: '• ' },
    { id: 'number', label: 'Numbered list', prefix: '1. ' },
    { id: 'quote', label: 'Quote', prefix: '> ' },
    { id: 'code', label: 'Code', prefix: '```\n' }
  ];
  const blockActions = [
    { id: 'duplicate', label: 'Duplicate' },
    { id: 'delete', label: 'Delete' },
    { id: 'turninto', label: 'Turn into...' },
    { id: 'moveto', label: 'Move to...' },
    { id: 'copylink', label: 'Copy link to block' }
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
      setLoading(false);
    } else if (projectId) {
      fetchProject();
    }
  }, [projectId, isNewProject, user]);

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

  const executeAIAction = (action) => {
    setShowAIAssistant(false);
    setAiQuery('');
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project.name.trim()) return;
    setSaving(true);

    const projectData = { ...project };

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

  useEffect(() => {
    // no-op for per-line blocks; keep for future sizing if needed
  }, [project?.notes, isFullscreen]);

  const handleEditorInput = (e) => {
    const text = e.currentTarget.innerText;
    updateProject('notes', text);
    const trimmed = text.replace(/\s+$/g, '');
    setShowSlashMenu(trimmed.endsWith('/'));
  };

  const handleLineInput = (index, e) => {
    const currentNotes = project?.notes || '';
    const lines = currentNotes.split('\n');
    lines[index] = e.currentTarget.innerText;
    updateProject('notes', lines.join('\n'));
  };

  const focusLine = (index) => {
    const el = lineRefs.current[index];
    if (el) {
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const handleLineKeyDown = (index, e) => {
    const lines = (project?.notes || '').split('\n');
    const rawLine = lines[index] ?? '';
    const info = getLineInfo(rawLine);
    const editorText = lineRefs.current[index]?.innerText || '';

    if (e.key === 'Enter') {
      e.preventDefault();
      if ((info.type === 'bullet' || info.type === 'number' || info.type === 'todo') && editorText.trim().length === 0) {
        lines[index] = '';
        lines.splice(index + 1, 0, '');
        updateProject('notes', lines.join('\n'));
        setTimeout(() => focusLine(index + 1), 0);
        return;
      }

      const sel = window.getSelection();
      const atEnd = sel && sel.anchorOffset === editorText.length;
      const splitPos = atEnd ? editorText.length : sel ? sel.anchorOffset : editorText.length;
      const before = editorText.slice(0, splitPos);
      const after = editorText.slice(splitPos);

      if (info.type === 'todo') {
        lines[index] = buildLineFromInfo({ ...info, text: before });
        lines.splice(index + 1, 0, buildLineFromInfo({ ...info, checked: false, text: after }));
      } else if (info.type === 'bullet' || info.type === 'number') {
        lines[index] = buildLineFromInfo({ ...info, text: before });
        lines.splice(index + 1, 0, buildLineFromInfo({ ...info, text: after }));
      } else {
        lines[index] = before;
        lines.splice(index + 1, 0, after);
      }
      updateProject('notes', lines.join('\n'));
      setTimeout(() => focusLine(index + 1), 0);
      return;
    }

    if (e.key === 'Backspace') {
      if ((info.type === 'bullet' || info.type === 'number' || info.type === 'todo') && editorText.length === 0) {
        e.preventDefault();
        lines[index] = '';
        updateProject('notes', lines.join('\n'));
        return;
      }

      if (editorText.length === 0 && index > 0) {
        e.preventDefault();
        lines.splice(index, 1);
        updateProject('notes', lines.join('\n'));
        setTimeout(() => {
          focusLine(index - 1);
        }, 0);
      }
    }
  };

  const applyBlockOption = (option) => {
    const current = project?.notes || '';
    const withoutSlash = current.replace(/\/?\s*$/, '');
    const updated = `${withoutSlash}\n${option.prefix}`;
    updateProject('notes', updated);
    setShowSlashMenu(false);
    if (notesRef.current) {
      notesRef.current.innerText = updated;
    }
  };

  const getLineInfo = (line) => {
    if (/^\s*- \[ \]\s/.test(line)) {
      return { type: 'todo', checked: false, text: line.replace(/^\s*- \[ \]\s/, '') };
    }
    if (/^\s*- \[x\]\s/i.test(line)) {
      return { type: 'todo', checked: true, text: line.replace(/^\s*- \[x\]\s/i, '') };
    }
    if (/^\s*(?:\d+)\.\s/.test(line)) {
      return { type: 'number', text: line.replace(/^\s*(?:\d+)\.\s/, '') };
    }
    if (/^\s*(?:•|-|\*)\s/.test(line)) {
      return { type: 'bullet', text: line.replace(/^\s*(?:•|-|\*)\s/, '') };
    }
    if (/^\s*###\s/.test(line)) return { type: 'h3', text: line.replace(/^\s*###\s/, '') };
    if (/^\s*##\s/.test(line)) return { type: 'h2', text: line.replace(/^\s*##\s/, '') };
    if (/^\s*#\s/.test(line)) return { type: 'h1', text: line.replace(/^\s*#\s/, '') };
    if (/^\s*>\s/.test(line)) return { type: 'quote', text: line.replace(/^\s*>\s/, '') };
    return { type: 'text', text: line };
  };

  const buildLineFromInfo = (info) => {
    switch (info.type) {
      case 'todo':
        return `${info.checked ? '- [x] ' : '- [ ] '}${info.text || ''}`;
      case 'number':
        return `1. ${info.text || ''}`;
      case 'bullet':
        return `• ${info.text || ''}`;
      case 'h1':
        return `# ${info.text || ''}`;
      case 'h2':
        return `## ${info.text || ''}`;
      case 'h3':
        return `### ${info.text || ''}`;
      case 'quote':
        return `> ${info.text || ''}`;
      default:
        return info.text || '';
    }
  };

  const toggleTodoChecked = (index) => {
    const lines = (project?.notes || '').split('\n');
    const info = getLineInfo(lines[index] || '');
    if (info.type !== 'todo') return;
    const updated = buildLineFromInfo({ ...info, checked: !info.checked });
    lines[index] = updated;
    updateProject('notes', lines.join('\n'));
  };

  const insertBlock = (lineIndex, option) => {
    const lines = (project?.notes || '').split('\n');
    lines.splice(lineIndex + 1, 0, option.prefix);
    updateProject('notes', lines.join('\n'));
    setShowBlockMenu(null);
    setTimeout(() => focusLine(lineIndex + 1), 0);
  };

  const executeBlockAction = (lineIndex, action) => {
    const lines = (project?.notes || '').split('\n');
    switch (action.id) {
      case 'duplicate':
        lines.splice(lineIndex + 1, 0, lines[lineIndex]);
        break;
      case 'delete':
        if (lines.length > 1) lines.splice(lineIndex, 1);
        break;
      case 'turninto':
        lines[lineIndex] = '# ' + lines[lineIndex].replace(/^[#\-•>\d\.\s\[\]]+/, '');
        break;
    }
    updateProject('notes', lines.join('\n'));
    setShowBlockActions(null);
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen text-black font-sans flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white min-h-screen text-black font-sans flex items-center justify-center">
        <div className="text-xl">Project not found</div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-screen bg-white">
        <ProjectsPage />
      </div>
      
      <div className={`bg-gray-50 text-black font-sans antialiased fixed top-0 z-10 transition-all duration-300 h-screen overflow-y-auto ${
        isFullscreen ? 'left-0 w-full' : 'left-1/2 w-1/2 border-l border-gray-300'
      }`}>
      <div className={`sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm transition-all duration-300 ${
        isFullscreen ? 'px-64' : 'px-6'
      }`}>
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-150"
              title={isFullscreen ? 'Minimize' : 'Maximize'}
            >
              {isFullscreen ? (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15m-5.25 5.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
                </svg>
              )}
            </button>
            
            <button
              onClick={() => navigate('/projects')}
              className="p-1.5 hover:bg-gray-100 text-gray-600 rounded transition-colors duration-150"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded text-sm font-medium transition-colors duration-150"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      
      <div className={`flex-1 ${
        isFullscreen 
          ? 'flex justify-center' 
          : ''
      }`}>

        <div className={`w-full ${
          isFullscreen 
            ? 'max-w-5xl px-20 py-12' 
            : 'px-12 py-12'
        }`}>
        <div className="mb-8 ml-32">
          {project.id === 'new' || user?.role === 'manager' ? (
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              placeholder="Untitled"
              className="text-5xl font-bold bg-transparent border-none outline-none w-full text-black placeholder-gray-400 leading-tight focus:placeholder-gray-500 transition-colors duration-150"
            />
          ) : (
            <h1 className="text-5xl font-bold text-black leading-tight">{project.name}</h1>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm ml-32">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-black font-medium">{project.creatorName || project.ownerName || 'Unknown'}</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status === 'Completed' ? 'Done' : project.status}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-black font-medium">{getDaysLeft(project.endDate)}</span>
          </div>
        </div>

        <div className="mb-2 ml-8">
          <div className="p-6 border border-gray-300 rounded-lg">
            <div className="grid grid-cols-2 gap-8 text-sm">
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
                  className="px-3 py-1.5 rounded text-sm bg-white border border-gray-300 text-black focus:outline-none min-w-[140px]"
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
          <div className="bg-gray-50 p-6">
            {((project?.notes || '').split('\n').length ? (project?.notes || '').split('\n') : ['']).map((line, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity duration-150">
                  <div className="relative">
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150"
                      title="Add a block"
                      onClick={() => setShowBlockMenu(showBlockMenu === idx ? null : idx)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {showBlockMenu === idx && (
                      <div className="absolute left-0 top-8 w-48 max-h-48 bg-white text-black rounded-md shadow-lg border border-gray-200 z-30 overflow-y-auto">
                        {blockOptions.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => insertBlock(idx, opt)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-grab transition-all duration-150"
                      title="Drag to move, click for actions"
                      onClick={() => setShowBlockActions(showBlockActions === idx ? null : idx)}
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                    {showBlockActions === idx && (
                      <div className="absolute left-0 top-8 w-44 max-h-48 bg-white text-black rounded-md shadow-lg border border-gray-200 z-30 overflow-y-auto">
                        {blockActions.map(action => (
                          <button
                            key={action.id}
                            onClick={() => executeBlockAction(idx, action)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {(() => {
                  const info = getLineInfo(line);
                  return (
                    <div className="flex items-start gap-2">
                      <div className="w-6 flex justify-center pt-2 select-none">
                        {info.type === 'todo' && (
                          <input type="checkbox" className="h-4 w-4 cursor-pointer" checked={/^- \[x\] /i.test(line)} onChange={() => toggleTodoChecked(idx)} />
                        )}
                        {info.type === 'bullet' && (
                          <div className="h-2 w-2 rounded-full bg-gray-400 mt-1" />
                        )}
                        {info.type === 'number' && (
                          <div className="text-gray-400 text-sm mt-0.5">{idx + 1}.</div>
                        )}
                        {info.type === 'quote' && (
                          <div className="h-full w-1 bg-gray-600 rounded" />
                        )}
                      </div>

                      <div
                        ref={(el) => (lineRefs.current[idx] = el)}
                        contentEditable
                        suppressContentEditableWarning
                        // onInput={(e) => handleLineInput(idx, e)}
                        onKeyDown={(e) => handleLineKeyDown(idx, e)}
                        data-placeholder={idx === 0 ? "Type here... use '/' for quick commands" : ''}
                        className={
                          info.type === 'h1' ? 'w-full text-black text-3xl font-bold outline-none border-none py-1 whitespace-pre-wrap' :
                          info.type === 'h2' ? 'w-full text-black text-2xl font-semibold outline-none border-none py-1 whitespace-pre-wrap' :
                          info.type === 'h3' ? 'w-full text-black text-xl font-semibold outline-none border-none py-1 whitespace-pre-wrap' :
                          info.type === 'quote' ? 'w-full text-black italic outline-none border-none py-1 whitespace-pre-wrap' :
                          'w-full text-black leading-relaxed outline-none border-none py-2 whitespace-pre-wrap'
                        }
                        style={info.type !== 'h1' && info.type !== 'h2' && info.type !== 'h3' && info.type !== 'quote' ? { fontSize: '17px' } : {}}
                      >
                        {info.text}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {showSlashMenu && (
            <div className="mt-2 w-48 max-h-48 bg-white text-black rounded-md shadow-lg border border-gray-200 z-20 overflow-y-auto">
              {blockOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => applyBlockOption(opt)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {showAIAssistant && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Assistant</span>
            </div>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => executeAIAction(suggestion.action)}
                  className="flex items-center gap-2 w-full p-2 text-left hover:bg-blue-100 rounded transition-colors"
                >
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        </div>
      </div>
      </div>
    </>
  );
};

export default ProjectDetailPage;