import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../common/PageHeader';
import { 
  Calendar, Clock, Users, Plus, X, User, 
  ChevronDown, ChevronUp, Tag, AlertCircle, 
  CheckCircle, Save, Trash2, FileText 
} from 'lucide-react';

const MEETING_TYPES = [
  'Standup', 'Planning', 'Review', 'Retro', 
  'Presentation', 'Workshop', '1:1', 'Team Sync'
];

const MEETING_DURATIONS = [
  '15 min', '30 min', '45 min', '1 hour', 
  '1.5 hours', '2 hours', 'Half day', 'Full day'
];

const MEETING_STATUSES = [
  'Scheduled', 'In Progress', 'Completed', 'Cancelled'
];

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
  
  // State for main form and UI
  const [form, setForm] = useState({
    ...defaultForm,
    date: new Date().toISOString().split('T')[0], // Set default to today
    time: '10:00' // Default time
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showSubMeetings, setShowSubMeetings] = useState(true);
  const subMeetingFormRef = useRef(null);
  const [subParticipantName, setSubParticipantName] = useState('');
  // Rich text editor ref for Notes
  const notesRteRef = useRef(null);
  
  // State for sub-meetings
  const [subMeetings, setSubMeetings] = useState([]);
  const [showSubMeetingForm, setShowSubMeetingForm] = useState(false);
  const [subMeetingForm, setSubMeetingForm] = useState({
    title: '',
    time: '',
    duration: '15 min',
    participants: []
  });
  
  // UI state
  const [sections, setSections] = useState({
    details: true,
    participants: true,
    subMeetings: true,
    notes: true
  });
  // Scroll progress for top progress bar
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const isCreating = !!(typeof window !== 'undefined' && window.location && 
    typeof window.location.pathname === 'string' && 
    window.location.pathname.includes('meeting-new'));
  
  // Toggle section visibility
  const toggleSection = useCallback((section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  }, []);
  
  // Handle form field changes
  const handleFormChange = useCallback((field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    if (!isDirty) setIsDirty(true);
  }, [isDirty]);

  // Execute formatting commands for the Notes rich text editor
  const handleRteCommand = useCallback((cmd, value = null) => {
    // Ensure the editor is focused before executing
    if (notesRteRef.current) notesRteRef.current.focus();
    try {
      if (cmd === 'formatBlock') {
        document.execCommand('formatBlock', false, value);
      } else {
        document.execCommand(cmd, false, value);
      }
    } catch (e) {
      // no-op; execCommand may be deprecated but works across browsers we target
      console.warn('execCommand failed:', cmd, e);
    }
    // After command, update state with latest HTML
    if (notesRteRef.current) {
      const html = notesRteRef.current.innerHTML;
      setForm(prev => ({ ...prev, summary: html }));
      setIsDirty(true);
    }
  }, [setForm]);

  // Keep contenteditable in sync when form.summary changes externally (e.g., draft load)
  useEffect(() => {
    if (notesRteRef.current && notesRteRef.current.innerHTML !== (form.summary || '')) {
      notesRteRef.current.innerHTML = form.summary || '';
    }
  }, [form.summary]);
  
  // Handle participant changes
  const handleAddParticipant = useCallback((participant) => {
    if (!participant) return;
    
    const participantObj = typeof participant === 'string' 
      ? { id: Date.now().toString(), name: participant }
      : participant;
    
    setForm(prev => ({
      ...prev,
      participants: [...prev.participants, participantObj]
    }));
    setIsDirty(true);
  }, []);
  
  const handleRemoveParticipant = useCallback((index) => {
    setForm(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const meetingData = {
        ...form,
        id: isCreating ? `meeting-${Date.now()}` : form.id,
        updatedAt: new Date().toISOString(),
        subMeetings,
      };
      const meetings = JSON.parse(localStorage.getItem('meetingNotes') || '[]');
      const updatedMeetings = isCreating
        ? [meetingData, ...meetings]
        : meetings.map(m => (m.id === meetingData.id ? meetingData : m));
      localStorage.setItem('meetingNotes', JSON.stringify(updatedMeetings));
      localStorage.removeItem('meetingDraft');
      showNotification(isCreating ? 'Meeting created successfully!' : 'Meeting updated!', 'success');
      setIsDirty(false);
      if (isCreating) navigate(`/meeting-notes`);
    } catch (error) {
      console.error('Error saving meeting:', error);
      showNotification('Failed to save meeting. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isCreating, navigate, showNotification, subMeetings]);

  const handleAddSubMeeting = () => {
    if (!subMeetingForm.title.trim()) return;
    
    const newSubMeeting = {
      id: Date.now().toString(),
      ...subMeetingForm,
      time: subMeetingForm.time || form.time,
      date: form.date,
      // Only use the participants that were explicitly selected for this sub-meeting
      participants: [...subMeetingForm.participants] // Create a new array to avoid reference issues
    };
    
    setSubMeetings(prev => [...prev, newSubMeeting]);
    setSubMeetingForm({
      title: '',
      time: '',
      duration: '15 min',
      participants: []
    });
  };

  const removeSubMeeting = (id) => {
    setSubMeetings(prev => prev.filter(m => m.id !== id));
  };

  const clearSubMeetings = () => {
    setSubMeetings([]);
  };

  const getDisplayName = (u) => {
    if (!u) {
      console.log('getDisplayName: User object is undefined');
      return 'User';
    }
    
    const name = u.name || 
                u.fullName || 
                u.displayName || 
                u.full_name ||
                [u.firstName, u.lastName].filter(Boolean).join(' ') ||
                u.username ||
                'User';
    
    console.log('getDisplayName for user:', {
      id: u.id || u._id,
      name: u.name,
      fullName: u.fullName,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      finalName: name
    });
    
    return name;
  };

  // Visual helpers
  const getInitials = (u) => {
    const n = getDisplayName(u) || '';
    const parts = n.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('');
  };

  const colorFromName = (name) => {
    const palette = ['rose', 'fuchsia', 'violet', 'indigo', 'blue', 'cyan', 'teal', 'emerald', 'lime', 'amber', 'orange', 'pink', 'purple'];
    let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const idx = Math.abs(hash) % palette.length;
    return palette[idx]; // used to build Tailwind classes like bg-blue-100
  };

  // Load draft if any
  useEffect(() => {
    try {
      const draftRaw = localStorage.getItem('meetingDraft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        const { subMeetings: draftSubs, ...rest } = draft || {};
        setForm({ ...defaultForm, ...rest });
        if (Array.isArray(draftSubs)) setSubMeetings(draftSubs);
      }
    } catch { }
  }, []);

  // Restore sub-meeting section visibility after returning from picker
  useEffect(() => {
    try {
      const flag = localStorage.getItem('ui_showSubMeetingForm');
      if (flag === '1') setShowSubMeetingForm(true);
      localStorage.removeItem('ui_showSubMeetingForm');
    } catch {}
  }, []);

  // Load/show preference for showing sub-meetings section
  useEffect(() => {
    try {
      const v = localStorage.getItem('ui_showSubMeetings');
      if (v === '0') setShowSubMeetings(false);
    } catch {}
  }, []);

  // Persist preference for showing sub-meetings section
  useEffect(() => {
    try {
      localStorage.setItem('ui_showSubMeetings', showSubMeetings ? '1' : '0');
    } catch {}
  }, [showSubMeetings]);

  // Persist draft on change (include subMeetings so deletions stick)
  useEffect(() => {
    try {
      localStorage.setItem('meetingDraft', JSON.stringify({ ...form, subMeetings }));
    } catch { }
  }, [form, subMeetings]);

  // Update scroll progress bar
  useEffect(() => {
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      const p = total > 0 ? (scrollTop / total) * 100 : 0;
      setScrollProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openUserPagePicker = (isForSubMeeting = false) => {
    // Persist UI state so the sub-meeting section stays open after returning
    try { localStorage.setItem('ui_showSubMeetingForm', showSubMeetingForm ? '1' : '0'); } catch {}
    // Store the current state based on which picker is being used
    if (isForSubMeeting) {
      // For sub-meeting picker
      localStorage.setItem('subMeetingFormDraft', JSON.stringify(subMeetingForm));
      localStorage.setItem('isSubMeetingPicker', 'true');
      
      // Set preselected participants for sub-meeting
      const preselected = (subMeetingForm.participants || []).map(p => p.id || p._id).filter(Boolean);
      const intent = {
        source: 'submeeting-participants',
        returnTo: '/meeting-new',
        preselected,
        filters: { activeOnly: true, role: 'all' },
        multi: true,
        timestamp: Date.now()
      };
      
      localStorage.setItem('peoplePickerIntent', JSON.stringify(intent));
    } else {
      // For main meeting picker
      localStorage.removeItem('isSubMeetingPicker');
      const preselected = (form.participants || []).map(p => p.id || p._id).filter(Boolean);
      const intent = {
        source: 'meeting-participants',
        returnTo: '/meeting-new',
        preselected,
        filters: { activeOnly: true, role: 'all' },
        multi: true,
        timestamp: Date.now()
      };
      
      localStorage.setItem('peoplePickerIntent', JSON.stringify(intent));
      localStorage.setItem('meetingDraft', JSON.stringify(form));
    }
    
    navigate('/users?picker=1');
  };

  // Handle picker result
  useEffect(() => {
    const checkPickerResult = () => {
      try {
        const raw = localStorage.getItem('peoplePickerResult');
        if (!raw) {
          console.log('No peoplePickerResult found in localStorage');
          return;
        }
        
        const pickerResult = JSON.parse(raw);
        const intent = JSON.parse(localStorage.getItem('peoplePickerIntent') || '{}');
        
        // Clear the result immediately to prevent duplicate processing
        localStorage.removeItem('peoplePickerResult');
        const isSubFlag = localStorage.getItem('isSubMeetingPicker') === 'true';
        const isSubPick = intent.source === 'submeeting-participants' || isSubFlag;
        
        if (!pickerResult || !Array.isArray(pickerResult.selected)) {
          console.log('No selected users in picker result');
          return;
        }
        
        // Map user data from picker result
        const mapUserData = (u) => ({
          id: u.id || u._id,
          name: u.name || u.fullName || u.displayName || u.username,
          username: u.username,
          fullName: u.fullName,
          displayName: u.displayName,
          full_name: u.full_name,
          firstName: u.firstName,
          lastName: u.lastName,
        });
        
        // Handle sub-meeting participant selection
        if (isSubPick) {
          const mappedParticipants = pickerResult.selected.map(mapUserData);
          console.log('Picker: updating SUB participants', {
            count: mappedParticipants.length,
            intentSource: intent.source,
            isSubFlag
          });
          
          setSubMeetingForm(prev => ({
            ...prev,
            participants: mappedParticipants
          }));
          
          // Update the sub-meeting draft
          try {
            const draft = { ...subMeetingForm, participants: mappedParticipants };
            localStorage.setItem('subMeetingFormDraft', JSON.stringify(draft));
          } catch (err) {
            console.error('Failed to persist subMeetingFormDraft', err);
          }
          // Clear sub-meeting flag after handling
          localStorage.removeItem('isSubMeetingPicker');
        } else {
          // Default to MAIN participants when not a sub pick
          const mappedParticipants = pickerResult.selected.map(mapUserData);
          console.log('Picker: updating MAIN participants', {
            count: mappedParticipants.length,
            intentSource: intent.source,
            isSubFlag
          });
          setForm(prev => ({
            ...prev,
            participants: mappedParticipants
          }));
        }
        // Clear intent after handling to avoid stale routing on next mount
        localStorage.removeItem('peoplePickerIntent');
      } catch (err) {
        console.error('Error handling picker result', err);
      }
    };

    const interval = setInterval(checkPickerResult, 500);
    return () => clearInterval(interval);
  }, [navigate, subMeetingForm]);

  // keep page position stable; no auto-scroll to avoid hiding other sections visually

  const handleSaveDraft = () => {
    try {
      const draft = { ...form, subMeetings };
      localStorage.setItem('meetingDraft', JSON.stringify(draft));
      // Lightweight feedback
      console.log('Draft saved');
    } catch (err) {
      console.error('Failed to save draft', err);
    }
  };

  const cancel = () => {
    const ok = window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.');
    if (!ok) return;
    try {
      localStorage.removeItem('meetingDraft');
      localStorage.removeItem('subMeetingFormDraft');
    } catch {}
    navigate('/meeting-notes');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'} transition-colors duration-300`}>
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${scrollProgress}%` }} />
      </div>
      {/* Local animations to avoid Tailwind config changes */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 200ms ease-out; }
        .card-hover { transition: transform 180ms ease, box-shadow 200ms ease; will-change: transform; transform: translateZ(0); }
        .card-hover:hover { transform: translateY(-2px); }
      `}</style>
      {/* Gradient hero */}
      <div className={`relative ${isDarkMode ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950' : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500'} text-white`}> 
        <div className="absolute inset-0 opacity-20 blur-2xl pointer-events-none" aria-hidden>
          <div className="w-72 h-72 rounded-full bg-white/20 absolute -top-10 -left-10" />
          <div className="w-80 h-80 rounded-full bg-white/10 absolute -bottom-12 right-10" />
        </div>
        {/* Decorative pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-10 mix-blend-overlay pointer-events-none" aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gridGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d="M0 10 H100 M0 30 H100 M0 50 H100 M0 70 H100 M0 90 H100 M10 0 V100 M30 0 V100 M50 0 V100 M70 0 V100 M90 0 V100" stroke="url(#gridGrad)" strokeWidth="0.3" />
        </svg>
        <div className="max-w-5xl mx-auto px-4 py-8 relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {isCreating ? 'Schedule New Meeting' : 'Edit Meeting'}
              </h1>
              <p className="mt-1 text-white/80 text-sm">
                {isCreating ? 'Schedule New Meeting' : 'Update details and participants, then save your changes'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur px-2.5 py-1"> 
                  <Calendar className="h-3.5 w-3.5 mr-1.5" /> {form.date || 'Date'}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur px-2.5 py-1">
                  <Clock className="h-3.5 w-3.5 mr-1.5" /> {form.time || 'Time'} • {form.duration}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur px-2.5 py-1">
                  <Tag className="h-3.5 w-3.5 mr-1.5" /> {form.type}
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button type="button" onClick={cancel} className="inline-flex items-center px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 backdrop-blur transition">
                <X className="h-4 w-4 mr-1" /> Cancel
              </button>
              <button type="button" onClick={handleSaveDraft} className="inline-flex items-center px-3 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition">
                <Save className="h-4 w-4 mr-1" /> Save draft
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 pb-24 relative">
        {notification.show && (
          <div 
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 ${
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Decorative background accents */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-8 -left-10 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-16 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full" />
        </div>

        <div className="rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500/40 to-cyan-500/40">
          <div className={`${isDarkMode ? 'bg-slate-900/70' : 'bg-white/80'} backdrop-blur-xl rounded-2xl shadow-xl ring-1 ${isDarkMode ? 'ring-white/10' : 'ring-black/5'} overflow-hidden transition-all`}> 
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200/60 dark:divide-white/10">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">
                <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  {isCreating ? 'Schedule New Meeting' : 'Edit Meeting'}
                </span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isCreating ? 'Fill in the details below to schedule a new meeting' : 'Update details and save changes'}
              </p>
              <div className="mt-2 h-0.5 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-1">
                <label htmlFor="title" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition focus:ring-2 focus:ring-offset-0 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500/50' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-blue-500/30'}`}
                  placeholder="Team standup, Project kickoff, etc."
                  required
                />
              </div>

              {/* Date/Time/Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label htmlFor="date" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500/40' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500/30'}`}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="time" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={(e) => handleFormChange('time', e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500/40' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500/30'}`}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="duration" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Duration
                  </label>
                  <div className="relative">
                    <select
                      id="duration"
                      value={form.duration}
                      onChange={(e) => handleFormChange('duration', e.target.value)}
                      className={`w-full pl-3 pr-10 py-2.5 rounded-lg border text-sm appearance-none transition focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500/40' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500/30'}`}
                    >
                      {MEETING_DURATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Type/Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="type" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Meeting Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="type"
                      value={form.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm appearance-none transition focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500/40' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500/30'}`}
                    >
                      {MEETING_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="status" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      value={form.status}
                      onChange={(e) => handleFormChange('status', e.target.value)}
                      className={`w-full pl-3 pr-10 py-2.5 rounded-lg border text-sm appearance-none transition focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500/40' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500/30'}`}
                    >
                      {MEETING_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleSection('participants')}
                  className="flex items-center w-full text-left focus:outline-none py-2 transition hover:opacity-90"
                >
                  <Users className={`${isDarkMode ? 'text-blue-400' : 'text-blue-500'} h-5 w-5 mr-2`} />
                  <span className="font-medium">Participants</span>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-2 text-sm`}>
                    {form.participants.length} {form.participants.length === 1 ? 'participant' : 'participants'}
                  </span>
                  {sections.participants ? (
                    <ChevronUp className="ml-auto h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="ml-auto h-5 w-5 text-gray-400" />
                  )}
                </button>
                {sections.participants && (
                  <div className="pl-7 mt-2 space-y-3 animate-fadeIn">
                    {form.participants.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {form.participants.map((p, idx) => {
                          const name = getDisplayName(p);
                          const color = colorFromName(name);
                          const light = `${color}-100`;
                          const dark = `${color}-900/30`;
                          return (
                            <span key={`p-${p.id || p._id || idx}`} className={`inline-flex items-center pr-2 pl-1.5 py-1.5 rounded-full text-sm shadow-sm ring-1 ${isDarkMode ? 'ring-white/10' : 'ring-black/5'} ${isDarkMode ? `bg-${dark} text-${color}-200` : `bg-${light} text-${color}-800`} transition`}> 
                              <span className={`mr-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isDarkMode ? `bg-${color}-800 text-${color}-100` : `bg-${color}-200 text-${color}-800`}`}>{getInitials(p)}</span>
                              {name}
                              <button
                                type="button"
                                onClick={() => handleRemoveParticipant(idx)}
                                className={`${isDarkMode ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-black/50 hover:text-black hover:bg-black/5'} ml-1.5 rounded-full p-0.5`}
                                aria-label="Remove participant"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                        No participants added yet.
                      </p>
                    )}
                    <div>
                      <button
                        type="button"
                        onClick={() => openUserPagePicker(false)}
                        className={`inline-flex items-center px-3 py-1.5 border border-dashed rounded-md text-sm ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Add Participants
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleSection('notes')}
                  className="flex items-center w-full text-left focus:outline-none py-2 transition hover:opacity-90"
                >
                  <FileText className={`${isDarkMode ? 'text-green-400' : 'text-green-500'} h-5 w-5 mr-2`} />
                  <span className="font-medium">Notes</span>
                  {sections.notes ? (
                    <ChevronUp className="ml-auto h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="ml-auto h-5 w-5 text-gray-400" />
                  )}
                </button>
                {sections.notes && (
                  <div className="pl-7 mt-2 animate-fadeIn">
                    {/* Notes Rich Text Toolbar */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <button type="button" className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('bold')}><strong>B</strong></button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border italic ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('italic')}>I</button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border underline ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('underline')}>U</button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border line-through ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('strikeThrough')}>S</button>
                      <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mx-1`}>|</span>
                      <button type="button" className={`px-2 py-1 text-xs rounded border font-semibold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('formatBlock', 'H1')}>H1</button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border font-semibold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('formatBlock', 'H2')}>H2</button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border font-semibold ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('formatBlock', 'H3')}>H3</button>
                      <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mx-1`}>|</span>
                      <button type="button" className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('insertUnorderedList')}>• List</button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('insertOrderedList')}>1. List</button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('formatBlock', 'BLOCKQUOTE')}>❝ Quote</button>
                      <button type="button" className={`px-2 py-1 text-xs rounded border font-mono ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('formatBlock', 'PRE')}>{'<>'} Code</button>
                      <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mx-1`}>|</span>
                      <button type="button" className={`px-2 py-1 text-xs rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`} onClick={() => handleRteCommand('removeFormat')}>Clear</button>
                    </div>
                    {/* Contenteditable editor */}
                    <div
                      ref={notesRteRef}
                      contentEditable
                      role="textbox"
                      aria-label="Meeting notes rich text editor"
                      className={`min-h-[120px] w-full px-3 py-2 rounded-lg border text-sm transition focus:ring-2 focus:border-transparent outline-none prose prose-sm ${isDarkMode ? 'bg-gray-900/60 border-gray-700 text-white focus:ring-green-500/40' : 'bg-white border-gray-200 text-gray-900 focus:ring-green-500/30'}`}
                      onInput={(e) => {
                        const html = e.currentTarget.innerHTML;
                        handleFormChange('summary', html);
                      }}
                      onBlur={(e) => {
                        const html = e.currentTarget.innerHTML;
                        if (html !== form.summary) handleFormChange('summary', html);
                      }}
                      suppressContentEditableWarning
                      placeholder="Add meeting agenda, notes, or key points..."
                    />
                  </div>
                )}
              </div>

              {/* Sub-meetings */}
              {!isCreating && (
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => toggleSection('subMeetings')} className="flex items-center focus:outline-none py-2">
                      <Users className={`${isDarkMode ? 'text-purple-400' : 'text-purple-500'} h-5 w-5 mr-2`} />
                      <span className="font-medium">Sub-meetings</span>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-2 text-sm`}>{subMeetings.length}</span>
                      {sections.subMeetings ? (
                        <ChevronUp className="ml-2 h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {sections.subMeetings && (
                      <button
                        type="button"
                        onClick={() => setShowSubMeetingForm(true)}
                        className={`${isDarkMode ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/50' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'} inline-flex items-center px-3 py-1.5 text-sm rounded-md`}
                      >
                        <Plus className="h-4 w-4 mr-1.5" /> Add Sub-meeting
                      </button>
                    )}
                  </div>
                  {sections.subMeetings && (
                    <div className="pl-7 mt-2 space-y-3 animate-fadeIn">
                      {subMeetings.length > 0 ? (
                        <div className="space-y-2">
                          {subMeetings.map(m => (
                            <div key={m.id} className={`card-hover ${isDarkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white/80 border-black/5'} backdrop-blur rounded-lg border p-3 hover:shadow-md`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{m.title || 'Untitled Meeting'}</h4>
                                  <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center text-xs mt-1 space-x-3`}>
                                    <span className="inline-flex items-center"><Clock className="h-3.5 w-3.5 mr-1" />{m.time || form.time} • {m.duration}</span>
                                    {m.participants?.length > 0 && (
                                      <span className="inline-flex items-center"><Users className="h-3.5 w-3.5 mr-1" />{m.participants.length}</span>
                                    )}
                                  </div>
                                </div>
                                <button type="button" onClick={() => removeSubMeeting(m.id)} className={`${isDarkMode ? 'text-gray-300 hover:text-red-400 hover:bg-white/10' : 'text-gray-500 hover:text-red-500 hover:bg-black/5'} p-1 rounded-full transition`}>
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'} p-4 text-center rounded-lg border border-dashed`}>
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>No sub-meetings added yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {sections.subMeetings && showSubMeetingForm && (
                    <div ref={subMeetingFormRef} className={`${isDarkMode ? 'bg-gray-900/60 border-white/10' : 'bg-white/80 border-black/5'} backdrop-blur p-4 rounded-lg border mt-3 animate-fadeIn`}>
 
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
                          <input type="text" value={subMeetingForm.title} onChange={e => setSubMeetingForm(prev => ({ ...prev, title: e.target.value }))} className={`${isDarkMode ? 'bg-gray-900/60 border-gray-700 text-white' : 'bg-white border-gray-200'} w-full px-3 py-2 border rounded-md text-sm transition focus:ring-2 ${isDarkMode ? 'focus:ring-purple-500/40' : 'focus:ring-purple-500/30'}`} />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Time</label>
                          <input type="time" value={subMeetingForm.time} onChange={e => setSubMeetingForm(prev => ({ ...prev, time: e.target.value }))} className={`${isDarkMode ? 'bg-gray-900/60 border-gray-700 text-white' : 'bg-white border-gray-200'} w-full px-3 py-2 border rounded-md text-sm transition focus:ring-2 ${isDarkMode ? 'focus:ring-purple-500/40' : 'focus:ring-purple-500/30'}`} />
                        </div>
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Duration</label>
                          <select value={subMeetingForm.duration} onChange={e => setSubMeetingForm(prev => ({ ...prev, duration: e.target.value }))} className={`${isDarkMode ? 'bg-gray-900/60 border-gray-700 text-white' : 'bg-white border-gray-200'} w-full px-3 py-2 border rounded-md text-sm transition focus:ring-2 ${isDarkMode ? 'focus:ring-purple-500/40' : 'focus:ring-purple-500/30'}`}>
                            <option>15 min</option>
                            <option>30 min</option>
                            <option>45 min</option>
                            <option>60 min</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Participants</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {subMeetingForm.participants.length > 0 ? (
                            subMeetingForm.participants.map((p, idx) => (
                              <span key={`sm-${p.id || p._id || idx}`} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 shadow-sm">
                                <span className="mr-1.5 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100 font-semibold text-[10px]">{getInitials(p)}</span>
                                {getDisplayName(p)}
                                <button type="button" onClick={() => setSubMeetingForm(prev => ({ ...prev, participants: prev.participants.filter((_, i) => i !== idx) }))} className="ml-2 -mr-1 text-green-600 hover:text-red-500 focus:outline-none transition-colors" aria-label="Remove participant">×</button>
                              </span>
                            ))
                          ) : (
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>No participants added</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="text" value={subParticipantName} onChange={e => setSubParticipantName(e.target.value)} placeholder="Type participant name" className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} flex-1 px-3 py-2 border rounded-md text-sm`} />
                          <button type="button" onClick={() => { const name = subParticipantName.trim(); if (!name) return; setSubMeetingForm(prev => ({ ...prev, participants: [...prev.participants, { id: Date.now().toString(), name }] })); setSubParticipantName(''); }} className="px-3 py-2 text-xs rounded-md bg-green-600 text-white hover:bg-green-700">Add</button>
                          <button type="button" onClick={() => openUserPagePicker(true)} className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} px-3 py-2 text-xs rounded-md border`}>Pick from users</button>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={() => setShowSubMeetingForm(false)} className={`${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} px-4 py-2 text-xs rounded-md border`}>Cancel</button>
                        <button type="button" onClick={handleAddSubMeeting} className="px-4 py-2 text-xs rounded-md bg-green-600 text-white hover:bg-green-700">Add Sub-meeting</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={`${isDarkMode ? 'border-white/10 bg-slate-900/60' : 'border-black/5 bg-white/60'} sticky bottom-0 z-10 backdrop-blur px-6 py-4 border-t shadow-lg`}> 
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="flex items-center">
                  {isDirty && (
                    <div className={`${isDarkMode ? 'text-amber-400' : 'text-amber-600'} inline-flex items-center text-sm`}>
                      <AlertCircle className="h-4 w-4 mr-1.5" />
                      <span>Unsaved changes</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <button type="button" onClick={cancel} className={`${isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'} px-4 py-2.5 rounded-lg font-medium transition`}>Cancel</button>
                  <button type="submit" disabled={isSubmitting || !form.title || !form.date || !form.time} className={`px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500/40 flex items-center justify-center ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}>
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {isCreating ? 'Creating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1.5" />
                        {isCreating ? 'Create Meeting' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating save when there are unsaved changes */}
      {isDirty && !isSubmitting && (
        <div className="fixed bottom-6 right-6 z-40">
          <button onClick={handleSubmit} className="shadow-xl inline-flex items-center gap-2 rounded-full px-5 py-3 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
            <Save className="h-4 w-4" /> Quick Save
          </button>
        </div>
      )}
    </div>
  );
}
