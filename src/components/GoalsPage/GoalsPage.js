import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  GripVertical,
  Type,
  Hash,
  List,
  CheckSquare,
  Quote,
  Minus,
  Lightbulb,
  Copy,
  ChevronUp,
  ChevronDown,
  Trash2,
  Menu,
  MessageSquare
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const GoalsPage = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [blocks, setBlocks] = useState([{ id: 'block-1', type: 'text', content: '' }]);
  const [showFormattingMenu, setShowFormattingMenu] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showBlockMenu, setShowBlockMenu] = useState(null);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const formattingMenuRef = useRef(null);
  const blockMenuRef = useRef(null);
  const blockRefs = useRef({});

  useEffect(() => {
    const saved = localStorage.getItem('goalBlocks');
    if (saved) {
      try {
        setBlocks(JSON.parse(saved));
      } catch (e) {
        setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('goalBlocks', JSON.stringify(blocks));
  }, [blocks]);

  // Handle click outside formatting menu
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
          // We'll show the menu at the cursor position
        }
        setShowFormattingMenu(id);
      }
    }
  };

  // Handle click on plus button to show formatting menu
  const handlePlusButtonClick = (e, blockId) => {
    e.stopPropagation();
    setActiveBlockId(blockId);
    setShowFormattingMenu(showFormattingMenu === blockId ? null : blockId);
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
      case 'h1':
        changeBlockType(activeBlockId, 'h1');
        break;
      case 'h2':
        changeBlockType(activeBlockId, 'h2');
        break;
      case 'h3':
        changeBlockType(activeBlockId, 'h3');
        break;
      case 'bulleted':
        changeBlockType(activeBlockId, 'bulleted');
        break;
      case 'numbered':
        changeBlockType(activeBlockId, 'numbered');
        break;
      case 'todo':
        changeBlockType(activeBlockId, 'todo');
        break;
      case 'quote':
        changeBlockType(activeBlockId, 'quote');
        break;
      case 'divider':
        addBlock(blocks.findIndex(b => b.id === activeBlockId), 'divider');
        break;
      case 'callout':
        changeBlockType(activeBlockId, 'callout');
        break;
      default:
        break;
    }

    // Close the formatting menu
    setShowFormattingMenu(null);
  };

  // Get placeholder text for block
  const getBlockPlaceholder = (type) => {
    switch (type) {
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      case 'bulleted': return 'List item';
      case 'numbered': return 'List item';
      case 'todo': return 'To-do item';
      case 'quote': return 'Quote';
      case 'callout': return 'Callout';
      default: return 'Type \'/\' for commands';
    }
  };

  // Render block based on type
  const renderBlock = (block, index) => {
    const commonProps = {
      ref: (el) => blockRefs.current[block.id] = el,
      key: block.id,
      className: `w-full outline-none resize-none border-none bg-transparent py-1 px-2 rounded ${isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`,
      value: block.content,
      onChange: (e) => updateBlock(block.id, e.target.value),
      onKeyDown: (e) => handleBlockKeyDown(block.id, e),
      onFocus: () => setActiveBlockId(block.id),
      placeholder: getBlockPlaceholder(block.type)
    };

    switch (block.type) {
      case 'h1':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
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
              className={`${commonProps.className} text-4xl font-bold py-2`}
            />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
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
              className={`${commonProps.className} text-3xl font-bold py-2`}
            />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
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
              className={`${commonProps.className} text-2xl font-bold py-1`}
            />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'bulleted':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
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
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'numbered':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
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
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
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
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'quote':
        return (
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="border-l-4 border-gray-400 dark:border-gray-500 pl-4 py-1">
              <input {...commonProps} />
            </div>
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'divider':
        return (
          <div className="flex items-center my-4 relative group py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'callout':
        return (
          <div className="flex items-start group relative bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 my-2 py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <Lightbulb className="w-5 h-5 text-blue-500 mr-2 mt-1" />
            <input {...commonProps} />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="flex items-start group relative py-1">
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => handlePlusButtonClick(e, block.id)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 w-6 h-6 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id);
                }}
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </div>
            <input {...commonProps} />
            {showBlockMenu === block.id && (
              <div
                ref={blockMenuRef}
                className={`absolute left-0 top-0 mt-8 w-48 rounded-lg shadow-lg border z-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
              >
                <div className="py-1">
                  <button
                    onClick={() => duplicateBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => moveBlockUp(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Move up
                  </button>
                  <button
                    onClick={() => moveBlockDown(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Move down
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Goals</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Write your goals and objectives</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowQuickNav(!showQuickNav)}
              className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Menu className="w-4 h-4" />
            </button>
            {showQuickNav && (
              <div className={`absolute right-0 top-12 w-48 rounded-lg shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="py-2">
                  <button onClick={() => { navigate('/tasks'); setShowQuickNav(false); }} className={`w-full px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center gap-2`}>
                    <CheckSquare className="w-4 h-4" />Tasks
                  </button>
                  <button onClick={() => { navigate('/comments'); setShowQuickNav(false); }} className={`w-full px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center gap-2`}>
                    <MessageSquare className="w-4 h-4" />Comments
                  </button>
                  <button onClick={() => { navigate('/goals'); setShowQuickNav(false); }} className={`w-full px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center gap-2`}>
                    <Target className="w-4 h-4" />Goals
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-8 min-h-[calc(100vh-200px)]`}>
          <div className="space-y-2">
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>

          {/* Add block button */}
          <button
            onClick={() => addBlock(blocks.length - 1)}
            className="flex items-center mt-4 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add block
          </button>
        </div>
      </div>

      {/* Formatting Menu - Notion Style */}
      {showFormattingMenu && (
        <div
          ref={formattingMenuRef}
          className={`absolute z-50 mt-1 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            minWidth: '250px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="py-2">
            {/* Text section */}
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Basic blocks
            </div>
            <button
              onClick={() => applyFormatting('text')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Type className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Text</div>
                <div className="text-xs text-gray-500">Just start writing with plain text.</div>
              </div>
            </button>
            <button
              onClick={() => applyFormatting('h1')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Hash className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Heading 1</div>
                <div className="text-xs text-gray-500">Big section heading.</div>
              </div>
            </button>
            <button
              onClick={() => applyFormatting('h2')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Hash className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Heading 2</div>
                <div className="text-xs text-gray-500">Medium section heading.</div>
              </div>
            </button>
            <button
              onClick={() => applyFormatting('h3')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Hash className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Heading 3</div>
                <div className="text-xs text-gray-500">Small section heading.</div>
              </div>
            </button>

            {/* Lists section */}
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
              Lists
            </div>
            <button
              onClick={() => applyFormatting('bulleted')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <List className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Bulleted list</div>
                <div className="text-xs text-gray-500">Create a simple bulleted list.</div>
              </div>
            </button>
            <button
              onClick={() => applyFormatting('numbered')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <List className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Numbered list</div>
                <div className="text-xs text-gray-500">Create a list with numbering.</div>
              </div>
            </button>
            <button
              onClick={() => applyFormatting('todo')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <CheckSquare className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">To-do list</div>
                <div className="text-xs text-gray-500">Track tasks with a to-do list.</div>
              </div>
            </button>

            {/* Media section */}
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
              Media
            </div>
            <button
              onClick={() => applyFormatting('quote')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Quote className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Quote</div>
                <div className="text-xs text-gray-500">Capture a quote.</div>
              </div>
            </button>
            <button
              onClick={() => applyFormatting('divider')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Minus className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Divider</div>
                <div className="text-xs text-gray-500">Visually divide blocks.</div>
              </div>
            </button>
            <button
              onClick={() => applyFormatting('callout')}
              className={`w-full flex items-center px-4 py-2 text-left hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Lightbulb className="w-5 h-5 mr-3 text-gray-500" />
              <div>
                <div className="font-medium">Callout</div>
                <div className="text-xs text-gray-500">Make writing stand out.</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;