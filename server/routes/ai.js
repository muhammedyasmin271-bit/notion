const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Optional OpenAI client
let openaiClient = null;
try {
  const OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  // openai not installed or other issue; fallback will be used
}

// Helper: basic local transforms as fallback
function localAssist(text, mode) {
  const sentences = (text || '')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  switch (mode) {
    case 'summarize': {
      const take = Math.max(1, Math.min(5, Math.ceil(sentences.length * 0.3)));
      return sentences.slice(0, take).join(' ');
    }
    case 'improve': {
      return text
        .split('\n')
        .map(l => l.replace(/\s+/g, ' ').trim())
        .map(l => (l ? l.charAt(0).toUpperCase() + l.slice(1) : l))
        .join('\n');
    }
    case 'bulletize': {
      return sentences.map(s => `• ${s}`).join('\n');
    }
    case 'tasks': {
      return sentences.map(s => `- [ ] ${s}`).join('\n');
    }
    default:
      return text;
  }
}

// POST /api/ai/assist
// body: { prompt: string, mode: 'summarize'|'improve'|'bulletize'|'tasks' }
router.post('/assist', auth, async (req, res) => {
  try {
    const { prompt = '', mode = 'summarize' } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'prompt is required' });
    }

    // If OpenAI client available, use it; else fallback
    if (openaiClient) {
      const system = `You are an expert product and technical writer helping inside a Notion-like editor.
Mode: ${mode}.
Constraints: Return plain text only. For bulletize, start each line with •. For tasks, start each with - [ ]. Do not include any additional commentary.`;
      const user = `Text:\n\n${prompt}`;

      const resp = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });
      const content = resp.choices?.[0]?.message?.content || '';
      return res.json({ content });
    }

    const content = localAssist(prompt, mode);
    return res.json({ content });
  } catch (error) {
    console.error('AI assist error:', error);
    return res.status(500).json({ message: 'AI service failed' });
  }
});

module.exports = router;


