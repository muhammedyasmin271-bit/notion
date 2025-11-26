const fetch = require('node-fetch');
require('dotenv').config();

const tx_ref = 'pay-comp_1764139276619_5xu76ixhi-40104529';

async function debugChapaVerify() {
  try {
    const CHAPA_TOKEN = process.env.CHAPA_TOKEN;
    const CHAPA_API = process.env.CHAPA_API || 'https://api.chapa.co/v1';
    
    console.log('🔧 Debug Chapa Verification');
    console.log('Token:', CHAPA_TOKEN ? CHAPA_TOKEN.substring(0, 15) + '...' : 'MISSING');
    console.log('API:', CHAPA_API);
    console.log('TX_REF:', tx_ref);
    
    const verifyUrl = `${CHAPA_API}/transaction/verify/${tx_ref}`;
    console.log('🌐 Calling:', verifyUrl);
    
    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_TOKEN}`
      }
    });
    
    console.log('📡 Response Status:', response.status);
    const data = await response.json();
    
    console.log('📊 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n🔍 Analysis:');
    console.log('API Status:', data.status);
    console.log('Transaction Status:', data.data?.status);
    console.log('Amount:', data.data?.amount);
    console.log('Currency:', data.data?.currency);
    
    // Current verification logic
    const apiStatus = data.status?.toLowerCase();
    const transactionStatus = data.data?.status?.toLowerCase();
    const isSuccessful = 
      apiStatus === 'success' && 
      transactionStatus === 'success' &&
      data.data?.amount > 0;
      
    console.log('\n✅ Current Logic Result:');
    console.log('API Status Match (success):', apiStatus === 'success');
    console.log('Transaction Status Match (successful):', transactionStatus === 'successful');
    console.log('Amount > 0:', data.data?.amount > 0);
    console.log('Final Result:', isSuccessful ? 'APPROVED' : 'REJECTED');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugChapaVerify();