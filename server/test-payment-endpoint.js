const fetch = require('node-fetch');

async function testPaymentEndpoint() {
  console.log('🧪 Testing payment endpoint...');
  
  // You'll need to replace this with a valid JWT token from your app
  const testToken = 'your-jwt-token-here'; // Get this from browser localStorage
  
  const testPayload = {
    amount: 1000,
    months: [12],
    year: 2024,
    planName: 'Monthly Plan'
  };
  
  try {
    const response = await fetch('process.env.Backendurl/api/payments/chapa/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': testToken
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Payment endpoint is working!');
    } else {
      console.log('❌ Payment endpoint test failed');
    }
  } catch (error) {
    console.error('💥 Error testing payment endpoint:', error.message);
  }
}

console.log('⚠️  To test the payment endpoint, you need to:');
console.log('1. Login to your app');
console.log('2. Open browser dev tools (F12)');
console.log('3. Go to Application/Storage > Local Storage');
console.log('4. Copy the "token" value');
console.log('5. Replace "your-jwt-token-here" in this file with the actual token');
console.log('6. Run this test again');
console.log('');

// Uncomment the line below and add your token to test
// testPaymentEndpoint();