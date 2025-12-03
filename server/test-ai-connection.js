require('dotenv').config();

const testAIConnection = async () => {
  console.log('Testing AI Configuration...');
  
  // Check if API key exists
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ OPENAI_API_KEY found');
  console.log('Key starts with:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
  
  // Test API connection
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Hello, test connection' }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      console.log('✅ OpenAI API connection successful');
      const data = await response.json();
      console.log('Response:', data.choices[0]?.message?.content);
    } else {
      const error = await response.json();
      console.error('❌ OpenAI API Error:', error);
    }
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
};

testAIConnection();