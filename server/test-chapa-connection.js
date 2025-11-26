/**
 * Test Chapa API connection with your actual token
 * Run: node test-chapa-connection.js
 */

require('dotenv').config();

const fetch = require('node-fetch');

async function testChapaConnection() {
  // Get token and clean it (remove quotes if present)
  let CHAPA_TOKEN = (process.env.CHAPA_TOKEN || process.env.CHAPA_SECRET_KEY || '').trim();
  if (CHAPA_TOKEN.startsWith('"') && CHAPA_TOKEN.endsWith('"')) {
    CHAPA_TOKEN = CHAPA_TOKEN.slice(1, -1);
  }
  if (CHAPA_TOKEN.startsWith("'") && CHAPA_TOKEN.endsWith("'")) {
    CHAPA_TOKEN = CHAPA_TOKEN.slice(1, -1);
  }
  
  const CHAPA_API = (process.env.CHAPA_API || 'https://api.chapa.co/v1').trim();
  
  console.log('\n🔍 Testing Chapa API Connection...\n');
  console.log('Token (first 20 chars):', CHAPA_TOKEN.substring(0, 20) + '...');
  console.log('Token length:', CHAPA_TOKEN.length);
  console.log('Token starts with:', CHAPA_TOKEN.substring(0, 8));
  console.log('API URL:', CHAPA_API);
  console.log('');
  
  if (!CHAPA_TOKEN) {
    console.error('❌ CHAPA_TOKEN is not set!');
    console.error('\nMake sure your server/.env file has:');
    console.error('CHAPA_TOKEN=CHASECK-9InSJMt5QQ7ksdq8cZA6I7szlgePMoQr');
    console.error('\n⚠️  Note: Do NOT use quotes around the value in .env file!');
    process.exit(1);
  }
  
  // Test payment data
  const testPayment = {
    amount: 100,
    currency: 'ETB',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone_number: '+251911123456',
    tx_ref: `test-${Date.now()}`,
    callback_url: 'http://localhost:9000/api/payments/chapa/callback',
    return_url: 'http://localhost:3000/admin/payments?status=success',
    customization: {
      title: 'Test Payment',
      description: 'Testing Chapa API connection'
    }
  };
  
  try {
    console.log('🚀 Sending test request to Chapa API...\n');
    
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
    console.log('');
    
    if (response.ok && data.status === 'success' && data.data && data.data.checkout_url) {
      console.log('✅ SUCCESS! Chapa API is working correctly!');
      console.log('🔗 Test checkout URL:', data.data.checkout_url);
      console.log('\n✅ Your payment integration is ready to use!\n');
    } else {
      console.log('❌ Chapa API test failed');
      if (data.message) {
        console.log('Error message:', data.message);
      }
      if (data.status) {
        console.log('Status:', data.status);
      }
      if (response.status === 401) {
        console.log('\n⚠️  Authentication failed. Check if your CHAPA_TOKEN is correct.');
        console.log('   Make sure you copied the full token without quotes.');
      }
    }
  } catch (error) {
    console.error('💥 Error testing Chapa API:', error.message);
    console.error('Stack:', error.stack);
  }
}

testChapaConnection();

