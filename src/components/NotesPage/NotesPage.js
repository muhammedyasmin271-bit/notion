import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Grid, List as ListIcon, Search, Clock, Tag } from 'lucide-react';

const NotesPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('notepadNotes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState('');
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt' | 'createdAt' | 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Refresh from localStorage when storage changes in this tab
  useEffect(() => {
    const onStorage = () => {
      try {
        const saved = localStorage.getItem('notepadNotes');
        setNotes(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    let arr = notes.filter(n =>
      !lower || n.title.toLowerCase().includes(lower) || (n.content || '').toLowerCase().includes(lower)
    );
    arr.sort((a, b) => {
      if (sortBy === 'title') {
        const t = a.title.localeCompare(b.title);
        return sortOrder === 'asc' ? t : -t;
      }
      const va = new Date(a[sortBy] || 0).getTime();
      const vb = new Date(b[sortBy] || 0).getTime();
      return sortOrder === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [notes, query, sortBy, sortOrder]);

  const openNote = (noteId) => {
    navigate(`/notepad?noteId=${noteId}`);
  };

  const cardBase = `rounded-2xl border p-4 transition-colors duration-200 ${
    isDarkMode ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'
  }`;
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-400' : 'bg-white border border-gray-300'
            }`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              view === 'grid' ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white border'
            }`}
            aria-pressed={view === 'grid'}
          >
            <Grid className="w-4 h-4" /> Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              view === 'list' ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white border'
            }`}
            aria-pressed={view === 'list'}
          >
            <ListIcon className="w-4 h-4" /> List
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white border'}`}
          >
            <option value="updatedAt">Updated</option>
            <option value="createdAt">Created</option>
            <option value="title">Title</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={`px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white border'}`}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(n => (
            <button key={n.id} onClick={() => openNote(n.id)} className={cardBase}>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-left truncate max-w-[70%]">{n.title || 'Untitled'}</h3>
                <span className={`text-xs ${textMuted} flex items-center gap-1`}>
                  <Clock className="w-3 h-3" />
                  {new Date(n.updatedAt || n.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <p className={`mt-2 text-sm text-left line-clamp-3 ${textMuted}`}>{(n.content || '').replace(/<[^>]*>/g, '').slice(0, 240)}</p>
              {Array.isArray(n.tags) && n.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.tags.slice(0, 4).map((t, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      <Tag className="w-3 h-3" /> {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="divide-y rounded-2xl border overflow-hidden">
          {filtered.map(n => (
            <button
              key={n.id}
              onClick={() => openNote(n.id)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
              }`}
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{n.title || 'Untitled'}</div>
                <div className={`text-xs ${textMuted} truncate`}>{(n.content || '').replace(/<[^>]*>/g, '').slice(0, 140)}</div>
              </div>
              <div className={`text-xs ${textMuted}`}>
                {new Date(n.updatedAt || n.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesPage;
