const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Helper function to call OpenAI API
const callOpenAI = async (messages, temperature = 0.7, maxTokens = 1000) => {
  const fetch = (await import('node-fetch')).default;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-2024-04-09',
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('OpenAI API Error:', error);
    throw new Error('AI service error');
  }

  const data = await response.json();
  let aiResponse = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
  
  // Decode HTML entities
  return aiResponse
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

// 1. Full App AI - Analyzes entire app context
router.post('/app-chat', auth, async (req, res) => {
  try {
    const { query, appData = {} } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are MELA AI, an advanced AI assistant with full access to this Notion-like productivity app. You can analyze all app data, navigate between pages, and provide comprehensive insights. You have internet search capabilities to provide accurate, up-to-date information. Always introduce yourself as MELA AI and provide actionable recommendations based on the entire app context.`
      },
      {
        role: 'user',
        content: `App Context: ${JSON.stringify(appData)}\n\nQuestion: ${query}`
      }
    ];

    const aiResponse = await callOpenAI(messages, 0.7, 1500);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('App AI Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Page AI - Analyzes current page only
router.post('/page-chat', auth, async (req, res) => {
  try {
    const { query, pageContext = '', pageName = '' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are MELA AI, focused on analyzing the current page (${pageName}) in this Notion-like productivity app. You can only see and analyze the current page content. You have internet search capabilities to provide accurate information. Provide precise, page-specific insights and recommendations.`
      },
      {
        role: 'user',
        content: `Current Page: ${pageName}\nPage Content: ${pageContext}\n\nQuestion: ${query}`
      }
    ];

    const aiResponse = await callOpenAI(messages, 0.7, 1000);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Page AI Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Inline AI - Analyzes text area content
router.post('/inline-chat', auth, async (req, res) => {
  try {
    const { query, textContent = '', fieldName = '' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are MELA AI, specialized in analyzing and working with text content. You can read, summarize, calculate, format, and enhance text. You have internet search capabilities for fact-checking and additional information. Provide direct, actionable responses for text-based tasks like summaries, calculations, formatting, and content enhancement.`
      },
      {
        role: 'user',
        content: `Field: ${fieldName}\nText Content: ${textContent}\n\nTask: ${query}`
      }
    ];

    const aiResponse = await callOpenAI(messages, 0.5, 800);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Inline AI Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy endpoint for backward compatibility
router.post('/chat', auth, async (req, res) => {
  try {
    const { query, context = '', temperature = 0.7, maxTokens = 500 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are MELA AI, an advanced AI assistant for a Notion-like productivity app. Always introduce yourself as MELA AI when greeting users. Provide precise, contextual responses. For formatting requests (tables, lists, headings), return clean markdown only. For queries, give concise, actionable answers. Prioritize clarity and efficiency in all responses.'
      },
      {
        role: 'user',
        content: context ? `Context: ${context}\n\nQuestion: ${query}` : query
      }
    ];

    const aiResponse = await callOpenAI(messages, temperature, maxTokens);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;