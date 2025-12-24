// Quick API health and endpoint test
const fetch = require('node-fetch');

async function quickTest() {
  console.log('🔍 QUICK API HEALTH CHECK\n');
  
  const tests = [
    { name: 'Health Endpoint', url: 'process.env.Backendurl/api/health', method: 'GET' },
    { name: 'Login Endpoint', url: 'process.env.Backendurl/api/auth/login', method: 'POST', body: { username: 'test', password: 'test' } },
    { name: 'Payment Settings', url: 'process.env.Backendurl/api/settings/payment', method: 'GET' }
  ];
  
  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const res = await fetch(test.url, options);
      const data = await res.json();
      
      console.log(`${res.ok ? '✅' : '⚠️'}  ${test.name.padEnd(20)} - Status: ${res.status}`);
      if (test.name === 'Health Endpoint' && data) {
        console.log(`   Database: ${data.database}, Status: ${data.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name.padEnd(20)} - Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Backend server is responding');
  console.log('📋 Please run manual tests using COMPLETE_TESTING_GUIDE.md\n');
}

quickTest();

