/**
 * Test payment with realistic data
 * Run: node test-payment-real.js
 */

require('dotenv').config();
const fetch = require('node-fetch');

async function testRealPayment() {
  console.log('\n🧪 Testing Payment with Realistic Data...\n');
  
  let CHAPA_TOKEN = (process.env.CHAPA_TOKEN || '').trim();
  if (CHAPA_TOKEN.startsWith('"') && CHAPA_TOKEN.endsWith('"')) {
    CHAPA_TOKEN = CHAPA_TOKEN.slice(1, -1);
  }
  
  const CHAPA_API = 'https://api.chapa.co/v1';
  
  // Use a more realistic email (Chapa might reject test@example.com)
  const testPayment = {
    amount: 100,
    currency: 'ETB',
    email: 'customer@gmail.com', // More realistic email
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '+251911123456',
    tx_ref: `payment-${Date.now()}`,
    callback_url: 'process.env.Backendurl/api/payments/chapa/callback',
    return_url: 'process.env.Backendurl/admin/payments?status=success',
    customization: {
      title: 'Subscription',
      description: 'Monthly subscription payment'
    }
  };
  
  console.log('📦 Payment Data:');
  console.log(JSON.stringify(testPayment, null, 2));
  console.log('');
  
  try {
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
    console.log('📦 Response:', JSON.stringify(data, null, 2));
    console.log('');
    
    if (response.ok && data.status === 'success' && data.data && data.data.checkout_url) {
      console.log('✅ SUCCESS! Payment initialization works!');
      console.log('🔗 Checkout URL:', data.data.checkout_url);
      console.log('');
      console.log('🎉 Your payment integration is working correctly!');
      console.log('');
      console.log('✅ All tests passed!');
      console.log('   - Chapa token is valid');
      console.log('   - API connection works');
      console.log('   - Payment initialization successful');
      console.log('   - Checkout URL generated');
      console.log('');
      console.log('💡 Your payment system is ready to use!');
      console.log('   Just make sure users have valid email addresses in their profiles.');
    } else {
      console.log('❌ Payment test failed');
      if (data.message) {
        console.log('Error details:', JSON.stringify(data.message, null, 2));
      }
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testRealPayment();

