import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
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
  FileText
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const GoalPage = () => {
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
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const formattingMenuRef = useRef(null);
  const blockMenuRef = useRef(null);
  const templateMenuRef = useRef(null);
  const blockRefs = useRef({});

  const templates = [
    {
      name: 'Project Goals',
      blocks: [
        { id: 'temp-1', type: 'h1', content: 'Project Goals' },
        { id: 'temp-2', type: 'h2', content: 'Objectives' },
        { id: 'temp-3', type: 'bulleted', content: 'Define clear project scope' },
        { id: 'temp-4', type: 'bulleted', content: 'Set measurable outcomes' },
        { id: 'temp-5', type: 'h2', content: 'Success Metrics' },
        { id: 'temp-6', type: 'todo', content: 'Track progress weekly' }
      ]
    },
    {
      name: 'Team Goals',
      blocks: [
        { id: 'temp-7', type: 'h1', content: 'Team Goals' },
        { id: 'temp-8', type: 'h2', content: 'Team Development' },
        { id: 'temp-9', type: 'bulleted', content: 'Improve collaboration' },
        { id: 'temp-10', type: 'bulleted', content: 'Enhance skills' },
        { id: 'temp-11', type: 'h2', content: 'Performance Targets' },
        { id: 'temp-12', type: 'numbered', content: 'Increase productivity by 20%' }
      ]
    },
    {
      name: 'Personal Goals',
      blocks: [
        { id: 'temp-13', type: 'h1', content: 'Personal Goals' },
        { id: 'temp-14', type: 'quote', content: 'Focus on continuous improvement' },
        { id: 'temp-15', type: 'h2', content: 'Learning Objectives' },
        { id: 'temp-16', type: 'todo', content: 'Complete certification' },
        { id: 'temp-17', type: 'todo', content: 'Attend workshops' }
      ]
    },
    {
      name: 'SMART Goals',
      blocks: [
        { id: 'temp-18', type: 'h1', content: 'SMART Goals Framework' },
        { id: 'temp-19', type: 'h2', content: 'Specific' },
        { id: 'temp-20', type: 'text', content: 'What exactly do you want to accomplish?' },
        { id: 'temp-21', type: 'h2', content: 'Measurable' },
        { id: 'temp-22', type: 'text', content: 'How will you measure progress?' },
        { id: 'temp-23', type: 'h2', content: 'Achievable' },
        { id: 'temp-24', type: 'text', content: 'Is this goal realistic?' },
        { id: 'temp-25', type: 'h2', content: 'Relevant' },
        { id: 'temp-26', type: 'text', content: 'Why is this goal important?' },
        { id: 'temp-27', type: 'h2', content: 'Time-bound' },
        { id: 'temp-28', type: 'text', content: 'When will you complete this goal?' }
      ]
    },
    {
      name: 'OKRs Template',
      blocks: [
        { id: 'temp-29', type: 'h1', content: 'Objectives & Key Results' },
        { id: 'temp-30', type: 'h2', content: 'Objective 1' },
        { id: 'temp-31', type: 'text', content: 'What you want to achieve' },
        { id: 'temp-32', type: 'h3', content: 'Key Results' },
        { id: 'temp-33', type: 'numbered', content: 'Measurable outcome 1' },
        { id: 'temp-34', type: 'numbered', content: 'Measurable outcome 2' },
        { id: 'temp-35', type: 'numbered', content: 'Measurable outcome 3' },
        { id: 'temp-36', type: 'divider', content: '' },
        { id: 'temp-37', type: 'h2', content: 'Objective 2' },
        { id: 'temp-38', type: 'text', content: 'What you want to achieve' },
        { id: 'temp-39', type: 'h3', content: 'Key Results' },
        { id: 'temp-40', type: 'numbered', content: 'Measurable outcome 1' },
        { id: 'temp-41', type: 'numbered', content: 'Measurable outcome 2' }
      ]
    },
    {
      name: 'Sprint Goals',
      blocks: [
        { id: 'temp-42', type: 'h1', content: 'Sprint Goals' },
        { id: 'temp-43', type: 'h2', content: 'Sprint Objective' },
        { id: 'temp-44', type: 'quote', content: 'What is the main focus of this sprint?' },
        { id: 'temp-45', type: 'h2', content: 'User Stories' },
        { id: 'temp-46', type: 'todo', content: 'As a user, I want to...' },
        { id: 'temp-47', type: 'todo', content: 'As a user, I want to...' },
        { id: 'temp-48', type: 'h2', content: 'Definition of Done' },
        { id: 'temp-49', type: 'bulleted', content: 'All tests pass' },
        { id: 'temp-50', type: 'bulleted', content: 'Code reviewed' },
        { id: 'temp-51', type: 'bulleted', content: 'Documentation updated' }
      ]
    },
    {
      name: 'Quarterly Goals',
      blocks: [
        { id: 'temp-52', type: 'h1', content: 'Q1 2024 Goals' },
        { id: 'temp-53', type: 'h2', content: 'Business Objectives' },
        { id: 'temp-54', type: 'numbered', content: 'Increase revenue by 15%' },
        { id: 'temp-55', type: 'numbered', content: 'Launch new product feature' },
        { id: 'temp-56', type: 'h2', content: 'Team Development' },
        { id: 'temp-57', type: 'bulleted', content: 'Hire 2 new developers' },
        { id: 'temp-58', type: 'bulleted', content: 'Complete team training' },
        { id: 'temp-59', type: 'h2', content: 'Key Milestones' },
        { id: 'temp-60', type: 'todo', content: 'Month 1: Planning phase' },
        { id: 'temp-61', type: 'todo', content: 'Month 2: Development phase' },
        { id: 'temp-62', type: 'todo', content: 'Month 3: Testing & launch' }
      ]
    },
    {
      name: 'Learning Goals',
      blocks: [
        { id: 'temp-63', type: 'h1', content: 'Learning & Development Goals' },
        { id: 'temp-64', type: 'h2', content: 'Technical Skills' },
        { id: 'temp-65', type: 'todo', content: 'Master React advanced patterns' },
        { id: 'temp-66', type: 'todo', content: 'Learn TypeScript' },
        { id: 'temp-67', type: 'todo', content: 'Complete AWS certification' },
        { id: 'temp-68', type: 'h2', content: 'Soft Skills' },
        { id: 'temp-69', type: 'bulleted', content: 'Improve public speaking' },
        { id: 'temp-70', type: 'bulleted', content: 'Enhance leadership skills' },
        { id: 'temp-71', type: 'h2', content: 'Learning Resources' },
        { id: 'temp-72', type: 'numbered', content: 'Online courses' },
        { id: 'temp-73', type: 'numbered', content: 'Books and articles' },
        { id: 'temp-74', type: 'numbered', content: 'Conferences and workshops' }
      ]
    },
    {
      name: 'Health & Wellness',
      blocks: [
        { id: 'temp-75', type: 'h1', content: 'Health & Wellness Goals' },
        { id: 'temp-76', type: 'quote', content: 'A healthy mind in a healthy body' },
        { id: 'temp-77', type: 'h2', content: 'Physical Health' },
        { id: 'temp-78', type: 'todo', content: 'Exercise 3 times per week' },
        { id: 'temp-79', type: 'todo', content: 'Walk 10,000 steps daily' },
        { id: 'temp-80', type: 'h2', content: 'Mental Health' },
        { id: 'temp-81', type: 'bulleted', content: 'Practice meditation daily' },
        { id: 'temp-82', type: 'bulleted', content: 'Maintain work-life balance' },
        { id: 'temp-83', type: 'h2', content: 'Nutrition' },
        { id: 'temp-84', type: 'numbered', content: 'Eat 5 servings of fruits/vegetables' },
        { id: 'temp-85', type: 'numbered', content: 'Drink 8 glasses of water daily' }
      ]
    },
    {
      name: 'Financial Goals',
      blocks: [
        { id: 'temp-86', type: 'h1', content: 'Financial Goals' },
        { id: 'temp-87', type: 'h2', content: 'Savings' },
        { id: 'temp-88', type: 'bulleted', content: 'Save 20% of monthly income' },
        { id: 'temp-89', type: 'bulleted', content: 'Build emergency fund (6 months expenses)' },
        { id: 'temp-90', type: 'h2', content: 'Investments' },
        { id: 'temp-91', type: 'todo', content: 'Open investment account' },
        { id: 'temp-92', type: 'todo', content: 'Diversify portfolio' },
        { id: 'temp-93', type: 'h2', content: 'Debt Management' },
        { id: 'temp-94', type: 'numbered', content: 'Pay off credit card debt' },
        { id: 'temp-95', type: 'numbered', content: 'Reduce monthly expenses by 10%' }
      ]
    }
  ];

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
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target)) {
        setShowTemplateMenu(false);
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
        if (data.goal) {
          const goalBlocks = data.goal.split('\n').map((line, index) => ({
            id: `block-${index + 1}`,
            type: 'text',
            content: line
          }));
          setBlocks(goalBlocks.length > 0 ? goalBlocks : [{ id: 'block-1', type: 'text', content: '' }]);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);

    const goalContent = blocks.map(block => block.content).join('\n');

    try {
      const response = await fetch(`http://localhost:5000/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ ...project, goal: goalContent })
      });
      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setSaving(false);
    }
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

  const applyTemplate = (template) => {
    const newBlocks = template.blocks.map(block => ({
      ...block,
      id: `block-${Date.now()}-${Math.random()}`
    }));
    setBlocks(newBlocks);
    setShowTemplateMenu(false);
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
              <h1 className="text-2xl font-bold">Project Goal</h1>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Goal Description</h2>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
              >
                Temp
              </button>
              {showTemplateMenu && (
                <div
                  ref={templateMenuRef}
                  className={`absolute right-0 top-full mt-1 w-56 rounded-lg shadow-lg border z-20 max-h-80 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="py-1">
                    {templates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => applyTemplate(template)}
                        className={`w-full px-4 py-2 text-left transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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

export default GoalPage;