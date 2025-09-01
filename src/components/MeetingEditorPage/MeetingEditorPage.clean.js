import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../common/PageHeader';
import { Calendar, Clock, Users, Plus, X, User, Bold, Italic, Underline, List as ListIcon, ListOrdered, Quote, Code, FileText as FileTextIcon, CheckCircle, Minus } from 'lucide-react';

const defaultForm = {
  title: '',
  type: 'Standup',
  date: '',
  time: '',
  duration: '30 min',
  status: 'Scheduled',
  participants: [],
  summary: ''
};

export default function MeetingEditorPage() {
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subMeetings, setSubMeetings] = useState([]);
  const [showSubMeetingForm, setShowSubMeetingForm] = useState(false);
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [formatPanel, setFormatPanel] = useState('text'); // 'text' | 'headings' | 'lists' | 'blocks'
  const [showFormatPopover, setShowFormatPopover] = useState(false);
  const descRef = useRef(null);
  const [subMeetingForm, setSubMeetingForm] = useState({
    title: '',
    time: '',
    duration: '15 min',
    participants: []
  });

  const handleAddSubMeeting = () => {
    if (!subMeetingForm.title.trim()) return;
    
    const newSubMeeting = {
      id: Date.now().toString(),
      ...subMeetingForm,
      time: subMeetingForm.time || form.time,
      date: form.date,
      participants: [...subMeetingForm.participants]
    };

    
    setSubMeetings(prev => [...prev, newSubMeeting]);
    setSubMeetingForm({
      title: '',
      time: '',
      duration: '15 min',
      participants: []
    });
    setShowSubMeetingForm(false);
  };

  const removeSubMeeting = (id) => {
    setSubMeetings(prev => prev.filter(m => m.id !== id));
  };

  const getDisplayName = (u) => {
    if (!u) return 'User';
    return u.name || u.fullName || u.displayName || u.full_name ||
           [u.firstName, u.lastName].filter(Boolean).join(' ') ||
           u.username || 'User';
  };

  // Load draft if any
  useEffect(() => {
    try {
      const draftRaw = localStorage.getItem('meetingDraft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        setForm({ ...defaultForm, ...draft });
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newNote = {
        id: Date.now().toString(),
        title: form.title,
        type: form.type,
        date: form.date,
        time: form.time,
        duration: form.duration,
        status: form.status,
        participants: form.participants,
        summary: form.summary,
        subMeetings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const existing = JSON.parse(localStorage.getItem('meetingNotes') || '[]');
      const updated = [newNote, ...existing];
      localStorage.setItem('meetingNotes', JSON.stringify(updated));
      localStorage.removeItem('meetingDraft');
      
      navigate('/meeting-notes');
    }, 1000);
  };

  const cancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate(-1);
    }
  };

  // Formatting helpers for Meeting Description (form.summary)
  const updateSummary = (newSummary, start, end) => {
    setForm(prev => ({ ...prev, summary: newSummary }));
    // Restore selection after state update
    requestAnimationFrame(() => {
      if (descRef.current) {
        descRef.current.focus();
        try {
          descRef.current.setSelectionRange(start, end);
        } catch {}
      }
    });
  };

  const surroundSelection = (before, after) => {
    const ta = descRef.current;
    const value = form.summary || '';
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end);
    const newStart = start + before.length;
    const newEnd = newStart + selected.length;
    updateSummary(newValue, newStart, newEnd);
  };

  const insertAtLineStart = (prefix) => {
    const ta = descRef.current;
    const value = form.summary || '';
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const after = value.slice(end);
    const lineStart = before.lastIndexOf('\n') + 1;
    const newBefore = before.slice(0, lineStart) + prefix + before.slice(lineStart);
    const newStart = start + prefix.length;
    const newEnd = end + prefix.length;
    updateSummary(newBefore + sel + after, newStart, newEnd);
  };

  const handleFormat = (action) => {
    switch (action) {
      case 'bold':
        surroundSelection('**', '**');
        break;
      case 'italic':
        surroundSelection('*', '*');
        break;
      case 'underline':
        surroundSelection('<u>', '</u>');
        break;
      case 'strikethrough':
        surroundSelection('~~', '~~');
        break;
      case 'highlight':
        surroundSelection('==', '==');
        break;
      case 'heading1':
        insertAtLineStart('# ');
        break;
      case 'heading2':
        insertAtLineStart('## ');
        break;
      case 'heading3':
        insertAtLineStart('### ');
        break;
      case 'list':
        insertAtLineStart('- ');
        break;
      case 'numbered-list':
        insertAtLineStart('1. ');
        break;
      default:
        break;
    }
  };

  const handleInsertBlock = (type) => {
    const ta = descRef.current;
    const value = form.summary || '';
    if (!ta) return;
    const start = ta.selectionStart ?? value.length;
    const blockMap = {
      quote: '\n> Quote...\n',
      code: '\n```\ncode\n```\n',
      table: '\n| Col1 | Col2 |\n| ---- | ---- |\n| Val1 | Val2 |\n',
      task: '\n- [ ] Task item\n',
      divider: '\n---\n'
    };
    const insert = blockMap[type] || '\n';
    const newValue = value.slice(0, start) + insert + value.slice(start);
    const newPos = start + insert.length;
    updateSummary(newValue, newPos, newPos);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Meeting"
        subtitle="Fill in the meeting details"
        icon={Calendar}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="Enter meeting title"
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Duration
            </label>
            <select
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="15 min">15 minutes</option>
              <option value="30 min">30 minutes</option>
              <option value="45 min">45 minutes</option>
              <option value="1 hour">1 hour</option>
              <option value="1.5 hours">1.5 hours</option>
              <option value="2 hours">2 hours</option>
              <option value="3 hours">3+ hours</option>
            </select>
          </div>
        </div>
        
        {/* Meeting Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Meeting Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="Standup">Standup</option>
              <option value="Planning">Planning</option>
              <option value="Review">Review</option>
              <option value="Retro">Retrospective</option>
              <option value="One-on-One">One-on-One</option>
              <option value="Workshop">Workshop</option>
              <option value="Presentation">Presentation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {/* Participants Section */}
        <div className="mt-6">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Participants
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.participants.length > 0 ? (
              form.participants.map((p, idx) => (
                <span 
                  key={`participant-${p.id || p._id || idx}`} 
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                >
                  {getDisplayName(p)}
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm(prev => ({
                        ...prev,
                        participants: prev.participants.filter(part => 
                          (p.id && part.id !== p.id) || 
                          (p._id && part._id !== p._id) || 
                          part !== p
                        )
                      }));
                    }} 
                    className="ml-2 -mr-1 text-blue-500 hover:text-red-500 focus:outline-none transition-colors"
                    aria-label="Remove participant"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No participants added yet</p>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setShowParticipantPicker(true)}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            <Users className="h-4 w-4 mr-2" />
            {form.participants.length > 0 ? 'Add More Participants' : 'Add Participants'}
          </button>
        </div>

        {/* Meeting Description */}
        <div className="mt-6">
          <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Meeting Description
          </label>
          {/* Type Popover */}
          <div className="mb-2 relative">
            <button
              type="button"
              onClick={() => setShowFormatPopover(v => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border ${isDarkMode ? 'bg-gray-800 text-blue-200 border-blue-800' : 'bg-white text-blue-800 border-blue-200'} shadow-sm hover:bg-blue-50`}
            >
              Type
            </button>
            {showFormatPopover && (
              <div className={`absolute z-20 mt-2 w-[520px] max-w-[95vw] rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-blue-100 bg-white'} shadow-lg p-3`}>
                <div className="flex items-center gap-1 mb-2">
                  {[
                    { key: 'text', label: 'Text' },
                    { key: 'headings', label: 'Headings' },
                    { key: 'lists', label: 'Lists' },
                    { key: 'blocks', label: 'Blocks' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFormatPanel(tab.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${formatPanel === tab.key ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <div className="ml-auto">
                    <button type="button" onClick={() => setShowFormatPopover(false)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Close</button>
                  </div>
                </div>
                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-900/30 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
                  {formatPanel === 'text' && (
                    <div className="flex items-center flex-wrap gap-2">
                      <button onClick={() => handleFormat('bold')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Bold"><Bold className="h-4 w-4" /></button>
                      <button onClick={() => handleFormat('italic')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Italic"><Italic className="h-4 w-4" /></button>
                      <button onClick={() => handleFormat('underline')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Underline"><Underline className="h-4 w-4" /></button>
                      <button onClick={() => handleFormat('strikethrough')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Strikethrough"><span className="text-sm font-bold">S</span></button>
                      <button onClick={() => handleFormat('highlight')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Highlight"><span className="text-sm font-bold">H</span></button>
                    </div>
                  )}
                  {formatPanel === 'headings' && (
                    <div className="flex items-center flex-wrap gap-2">
                      <button onClick={() => handleFormat('heading1')} className="px-3 py-2 text-gray-700 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Heading 1">H1</button>
                      <button onClick={() => handleFormat('heading2')} className="px-3 py-2 text-gray-700 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Heading 2">H2</button>
                      <button onClick={() => handleFormat('heading3')} className="px-3 py-2 text-gray-700 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Heading 3">H3</button>
                    </div>
                  )}
                  {formatPanel === 'lists' && (
                    <div className="flex items-center flex-wrap gap-2">
                      <button onClick={() => handleFormat('list')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Bullet List"><ListIcon className="h-4 w-4" /></button>
                      <button onClick={() => handleFormat('numbered-list')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Numbered List"><ListOrdered className="h-4 w-4" /></button>
                    </div>
                  )}
                  {formatPanel === 'blocks' && (
                    <div className="flex items-center flex-wrap gap-2">
                      <button onClick={() => handleInsertBlock('quote')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Quote"><Quote className="h-4 w-4" /></button>
                      <button onClick={() => handleInsertBlock('code')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Code"><Code className="h-4 w-4" /></button>
                      <button onClick={() => handleInsertBlock('table')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Table"><FileTextIcon className="h-4 w-4" /></button>
                      <button onClick={() => handleInsertBlock('task')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Task"><CheckCircle className="h-4 w-4" /></button>
                      <button onClick={() => handleInsertBlock('divider')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg" title="Divider"><Minus className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <textarea
            ref={descRef}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}
            placeholder="Add meeting agenda, discussion points, or any important notes..."
          />
        </div>
        
        {/* Form Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={cancel}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              }`}
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleSubmit({ preventDefault: () => {} })}
                className="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-900/50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => setShowSubMeetingForm(!showSubMeetingForm)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2 ${
                  isDarkMode 
                    ? 'border-green-600 text-green-300 hover:bg-green-900/30' 
                    : 'border-green-500 text-green-700 hover:bg-green-50'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Add Sub-meeting</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.title || !form.date || !form.time}
                className={`px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  (isSubmitting || !form.title || !form.date || !form.time) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Meeting'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
