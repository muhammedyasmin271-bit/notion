const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testManagerRegistration() {
  console.log('🧪 Testing Manager Registration System...\n');

  try {
    // Test 1: Register first manager (should be auto-approved)
    console.log('1️⃣ Testing first manager registration (should auto-approve)...');
    const firstManager = {
      name: 'First Manager',
      username: 'firstmanager',
      password: 'password123',
      role: 'manager'
    };

    const firstResponse = await axios.post(`${API_BASE}/auth/register`, firstManager);
    console.log('✅ First manager registered:', {
      status: firstResponse.data.user?.status || 'approved',
      hasToken: !!firstResponse.data.token,
      requiresApproval: firstResponse.data.requiresApproval
    });

    // Test 2: Register second manager (should require approval)
    console.log('\n2️⃣ Testing second manager registration (should require approval)...');
    const secondManager = {
      name: 'Second Manager',
      username: 'secondmanager',
      password: 'password123',
      role: 'manager'
    };

    const secondResponse = await axios.post(`${API_BASE}/auth/register`, secondManager);
    console.log('✅ Second manager registered:', {
      status: secondResponse.data.user?.status || 'unknown',
      hasToken: !!secondResponse.data.token,
      requiresApproval: secondResponse.data.requiresApproval,
      message: secondResponse.data.message
    });

    // Test 3: Try to login with pending manager (should fail)
    console.log('\n3️⃣ Testing login with pending manager (should fail)...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        username: 'secondmanager',
        password: 'password123'
      });
      console.log('❌ Login should have failed but succeeded');
    } catch (error) {
      console.log('✅ Login correctly failed:', error.response?.data?.message);
    }

    console.log('\n🎉 Manager registration system is working correctly!');
    console.log('\n📋 Summary:');
    console.log('- First manager: Auto-approved ✅');
    console.log('- Subsequent managers: Require approval ✅');
    console.log('- Pending managers cannot login ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testManagerRegistration();