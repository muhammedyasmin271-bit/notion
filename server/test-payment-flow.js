/**
 * Test the complete payment flow
 * Run: node test-payment-flow.js
 * 
 * This tests:
 * 1. Chapa token configuration
 * 2. Payment initialization endpoint structure
 * 3. Chapa API connection
 */

require('dotenv').config();
const fetch = require('node-fetch');

async function testPaymentFlow() {
  console.log('\n🧪 Testing Payment Flow...\n');
  
  // Step 1: Check Chapa Configuration
  console.log('📋 Step 1: Checking Chapa Configuration...');
  let CHAPA_TOKEN = (process.env.CHAPA_TOKEN || process.env.CHAPA_SECRET_KEY || '').trim();
  if (CHAPA_TOKEN.startsWith('"') && CHAPA_TOKEN.endsWith('"')) {
    CHAPA_TOKEN = CHAPA_TOKEN.slice(1, -1);
  }
  if (CHAPA_TOKEN.startsWith("'") && CHAPA_TOKEN.endsWith("'")) {
    CHAPA_TOKEN = CHAPA_TOKEN.slice(1, -1);
  }
  
  const CHAPA_API = (process.env.CHAPA_API || 'https://api.chapa.co/v1').trim();
  const BASE_URL = (process.env.BASE_URL || 'process.env.Backendurl').trim();
  
  if (!CHAPA_TOKEN) {
    console.error('❌ CHAPA_TOKEN not found!');
    return;
  }
  
  console.log('✅ Token configured:', CHAPA_TOKEN.substring(0, 20) + '...');
  console.log('✅ API URL:', CHAPA_API);
  console.log('✅ Base URL:', BASE_URL);
  console.log('');
  
  // Step 2: Test Chapa API with valid data
  console.log('📋 Step 2: Testing Chapa API with valid payment data...');
  
  const testPayment = {
    amount: 100,
    currency: 'ETB',
    email: 'test@example.com', // Valid email format
    first_name: 'Test',
    last_name: 'User',
    phone_number: '+251911123456',
    tx_ref: `test-payment-${Date.now()}`,
    callback_url: 'process.env.Backendurl/api/payments/chapa/callback',
    return_url: `${BASE_URL}/admin/payments?status=success`,
    customization: {
      title: 'Test Payment',
      description: 'Testing payment flow'
    },
    meta: {
      companyId: 'test-company',
      companyName: 'Test Company',
      userId: 'test-user-id',
      months: JSON.stringify([1, 2, 3]),
      year: '2024',
      planName: 'One Month Plan'
    }
  };
  
  try {
    console.log('🚀 Sending test payment to Chapa...');
    console.log('   Amount:', testPayment.amount, testPayment.currency);
    console.log('   Email:', testPayment.email);
    console.log('   Transaction Ref:', testPayment.tx_ref);
    console.log('');
    
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
    
    if (response.ok && data.status === 'success' && data.data && data.data.checkout_url) {
      console.log('✅ SUCCESS! Chapa API is working!');
      console.log('🔗 Checkout URL:', data.data.checkout_url);
      console.log('');
      console.log('✅ Payment flow test PASSED!');
      console.log('');
      console.log('📝 Summary:');
      console.log('   ✅ Chapa token is configured correctly');
      console.log('   ✅ Chapa API is accessible');
      console.log('   ✅ Payment initialization works');
      console.log('   ✅ Checkout URL is generated');
      console.log('');
      console.log('🎉 Your payment integration is ready to use!');
      console.log('');
      console.log('💡 Next steps:');
      console.log('   1. Make sure your server is running (npm run dev)');
      console.log('   2. Login as a company admin');
      console.log('   3. Go to the payment page');
      console.log('   4. Select a plan and click "Pay with Chapa"');
      console.log('   5. You should be redirected to Chapa checkout page');
      console.log('');
    } else {
      console.log('❌ Chapa API test failed');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (response.status === 401) {
        console.log('');
        console.log('⚠️  Authentication failed. Your CHAPA_TOKEN might be invalid.');
      } else if (data.message) {
        console.log('');
        console.log('⚠️  Error:', JSON.stringify(data.message, null, 2));
      }
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Step 3: Test endpoint structure
  console.log('');
  console.log('📋 Step 3: Testing backend endpoint availability...');
  try {
    const endpointTest = await fetch('process.env.Backendurl/api/payments/chapa/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'test-token'
      },
      body: JSON.stringify({ amount: 100 })
    });
    
    const endpointData = await endpointTest.json();
    
    if (endpointTest.status === 401 || endpointTest.status === 403) {
      console.log('✅ Endpoint exists (authentication required as expected)');
    } else if (endpointTest.status === 500 && endpointData.error === 'CHAPA_TOKEN not found') {
      console.log('⚠️  Endpoint exists but CHAPA_TOKEN not found in server environment');
      console.log('   Make sure server/.env has CHAPA_TOKEN and server is restarted');
    } else {
      console.log('✅ Endpoint is accessible');
      console.log('   Status:', endpointTest.status);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Backend server is not running');
      console.log('   Start it with: cd server && npm run dev');
    } else {
      console.log('⚠️  Could not test endpoint:', error.message);
    }
  }
  
  console.log('');
}

testPaymentFlow();

