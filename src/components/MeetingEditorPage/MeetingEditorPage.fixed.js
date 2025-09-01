import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import PageHeader from '../common/PageHeader';
import { Calendar, Users, Plus, X } from 'lucide-react';

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
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subMeetings, setSubMeetings] = useState([]);
  const [showSubMeetingForm, setShowSubMeetingForm] = useState(false);
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle form submission
    console.log('Form submitted:', { ...form, subMeetings });
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/meeting-notes');
    }, 1000);
  };

  const cancel = () => {
    if (window.confirm('Are you sure you want to cancel?')) {
      navigate(-1);
    }
  };

  const getDisplayName = (user) => {
    if (!user) return 'User';
    return user.name || user.username || 'User';
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
        </div>

        <div className="mt-6">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Participants
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.participants.length > 0 ? (
              form.participants.map((p, idx) => (
                <span 
                  key={p.id || idx}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                >
                  {getDisplayName(p)}
                  <button 
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        participants: prev.participants.filter(part => part !== p)
                      }));
                    }}
                    className="ml-2 -mr-1 text-blue-500 hover:text-red-500 focus:outline-none"
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Users className="h-4 w-4 mr-2" />
            {form.participants.length > 0 ? 'Add More Participants' : 'Add Participants'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={cancel}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg border ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowSubMeetingForm(!showSubMeetingForm)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg border flex items-center gap-2 ${
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
                className={`px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (isSubmitting || !form.title || !form.date || !form.time) ? 'opacity-50 cursor-not-allowed' : ''
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
