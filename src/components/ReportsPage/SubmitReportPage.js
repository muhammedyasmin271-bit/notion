import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Save, 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  Tag,
  Plus,
  GripVertical,
  Minus,
  CheckCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import { getTemplatesByRole, populateTemplate } from './ReportTemplates';

const SubmitReportPage = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [tableData, setTableData] = useState({});
  const [selectedImages, setSelectedImages] = useState({});
  const [workerReports, setWorkerReports] = useState([]);

  useEffect(() => {
    loadWorkerReports();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const loadWorkerReports = () => {
    const reports = JSON.parse(localStorage.getItem('workerReports') || '[]');
    setWorkerReports(reports);
  };

  const submitReport = () => {
    if (!reportContent.trim() || !reportTitle.trim()) return;
    
    const report = {
      id: Date.now(),
      title: reportTitle.trim(),
      content: reportContent.trim(),
      author: user?.name || 'Anonymous',
      role: user?.role || 'user',
      createdAt: new Date().toISOString(),
      wordCount: reportContent.trim().split(/\s+/).filter(word => word.length > 0).length,
      status: 'submitted',
      projectId: null,
      priority: 'medium'
    };
    
    const updated = [...workerReports, report];
    setWorkerReports(updated);
    localStorage.setItem('workerReports', JSON.stringify(updated));
    setReportContent('');
    setReportTitle('');
    
    console.log('Report submitted successfully');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Submit Report
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {user?.role === 'manager' 
                  ? 'Create detailed management reports for executive review'
                  : 'Create project reports for management review and tracking'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Report Form */}
          <div className={`p-8 rounded-xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Report Title
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder={user?.role === 'manager' 
                    ? "e.g., Monthly Management Report - Q1 2024 Performance Review"
                    : "e.g., Weekly Project Status Report - Marketing Campaign"
                  }
                  className={`w-full p-4 rounded-lg border font-medium ${isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Template Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Report Content
                  </label>
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'templates' ? null : 'templates')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all duration-200 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
                    >
                      📋 Use Template
                      <svg className={`w-4 h-4 transition-transform ${activeDropdown === 'templates' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {activeDropdown === 'templates' && (
                      <div className={`absolute right-0 top-12 z-50 w-96 rounded-xl shadow-2xl border backdrop-blur-sm overflow-hidden ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                        <div className="py-2">
                          <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                            {user?.role === 'manager' ? 'Management Templates' : 'Project Templates'}
                          </div>
                          <div className="py-1 max-h-80 overflow-y-auto">
                            {getTemplatesByRole(user?.role).map((template, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const populatedTemplate = populateTemplate(template.template, user);
                                  setReportContent(populatedTemplate);
                                  setReportTitle(template.name);
                                  setActiveDropdown(null);
                                }}
                                className={`w-full flex items-start px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}
                              >
                                <div className={`w-10 h-10 mr-3 flex items-center justify-center rounded-lg text-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  {template.icon}
                                </div>
                                <div className="text-left flex-1">
                                  <div className="font-medium">{template.name}</div>
                                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {template.category} • {template.description}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className={`border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                  <div className="p-6 space-y-1 min-h-[600px]">
                    {reportContent.split('\n').map((line, index) => (
                      <div key={index} className="group flex items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors duration-150">
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1 py-1">
                          <div className="relative">
                            <button 
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                              onClick={() => setActiveDropdown(activeDropdown === `plus-${index}` ? null : `plus-${index}`)}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            {activeDropdown === `plus-${index}` && (
                              <div className={`absolute left-8 top-0 z-50 w-72 max-h-80 rounded-xl shadow-2xl border backdrop-blur-sm overflow-hidden ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                                <div className="py-3">
                                  <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
                                    Basic Blocks
                                  </div>
                                  <div className="py-1 max-h-64 overflow-y-auto">
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, ''); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>📝</div>
                                      <span className="font-medium">Text</span>
                                    </button>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '# '); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>#</div>
                                      <span className="font-medium">Heading 1</span>
                                    </button>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '## '); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>#</div>
                                      <span className="font-medium">Heading 2</span>
                                    </button>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '### '); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>#</div>
                                      <span className="font-medium">Heading 3</span>
                                    </button>
                                    <div className={`border-t my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '• '); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>•</div>
                                      <span className="font-medium">Bullet List</span>
                                    </button>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '1. '); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>1.</div>
                                      <span className="font-medium">Numbered List</span>
                                    </button>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '☐ '); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>☐</div>
                                      <span className="font-medium">To-Do List</span>
                                    </button>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '> '); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>"</div>
                                      <span className="font-medium">Quote</span>
                                    </button>
                                    <div className={`border-t my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '---'); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>—</div>
                                      <span className="font-medium">Divider</span>
                                    </button>
                                    <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, '| Header | Column |'); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full flex items-center px-4 py-3 text-sm transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-900'}`}>
                                      <div className={`w-8 h-8 mr-3 flex items-center justify-center rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>⊞</div>
                                      <span className="font-medium">Table</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="relative">
                            <button 
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                              onClick={() => setActiveDropdown(activeDropdown === `grip-${index}` ? null : `grip-${index}`)}
                            >
                              <GripVertical className="w-3 h-3" />
                            </button>
                            {activeDropdown === `grip-${index}` && (
                              <div className={`absolute z-50 mt-1 w-40 rounded-md shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="py-1">
                                  <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index + 1, 0, ''); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>➕ Add Line Below</button>
                                  <button onClick={() => { const lines = reportContent.split('\n'); lines.splice(index, 0, ''); setReportContent(lines.join('\n')); setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⬆️ Add Line Above</button>
                                  <button onClick={() => { const lines = reportContent.split('\n'); if (index > 0) { const line = lines[index]; lines.splice(index, 1); lines.splice(index - 1, 0, line); setReportContent(lines.join('\n')); } setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⬆️ Move Up</button>
                                  <button onClick={() => { const lines = reportContent.split('\n'); if (index < lines.length - 1) { const line = lines[index]; lines.splice(index, 1); lines.splice(index + 1, 0, line); setReportContent(lines.join('\n')); } setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>⬇️ Move Down</button>
                                  <button onClick={() => { const lines = reportContent.split('\n'); if (lines.length > 1) { lines.splice(index, 1); setReportContent(lines.join('\n')); } setActiveDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500`}>🗑️ Delete Line</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 py-1">
                          {line === '---' ? (
                            <div className={`w-full h-px my-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                          ) : line.startsWith('> ') ? (
                            <div className={`border-l-4 pl-4 py-2 my-2 ${isDarkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'}`}>
                              <input
                                type="text"
                                value={line.slice(2)}
                                onChange={(e) => {
                                  const lines = reportContent.split('\n');
                                  lines[index] = '> ' + e.target.value;
                                  setReportContent(lines.join('\n'));
                                }}
                                placeholder="Quote text"
                                className={`w-full outline-none border-none bg-transparent font-inter leading-relaxed italic ${isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                                style={{ lineHeight: '1.6' }}
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={line.startsWith('# ') ? line.slice(2) : line.startsWith('## ') ? line.slice(3) : line.startsWith('### ') ? line.slice(4) : line}
                              onChange={(e) => {
                                const lines = reportContent.split('\n');
                                const originalLine = lines[index];
                                if (originalLine.startsWith('# ')) {
                                  lines[index] = '# ' + e.target.value;
                                } else if (originalLine.startsWith('## ')) {
                                  lines[index] = '## ' + e.target.value;
                                } else if (originalLine.startsWith('### ')) {
                                  lines[index] = '### ' + e.target.value;
                                } else {
                                  lines[index] = e.target.value;
                                }
                                setReportContent(lines.join('\n'));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const lines = reportContent.split('\n');
                                  let newLine = '';
                                  
                                  if (line.startsWith('• ')) {
                                    newLine = '• ';
                                  } else if (line.match(/^\d+\. /)) {
                                    const num = parseInt(line.match(/^(\d+)\./)[1]) + 1;
                                    newLine = num + '. ';
                                  } else if (line.startsWith('☐ ') || line.startsWith('☑ ')) {
                                    newLine = '☐ ';
                                  }
                                  
                                  lines.splice(index + 1, 0, newLine);
                                  setReportContent(lines.join('\n'));
                                }
                              }}
                              placeholder={
                                line.startsWith('# ') ? 'Heading 1' :
                                line.startsWith('## ') ? 'Heading 2' :
                                line.startsWith('### ') ? 'Heading 3' :
                                index === 0 && line === '' ? (user?.role === 'manager' 
                                  ? "Write your detailed management report here..."
                                  : "Write your detailed project report here...") : ''
                              }
                              className={`w-full outline-none border-none bg-transparent font-inter leading-relaxed ${isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'} ${
                                line.startsWith('# ') ? 'text-2xl font-bold' :
                                line.startsWith('## ') ? 'text-xl font-semibold' :
                                line.startsWith('### ') ? 'text-lg font-medium' : ''
                              }`}
                              style={{ lineHeight: '1.6' }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    {reportContent === '' && (
                      <div className="group flex items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors duration-150">
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2 gap-1 py-1">
                          <button 
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                            onClick={() => setReportContent('\n')}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button 
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center w-6 h-6" 
                          >
                            <GripVertical className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 py-1">
                          <input
                            type="text"
                            value=""
                            onChange={(e) => setReportContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setReportContent(e.target.value + '\n');
                              }
                            }}
                            placeholder={user?.role === 'manager' 
                              ? "Write your detailed management report here..."
                              : "Write your detailed project report here..."}
                            className={`w-full outline-none border-none bg-transparent font-inter leading-relaxed ${isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                            style={{ lineHeight: '1.6' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className={`border-t backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} p-4 rounded-lg shadow-lg`}>
                <div className="flex items-center justify-between">
                  {/* Report Metadata */}
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      <span>{reportContent.trim().split(/\s+/).filter(w => w.length > 0).length} words • {reportContent.length} characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>Report will be saved automatically</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setReportContent('');
                        setReportTitle('');
                      }}
                      disabled={!reportContent.trim() && !reportTitle.trim()}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        !reportContent.trim() && !reportTitle.trim()
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : isDarkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      Clear
                    </button>
                    
                    <button
                      onClick={submitReport}
                      disabled={!reportContent.trim() || !reportTitle.trim()}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                        !reportContent.trim() || !reportTitle.trim()
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } shadow-lg`}
                    >
                      <Upload className="w-4 h-4" />
                      {user?.role === 'manager' ? 'Submit Management Report' : 'Submit Project Report'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          {workerReports.filter(r => r.author === user?.name).length > 0 && (
            <div className="mt-8">
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Recent {user?.role === 'manager' ? 'Management' : 'Project'} Reports
              </h4>
              <div className="space-y-4">
                {workerReports.filter(r => r.author === user?.name).slice(-3).reverse().map((report) => (
                  <div key={report.id} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{report.title}</h5>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(report.createdAt).toLocaleDateString()} • {report.wordCount} words
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitReportPage;