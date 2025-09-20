import React, { useState } from 'react';
import { Sparkles, Send, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const AIAssistant = () => {
  const { isDarkMode } = useTheme();
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAISubmit = async () => {
    if (!aiQuery.trim()) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('AI Query:', aiQuery);
      setShowAIPopup(false);
      setAiQuery('');
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* AI Button - Bottom Right Corner */}
      <button
        onClick={() => setShowAIPopup(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:shadow-xl hover:scale-105 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
            : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
        } text-white`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* AI Popup */}
      {showAIPopup && (
        <div className={`fixed bottom-24 right-6 z-[9999] w-96 rounded-xl shadow-2xl border transition-all duration-200 transform animate-in slide-in-from-bottom-2 ${
          isDarkMode 
            ? 'bg-gray-900/95 border-gray-700/80 backdrop-blur-xl' 
            : 'bg-white border-gray-200 backdrop-blur-lg'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                  <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Ask AI</span>
              </div>
              <button
                onClick={() => setShowAIPopup(false)}
                className={`p-1 rounded-md hover:opacity-75 transition-opacity ${
                  isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiQuery.trim()) {
                    e.preventDefault();
                    handleAISubmit();
                  } else if (e.key === 'Escape') {
                    setShowAIPopup(false);
                    setAiQuery('');
                  }
                }}
                placeholder="Ask anything..."
                className={`flex-1 px-4 py-3 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all ${
                  isDarkMode 
                    ? 'bg-gray-800/80 border-gray-700 text-gray-100 placeholder-gray-500 focus:bg-gray-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                }`}
                autoFocus
              />
              <button
                onClick={handleAISubmit}
                disabled={!aiQuery.trim() || isGenerating}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center min-w-[42px] ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-800 text-white shadow-lg shadow-purple-900/20'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-md shadow-purple-500/20'
                }`}
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className={`mt-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Press Enter to submit · Esc to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;