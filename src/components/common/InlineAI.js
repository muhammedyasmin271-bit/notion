import React, { useState, useEffect } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { askInlineAI } from '../../services/aiService';

const InlineAI = ({ 
  textContent = '', 
  fieldName = '', 
  onInsertText, 
  onClose, 
  position = { top: 0, left: 0 } 
}) => {
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const aiResponse = await askInlineAI(query, textContent, fieldName);
      setResponse(aiResponse);
      setQuery('');
    } catch (error) {
      console.error('Inline AI Error:', error);
      setResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (response && onInsertText) {
      onInsertText(response);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed z-[9999] w-80 rounded-xl shadow-2xl border transition-all duration-200 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/80 backdrop-blur-xl' 
          : 'bg-white border-gray-200 backdrop-blur-lg'
      }`}
      style={{ 
        top: position.top + 'px', 
        left: position.left + 'px',
        maxHeight: '400px'
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              MELA AI - Text Assistant
            </span>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-md hover:opacity-75 transition-opacity ${
              isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Query Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Summarize, calculate, format, or enhance this text..."
            className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all ${
              isDarkMode 
                ? 'bg-gray-800/80 border-gray-700 text-gray-100 placeholder-gray-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            autoFocus
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center min-w-[36px] ${
              isDarkMode
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-800 text-white'
                : 'bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 text-white'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1 mb-3">
          {[
            'Summarize this text',
            'Count words/characters', 
            'Format as bullet points',
            'Calculate numbers',
            'Improve writing',
            'Translate'
          ].map((action) => (
            <button
              key={action}
              onClick={() => setQuery(action)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Response Area */}
        {(response || isLoading) && (
          <div className={`p-3 rounded-lg border max-h-40 overflow-y-auto ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  MELA AI is analyzing...
                </span>
              </div>
            ) : (
              <>
                <div className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {response}
                </div>
                <button
                  onClick={handleInsert}
                  className={`mt-2 px-3 py-1 text-xs rounded-md transition-all ${
                    isDarkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  Insert Response
                </button>
              </>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Enter to submit • Esc to close • I can read and analyze all your text
        </div>
      </div>
    </div>
  );
};

export default InlineAI;