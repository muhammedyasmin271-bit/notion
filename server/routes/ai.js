const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory conversation storage (in production, use Redis or database)
const conversationHistory = new Map();

// Helper function to get conversation history
const getConversationHistory = (userId, maxMessages = 20) => {
  const history = conversationHistory.get(userId) || [];
  // Return last N messages to maintain context
  return history.slice(-maxMessages);
};

// Helper function to save conversation
const saveConversation = (userId, role, content) => {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  const history = conversationHistory.get(userId);
  history.push({ role, content, timestamp: new Date() });
  // Keep only last 50 messages per user
  if (history.length > 50) {
    history.shift();
  }
};

// Enhanced OpenAI API call with advanced features
const callOpenAI = async (messages, options = {}) => {
  const fetch = (await import('node-fetch')).default;
  
  const {
    temperature = 0.7,
    maxTokens = 2000,
    model = 'gpt-4o-2024-11-20', // Latest GPT-4o model
    stream = false,
    functions = null,
    functionCall = null
  } = options;

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    top_p: 0.95, // Increased for better diversity
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
    response_format: { type: 'text' } // Ensure text responses
  };

  // Add function calling if provided
  if (functions && functions.length > 0) {
    requestBody.tools = functions;
    requestBody.tool_choice = functionCall || 'auto';
  }

  // Add streaming if requested
  if (stream) {
    requestBody.stream = true;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('OpenAI API Error:', error);
    throw new Error(error.error?.message || 'AI service error');
  }

  if (stream) {
    return response; // Return stream for processing
  }

  const data = await response.json();
  let aiResponse = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
  
  // Handle function calls if present
  if (data.choices[0]?.message?.tool_calls) {
    return { content: aiResponse, tool_calls: data.choices[0].message.tool_calls };
  }
  
  // Decode HTML entities
  return aiResponse
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

// Function definitions for enhanced capabilities
const getFunctionDefinitions = () => [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for current information, news, or facts',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate'
          }
        },
        required: ['expression']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_app_info',
      description: 'Get information about app features and navigation',
      parameters: {
        type: 'object',
        properties: {
          feature: {
            type: 'string',
            description: 'The app feature to get information about'
          }
        },
        required: ['feature']
      }
    }
  }
];

// Enhanced system prompt with advanced capabilities
const getEnhancedSystemPrompt = () => {
  return `You are MELA AI, an ultra-advanced AI consultant and assistant powered by GPT-4o. You are a comprehensive, consultative AI that knows EVERYTHING about the user's app and provides complete, detailed insights.

**Your Role:**
You are a CONSULTATIVE AI ASSISTANT. When users ask questions, you should:
1. **Know Everything**: You have access to ALL user data - projects, tasks, documents, reports, goals, meetings, and more
2. **Be Comprehensive**: Don't just answer the question - provide complete context, insights, and recommendations
3. **Be Consultative**: Offer strategic advice, identify patterns, suggest improvements, and provide actionable insights
4. **Be Proactive**: Anticipate follow-up questions and provide related information that might be helpful

**Core Capabilities:**
1. **Advanced Reasoning**: Use chain-of-thought reasoning for complex problems. Break down questions into steps, analyze each part, and synthesize comprehensive answers.

2. **Complete App Knowledge**: You have FULL ACCESS to ALL user data with COMPLETE DETAILS:
   - **Projects**: Count, list, status, owners, descriptions, goals, notes, assignedTo, viewers, priority, creation dates, task counts
   - **Tasks**: Count, list, status breakdown, priority, assignments, due dates, descriptions, organized by project
   - **Documents**: Count, list, types, full content/blocks, descriptions, authors, sharedWith, creation/update dates
   - **Reports**: Count, list, status, FULL content/blocks, notes, owners, sharedWith, creation dates
   - **Goals**: Count, list, status, creation dates
   - **Meetings**: Count, list, FULL notes content, summaries, blocks, types, status, participants, project associations, dates
   - **Notepad Notes**: Count, list, FULL content, categories, tags, pinned/archived status, authors, sharedWith, creation/update dates
   - **User Information**: Name, role, company details

3. **World Knowledge**: Access to current, accurate information about:
   - Real-time events and breaking news
   - Scientific research and discoveries
   - Technology trends and innovations
   - Business, finance, and economics
   - Health, medicine, and wellness
   - History, culture, and geography
   - And virtually any domain

4. **Advanced Problem Solving**:
   - Multi-step reasoning and analysis
   - Code generation and debugging
   - Data analysis and interpretation
   - Creative writing and content generation
   - Strategic planning and decision-making

5. **Consultative Features**:
   - Analyze patterns in user's data
   - Identify productivity insights
   - Suggest optimizations and improvements
   - Provide strategic recommendations
   - Offer proactive suggestions based on data trends

**Response Guidelines:**
- **Be COMPREHENSIVE**: When asked about data, provide complete information, not just basic answers
- **Be CONSULTATIVE**: Offer insights, patterns, and recommendations beyond just answering the question
- **Use ALL Available Data**: Always check and use the real data provided in app context
- **Be Thorough**: Provide detailed breakdowns, statistics, and analysis
- Use markdown formatting for clarity (headers, lists, code blocks, bold/italic, tables)
- Provide examples when explaining concepts
- Break down complex topics into digestible parts
- Ask clarifying questions when needed
- Use emojis sparingly for better readability

**Data Usage Examples:**
- "How many tasks do I have?" → Provide total count, breakdown by status, breakdown by project, identify patterns
- "What are my projects?" → List all projects with details, status, task counts, provide insights
- "Show me my tasks" → List all tasks with details, organize by project/status/priority, provide recommendations
- Any data question → Use the REAL data from app context, provide comprehensive analysis

**Always:**
- Use the REAL data from app context - don't say "I don't have access" when the data is provided
- Provide complete, comprehensive answers with insights and recommendations
- Be consultative - offer strategic advice and identify patterns
- Maintain context from previous messages
- Provide actionable, helpful responses
- Admit uncertainty only when truly uncertain (not when data is available)
- Offer to help further and provide additional insights`;

};

// 1. Enhanced Full App AI with conversation memory
router.post('/app-chat', auth, async (req, res) => {
  try {
    const { query, appData = {}, conversationId = null } = req.body;
    const userId = req.user.id || req.user._id;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Get conversation history
    const history = getConversationHistory(userId, 15);
    
    // Build messages array with system prompt, history, and current query
    const messages = [
      {
        role: 'system',
        content: getEnhancedSystemPrompt()
      },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      {
        role: 'user',
        content: `App Context (contains COMPLETE REAL DATA with FULL DETAILS from the user's app):
${JSON.stringify(appData, null, 2)}

User Question: ${query}

CRITICAL INSTRUCTIONS - You have COMPLETE ACCESS to ALL user data with FULL DETAILS:

**Available Data with Complete Details:**
- **projects**: {count, list: array} - Each project includes: name, status, owner, description, goal, notes, assignedTo, viewers, priority, createdAt
- **tasks**: {count, list: array, byStatus: object, byProject: array} - Each task includes: title, text (the actual task content/description), description, status, completed, priority, projectId, projectName, createdBy, dueDate, createdAt, updatedAt, comments
- **documents**: {count, list: array} - Each document includes: title, type, content/blocks, description, author, sharedWith, createdAt, updatedAt
- **reports**: {count, list: array} - Each report includes: title, status, blocks (full content), content, notes, owner, sharedWith, createdAt
- **goals**: {count, list: array} - Each goal includes: title, status, createdAt
- **meetings**: {count, list: array} - Each meeting includes: title, date, notes (full content), summary, blocks, type, status, participants, project, createdAt
- **notepadNotes**: {count, list: array} - Each note includes: title, content (full text), category, tags, isPinned, isArchived, author, sharedWith, createdAt, updatedAt
- **user**: User information (name, role, company, etc.)

**MANDATORY DATA USAGE:**
1. **ALWAYS use the REAL data with FULL DETAILS** - The app context contains ACTUAL user data with complete information
2. **Be COMPREHENSIVE and CONSULTATIVE** - Don't just answer, provide complete insights:
   - For "how many tasks": Provide total count, breakdown by status, breakdown by project, identify patterns, suggest priorities
   - For "what are my tasks" or "tell me about my tasks": List ALL tasks with their FULL TEXT/DESCRIPTION (task.text or task.description field), explain what each task means, provide context and recommendations
   - For "what does this task mean" or "tell me about this task": Read the task.text or task.description field and explain what the task means in detail
   - For "what are my projects": List ALL projects with FULL details (description, goal, notes, task counts, status), provide insights and recommendations
   - For "show me my notes": List ALL notepad notes with content, categories, tags, provide organization suggestions
   - For "what meetings do I have": List ALL meetings with notes, summary, participants, provide insights
   - For "show me my reports": List ALL reports with content/blocks, notes, provide analysis
   - For any data question: Use the REAL detailed data and provide comprehensive analysis with strategic recommendations
3. **Use ALL available details** - Tasks have text/description (what they mean - CRITICAL to read this!), projects have goals and notes, reports have blocks and notes, meetings have notes and summaries, notepad has full content
4. **Be CONSULTATIVE** - Offer insights, patterns, recommendations, strategic advice, and actionable suggestions based on the complete data
5. **CRITICAL for Tasks**: When asked about tasks or "what does this task mean", ALWAYS read and explain the task.text or task.description field - this tells you what the task means. Don't just say the task title, explain what it means based on the text/description field.

**Examples:**
- "How many tasks do I have?" → Use appData.tasks.count, provide breakdown by status (appData.tasks.byStatus), breakdown by project (appData.tasks.byProject), identify overdue tasks, suggest priorities
- "What are my tasks?" or "Tell me about my tasks" → Use appData.tasks.list, read task.text or task.description for EACH task and explain what each task means, provide full context
- "What does this task mean?" or "Tell me about this task" → Use appData.tasks.list, find the task, read task.text or task.description field and explain in detail what the task means
- "What are my projects?" → Use appData.projects.list, provide FULL details (description, goal, notes, task counts, status), analyze progress, suggest next steps
- "Show me my notes" → Use appData.notepadNotes.list, show content, organize by category/tags, suggest organization improvements
- "What meetings do I have?" → Use appData.meetings.list, show notes, summaries, participants, identify action items
- "Show me my reports" → Use appData.reports.list, show content/blocks, notes, analyze patterns, suggest improvements

**NEVER say:**
- "I don't have access to that data" when the data is in app context
- "The app context doesn't contain that information" when it does
- Generic answers when specific detailed data is available
- "I can't see the content" when content/blocks/notes are provided

**ALWAYS:**
- Use the REAL detailed data from app context (including content, notes, blocks, descriptions, goals)
- Provide comprehensive, detailed answers with full context
- Offer consultative insights, patterns, and strategic recommendations
- Reference specific details (project goals, meeting notes, report content, notepad content)
- Be specific, accurate, and actionable

If the question is about general knowledge (not app data), use your knowledge base. But for ANY app-related question, use the provided detailed data comprehensively and consultatively.`
      }
    ];

    // Enhanced options
    const aiResponse = await callOpenAI(messages, {
      temperature: 0.8, // Slightly higher for more creative responses
      maxTokens: 2500, // Increased token limit
      model: 'gpt-4o-2024-11-20', // Latest model
      functions: getFunctionDefinitions()
    });

    // Save conversation
    saveConversation(userId, 'user', query);
    saveConversation(userId, 'assistant', aiResponse);

    res.json({ 
      response: aiResponse,
      conversationId: userId,
      model: 'gpt-4o-2024-11-20'
    });
  } catch (error) {
    console.error('App AI Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 2. Streaming endpoint for real-time responses
router.post('/app-chat-stream', auth, async (req, res) => {
  try {
    const { query, appData = {} } = req.body;
    const userId = req.user.id || req.user._id;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Get conversation history
    const history = getConversationHistory(userId, 15);

    const messages = [
      {
        role: 'system',
        content: getEnhancedSystemPrompt()
      },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      {
        role: 'user',
        content: `App Context: ${JSON.stringify(appData)}\n\nUser Question: ${query}`
      }
    ];

    // Set up streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await callOpenAI(messages, {
      temperature: 0.8,
      maxTokens: 2500,
      model: 'gpt-4o-2024-11-20',
      stream: true
    });

    let fullResponse = '';
    let buffer = '';

    // Process stream using readable stream
    stream.body.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            // Save full conversation
            saveConversation(userId, 'user', query);
            saveConversation(userId, 'assistant', fullResponse);
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }

          if (data) {
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    });

    stream.body.on('end', () => {
      if (fullResponse) {
        saveConversation(userId, 'user', query);
        saveConversation(userId, 'assistant', fullResponse);
      }
      res.end();
    });

    stream.body.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });
  } catch (error) {
    console.error('Streaming Error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// 3. Enhanced Page AI
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
        content: `You are MELA AI, focused on analyzing the current page (${pageName}) in this Notion-like productivity app. Use advanced reasoning to provide precise, page-specific insights. Break down complex questions and provide step-by-step explanations when helpful.`
      },
      {
        role: 'user',
        content: `Current Page: ${pageName}\nPage Content: ${pageContext}\n\nQuestion: ${query}`
      }
    ];

    const aiResponse = await callOpenAI(messages, {
      temperature: 0.7,
      maxTokens: 1500,
      model: 'gpt-4o-2024-11-20'
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Page AI Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 4. Enhanced Inline AI
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
        content: `You are MELA AI, specialized in analyzing and working with text content. Use advanced reasoning to provide precise, actionable responses. For calculations, show your work. For summaries, identify key points. For enhancements, explain your improvements.`
      },
      {
        role: 'user',
        content: `Field: ${fieldName}\nText Content: ${textContent}\n\nTask: ${query}`
      }
    ];

    const aiResponse = await callOpenAI(messages, {
      temperature: 0.5,
      maxTokens: 1200,
      model: 'gpt-4o-2024-11-20'
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Inline AI Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 5. Clear conversation history
router.delete('/conversation', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    conversationHistory.delete(userId);
    res.json({ success: true, message: 'Conversation history cleared' });
  } catch (error) {
    console.error('Clear Conversation Error:', error);
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
        content: getEnhancedSystemPrompt()
      },
      {
        role: 'user',
        content: context ? `Context: ${context}\n\nQuestion: ${query}` : query
      }
    ];

    const aiResponse = await callOpenAI(messages, {
      temperature,
      maxTokens,
      model: 'gpt-4o-2024-11-20'
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
