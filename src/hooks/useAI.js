import { useState, useCallback } from 'react';

export const useInlineAI = () => {
  const [showAI, setShowAI] = useState(false);
  const [aiPosition, setAiPosition] = useState({ top: 0, left: 0 });

  const handleKeyDown = useCallback((e, currentValue, textAreaRef) => {
    // Trigger AI on Space when line is empty or textarea is empty
    if (e.key === ' ') {
      const textarea = textAreaRef?.current || e.target;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = currentValue.substring(0, cursorPos);
      const currentLine = textBeforeCursor.split('\n').pop();
      
      // Show AI if current line is empty or textarea is completely empty
      if (currentLine.trim() === '' || currentValue.trim() === '') {
        e.preventDefault();
        
        // Calculate position for AI popup
        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20;
        const lines = textBeforeCursor.split('\n').length;
        
        setAiPosition({
          top: rect.top + (lines * lineHeight) + 30,
          left: rect.left + 20
        });
        
        setShowAI(true);
      }
    }
  }, []);

  const handleInsertText = useCallback((text, onValueChange, textAreaRef) => {
    if (onValueChange) {
      onValueChange(prev => {
        const textarea = textAreaRef?.current;
        if (textarea) {
          const cursorPos = textarea.selectionStart;
          const newValue = prev.substring(0, cursorPos) + text + prev.substring(cursorPos);
          
          // Set cursor position after inserted text
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = cursorPos + text.length;
            textarea.focus();
          }, 0);
          
          return newValue;
        }
        return prev + text;
      });
    }
    setShowAI(false);
  }, []);

  const closeAI = useCallback(() => {
    setShowAI(false);
  }, []);

  return {
    showAI,
    aiPosition,
    handleKeyDown,
    handleInsertText,
    closeAI
  };
};

// Legacy hook for backward compatibility
export const useAI = () => {
  const [showAI, setShowAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyDown = (e, currentValue, onValueChange) => {
    if (e.key === ' ' && currentValue.trim() === '') {
      e.preventDefault();
      setShowAI(true);
    }
  };

  const handleAIResponse = async (query, onValueChange) => {
    if (!query) {
      setShowAI(false);
      return;
    }

    setIsLoading(true);
    try {
      const { askInlineAI } = await import('../services/aiService');
      const response = await askInlineAI(query, '', 'text-field');
      onValueChange(response);
    } catch (error) {
      console.error('AI assist failed:', error);
      onValueChange('MELA AI is currently unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
      setShowAI(false);
    }
  };

  return {
    showAI,
    setShowAI,
    isLoading,
    handleKeyDown,
    handleAIResponse
  };
};

export default useAI;