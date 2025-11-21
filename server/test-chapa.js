const fetch = require('node-fetch');
require('dotenv').config();

async function testChapaAPI() {
  const CHAPA_TOKEN = process.env.CHAPA_TOKEN;
  const CHAPA_API = process.env.CHAPA_API || 'https://api.chapa.co/v1';
  
  console.log('🔧 Testing Chapa API Configuration...');
  console.log('Token:', CHAPA_TOKEN ? `${CHAPA_TOKEN.substring(0, 15)}...` : 'NOT FOUND');
  console.log('API Base:', CHAPA_API);
  
  if (!CHAPA_TOKEN) {
    console.error('❌ CHAPA_TOKEN not found in .env file');
    return;
  }
  
  // Test payment data
  const testPayment = {
    amount: 100,
    currency: 'ETB',
    email: 'testuser@gmail.com',
    first_name: 'Test',
    last_name: 'User',
    phone_number: '+251911123456',
    tx_ref: `test-${Date.now()}`,
    callback_url: 'http://localhost:9000/api/payments/chapa/callback',
    return_url: 'http://localhost:3000/admin/payments?status=success',
    customization: {
      title: 'Test Payment',
      description: 'Testing Chapa API integration'
    }
  };
  
  try {
    console.log('🚀 Sending test payment to Chapa...');
    
    const response = await fetch(`${CHAPA_API}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayment)
    });
    
    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.status === 'success' && data.data && data.data.checkout_url) {
      console.log('✅ Chapa API is working correctly!');
      console.log('🔗 Test checkout URL:', data.data.checkout_url);
    } else {
      console.log('❌ Chapa API test failed');
      if (data.message) {
        console.log('Error message:', data.message);
      }
      if (data.status) {
        console.log('Status:', data.status);
      }
    }
  } catch (error) {
    console.error('💥 Error testing Chapa API:', error.message);
  }
}

testChapaAPI();