import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Bold, Italic, List, Quote, Type, FileText, Trash2, Star, Menu, Code, Link, Image, Underline, AlignLeft, AlignCenter, AlignRight, Save, Clock, Eye, EyeOff, Archive, ArrowLeft, Download, Share, Moon, Sun, Maximize2, Minimize2, Copy, Mail, MessageCircle, ExternalLink, Edit, Heart, Move, Strikethrough, Subscript, Superscript, Highlighter, Palette, MoreHorizontal, ListOrdered, CheckSquare, Table, Minus, Zap, Sparkles, Focus, Timer, Tag, Folder, Undo, Redo, Mic, Smile, Hash, Target, TrendingUp, BookOpen, Coffee, Flame, Award } from 'lucide-react';

const NotesArchive = ({ onBack, notes, shareNote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('saved');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'saved') return matchesSearch && note.isArchived;
    if (selectedCategory === 'shared') return matchesSearch && note.isShared;
    if (selectedCategory === 'received') return matchesSearch && note.isReceived;
    return matchesSearch;
  });

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50/20">
      <div className="bg-white/95 backdrop-blur-2xl border-b border-blue-200/40 p-8 shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                📚 Notes Archive
              </h1>
              <p className="text-blue-600/70 mt-2 text-lg">Your collection of saved memories and shared thoughts</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-blue-500 bg-blue-100 px-3 py-1 rounded-full">
                  {filteredNotes.length} notes
                </span>
                {selectedNotes.size > 0 && (
                  <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {selectedNotes.size} selected
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all duration-300 hover:scale-110 shadow-md"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-3 bg-blue-100 text-blue-600 rounded-2xl hover:bg-blue-200 transition-all duration-300 hover:scale-110 shadow-md"
              title={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl hover:bg-indigo-200 transition-all duration-300 hover:scale-110 shadow-md"
              title="Advanced Filters"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-5 top-4 w-5 h-5 text-blue-400" />
              <input
                type="text"
                placeholder="🔍 Search notes, tags, content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-blue-50/50 border border-blue-200/40 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/60 transition-all duration-300 text-lg backdrop-blur-sm shadow-md hover:shadow-lg"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-6 py-4 bg-blue-50/50 border border-blue-200/40 rounded-2xl focus:ring-2 focus:ring-blue-500/30 text-blue-700 font-medium shadow-md hover:shadow-lg transition-all duration-300"
            >
              <option value="date">📅 Sort by Date</option>
              <option value="title">📝 Sort by Title</option>
              <option value="words">📊 Sort by Length</option>
              <option value="category">🏷️ Sort by Category</option>
            </select>
            
            {selectedNotes.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    selectedNotes.forEach(noteId => shareNote(notes.find(n => n.id === noteId), 'copy'));
                    setSelectedNotes(new Set());
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Share All
                </button>
                <button
                  onClick={() => setSelectedNotes(new Set())}
                  className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          
          {showFilters && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-blue-200/40 shadow-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">🔧 Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Date Range</label>
                  <select className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/30">
                    <option>All Time</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Word Count</label>
                  <select className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/30">
                    <option>Any Length</option>
                    <option>Short (0-100 words)</option>
                    <option>Medium (100-500 words)</option>
                    <option>Long (500+ words)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Has Tags</label>
                  <select className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/30">
                    <option>All Notes</option>
                    <option>With Tags</option>
                    <option>Without Tags</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory('saved')}
              className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-105 ${
                selectedCategory === 'saved' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25' 
                  : 'bg-white/80 text-green-600 hover:bg-green-50 border border-green-200/40'
              }`}
            >
              💾 Saved Notes
            </button>
            <button
              onClick={() => setSelectedCategory('shared')}
              className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-105 ${
                selectedCategory === 'shared' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/25' 
                  : 'bg-white/80 text-blue-600 hover:bg-blue-50 border border-blue-200/40'
              }`}
            >
              📤 Shared Notes
            </button>
            <button
              onClick={() => setSelectedCategory('received')}
              className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-md hover:shadow-lg hover:scale-105 ${
                selectedCategory === 'received' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/25' 
                  : 'bg-white/80 text-purple-600 hover:bg-purple-50 border border-purple-200/40'
              }`}
            >
              📥 Received Notes
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8' : 'space-y-4'}`}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`group relative backdrop-blur-md border rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
                selectedNotes.has(note.id) 
                  ? 'bg-blue-100/90 border-blue-400/60 shadow-blue-500/20 shadow-xl' 
                  : isDarkMode 
                    ? 'bg-slate-800/90 border-slate-600/30 hover:border-slate-500/50' 
                    : 'bg-white/90 border-blue-200/30 hover:border-blue-300/50'
              } ${
                viewMode === 'list' ? 'flex items-center gap-6 p-6' : 'p-8'
              }`}
              onClick={() => {
                const newSelected = new Set(selectedNotes);
                if (newSelected.has(note.id)) {
                  newSelected.delete(note.id);
                } else {
                  newSelected.add(note.id);
                }
                setSelectedNotes(newSelected);
              }}
            >
              <div className={`flex items-start justify-between ${viewMode === 'list' ? 'mb-0' : 'mb-6'}`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-4 h-4 rounded-full shadow-lg animate-pulse ${
                    selectedCategory === 'saved' ? 'bg-green-400' :
                    selectedCategory === 'shared' ? 'bg-blue-400' : 'bg-purple-400'
                  }`} />
                  <h3 className={`font-bold truncate flex-1 ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  } ${viewMode === 'list' ? 'text-lg' : 'text-xl'}`}>{note.title}</h3>
                  {note.isFavorite && <Star className="w-6 h-6 text-yellow-500 fill-current animate-pulse" />}
                  {selectedNotes.has(note.id) && (
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="relative group">
                    <button className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors" title="Share">
                      <Share className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
                      <button
                        onClick={() => shareNote(note, 'copy')}
                        className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </button>
                      <button
                        onClick={() => shareNote(note, 'email')}
                        className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </button>
                      <button
                        onClick={() => shareNote(note, 'whatsapp')}
                        className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => shareNote(note, 'link')}
                        className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Copy Link
                      </button>
                    </div>
                  </div>
                  <button className="p-1.5 text-gray-400 hover:text-green-500 transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Like">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-slate-600 text-base leading-relaxed mb-6 line-clamp-4">
                {(note.content || '').replace(/<[^>]*>/g, '').substring(0, 180)}...
              </p>
              
              <div className="flex items-center justify-between text-sm text-blue-600/70 mb-4">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {(note.content || '').replace(/<[^>]*>/g, '').split(' ').length} words
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    shareNote(note, 'copy');
                  }}
                  className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-all duration-200 hover:scale-110 shadow-md"
                  title="Share Note"
                >
                  <Share className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this note?')) {
                      // Add delete functionality here
                    }
                  }}
                  className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all duration-200 hover:scale-110 shadow-md"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 mx-auto">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No notes found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NotepadPage = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [receivedNotes, setReceivedNotes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [writingStats, setWritingStats] = useState({ chars: 0, words: 0, readTime: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [writingGoal, setWritingGoal] = useState(500);
  const [writingStreak, setWritingStreak] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const contentRef = useRef(null);
  const toolbarRef = useRef(null);
  const typingTimer = useRef(null);
  const recognition = useRef(null);

  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem('notepad-notes') || '[]');
    const archivedNotes = JSON.parse(localStorage.getItem('archived-notes') || '[]');
    const sharedNotesData = JSON.parse(localStorage.getItem('shared-notes') || '[]');
    const receivedNotesData = JSON.parse(localStorage.getItem('received-notes') || '[]');
    setSavedNotes(archivedNotes);
    setSharedNotes(sharedNotesData);
    setReceivedNotes(receivedNotesData);
    
    if (savedNotes.length === 0) {
      const welcomeNote = {
        id: Date.now(),
        title: 'Welcome to Notepad',
        content: 'Start writing your thoughts here...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setNotes([welcomeNote]);
      setCurrentNote(welcomeNote);
      localStorage.setItem('notepad-notes', JSON.stringify([welcomeNote]));
    } else {
      setNotes(savedNotes);
      setCurrentNote(savedNotes[0]);
    }
  }, []);

  useEffect(() => {
    if (currentNote) {
      const timer = setTimeout(() => {
        setIsSaving(true);
        const updatedNotes = notes.map(note => 
          note.id === currentNote.id ? { ...currentNote, updatedAt: new Date().toISOString() } : note
        );
        setNotes(updatedNotes);
        localStorage.setItem('notepad-notes', JSON.stringify(updatedNotes));
        setTimeout(() => setIsSaving(false), 500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentNote, notes]);

  useEffect(() => {
    if (currentNote?.content) {
      const text = currentNote.content.replace(/<[^>]*>/g, '');
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [currentNote?.content]);

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Untitled',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setCurrentNote(newNote);
    localStorage.setItem('notepad-notes', JSON.stringify(updatedNotes));
  };

  const saveToArchive = () => {
    if (!currentNote || !currentNote.title.trim() || !currentNote.content.trim()) {
      alert('Please add a title and content before saving to archive.');
      return;
    }
    
    const archivedNote = {
      ...currentNote,
      isArchived: true,
      archivedAt: new Date().toISOString()
    };
    
    const updatedSavedNotes = [archivedNote, ...savedNotes];
    setSavedNotes(updatedSavedNotes);
    localStorage.setItem('archived-notes', JSON.stringify(updatedSavedNotes));
    
    alert('Note saved to archive successfully!');
    setShowArchive(true);
  };

  const shareNote = (note, method) => {
    const shareText = `${note.title}\n\n${note.content.replace(/<[^>]*>/g, '')}`;
    const shareUrl = `${window.location.origin}/note/${note.id}`;
    
    // Mark note as shared and save to shared notes
    const sharedNote = {
      ...note,
      isShared: true,
      sharedAt: new Date().toISOString(),
      shareMethod: method
    };
    
    const existingSharedNotes = JSON.parse(localStorage.getItem('shared-notes') || '[]');
    const updatedSharedNotes = [sharedNote, ...existingSharedNotes.filter(n => n.id !== note.id)];
    localStorage.setItem('shared-notes', JSON.stringify(updatedSharedNotes));
    
    switch(method) {
      case 'copy':
        navigator.clipboard.writeText(shareText);
        showNotification('Note copied to clipboard and saved to shared notes!', 'success');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(note.title)}&body=${encodeURIComponent(shareText)}`);
        showNotification('Note shared via email and saved to shared notes!', 'success');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
        showNotification('Note shared via WhatsApp and saved to shared notes!', 'success');
        break;
      case 'link':
        navigator.clipboard.writeText(shareUrl);
        showNotification('Share link copied to clipboard and saved to shared notes!', 'success');
        break;
      default:
        break;
    }
  };

  const updateNote = (field, value) => {
    if (!currentNote) return;
    const updated = { ...currentNote, [field]: value };
    setCurrentNote(updated);
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      updateNote('content', contentRef.current.AlignLeft);
    }
  };

  const toggleFavorite = (noteId) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
    );
    setNotes(updatedNotes);
    localStorage.setItem('notepad-notes', JSON.stringify(updatedNotes));
    if (currentNote?.id === noteId) {
      setCurrentNote({ ...currentNote, isFavorite: !currentNote.isFavorite });
    }
  };

  const deleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem('notepad-notes', JSON.stringify(updatedNotes));
    if (currentNote?.id === noteId) {
      setCurrentNote(updatedNotes[0] || null);
    }
  };

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
    handleContentChange();
  };

  const insertText = (text) => {
    document.execCommand('insertText', false, text);
    contentRef.current?.focus();
    handleContentChange();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      contentRef.current?.focus();
      handleContentChange();
    }
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">Cell</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</table>';
      document.execCommand('insertHTML', false, tableHTML);
      contentRef.current?.focus();
      handleContentChange();
    }
  };

  const changeTextColor = () => {
    const color = prompt('Enter color (hex, rgb, or name):', '#ff0000');
    if (color) {
      document.execCommand('foreColor', false, color);
      contentRef.current?.focus();
      handleContentChange();
    }
  };

  const highlightText = () => {
    const color = prompt('Enter highlight color:', '#ffff00');
    if (color) {
      document.execCommand('backColor', false, color);
      contentRef.current?.focus();
      handleContentChange();
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.toolbar-handle')) {
      setIsDragging(true);
      const rect = toolbarRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      const handleMouseMove = (e) => {
        setToolbarPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY
        });
      };
      
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const renderMarkdown = (content) => {
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3 text-gray-800">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-2 text-gray-700">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-400 pl-4 italic text-gray-600 my-2">$1</blockquote>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's': e.preventDefault(); saveToArchive(); break;
          case 'b': e.preventDefault(); formatText('bold'); break;
          case 'i': e.preventDefault(); formatText('italic'); break;
          case 'u': e.preventDefault(); formatText('underline'); break;
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.onstart = () => setIsListening(true);
      recognition.current.onend = () => setIsListening(false);
      recognition.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        document.execCommand('insertText', false, transcript);
      };
      recognition.current.start();
    }
  };

  const stopVoiceRecognition = () => recognition.current?.stop();
  const insertEmoji = (emoji) => { document.execCommand('insertText', false, emoji); setShowEmojiPicker(false); };
  const undo = () => { if (historyIndex > 0) { updateNote('content', history[historyIndex - 1].content); setHistoryIndex(historyIndex - 1); } };
  const redo = () => { if (historyIndex < history.length - 1) { updateNote('content', history[historyIndex + 1].content); setHistoryIndex(historyIndex + 1); } };
  const addTag = (tagName) => { if (!tags.includes(tagName)) setTags([...tags, tagName]); if (currentNote && !currentNote.tags?.includes(tagName)) updateNote('tags', [...(currentNote.tags || []), tagName]); };
  const removeTag = (tagName) => { if (currentNote) updateNote('tags', currentNote.tags?.filter(tag => tag !== tagName) || []); };

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || (note.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => note.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  if (showArchive) {
    return <NotesArchive onBack={() => setShowArchive(false)} notes={[...notes, ...savedNotes, ...sharedNotes, ...receivedNotes]} shareNote={shareNote} />;
  }

  return (
    <div className={`h-screen flex transition-all duration-500 relative ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black via-gray-900 to-black' 
        : 'bg-gradient-to-br from-white via-gray-50 to-white'
    }`}>
      {/* QUANTUM DIMENSIONAL NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-8 max-w-xl">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`notification-quantum relative overflow-visible transition-all duration-2000 transform-gpu perspective-1000 ${
              notification.type === 'success' 
                ? 'notification-success quantum-success'
                : notification.type === 'error'
                  ? 'notification-error quantum-error'
                  : 'notification-info quantum-info'
            }`}
            style={{ 
              animationDelay: `${index * 250}ms`,
              animationFillMode: 'both',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Quantum Neural Network */}
            <div className="absolute -inset-12 overflow-visible pointer-events-none">
              {/* Neural Nodes */}
              {[...Array(30)].map((_, i) => (
                <div
                  key={`node-${i}`}
                  className={`absolute rounded-full animate-neural-pulse ${
                    notification.type === 'success' ? 'bg-emerald-300 shadow-emerald-300/80' :
                    notification.type === 'error' ? 'bg-red-300 shadow-red-300/80' : 'bg-blue-300 shadow-blue-300/80'
                  }`}
                  style={{
                    width: `${1 + Math.random() * 6}px`,
                    height: `${1 + Math.random() * 6}px`,
                    left: `${Math.random() * 140}%`,
                    top: `${Math.random() * 140}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                    boxShadow: `0 0 ${8 + Math.random() * 16}px currentColor, inset 0 0 ${4 + Math.random() * 8}px rgba(255,255,255,0.3)`,
                    filter: `blur(${Math.random() * 2}px)`
                  }}
                />
              ))}
              
              {/* Quantum Portals */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={`portal-${i}`}
                  className={`absolute border-4 rounded-full animate-quantum-portal opacity-30 ${
                    notification.type === 'success' ? 'border-emerald-400' :
                    notification.type === 'error' ? 'border-red-400' : 'border-blue-400'
                  }`}
                  style={{
                    width: `${80 + i * 60}px`,
                    height: `${80 + i * 60}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotateX(60deg)',
                    animationDelay: `${i * 0.7}s`,
                    animationDuration: `${12 + i * 3}s`,
                    borderStyle: 'dashed',
                    filter: `blur(${i}px) hue-rotate(${i * 30}deg)`
                  }}
                />
              ))}
              
              {/* Energy Streams */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`stream-${i}`}
                  className={`absolute w-px animate-energy-stream ${
                    notification.type === 'success' ? 'bg-gradient-to-t from-emerald-400 via-green-300 to-transparent' :
                    notification.type === 'error' ? 'bg-gradient-to-t from-red-400 via-rose-300 to-transparent' :
                    'bg-gradient-to-t from-blue-400 via-indigo-300 to-transparent'
                  }`}
                  style={{
                    height: `${100 + Math.random() * 200}px`,
                    left: `${20 + Math.random() * 60}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    filter: `blur(1px) brightness(${1.5 + Math.random()})`
                  }}
                />
              ))}
            </div>
            
            {/* Quantum Glass Container */}
            <div className={`absolute inset-0 backdrop-blur-3xl border-4 transition-all duration-3000 quantum-morph ${
              notification.type === 'success' 
                ? isDarkMode 
                  ? 'bg-gradient-to-br from-emerald-900/98 via-green-800/98 via-teal-700/98 via-cyan-800/98 to-emerald-900/98 border-emerald-200/80 shadow-3xl shadow-emerald-300/60' 
                  : 'bg-gradient-to-br from-emerald-50/99 via-green-100/99 via-teal-100/99 via-cyan-100/99 to-emerald-50/99 border-emerald-500/90 shadow-3xl shadow-emerald-400/70'
                : notification.type === 'error'
                  ? isDarkMode 
                    ? 'bg-gradient-to-br from-red-900/98 via-rose-800/98 via-pink-700/98 via-fuchsia-800/98 to-red-900/98 border-red-200/80 shadow-3xl shadow-red-300/60' 
                    : 'bg-gradient-to-br from-red-50/99 via-rose-100/99 via-pink-100/99 via-fuchsia-100/99 to-red-50/99 border-red-500/90 shadow-3xl shadow-red-400/70'
                  : isDarkMode 
                    ? 'bg-gradient-to-br from-blue-900/98 via-indigo-800/98 via-purple-700/98 via-violet-800/98 to-blue-900/98 border-blue-200/80 shadow-3xl shadow-blue-300/60' 
                    : 'bg-gradient-to-br from-blue-50/99 via-indigo-100/99 via-purple-100/99 via-violet-100/99 to-blue-50/99 border-blue-500/90 shadow-3xl shadow-blue-400/70'
            } hover:scale-115 hover:rotate-3 hover:shadow-5xl quantum-hover`} />
            
            {/* Liquid Blob Overlay */}
            <div className={`absolute inset-0 opacity-30 animate-liquid-flow ${
              notification.type === 'success' 
                ? 'bg-gradient-radial from-emerald-400/60 via-green-300/40 to-teal-400/60'
                : notification.type === 'error'
                  ? 'bg-gradient-radial from-red-400/60 via-rose-300/40 to-pink-400/60'
                  : 'bg-gradient-radial from-blue-400/60 via-indigo-300/40 to-purple-400/60'
            }`} />
            
            {/* Quantum Field Layers */}
            <div className="absolute inset-0 overflow-hidden">
              <div className={`absolute inset-0 opacity-50 animate-quantum-field-1 ${
                notification.type === 'success' 
                  ? 'bg-gradient-conic from-emerald-300 via-green-400 via-teal-300 via-cyan-400 via-emerald-300 to-green-400'
                  : notification.type === 'error'
                    ? 'bg-gradient-conic from-red-300 via-rose-400 via-pink-300 via-fuchsia-400 via-red-300 to-rose-400'
                    : 'bg-gradient-conic from-blue-300 via-indigo-400 via-purple-300 via-violet-400 via-blue-300 to-indigo-400'
              }`} />
              <div className={`absolute inset-0 opacity-40 animate-quantum-field-2 ${
                notification.type === 'success' 
                  ? 'bg-gradient-conic from-teal-300 via-emerald-400 via-green-300 via-cyan-400 via-teal-300 to-emerald-400'
                  : notification.type === 'error'
                    ? 'bg-gradient-conic from-pink-300 via-red-400 via-rose-300 via-fuchsia-400 via-pink-300 to-red-400'
                    : 'bg-gradient-conic from-purple-300 via-blue-400 via-indigo-300 via-violet-400 via-purple-300 to-blue-400'
              }`} />
              <div className={`absolute inset-0 opacity-30 animate-quantum-field-3 ${
                notification.type === 'success' 
                  ? 'bg-gradient-radial from-emerald-200/60 via-transparent via-green-200/60 to-teal-200/60'
                  : notification.type === 'error'
                    ? 'bg-gradient-radial from-red-200/60 via-transparent via-rose-200/60 to-pink-200/60'
                    : 'bg-gradient-radial from-blue-200/60 via-transparent via-indigo-200/60 to-purple-200/60'
              }`} />
            </div>
            
            {/* Dimensional Rifts */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 via-cyan-300/30 via-magenta-300/30 via-yellow-300/30 via-white/40 to-transparent -skew-x-15 animate-dimensional-rift" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/30 via-blue-300/25 via-green-300/25 via-purple-300/25 via-white/30 to-transparent skew-x-15 animate-reality-tear" />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 via-orange-300/20 via-pink-300/20 via-white/20 to-transparent -skew-y-12 animate-space-fold" />
            </div>
            
            <div className="relative px-8 py-6 z-10">
              <div className="flex items-start gap-5">
                {/* Levitating 3D Icon */}
                <div className={`relative flex-shrink-0 w-16 h-16 flex items-center justify-center transform transition-all duration-700 animate-levitate ${
                  notification.type === 'success' 
                    ? 'bg-gradient-to-br from-emerald-300 via-green-400 to-teal-500 animate-morph-success shadow-2xl shadow-emerald-400/60'
                    : notification.type === 'error'
                      ? 'bg-gradient-to-br from-red-300 via-rose-400 to-pink-500 animate-morph-error shadow-2xl shadow-red-400/60'
                      : 'bg-gradient-to-br from-blue-300 via-indigo-400 to-purple-500 animate-morph-info shadow-2xl shadow-blue-400/60'
                } hover:scale-125 hover:rotate-180 liquid-morph`}>
                  
                  {/* 3D Depth Layers */}
                  <div className={`absolute inset-1 rounded-2xl opacity-60 ${
                    notification.type === 'success' ? 'bg-gradient-to-br from-emerald-200 to-teal-400' :
                    notification.type === 'error' ? 'bg-gradient-to-br from-red-200 to-pink-400' :
                    'bg-gradient-to-br from-blue-200 to-purple-400'
                  }`} />
                  <div className={`absolute inset-2 rounded-xl opacity-40 ${
                    notification.type === 'success' ? 'bg-gradient-to-br from-emerald-100 to-teal-300' :
                    notification.type === 'error' ? 'bg-gradient-to-br from-red-100 to-pink-300' :
                    'bg-gradient-to-br from-blue-100 to-purple-300'
                  }`} />
                  {/* Multi-Layer Glow */}
                  <div className={`absolute -inset-2 rounded-3xl blur-xl opacity-50 animate-glow-pulse ${
                    notification.type === 'success' ? 'bg-emerald-400' :
                    notification.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                  }`} />
                  <div className={`absolute -inset-1 rounded-2xl blur-lg opacity-70 animate-glow-breathe ${
                    notification.type === 'success' ? 'bg-emerald-300' :
                    notification.type === 'error' ? 'bg-red-300' : 'bg-blue-300'
                  }`} />
                  
                  {notification.type === 'success' && (
                    <svg className="w-9 h-9 text-white animate-magical-draw relative z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" 
                        style={{ 
                          strokeDasharray: 24, 
                          strokeDashoffset: 24, 
                          animation: 'magical-draw 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s forwards',
                          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
                        }} />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-9 h-9 text-white animate-magical-draw relative z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" 
                        style={{ 
                          strokeDasharray: 24, 
                          strokeDashoffset: 24, 
                          animation: 'magical-draw 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s forwards',
                          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
                        }} />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="w-9 h-9 text-white animate-magical-draw relative z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        style={{ 
                          strokeDasharray: 60, 
                          strokeDashoffset: 60, 
                          animation: 'magical-draw 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s forwards',
                          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
                        }} />
                    </svg>
                  )}
                </div>
                
                {/* Enhanced Message */}
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-lg mb-1 ${
                    notification.type === 'success' 
                      ? isDarkMode ? 'text-emerald-100' : 'text-emerald-900'
                      : notification.type === 'error'
                        ? isDarkMode ? 'text-red-100' : 'text-red-900'
                        : isDarkMode ? 'text-blue-100' : 'text-blue-900'
                  } animate-typewriter`}>
                    {notification.type === 'success' ? '✨ Success!' : 
                     notification.type === 'error' ? '⚠️ Error!' : 'ℹ️ Info'}
                  </div>
                  <p className={`text-sm leading-relaxed opacity-90 ${
                    notification.type === 'success' 
                      ? isDarkMode ? 'text-emerald-200' : 'text-emerald-800'
                      : notification.type === 'error'
                        ? isDarkMode ? 'text-red-200' : 'text-red-800'
                        : isDarkMode ? 'text-blue-200' : 'text-blue-800'
                  } animate-fade-in-up`} style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                    {notification.message}
                  </p>
                </div>
                
                {/* Floating Close Button */}
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-125 hover:rotate-90 backdrop-blur-sm ${
                    isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-black/50 hover:text-black/70'
                  } border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/10 rounded-b-3xl overflow-hidden">
                <div className={`h-full rounded-b-3xl transition-all duration-3000 ease-linear relative overflow-hidden ${
                  notification.type === 'success' 
                    ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400'
                    : notification.type === 'error'
                      ? 'bg-gradient-to-r from-red-400 via-rose-400 to-pink-400'
                      : 'bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400'
                }`} style={{ width: '100%', animation: 'shrink 3000ms linear forwards' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-progress-shine" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* MAGICAL LIQUID ANIMATIONS */}
      <style jsx>{`
        .notification-magical {
          animation: magical-entrance 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform: translateX(500px) rotate(45deg) scale(0.3) skewY(20deg);
          opacity: 0;
          filter: blur(20px) hue-rotate(180deg);
        }
        
        @keyframes magical-entrance {
          0% {
            transform: translateX(500px) rotate(45deg) scale(0.3) skewY(20deg);
            opacity: 0;
            filter: blur(20px) hue-rotate(180deg) saturate(3);
          }
          25% {
            transform: translateX(-50px) rotate(-15deg) scale(0.8) skewY(-10deg);
            opacity: 0.4;
            filter: blur(8px) hue-rotate(90deg) saturate(2);
          }
          50% {
            transform: translateX(30px) rotate(8deg) scale(1.15) skewY(5deg);
            opacity: 0.7;
            filter: blur(4px) hue-rotate(45deg) saturate(1.5);
          }
          75% {
            transform: translateX(-10px) rotate(-3deg) scale(0.95) skewY(-2deg);
            opacity: 0.9;
            filter: blur(1px) hue-rotate(15deg) saturate(1.2);
          }
          100% {
            transform: translateX(0) rotate(0deg) scale(1) skewY(0deg);
            opacity: 1;
            filter: blur(0px) hue-rotate(0deg) saturate(1);
          }
        }
        
        @keyframes aurora-1 {
          0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.4; }
          25% { transform: rotate(90deg) scale(1.2); opacity: 0.6; }
          50% { transform: rotate(180deg) scale(0.8); opacity: 0.8; }
          75% { transform: rotate(270deg) scale(1.1); opacity: 0.5; }
        }
        
        @keyframes aurora-2 {
          0%, 100% { transform: rotate(180deg) scale(0.9); opacity: 0.3; }
          33% { transform: rotate(60deg) scale(1.3); opacity: 0.7; }
          66% { transform: rotate(300deg) scale(0.7); opacity: 0.9; }
        }
        
        @keyframes prismatic {
          0% { transform: translateX(-300%) skewX(-20deg) scaleY(1.5); opacity: 0; }
          25% { opacity: 0.6; }
          50% { transform: translateX(0%) skewX(-10deg) scaleY(1.2); opacity: 1; }
          75% { opacity: 0.6; }
          100% { transform: translateX(400%) skewX(0deg) scaleY(1); opacity: 0; }
        }
        
        @keyframes holographic {
          0% { transform: translateX(300%) skewX(20deg) scaleX(1.5); opacity: 0; }
          30% { opacity: 0.8; }
          70% { opacity: 0.8; }
          100% { transform: translateX(-400%) skewX(-20deg) scaleX(1); opacity: 0; }
        }
        
        @keyframes constellation {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); 
            opacity: 0.4; 
            filter: blur(0px);
          }
          25% { 
            transform: translateY(-15px) translateX(10px) rotate(90deg) scale(1.5); 
            opacity: 0.8; 
            filter: blur(1px);
          }
          50% { 
            transform: translateY(-30px) translateX(-5px) rotate(180deg) scale(0.8); 
            opacity: 1; 
            filter: blur(0px);
          }
          75% { 
            transform: translateY(-15px) translateX(-10px) rotate(270deg) scale(1.2); 
            opacity: 0.6; 
            filter: blur(1px);
          }
        }
        
        @keyframes orbit {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 0.2; }
          50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 0.2; }
        }
        
        @keyframes morph-success {
          0%, 100% { 
            border-radius: 2rem 1rem 2rem 1rem; 
            transform: rotate(0deg) scale(1); 
          }
          20% { 
            border-radius: 1rem 3rem 1rem 3rem; 
            transform: rotate(8deg) scale(1.05); 
          }
          40% { 
            border-radius: 3rem 0.5rem 3rem 0.5rem; 
            transform: rotate(-5deg) scale(0.95); 
          }
          60% { 
            border-radius: 0.5rem 2.5rem 0.5rem 2.5rem; 
            transform: rotate(12deg) scale(1.08); 
          }
          80% { 
            border-radius: 2.5rem 1.5rem 2.5rem 1.5rem; 
            transform: rotate(-3deg) scale(0.98); 
          }
        }
        
        @keyframes morph-error {
          0%, 100% { border-radius: 1rem; transform: scale(1) rotate(0deg); }
          50% { border-radius: 2rem; transform: scale(1.1) rotate(180deg); }
        }
        
        @keyframes morph-info {
          0%, 100% { border-radius: 1rem; }
          33% { border-radius: 2rem 0.5rem 2rem 0.5rem; }
          66% { border-radius: 0.5rem 2rem 0.5rem 2rem; }
        }
        
        @keyframes magical-draw {
          0% { 
            stroke-dashoffset: 100; 
            opacity: 0; 
            filter: drop-shadow(0 0 0px rgba(255,255,255,0));
          }
          50% { 
            opacity: 0.8; 
            filter: drop-shadow(0 0 12px rgba(255,255,255,0.9));
          }
          100% { 
            stroke-dashoffset: 0; 
            opacity: 1; 
            filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));
          }
        }
        
        @keyframes typewriter {
          0% { width: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { width: 100%; opacity: 1; }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes progress-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shrink {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        
        .liquid-morph {
          border-radius: 2rem 1rem 2rem 1rem;
          animation: liquid-morph 6s ease-in-out infinite;
        }
        
        @keyframes liquid-morph {
          0%, 100% { border-radius: 2rem 1rem 2rem 1rem; }
          16% { border-radius: 1rem 2.5rem 1rem 2.5rem; }
          33% { border-radius: 3rem 0.5rem 3rem 0.5rem; }
          50% { border-radius: 0.5rem 3rem 0.5rem 3rem; }
          66% { border-radius: 2.5rem 1.5rem 2.5rem 1.5rem; }
          83% { border-radius: 1.5rem 2rem 1.5rem 2rem; }
        }
        
        @keyframes liquid-flow {
          0%, 100% { 
            background-position: 0% 50%; 
            transform: scale(1) rotate(0deg);
          }
          25% { 
            background-position: 100% 25%; 
            transform: scale(1.1) rotate(90deg);
          }
          50% { 
            background-position: 100% 75%; 
            transform: scale(0.9) rotate(180deg);
          }
          75% { 
            background-position: 0% 100%; 
            transform: scale(1.05) rotate(270deg);
          }
        }
        
        @keyframes levitate {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(180deg); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.5; transform: scale(1.1); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
        
        .animate-aurora-1 { animation: aurora-1 8s ease-in-out infinite; }
        .animate-aurora-2 { animation: aurora-2 12s ease-in-out infinite reverse; }
        .animate-prismatic { animation: prismatic 4s ease-in-out infinite; }
        .animate-holographic { animation: holographic 5s ease-in-out infinite; }
        .animate-constellation { animation: constellation 5s ease-in-out infinite; }
        .animate-orbit { animation: orbit 10s linear infinite; }
        .animate-liquid-flow { animation: liquid-flow 8s ease-in-out infinite; }
        .animate-levitate { animation: levitate 3s ease-in-out infinite; }
        .animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }
        .animate-glow-breathe { animation: glow-breathe 3s ease-in-out infinite; }
        .animate-morph-success { animation: morph-success 2s ease-in-out infinite; }
        .animate-morph-error { animation: morph-error 1s ease-in-out infinite; }
        .animate-morph-info { animation: morph-info 3s ease-in-out infinite; }
        .animate-typewriter { animation: typewriter 0.8s ease-out 0.2s both; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-progress-shine { animation: progress-shine 2s ease-in-out infinite; }
        
        .notification-success { 
          --glow-color: #10b981; 
          --particle-color: #34d399;
        }
        .notification-error { 
          --glow-color: #ef4444; 
          --particle-color: #f87171;
        }
        .notification-info { 
          --glow-color: #3b82f6; 
          --particle-color: #60a5fa;
        }
        
        .notification-magical:hover {
          filter: drop-shadow(0 0 30px var(--glow-color)) drop-shadow(0 0 60px var(--glow-color));
          transform: scale(1.05) rotate(2deg);
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
        
        .bg-gradient-conic {
          background: conic-gradient(var(--tw-gradient-stops));
        }
      `}</style>
      {/* Top Right Corner Buttons */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-white ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
          }`}
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowArchive(true)}
          className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          title="View Archive"
        >
          <Archive className="w-5 h-5" />
        </button>
        <button
          onClick={createNewNote}
          className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          title="New Note"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {/* Sidebar */}
      {showSidebar && (
        <div className={`${showSidebar ? 'w-80' : 'w-0'} lg:w-80 backdrop-blur-xl border-r shadow-xl transition-all duration-300 overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-900/90 border-gray-700/60' 
            : 'bg-white/95 border-gray-200/60'
        } ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:relative z-30 h-full`}>
          <div className="p-6 border-b border-gray-200/60">
            <div className="mb-6">
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Notes
              </h2>
              <p className="text-sm text-gray-500 mt-1">{notes.length} notes</p>

            </div>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-200 text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Writing Insights */}
            <div className={`p-4 rounded-2xl mb-4 ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-blue-50/80'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Award className={`w-4 h-4 ${
                  isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`} />
                <span className={`text-sm font-semibold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                }`}>Today's Progress</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>{wordCount}</div>
                  <div className="text-gray-500">Words</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>{notes.length}</div>
                  <div className="text-gray-500">Notes</div>
                </div>
              </div>
            </div>
            
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`group relative p-5 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.03] transform ${
                  currentNote?.id === note.id 
                    ? isDarkMode
                      ? 'bg-gradient-to-br from-blue-900/60 to-indigo-900/60 border-2 border-blue-400/60 shadow-2xl shadow-blue-500/30' 
                      : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-400/60 shadow-2xl shadow-blue-300/40'
                    : isDarkMode
                      ? 'bg-slate-700/60 hover:bg-slate-700/80 border border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/20'
                      : 'bg-white/90 hover:bg-white border border-blue-200/40 hover:shadow-xl hover:shadow-blue-200/40'
                } hover:border-blue-400/70`}
              >
                <div className="flex items-start justify-between" onClick={() => setCurrentNote(note)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className={`font-bold text-lg truncate flex-1 ${
                        isDarkMode ? 'text-white' : 'text-slate-800'
                      }`}>{note.title}</h3>
                      {note.isFavorite && <Star className="w-5 h-5 text-yellow-500 fill-current animate-pulse" />}
                      <div className={`w-3 h-3 rounded-full ${
                        currentNote?.id === note.id ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-300'
                      }`} />
                    </div>
                    <p className={`text-sm line-clamp-3 mb-4 leading-relaxed ${
                      isDarkMode ? 'text-blue-100' : 'text-slate-600'
                    }`}>
                      {(note.content || '').replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                    <div className={`flex items-center justify-between text-xs ${
                      isDarkMode ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {(note.content || '').replace(/<[^>]*>/g, '').split(' ').length} words
                      </span>
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            #{tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="text-xs text-blue-500 font-medium">+{note.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(note.id);
                    }}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                      note.isFavorite 
                        ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' 
                        : isDarkMode 
                          ? 'bg-slate-600 text-yellow-400 hover:bg-yellow-500 hover:text-white' 
                          : 'bg-gray-100 text-yellow-600 hover:bg-yellow-500 hover:text-white'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this note?')) {
                        deleteNote(note.id);
                        showNotification('Note deleted successfully', 'success');
                      }
                    }}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                      isDarkMode 
                        ? 'bg-slate-600 text-red-400 hover:bg-red-500 hover:text-white' 
                        : 'bg-gray-100 text-red-600 hover:bg-red-500 hover:text-white'
                    } hover:shadow-lg hover:shadow-red-500/30`}
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Main Editor */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {currentNote ? (
          <>
            {/* Header */}
            <div className={`backdrop-blur-xl border-b p-6 transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/90 border-gray-700/60' 
                : 'bg-white/90 border-gray-200/60'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleFavorite(currentNote.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star className={`w-5 h-5 ${currentNote.isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => setIsPreview(!isPreview)}
                      className={`p-2 rounded-lg transition-all ${
                        isPreview 
                          ? isDarkMode
                            ? 'bg-indigo-900/50 text-indigo-400'
                            : 'bg-indigo-100 text-indigo-600'
                          : isDarkMode
                            ? 'text-gray-400 hover:text-indigo-400'
                            : 'text-gray-400 hover:text-indigo-600'
                      }`}
                    >
                      {isPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-gray-200' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>

                  </div>
                </div>
              </div>
              
              {/* Enhanced Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFloatingToolbar(!showFloatingToolbar)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                      showFloatingToolbar 
                        ? 'bg-blue-100 text-blue-700 shadow-md' 
                        : isDarkMode 
                          ? 'bg-slate-700 text-blue-300 hover:bg-slate-600' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    <Zap className="w-4 h-4 mr-2 inline" />
                    {showFloatingToolbar ? 'Hide' : 'Show'} Toolbar
                  </button>
                  <button
                    onClick={() => setZenMode(!zenMode)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                      zenMode 
                        ? 'bg-purple-100 text-purple-700 shadow-md' 
                        : isDarkMode 
                          ? 'bg-slate-700 text-purple-300 hover:bg-slate-600' 
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    }`}
                  >
                    <Focus className="w-4 h-4 mr-2 inline" />
                    Zen Mode
                  </button>

                </div>
                <div className={`flex items-center gap-4 text-sm ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {isTyping && (
                    <div className="flex items-center gap-2 animate-pulse">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                      <span>Writing...</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span>{wordCount} words</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Toolbar */}
            {showFloatingToolbar && (
              <div
                ref={toolbarRef}
                className={`fixed z-50 backdrop-blur-xl border shadow-2xl rounded-2xl p-3 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800/95 border-gray-700/60' 
                    : 'bg-white/95 border-gray-200/60'
                } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  left: toolbarPosition.x || '50%',
                  top: toolbarPosition.y || '20%',
                  transform: !toolbarPosition.x ? 'translateX(-50%)' : 'none'
                }}
                onMouseDown={handleMouseDown}
              >
                <div className="toolbar-handle flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50">
                  <Move className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Formatting Toolbar</span>
                </div>
                
                <div className="grid grid-cols-6 gap-1 max-w-sm">
                  {/* Text Formatting */}
                  <button onClick={() => formatText('bold')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('bold') 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Bold">
                    <Bold className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('italic')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('italic') 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Italic">
                    <Italic className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('underline')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('underline') 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Underline">
                    <Underline className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('strikeThrough')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('strikeThrough') 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Strikethrough">
                    <Strikethrough className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('subscript')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Subscript">
                    <Subscript className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('superscript')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Superscript">
                    <Superscript className="w-4 h-4" />
                  </button>
                  
                  {/* Alignment */}
                  <button onClick={() => formatText('justifyLeft')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('justifyLeft') 
                      ? 'bg-green-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Align Left">
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('justifyCenter')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('justifyCenter') 
                      ? 'bg-green-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Align Center">
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('justifyRight')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('justifyRight') 
                      ? 'bg-green-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Align Right">
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button onClick={changeTextColor} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Text Color">
                    <Palette className="w-4 h-4" />
                  </button>
                  <button onClick={highlightText} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Highlight">
                    <Highlighter className="w-4 h-4" />
                  </button>
                  <button onClick={() => insertText('---')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Horizontal Line">
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  {/* Lists and Structure */}
                  <button onClick={() => formatText('insertUnorderedList')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('insertUnorderedList') 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Bullet List">
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => formatText('insertOrderedList')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    document.queryCommandState('insertOrderedList') 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Numbered List">
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button onClick={() => insertText('✔')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Checklist">
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => insertText('> ')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Quote">
                    <Quote className="w-4 h-4" />
                  </button>
                  <button onClick={() => insertText('`')} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Code">
                    <Code className="w-4 h-4" />
                  </button>
                  <button onClick={insertTable} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Insert Table">
                    <Table className="w-4 h-4" />
                  </button>
                  
                  {/* Headings */}
                  <button onClick={() => insertText('# ')} className={`p-2 rounded-lg transition-all hover:scale-105 text-xs font-bold ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Heading 1">
                    H1
                  </button>
                  <button onClick={() => insertText('## ')} className={`p-2 rounded-lg transition-all hover:scale-105 text-xs font-semibold ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Heading 2">
                    H2
                  </button>
                  <button onClick={() => insertText('### ')} className={`p-2 rounded-lg transition-all hover:scale-105 text-xs font-medium ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Heading 3">
                    H3
                  </button>
                  <button onClick={insertLink} className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`} title="Insert Link">
                    <Link className="w-4 h-4" />
                  </button>
                  <button onClick={() => insertText('![alt text](image-url)')} className={`p-2 rounded-lg transition-all hover:scale-105 ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`} title="Insert Image"><Image className="w-4 h-4" /></button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-lg transition-all hover:scale-105 ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`} title="Emoji"><Smile className="w-4 h-4" /></button>
                  <button onClick={isListening ? stopVoiceRecognition : startVoiceRecognition} className={`p-2 rounded-lg transition-all hover:scale-105 ${isListening ? 'bg-red-500 text-white' : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`} title="Voice Input"><Mic className="w-4 h-4" /></button>
                  <button onClick={undo} disabled={historyIndex <= 0} className={`p-2 rounded-lg transition-all hover:scale-105 ${historyIndex <= 0 ? 'opacity-50 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`} title="Undo (Ctrl+Z)"><Undo className="w-4 h-4" /></button>
                  <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`p-2 rounded-lg transition-all hover:scale-105 ${historyIndex >= history.length - 1 ? 'opacity-50 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`} title="Redo (Ctrl+Y)"><Redo className="w-4 h-4" /></button>
                  <button className={`p-2 rounded-lg transition-all hover:scale-105 ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`} title="More Options"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className={`fixed z-40 right-4 top-20 p-4 rounded-2xl shadow-xl border ${
                isDarkMode ? 'bg-slate-800 border-blue-700' : 'bg-white border-blue-200'
              }`}>
                <div className="grid grid-cols-8 gap-2 max-w-xs">
                  {['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Section */}
            {currentNote && (
              <div className={`p-4 border-b ${
                isDarkMode ? 'border-blue-700/60' : 'border-blue-200/60'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className={`w-4 h-4 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentNote.tags?.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Add tag..."
                    className="px-3 py-1 bg-transparent border border-blue-300 rounded-full text-sm focus:outline-none focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            )}



            {/* Floating Action Menu */}
            <div className="fixed bottom-4 right-4 lg:bottom-8 lg:right-8 z-40 flex flex-col gap-2 lg:gap-3">
              <button
                onClick={() => setZenMode(!zenMode)}
                className={`p-3 lg:p-4 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 ${
                  zenMode 
                    ? isDarkMode 
                      ? 'bg-white text-black shadow-white/30' 
                      : 'bg-black text-white shadow-black/30'
                    : isDarkMode 
                      ? 'bg-gray-800/80 text-white hover:bg-white hover:text-black' 
                      : 'bg-white/80 text-black hover:bg-black hover:text-white'
                } border border-gray-300/20`}
                title="Zen Mode"
              >
                <Focus className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`p-4 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 ${
                  isPreview 
                    ? isDarkMode 
                      ? 'bg-white text-black shadow-white/30' 
                      : 'bg-black text-white shadow-black/30'
                    : isDarkMode 
                      ? 'bg-gray-800/80 text-white hover:bg-white hover:text-black' 
                      : 'bg-white/80 text-black hover:bg-black hover:text-white'
                } border border-gray-300/20`}
                title="Preview Mode"
              >
                {isPreview ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-4 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 ${
                  isFullscreen 
                    ? isDarkMode 
                      ? 'bg-white text-black shadow-white/30' 
                      : 'bg-black text-white shadow-black/30'
                    : isDarkMode 
                      ? 'bg-gray-800/80 text-white hover:bg-white hover:text-black' 
                      : 'bg-white/80 text-black hover:bg-black hover:text-white'
                } border border-gray-300/20`}
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
              </button>
            </div>

            {/* Editor Area */}
            <div className={`flex-1 overflow-y-auto transition-all duration-500 relative ${
              zenMode 
                ? isDarkMode 
                  ? 'bg-gradient-to-br from-black via-gray-900 to-black' 
                  : 'bg-gradient-to-br from-white via-gray-50 to-white'
                : isDarkMode 
                  ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                  : 'bg-gradient-to-br from-white via-gray-50/50 to-white'
            } ${zenMode ? 'bg-opacity-95' : ''}`}>
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-20 left-10 w-3 h-3 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`} />
                <div className={`absolute top-40 right-20 w-2 h-2 rounded-full animate-bounce ${
                  isDarkMode ? 'bg-gray-400/15' : 'bg-gray-600/15'
                }`} style={{ animationDelay: '1s' }} />
                <div className={`absolute bottom-32 left-1/4 w-2.5 h-2.5 rounded-full animate-pulse ${
                  isDarkMode ? 'bg-gray-300/15' : 'bg-gray-700/15'
                }`} style={{ animationDelay: '2s' }} />
              </div>
              <div className={`mx-auto transition-all duration-500 ${
                zenMode 
                  ? 'max-w-3xl px-4 py-12 lg:px-8 lg:py-20' 
                  : isFullscreen 
                    ? 'max-w-full px-4 py-6 lg:px-6 lg:py-8' 
                    : 'max-w-4xl px-4 py-6 lg:px-8 lg:py-10'
              } ${typewriterMode ? 'pt-[30vh] lg:pt-[50vh]' : ''}`}>
                <input
                  value={currentNote.title}
                  onChange={(e) => updateNote('title', e.target.value)}
                  className={`w-full font-bold bg-transparent border-0 outline-0 mb-6 lg:mb-8 leading-tight transition-all duration-300 focus:outline-none ${
                    zenMode ? 'text-3xl lg:text-5xl mb-8 lg:mb-12' : 'text-2xl lg:text-4xl'
                  } ${
                    isDarkMode 
                      ? 'placeholder-gray-400/70 text-white' 
                      : 'placeholder-gray-400/60 text-black'
                  } ${zenMode ? 'text-center' : ''}`}
                  placeholder={zenMode ? '🧘 Enter your zen...' : '✨ What\'s on your mind?'}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', direction: 'ltr', textAlign: zenMode ? 'center' : 'left' }}
                  dir="ltr"
                />
                
                {isPreview ? (
                  <div 
                    className={`prose prose-xl max-w-none leading-relaxed transition-colors ${
                      isDarkMode ? 'text-blue-100' : 'text-blue-900'
                    }`}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif', direction: 'ltr', textAlign: 'left' }}
                    dir="ltr"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(currentNote.content || '') }}
                  />
                ) : (
                  <div className="relative">
                    <div className="group relative">
                      <div
                        ref={contentRef}
                        contentEditable
                        onInput={handleContentChange}
                        onBlur={handleContentChange}
                        className={`prose prose-lg max-w-none outline-0 leading-relaxed focus:ring-0 transition-all duration-700 backdrop-blur-sm relative z-10 ${
                          zenMode 
                            ? 'min-h-[60vh] p-12 text-center border-0 shadow-none focus:shadow-3xl rounded-3xl bg-gradient-to-br from-white/5 to-blue-50/10' 
                            : 'min-h-[500px] p-12 border border-blue-200/20 hover:border-blue-300/40 focus:border-blue-400/60 hover:shadow-2xl focus:shadow-3xl rounded-3xl bg-gradient-to-br from-white/80 via-blue-50/20 to-white/60'
                        } ${
                          isDarkMode 
                            ? zenMode
                              ? 'text-gray-100 selection:bg-blue-600/40 focus:bg-slate-800/10'
                              : 'text-blue-50 selection:bg-blue-600/50 focus:bg-slate-700/10 border-blue-400/20 hover:border-blue-300/40 focus:border-blue-200/60'
                            : zenMode
                              ? 'text-slate-700 selection:bg-blue-200/60 focus:bg-blue-50/10'
                              : 'text-slate-800 selection:bg-blue-100/80 focus:bg-blue-50/20'
                        } ${typewriterMode ? 'typewriter-mode' : ''}`}
                        style={{ 
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontSize: zenMode ? '24px' : '20px',
                          lineHeight: zenMode ? '2.2' : '1.9',
                          direction: 'ltr',
                          textAlign: zenMode ? 'center' : 'left'
                        }}
                        dir="ltr"
                        dangerouslySetInnerHTML={{ __html: currentNote.content }}
                        suppressContentEditableWarning
                        placeholder={zenMode ? 'Enter your zen state and let creativity flow...' : 'Begin your masterpiece here...'}
                      />
                      
                      {/* Glow Effect */}
                      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none ${
                        isDarkMode ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5' : 'bg-gradient-to-br from-blue-200/10 to-indigo-200/10'
                      }`} />
                    </div>
                    
                    {/* Floating Word Count */}
                    <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                      isDarkMode ? 'bg-slate-800/60 text-blue-300' : 'bg-white/60 text-blue-600'
                    }`}>
                      <span className="text-sm font-medium">{wordCount} words</span>
                    </div>
                    
                    {/* Floating Progress Ring */}
                    <div className={`absolute bottom-4 right-4 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center ${
                      isDarkMode ? 'bg-slate-800/60' : 'bg-white/60'
                    }`}>
                      <div className="relative w-8 h-8">
                        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-300" />
                          <circle 
                            cx="16" cy="16" r="14" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            fill="none" 
                            strokeDasharray={`${2 * Math.PI * 14}`}
                            strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min(wordCount / writingGoal, 1))}`}
                            className={`transition-all duration-500 ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-500'
                            }`}
                          />
                        </svg>
                        <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {Math.round((wordCount / writingGoal) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Action Buttons */}
                <div className="flex justify-center gap-8 mt-16">
                  <button
                    onClick={saveToArchive}
                    className="group relative inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-3xl hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 transition-all duration-500 shadow-2xl hover:shadow-emerald-500/25 hover:scale-110 text-lg font-semibold overflow-hidden"
                    title="Save to Archive"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-300 to-cyan-300 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
                    <Save className="w-6 h-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10" />
                    <span className="relative z-10">Save to Archive</span>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce opacity-80" />
                  </button>
                  <button
                    onClick={() => shareNote(currentNote, 'copy')}
                    className="group relative inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-3xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-500 shadow-2xl hover:shadow-blue-500/25 hover:scale-110 text-lg font-semibold overflow-hidden"
                    title="Share Note"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-purple-300 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
                    <Share className="w-6 h-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10" />
                    <span className="relative z-10">Share Note</span>
                    <Sparkles className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10 group-hover:animate-spin" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-white">
            <div className="text-center max-w-md animate-fade-in">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-white rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 hover:rotate-3">
                <FileText className="w-16 h-16 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 animate-bounce">Start Writing</h3>
              <p className="text-blue-700 mb-8 text-lg leading-relaxed opacity-80">Capture your thoughts, ideas, and inspiration in beautiful notes</p>
              <button
                onClick={createNewNote}
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-3xl hover:from-blue-700 hover:to-blue-800 transition-all duration-500 shadow-xl hover:shadow-2xl hover:scale-110 text-lg font-semibold group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create Your First Note</span>
                <Sparkles className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotepadPage;