import React, { useState, useRef, useEffect } from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Download,
  Upload,
  FileText,
  Palette,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  Settings,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const WorkersPage = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const editorRef = useRef(null);
  const [content, setContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [lineHeight, setLineHeight] = useState(1.6);
  const [savedDocuments, setSavedDocuments] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('workerDocuments') || '[]');
    setSavedDocuments(saved);
  }, []);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(content.trim() === '' ? 0 : words);
    setCharCount(content.length);
  }, [content]);

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const insertText = (text) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }
    editorRef.current.focus();
  };

  const saveDocument = () => {
    const doc = {
      id: Date.now(),
      title: content.split('\n')[0].substring(0, 50) || 'Untitled Document',
      content,
      createdAt: new Date().toISOString(),
      author: user?.name || 'Anonymous',
      wordCount,
      charCount
    };
    
    const updated = [...savedDocuments, doc];
    setSavedDocuments(updated);
    localStorage.setItem('workerDocuments', JSON.stringify(updated));
  };

  const loadDocument = (doc) => {
    setContent(doc.content);
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content;
    }
  };

  const exportDocument = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    } ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Header */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-sm ${
        isDarkMode ? 'bg-black/90 border-gray-800' : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Type className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Professional Workspace</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Advanced typing environment for professionals
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-4 text-sm">
                  <span>{wordCount} words</span>
                  <span>{charCount} characters</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-2 rounded-lg transition-all ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Typography Settings */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Typography</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className={`w-full mt-1 p-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Font Size: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>
                
                <div>
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Line Height: {lineHeight}
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(e.target.value)}
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={saveDocument}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save Document
                </button>
                
                <button
                  onClick={exportDocument}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
            </div>

            {/* Saved Documents */}
            <div className={`p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Recent Documents</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedDocuments.slice(-5).reverse().map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => loadDocument(doc)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isDarkMode 
                        ? 'hover:bg-gray-800 border border-gray-800' 
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium truncate">{doc.title}</span>
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {doc.wordCount} words • {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div className={`rounded-xl border overflow-hidden ${
              isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              
              {/* Toolbar */}
              <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Text Formatting */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => formatText('bold')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('italic')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('underline')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

                  {/* Headings */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => formatText('formatBlock', 'h1')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Heading 1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('formatBlock', 'h2')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

                  {/* Lists */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => formatText('insertUnorderedList')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('insertOrderedList')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />

                  {/* Alignment */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => formatText('justifyLeft')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('justifyCenter')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => formatText('justifyRight')}
                      className={`p-2 rounded-lg transition-all ${
                        isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                      title="Align Right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor Area */}
              <div className="flex">
                {/* Writing Area */}
                <div className={`flex-1 ${showPreview ? 'w-1/2' : 'w-full'}`}>
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => setContent(e.target.innerHTML)}
                    className={`min-h-96 p-8 outline-none resize-none leading-relaxed ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    style={{
                      fontFamily: fontFamily,
                      fontSize: `${fontSize}px`,
                      lineHeight: lineHeight,
                      minHeight: isFullscreen ? 'calc(100vh - 200px)' : '500px'
                    }}
                    placeholder="Start typing your professional document here..."
                    suppressContentEditableWarning={true}
                  />
                </div>

                {/* Preview Area */}
                {showPreview && (
                  <div className={`w-1/2 border-l ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                      <h4 className="font-semibold">Preview</h4>
                    </div>
                    <div
                      className={`p-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      style={{
                        fontFamily: fontFamily,
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeight
                      }}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className={`px-8 py-4 border-t flex items-center justify-between ${
                isDarkMode ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user?.name || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
                
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Professional Workspace • Auto-saved
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkersPage;