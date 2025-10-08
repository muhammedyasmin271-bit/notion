import React from 'react';
import { Sparkles, X } from 'lucide-react';
import useAI from '../../hooks/useAI';

const AITextarea = ({ value, onChange, placeholder, className, ...props }) => {
  const { showAI, setShowAI, isLoading, handleKeyDown, handleAIResponse } = useAI();

  const handleTextareaKeyDown = (e) => {
    handleKeyDown(e, value, onChange);
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const handleAIQuery = async (query) => {
    if (query) {
      await handleAIResponse(query, onChange);
    } else {
      setShowAI(false);
    }
  };

  if (showAI) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-purple-900/20 border border-purple-800/30 transition-all duration-200">
        <div className="p-1 rounded bg-purple-900/40">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <input
          type="text"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              e.preventDefault();
              handleAIQuery(e.target.value);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              handleAIQuery(null);
            }
          }}
          placeholder="Ask AI anything... (Press Enter to submit)"
          className="flex-1 outline-none bg-transparent text-sm font-medium text-purple-200 placeholder-purple-400"
          autoFocus
          disabled={isLoading}
        />
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
        ) : (
          <button
            onClick={() => handleAIQuery(null)}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors text-purple-400 hover:text-purple-300"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={handleTextareaKeyDown}
      placeholder={`${placeholder} (Press Space on empty line for AI)`}
      className={className}
      {...props}
    />
  );
};

export default AITextarea;