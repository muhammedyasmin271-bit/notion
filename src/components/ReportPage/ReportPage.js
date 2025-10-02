import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Save,
  Plus,
  GripVertical,
  Type,
  Hash,
  List,
  CheckSquare,
  Quote,
  Minus,
  Copy,
  ChevronUp,
  ChevronDown,
  Trash2,
  MessageSquare,
  Target
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const ReportPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [project, setProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'text', content: '' }]);
  const [showFormattingMenu, setShowFormattingMenu] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showBlockMenu, setShowBlockMenu] = useState(null);
  const [answers, setAnswers] = useState({
    objectives: '',
    challenges: '',
    improvements: '',
    rating: '',
    timeline: '',
    budget: '',
    teamwork: '',
    stakeholders: '',
    quality: '',
    recommendations: ''
  });
  const [savingAnswers, setSavingAnswers] = useState(false);
  const formattingMenuRef = useRef(null);
  const blockMenuRef = useRef(null);
  const blockRefs = useRef({});

  const blockOptions = [
    { id: 'text', label: 'Text', icon: <Type className="w-5 h-5" /> },
    { id: 'h1', label: 'Heading 1', icon: <Hash className="w-5 h-5" /> },
    { id: 'h2', label: 'Heading 2', icon: <Hash className="w-5 h-5" /> },
    { id: 'h3', label: 'Heading 3', icon: <Hash className="w-5 h-5" /> },
    { id: 'bulleted', label: 'Bulleted list', icon: <List className="w-5 h-5" /> },
    { id: 'numbered', label: 'Numbered list', icon: <List className="w-5 h-5" /> },
    { id: 'todo', label: 'To-do list', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'quote', label: 'Quote', icon: <Quote className="w-5 h-5" /> },
    { id: 'divider', label: 'Divider', icon: <Minus className="w-5 h-5" /> }
  ];

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formattingMenuRef.current && !formattingMenuRef.current.contains(event.target)) {
        setShowFormattingMenu(null);
      }
      if (blockMenuRef.current && !blockMenuRef.current.contains(event.target)) {
        setShowBlockMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        if (data.report) {
          const reportBlocks = data.report.split('\n').map((line, index) => ({
            id: `block-${index + 1}`,
            type: 'text',
            content: line
          }));
          setBlocks(reportBlocks.length > 0 ? reportBlocks : [{ id: 'block-1', type: 'text', content: '' }]);
        }
        if (data.reportAnswers) {
          setAnswers(data.reportAnswers);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);

    const reportContent = blocks.map(block => block.content).join('\n');

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ ...project, report: reportContent })
      });
      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnswers = async () => {
    if (!project) return;
    setSavingAnswers(true);

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ ...project, reportAnswers: answers })
      });
      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Error saving answers:', error);
    } finally {
      setSavingAnswers(false);
    }
  };

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

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

    setTimeout(() => {
      if (blockRefs.current[newBlock.id]) {
        blockRefs.current[newBlock.id].focus();
      }
    }, 10);
  };

  const updateBlock = (id, content) => {
    setBlocks(prev => prev.map(block =>
      block.id === id ? { ...block, content } : block
    ));
  };

  const deleteBlock = (id) => {
    if (blocks.length <= 1) return;
    setBlocks(prev => prev.filter(block => block.id !== id));
  };

  const changeBlockType = (id, type) => {
    setBlocks(prev => prev.map(block =>
      block.id === id ? { ...block, type } : block
    ));
    setShowFormattingMenu(null);
  };

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

  const moveBlockUp = (id) => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (blockIndex <= 0) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex - 1], newBlocks[blockIndex]] = [newBlocks[blockIndex], newBlocks[blockIndex - 1]];
    setBlocks(newBlocks);
    setShowBlockMenu(null);
  };

  const moveBlockDown = (id) => {
    const blockIndex = blocks.findIndex(block => block.id === id);
    if (blockIndex === -1 || blockIndex === blocks.length - 1) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
    setBlocks(newBlocks);
    setShowBlockMenu(null);
  };

  const handleBlockKeyDown = (id, e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const index = blocks.findIndex(block => block.id === id);
      addBlock(index);
    } else if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      deleteBlock(id);
    } else if (e.key === '/') {
      e.preventDefault();
      setActiveBlockId(id);
      setShowFormattingMenu(id);
    }
  };

  const handlePlusButtonClick = (e, blockId) => {
    e.stopPropagation();
    setActiveBlockId(blockId);
    setShowFormattingMenu(showFormattingMenu === blockId ? null : blockId);
  };

  const applyFormatting = (format) => {
    if (format === 'divider') {
      addBlock(blocks.findIndex(b => b.id === activeBlockId), 'divider');
    } else {
      changeBlockType(activeBlockId, format);
    }
    setShowFormattingMenu(null);
  };

  const getBlockPlaceholder = (type) => {
    switch (type) {
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      case 'bulleted': return 'List item';
      case 'numbered': return 'List item';
      case 'todo': return 'To-do item';
      case 'quote': return 'Quote';
      default: return 'Type \'/\' for commands';
    }
  };

  const renderBlock = (block, index) => {
    const commonProps = {
      ref: (el) => blockRefs.current[block.id] = el,
      key: block.id,
      className: `w-full outline-none resize-none border-none bg-transparent py-1 px-2 rounded ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`,
      value: block.content,
      onChange: (e) => updateBlock(block.id, e.target.value),
      onKeyDown: (e) => handleBlockKeyDown(block.id, e),
      onFocus: () => setActiveBlockId(block.id),
      placeholder: getBlockPlaceholder(block.type)
    };

    const blockMenu = showBlockMenu === block.id && (
      <div
        ref={blockMenuRef}
        className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <div className="py-1">
          <button onClick={() => duplicateBlock(block.id)} className={`flex items-center w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <Copy className="w-4 h-4 mr-2" />Duplicate
          </button>
          <button onClick={() => moveBlockUp(block.id)} className={`flex items-center w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <ChevronUp className="w-4 h-4 mr-2" />Move up
          </button>
          <button onClick={() => moveBlockDown(block.id)} className={`flex items-center w-full px-4 py-2 text-left ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <ChevronDown className="w-4 h-4 mr-2" />Move down
          </button>
          <hr className={`my-1 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`} />
          <button onClick={() => deleteBlock(block.id)} className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />Delete
          </button>
        </div>
      </div>
    );

    switch (block.type) {
      case 'h1':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input {...commonProps} className={`${commonProps.className} text-4xl font-bold py-2`} />
            {blockMenu}
          </div>
        );
      case 'h2':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input {...commonProps} className={`${commonProps.className} text-3xl font-bold py-2`} />
            {blockMenu}
          </div>
        );
      case 'h3':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input {...commonProps} className={`${commonProps.className} text-2xl font-bold py-2`} />
            {blockMenu}
          </div>
        );
      case 'bulleted':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <span className="mr-2">•</span>
              <input {...commonProps} />
            </div>
            {blockMenu}
          </div>
        );
      case 'numbered':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{index + 1}.</span>
              <input {...commonProps} />
            </div>
            {blockMenu}
          </div>
        );
      case 'todo':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="mr-2 mt-1" />
              <input {...commonProps} />
            </div>
            {blockMenu}
          </div>
        );
      case 'quote':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className={`border-l-4 pl-4 py-1 ${isDarkMode ? 'border-gray-600' : 'border-gray-400'}`}>
              <input {...commonProps} />
            </div>
            {blockMenu}
          </div>
        );
      case 'divider':
        return (
          <div className="flex items-center my-4 relative group">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className={`flex-grow border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
            {blockMenu}
          </div>
        );

      default:
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => handlePlusButtonClick(e, block.id)}>
                <Plus className="w-4 h-4" />
              </button>
              <button className={`p-1 rounded w-6 h-6 flex items-center justify-center ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={(e) => { e.stopPropagation(); setShowBlockMenu(showBlockMenu === block.id ? null : block.id); }}>
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input {...commonProps} />
            {blockMenu}
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Project Report</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {project?.name || 'Project'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 min-h-[600px] relative`}>
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Report Details</h2>
          </div>

          <div className="space-y-2">
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>

          <button
            onClick={() => addBlock(blocks.length - 1)}
            className={`flex items-center mt-4 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add block
          </button>
        </div>

        <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mt-6`}>
          <div className="flex items-center gap-2 mb-6">
            <CheckSquare className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Project Completion Questions</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                1. Were all project objectives achieved?
              </label>
              <textarea
                value={answers.objectives}
                onChange={(e) => updateAnswer('objectives', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Describe which objectives were met and any that weren't..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                2. What challenges did you face and how were they resolved?
              </label>
              <textarea
                value={answers.challenges}
                onChange={(e) => updateAnswer('challenges', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="List main challenges and solutions implemented..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                3. What would you do differently next time?
              </label>
              <textarea
                value={answers.improvements}
                onChange={(e) => updateAnswer('improvements', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Lessons learned and improvements for future projects..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                4. Rate the overall project success (1-10):
              </label>
              <select 
                value={answers.rating}
                onChange={(e) => updateAnswer('rating', e.target.value)}
                className={`w-full p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select rating...</option>
                <option value="10">10 - Excellent</option>
                <option value="9">9 - Very Good</option>
                <option value="8">8 - Good</option>
                <option value="7">7 - Satisfactory</option>
                <option value="6">6 - Fair</option>
                <option value="5">5 - Average</option>
                <option value="4">4 - Below Average</option>
                <option value="3">3 - Poor</option>
                <option value="2">2 - Very Poor</option>
                <option value="1">1 - Failed</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                5. Was the project completed within the planned timeline?
              </label>
              <textarea
                value={answers.timeline}
                onChange={(e) => updateAnswer('timeline', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Discuss timeline adherence and any delays..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                6. Did the project stay within budget?
              </label>
              <textarea
                value={answers.budget}
                onChange={(e) => updateAnswer('budget', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Explain budget performance and any overruns..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                7. How effective was the team collaboration?
              </label>
              <textarea
                value={answers.teamwork}
                onChange={(e) => updateAnswer('teamwork', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Assess team communication and collaboration..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                8. How satisfied were stakeholders with the outcome?
              </label>
              <textarea
                value={answers.stakeholders}
                onChange={(e) => updateAnswer('stakeholders', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Describe stakeholder feedback and satisfaction..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                9. Did the project deliverables meet quality standards?
              </label>
              <textarea
                value={answers.quality}
                onChange={(e) => updateAnswer('quality', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Evaluate the quality of deliverables and outcomes..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                10. What recommendations do you have for future similar projects?
              </label>
              <textarea
                value={answers.recommendations}
                onChange={(e) => updateAnswer('recommendations', e.target.value)}
                className={`w-full h-20 p-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Provide recommendations and best practices..."
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveAnswers}
                disabled={savingAnswers}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                <CheckSquare className="w-5 h-5" />
                {savingAnswers ? 'Saving Answers...' : 'Confirm & Save Answers'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFormattingMenu && (
        <div
          ref={formattingMenuRef}
          className={`absolute z-50 mt-1 rounded-xl shadow-xl border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            minWidth: '280px',
            maxHeight: '400px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="py-2 overflow-y-auto max-h-80">
            <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Basic blocks
            </div>
            {blockOptions.map(option => (
              <button
                key={option.id}
                onClick={() => applyFormatting(option.id)}
                className={`w-full flex items-center px-3 py-2.5 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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
      )}


    </div>
  );
};

export default ReportPage;