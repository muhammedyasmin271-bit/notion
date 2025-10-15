/**
 * MANUAL TESTING CHECKLIST
 * Run this to test with actual user credentials
 */

const fetch = require('node-fetch');
const BASE_URL = 'http://localhost:9000/api';

async function manualTest() {
  console.log('\n🧪 MANUAL TESTING WITH REAL CREDENTIALS\n');
  console.log('Testing with admin user...\n');
  
  // Try login with admin (we know this exists from debug)
  const loginAttempts = [
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: 'admin123' },
    { username: 'manager', password: 'manager' },
    { username: 'manager', password: 'manager123' }
  ];
  
  for (const cred of loginAttempts) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred)
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log(`✅ Login successful with ${cred.username}`);
      console.log(`   Token: ${data.token.substring(0, 30)}...`);
      console.log(`   User: ${JSON.stringify(data.user, null, 2)}`);
      
      // Now test other endpoints with this token
      await testWithToken(data.token, data.user);
      return;
    } else {
      console.log(`❌ Failed: ${cred.username}/${cred.password} - ${data.message || 'Unknown error'}`);
    }
  }
  
  console.log('\n⚠️  Could not log in with any credentials');
  console.log('\n📋 PLEASE TEST MANUALLY:');
  console.log('   1. Open http://localhost:3000');
  console.log('   2. Try logging in with different credentials');
  console.log('   3. Follow the comprehensive manual test checklist below\n');
}

async function testWithToken(token, user) {
  console.log(`\n\n📊 TESTING WITH AUTHENTICATED USER\n`);
  
  const tests = [
    { name: 'Projects', endpoint: '/projects' },
    { name: 'Documents', endpoint: '/documents' },
    { name: 'Notes', endpoint: '/notepad' },
    { name: 'Meetings', endpoint: '/meetings' },
    { name: 'Tasks', endpoint: '/tasks' },
    { name: 'Goals', endpoint: '/goals' },
    { name: 'Reports', endpoint: '/reports' },
    { name: 'Users', endpoint: '/users' },
    { name: 'Notifications', endpoint: '/notifications' }
  ];
  
  for (const test of tests) {
    const response = await fetch(`${BASE_URL}${test.endpoint}`, {
      headers: { 'x-auth-token': token }
    });
    
    const data = await response.json();
    const count = Array.isArray(data) ? data.length : '?';
    
    if (response.ok) {
      console.log(`✅ ${test.name.padEnd(20)} - ${count} items`);
    } else {
      console.log(`❌ ${test.name.padEnd(20)} - ${data.message || 'Failed'}`);
    }
  }
}

manualTest().catch(console.error);

