const AI_API_URL = process.env.REACT_APP_BACKEND_URL || 'process.env.Backendurl';

// Remove trailing /api if present to avoid double /api/api
const getApiUrl = (endpoint) => {
  const baseUrl = AI_API_URL.replace(/\/api$/, '');
  return `${baseUrl}/api${endpoint}`;
};

// Check AI service status
export const checkAIStatus = async () => {
  try {
    const response = await fetch(`${AI_API_URL}/api/ai/status`);
    if (response.ok) {
      return await response.json();
    }
    return { status: 'offline', error: 'Service unavailable' };
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
};

// 1. Enhanced Full App AI - Analyzes entire app with conversation memory
export const askAppAI = async (query, appData = {}, conversationId = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return `Hello! I'm MELA AI. I can analyze your entire app and help you navigate between pages. Please log in to use AI features.`;
    }

    const response = await fetch(getApiUrl('/ai/app-chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ query, appData, conversationId })
    });

    if (response.ok) {
      const data = await response.json();
      return data.response;
    }
    
    if (response.status === 401) {
      return `Hello! I'm MELA AI. Your session has expired. Please log in again to use AI features.`;
    }
    
    throw new Error('AI service unavailable');
  } catch (error) {
    console.error('App AI Error:', error);
    return `Hello! I'm MELA AI. I can analyze your entire app and help you navigate between pages. However, I'm currently unable to connect to my services. Please try again later.`;
  }
};

// Streaming AI response (for real-time feedback)
export const askAppAIStream = async (query, appData = {}, onChunk) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl('/ai/app-chat-stream'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ query, appData })
    });

    if (!response.ok) {
      throw new Error('Streaming not available');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content && onChunk) {
              onChunk(parsed.content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    console.error('Streaming AI Error:', error);
    throw error;
  }
};

// Clear conversation history
export const clearConversation = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(getApiUrl('/ai/conversation'), {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
  } catch (error) {
    console.error('Clear Conversation Error:', error);
  }
};

// 2. Page AI - Analyzes current page only
export const askPageAI = async (query, pageContext = '', pageName = '') => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return `Hi! I'm MELA AI for this page (${pageName}). Please log in to use AI features.`;
    }

    const response = await fetch(getApiUrl('/ai/page-chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ query, pageContext, pageName })
    });

    if (response.ok) {
      const data = await response.json();
      return data.response;
    }
    
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('AI API Error:', response.status, errorData);
    
    if (response.status === 401) {
      return `Hi! I'm MELA AI for this page (${pageName}). Your session has expired. Please log in again.`;
    }
    
    throw new Error(`AI service error: ${response.status}`);
  } catch (error) {
    console.error('Page AI Error:', error);
    return `Hi! I'm MELA AI for this page (${pageName}). I can analyze the current page content and provide insights. However, I'm currently offline. Please try again later.`;
  }
};

// 3. Inline AI - Analyzes text area content
export const askInlineAI = async (query, textContent = '', fieldName = '') => {
  try {
    const response = await fetch(getApiUrl('/ai/inline-chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ query, textContent, fieldName })
    });

    if (!response.ok) throw new Error('AI service unavailable');
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Inline AI Error:', error);
    return `I'm MELA AI, your text assistant. I can summarize, calculate, and enhance your content. Currently offline - please try again later.`;
  }
};

// Legacy function for backward compatibility
export const askAI = async (query, context = '') => {
  try {
    const response = await fetch(getApiUrl('/ai/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ 
        query, 
        context,
        temperature: 0.7,
        maxTokens: 500
      })
    });

    if (!response.ok) throw new Error('AI service unavailable');
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('AI Error:', error);
    return `Hello! I'm MELA AI. I'm currently unable to connect to my services. Please try again later.`;
  }
};