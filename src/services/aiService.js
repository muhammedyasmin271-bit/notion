const AI_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

// 1. Full App AI - Analyzes entire app and can navigate
export const askAppAI = async (query, appData = {}) => {
  try {
    const response = await fetch(`${AI_API_URL}/api/ai/app-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ query, appData })
    });

    if (!response.ok) throw new Error('AI service unavailable');
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('App AI Error:', error);
    return `Hello! I'm MELA AI. I can analyze your entire app and help you navigate between pages. However, I'm currently unable to connect to my services. Please try again later.`;
  }
};

// 2. Page AI - Analyzes current page only
export const askPageAI = async (query, pageContext = '', pageName = '') => {
  try {
    const response = await fetch(`${AI_API_URL}/api/ai/page-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ query, pageContext, pageName })
    });

    if (!response.ok) throw new Error('AI service unavailable');
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Page AI Error:', error);
    return `Hi! I'm MELA AI for this page (${pageName}). I can analyze the current page content and provide insights. However, I'm currently offline. Please try again later.`;
  }
};

// 3. Inline AI - Analyzes text area content
export const askInlineAI = async (query, textContent = '', fieldName = '') => {
  try {
    const response = await fetch(`${AI_API_URL}/api/ai/inline-chat`, {
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
    const response = await fetch(`${AI_API_URL}/api/ai/chat`, {
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