import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Save, Trash2, Edit3, Search } from 'lucide-react';

const storageKey = (userId) => `notes:${userId}`;

const NotepadWidget = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState({ id: null, title: '', content: '' });
  const [query, setQuery] = useState('');

  const loadNotes = useCallback(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      setNotes(raw ? JSON.parse(raw) : []);
    } catch {
      setNotes([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const persist = (items) => {
    if (!user?.id) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify(items));
  };

  const startNew = () => setDraft({ id: null, title: '', content: '' });

  const saveDraft = () => {
    if (!draft.title && !draft.content) return;
    let updated = [];
    if (draft.id) {
      updated = notes.map(n => (n.id === draft.id ? { ...n, ...draft, updatedAt: new Date().toISOString() } : n));
    } else {
      updated = [
        {
          id: Date.now(),
          title: draft.title || 'Untitled',
          content: draft.content || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...notes,
      ];
    }
    setNotes(updated);
    persist(updated);
    setDraft({ id: null, title: '', content: '' });
  };

  const editNote = (n) => setDraft({ id: n.id, title: n.title, content: n.content });

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    persist(updated);
    if (draft.id === id) startNew();
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const cardCls = isDarkMode
    ? 'bg-gray-900/50 border-gray-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const inputCls = isDarkMode
    ? 'bg-gray-900 border-gray-700 placeholder-gray-400 text-white'
    : 'bg-white border-gray-300 placeholder-gray-400 text-gray-900';

  return (
    <div className={`rounded-2xl border shadow-sm ${cardCls}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold">Notepad</h3>
        <button onClick={startNew} className="inline-flex items-center text-sm px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
          <Plus className="w-4 h-4 mr-1" /> New
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes..."
            className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputCls}`}
          />
        </div>

        <div className="space-y-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
            placeholder="Title"
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputCls}`}
          />
          <textarea
            value={draft.content}
            onChange={(e) => setDraft(d => ({ ...d, content: e.target.value }))}
            placeholder="Write your note..."
            rows={4}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y ${inputCls}`}
          />
          <button onClick={saveDraft} className="inline-flex items-center text-sm px-3 py-2 rounded-md bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700">
            <Save className="w-4 h-4 mr-1" /> Save
          </button>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No notes yet.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map(n => (
                <li key={n.id} className={`p-3 rounded-lg border hover:shadow-sm transition ${cardCls}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{n.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(n.updatedAt || n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => editNote(n)} className="p-1.5 rounded-md bg-blue-600/10 text-blue-600 hover:bg-blue-600/20">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteNote(n.id)} className="p-1.5 rounded-md bg-red-600/10 text-red-600 hover:bg-red-600/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {n.content && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{n.content}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotepadWidget;
