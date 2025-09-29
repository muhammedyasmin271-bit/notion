import React, { useState } from 'react';
import {
  Calendar,
  X,
  Sparkles,
  Send,
  Trash2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const MeetingDetailPage = ({ meeting, onClose, onUpdate, isNewMeeting }) => {
  const { isDarkMode } = useTheme();
  const [editingMeeting, setEditingMeeting] = useState(meeting);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [aiPopupQuery, setAiPopupQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    onUpdate(editingMeeting);
  };

  const handleFieldChange = (field, value) => {
    setEditingMeeting(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAISubmit = async () => {
    if (!aiPopupQuery.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiSuggestion = `AI Suggestion: ${aiPopupQuery}\n\nBased on your query, here are some recommendations for your meeting...`;
      handleFieldChange('description', editingMeeting.description ? `${editingMeeting.description}\n\n${aiSuggestion}` : aiSuggestion);
      setAiPopupQuery('');
      setShowAIPopup(false);
    } catch (error) {
      console.error('AI request failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-white' : 'bg-black'
              }`}>
                <Calendar className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isNewMeeting ? 'Create New Meeting' : 'Meeting Details'}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isNewMeeting ? 'Schedule and organize your team meeting' : 'View and edit meeting information'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Meeting Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Meeting Title *
            </label>
            <input
              type="text"
              value={editingMeeting.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Enter meeting title"
            />
          </div>

          {/* Meeting Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Meeting Type
              </label>
              <select
                value={editingMeeting.type || 'Standup'}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="Standup">Standup</option>
                <option value="Planning">Planning</option>
                <option value="Review">Review</option>
                <option value="Retro">Retro</option>
                <option value="Presentation">Presentation</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={editingMeeting.status || 'Scheduled'}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date *
              </label>
              <input
                type="date"
                value={editingMeeting.date || ''}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Time *
              </label>
              <input
                type="time"
                value={editingMeeting.time || ''}
                onChange={(e) => handleFieldChange('time', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Duration
              </label>
              <select
                value={editingMeeting.duration || '30 min'}
                onChange={(e) => handleFieldChange('duration', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="30 min">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="2 hours">2 hours</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Description / Agenda
            </label>
            <textarea
              value={editingMeeting.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={6}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Meeting agenda, topics to discuss..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {isNewMeeting ? 'Create Meeting' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Button */}
      <button
        onClick={() => setShowAIPopup(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-xl hover:scale-105 ${
          isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'
        } text-white`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* AI Popup */}
      {showAIPopup && (
        <div className={`fixed bottom-24 right-6 z-[9999] w-96 rounded-xl shadow-2xl border ${
          isDarkMode ? 'bg-gray-900/95 border-gray-700/80' : 'bg-white border-gray-200'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Ask AI</span>
              <button
                onClick={() => setShowAIPopup(false)}
                className={`p-1 rounded-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPopupQuery}
                onChange={(e) => setAiPopupQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiPopupQuery.trim()) {
                    handleAISubmit();
                  }
                }}
                placeholder="Ask about meeting planning..."
                className={`flex-1 px-4 py-3 text-sm rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                autoFocus
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiPopupQuery.trim() || isGenerating}
                className="px-4 py-3 rounded-lg bg-purple-500 text-white"
              >
                {isGenerating ? '...' : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetailPage;