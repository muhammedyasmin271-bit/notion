// Simple test to check AI endpoint from frontend perspective
const testAI = async () => {
  try {
    const response = await fetch('http://localhost:9000/api/ai/page-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'test-token' // You'll need a real token
      },
      body: JSON.stringify({ 
        query: 'Hello, are you working?',
        pageContext: 'Test page',
        pageName: 'Test'
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run if node-fetch is available
if (typeof fetch === 'undefined') {
  console.log('This test needs to be run in a browser environment or with node-fetch');
} else {
  testAI();
}