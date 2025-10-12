import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Archive, Search, Clock, Filter, Plus, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const getExcerpt = (html, length = 140) => {
  const text = (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > length ? text.slice(0, length) + '…' : text;
};

export default function SavedNotesPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [notes, setNotes] = useState([]);
  // Filters (persisted)
  const [q, setQ] = useState('');
  const [view, setView] = useState('all'); // all | favorites | archived
  const [sortBy, setSortBy] = useState('edited'); // edited | created | title
  const cardRefs = useRef({});
  const [justSavedId, setJustSavedId] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('notion-notes');
      const parsed = raw ? JSON.parse(raw) : [];
      setNotes(Array.isArray(parsed) ? parsed : []);
      // Restore filters
      const saved = localStorage.getItem('saved-notes-filters');
      if (saved) {
        const f = JSON.parse(saved);
        if (typeof f.q === 'string') setQ(f.q);
        if (['all','favorites','archived'].includes(f.view)) setView(f.view);
        if (['edited','created','title'].includes(f.sortBy)) setSortBy(f.sortBy);
      } else {
        // Default to show all (including archived)
        setView('all');
      }
      // Read the handoff id for just-saved note and store locally
      const preferId = localStorage.getItem('notepad-active-id');
      if (preferId) setJustSavedId(preferId);
    } catch {
      setNotes([]);
    }
  }, []);

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem('saved-notes-filters', JSON.stringify({ q, view, sortBy }));
    } catch {}
  }, [q, view, sortBy]);

  // Counts for segments
  const counts = useMemo(() => {
    const total = notes.length;
    const fav = notes.filter(n => n.properties?.isFavorite).length;
    const archived = notes.filter(n => n.properties?.isArchived).length;
    return { total, fav, archived };
  }, [notes]);

  const result = useMemo(() => {
    let arr = [...notes];
    if (view === 'favorites') arr = arr.filter(n => n.properties?.isFavorite);
    if (view === 'archived') arr = arr.filter(n => n.properties?.isArchived);
    // view === 'all' shows everything, including archived
    if (q.trim()) {
      const qq = q.toLowerCase();
      arr = arr.filter(n =>
        (n.title || '').toLowerCase().includes(qq) ||
        (n.description || '').toLowerCase().includes(qq) ||
        (n.properties?.tags || []).some(t => (t || '').toLowerCase().includes(qq))
      );
    }
    arr.sort((a,b) => {
      if (sortBy === 'title') return (a.title||'').localeCompare(b.title||'');
      if (sortBy === 'created') return new Date(b.properties?.created||0) - new Date(a.properties?.created||0);
      return new Date(b.properties?.lastEdited||0) - new Date(a.properties?.lastEdited||0);
    });
    return arr;
  }, [notes, q, sortBy, view]);

  // After results render, scroll to and highlight the just-saved card, then clear the handoff key
  useEffect(() => {
    if (!justSavedId) return;
    const el = cardRefs.current[justSavedId];
    if (el) {
      // Smooth scroll into view and highlight ring
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-indigo-400');
      const t = setTimeout(() => {
        el.classList.remove('ring-2', 'ring-indigo-400');
      }, 1400);
      try { localStorage.removeItem('notepad-active-id'); } catch {}
      return () => clearTimeout(t);
    }
  }, [justSavedId, result]);

  const openInEditor = (id) => {
    try { localStorage.setItem('notepad-active-id', id); } catch {}
    navigate('/notepad');
  };

  const createNewNote = () => {
    // Hint the editor to create a new note on next open
    try { localStorage.setItem('notepad-create-new', '1'); } catch {}
    navigate('/notepad');
  };

  return (
    <div className={`px-6 py-8 max-w-7xl mx-auto min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Saved Notes</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Browse, search, and open your notes</p>
        </div>
        <button onClick={createNewNote} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="w-4 h-4"/> New Note
        </button>
      </div>

      {/* Search and controls */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/>
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search by title, tag, or description..."
            className={`w-full pl-9 pr-3 py-2 rounded-md border backdrop-blur ${isDarkMode ? 'border-gray-600 bg-gray-800/70 text-white placeholder-gray-400' : 'border-gray-300 bg-white/70 text-gray-900 placeholder-gray-500'}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1 p-1 rounded-full border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
            <button
              className={`px-3 py-1.5 rounded-full text-sm ${view==='all' ? 'bg-blue-600 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              onClick={()=>setView('all')}
              title="Show all notes"
            >
              All <span className="ml-1 opacity-80">({counts.total})</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm inline-flex items-center gap-1 ${view==='favorites' ? 'bg-yellow-500 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              onClick={()=>setView('favorites')}
              title="Show favorites"
            >
              <Star className="w-4 h-4"/> <span>Fav</span> <span className="ml-1 opacity-80">({counts.fav})</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm inline-flex items-center gap-1 ${view==='archived' ? 'bg-slate-800 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              onClick={()=>setView('archived')}
              title="Show archived"
            >
              <Archive className="w-4 h-4"/> <span>Archived</span> <span className="ml-1 opacity-80">({counts.archived})</span>
            </button>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e)=>setSortBy(e.target.value)}
              className={`appearance-none pl-3 pr-8 py-2 rounded-md border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              title="Sort by"
            >
              <option value="edited">Last edited</option>
              <option value="created">Created</option>
              <option value="title">Title</option>
            </select>
            <Filter className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 opacity-60"/>
          </div>
        </div>
      </div>

      {result.length === 0 ? (
        <div className={`text-center py-24 border-2 border-dashed rounded-xl ${isDarkMode ? 'bg-gray-800/60 border-gray-600' : 'bg-white/60 border-gray-300'}`}>
          <div className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No notes found</div>
          <div className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Try a different search, switch views, or create a new note.</div>
          <button onClick={createNewNote} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2">
            <Plus className="w-4 h-4"/> New Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.map(n => (
            <button
              key={n.id}
              ref={el => { if (el) cardRefs.current[n.id] = el; }}
              onClick={()=>openInEditor(n.id)}
              className={`group text-left rounded-xl border shadow-sm hover:shadow transition overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800/70 hover:bg-gray-800' : 'border-gray-200 bg-white/70 hover:bg-white'}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {n.properties?.isFavorite && <Star className="w-4 h-4 text-yellow-500"/>}
                      <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{n.title || 'Untitled'}</h3>
                    </div>
                    <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{getExcerpt(n.content)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition"/>
                </div>

                {(n.properties?.tags?.length || 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {n.properties.tags.slice(0, 5).map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">{tag}</span>
                    ))}
                  </div>
                )}

                <div className={`mt-4 flex items-center justify-between text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <div className="inline-flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(n.properties?.lastEdited).toLocaleString()}</div>
                  {(n.properties?.isArchived) && <span className="inline-flex items-center gap-1"><Archive className="w-3 h-3"/> Archived</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
