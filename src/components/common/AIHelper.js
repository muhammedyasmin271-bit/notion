import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const AIHelper = ({ onAIResponse, placeholder = "Ask AI anything... (Press Enter to submit)" }) => {
  const [aiQuery, setAiQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAiQuerySubmit = async (e) => {
    if (e.key === 'Enter' && aiQuery.trim()) {
      e.preventDefault();
      setIsLoading(true);
      
      try {
        // Import the AI chat function
        const { aiChat } = await import('../../services/api');
        
        // Call the AI API
        const response = await aiChat([
          { role: 'user', content: aiQuery }
        ]);
        
        const content = response.reply?.content || 'AI service is currently unavailable.';
        
        // Call the callback with AI response
        onAIResponse(content);
        setAiQuery('');
      } catch (error) {
        console.error('AI assist failed:', error);
        onAIResponse('AI service is currently unavailable. Please check your configuration.');
        setAiQuery('');
      } finally {
        setIsLoading(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onAIResponse(null); // Cancel AI input
      setAiQuery('');
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-900/20 border border-purple-800/30 transition-all duration-200">
      <div className="p-1 rounded bg-purple-900/40">
        <Sparkles className="w-4 h-4 text-purple-400" />
      </div>
      <input
        type="text"
        value={aiQuery}
        onChange={(e) => setAiQuery(e.target.value)}
        onKeyDown={handleAiQuerySubmit}
        placeholder={placeholder}
        className="flex-1 outline-none bg-transparent text-sm font-medium text-purple-200 placeholder-purple-400"
        autoFocus
        disabled={isLoading}
      />
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      ) : (
        <button
          onClick={() => {
            onAIResponse(null);
            setAiQuery('');
          }}
          className="p-1 rounded-full hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AIHelper;