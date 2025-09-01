import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, Clock, Plus, Users, Save, Trash2 } from 'lucide-react';
import { addNotification } from '../../utils/notifications';

const storageKey = (userId) => `meetings:${userId}`;

const MeetingsWidget = () => {
  const { user } = useAppContext();
  const { isDarkMode } = useTheme();
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState({ title: '', date: '', time: '', participants: '' });

  const loadMeetings = useCallback(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      setMeetings(raw ? JSON.parse(raw) : []);
    } catch {
      setMeetings([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const persist = (items) => {
    if (!user?.id) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify(items));
  };

  const upcoming = useMemo(() => {
    return [...meetings].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));
  }, [meetings]);

  const createMeeting = async () => {
    if (!form.title || !form.date) return;
    const item = {
      id: Date.now(),
      ...form,
      createdAt: new Date().toISOString(),
    };
    const updated = [item, ...meetings];
    setMeetings(updated);
    persist(updated);
    setForm({ title: '', date: '', time: '', participants: '' });

    try {
      await addNotification(user?.id, {
        title: 'Meeting Scheduled',
        message: `${item.title} on ${item.date}${item.time ? ' at ' + item.time : ''}`,
        type: 'meeting',
      });
    } catch {}
  };

  const removeMeeting = (id) => {
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    persist(updated);
  };

  const cardCls = isDarkMode
    ? 'bg-gray-900/50 border-gray-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const inputCls = isDarkMode
    ? 'bg-gray-900 border-gray-700 placeholder-gray-400 text-white'
    : 'bg-white border-gray-300 placeholder-gray-400 text-gray-900';

  return (
    <div className={`rounded-2xl border shadow-sm ${cardCls}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold">Meetings</h3>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title"
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${inputCls}`}
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${inputCls}`}
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${inputCls}`}
          />
          <input
            value={form.participants}
            onChange={(e) => setForm(f => ({ ...f, participants: e.target.value }))}
            placeholder="Participants (comma separated)"
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${inputCls}`}
          />
        </div>
        <button onClick={createMeeting} className="inline-flex items-center text-sm px-3 py-2 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700">
          <Plus className="w-4 h-4 mr-1" /> Schedule
        </button>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          {upcoming.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No meetings scheduled.</div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map(m => (
                <li
                  key={m.id}
                  className={`p-3 rounded-lg border transition-transform duration-200 ease-out hover:shadow-lg transform hover:-translate-y-1 hover:scale-[1.02] ${cardCls}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> {m.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {m.date}{m.time ? ' • ' + m.time : ''}</span>
                        {m.participants && (
                          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {m.participants}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeMeeting(m.id)} className="p-1.5 rounded-md bg-red-600/10 text-red-600 hover:bg-red-600/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingsWidget;
