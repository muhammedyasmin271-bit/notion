// Test script to verify points system toggle works
// Run with: node test-points-fix.js

const axios = require('axios');

const BASE_URL = 'http://localhost:9000/api';

async function testPointsToggle() {
  try {
    console.log('🧪 Testing Points System Toggle Fix\n');

    // Test 1: Self-registration with points DISABLED
    console.log('1️⃣ Testing self-registration with points DISABLED...');
    const selfRegData = {
      companyName: 'Test Points Disabled Company',
      companyEmail: 'admin@pointsdisabled.com',
      companyPhone: '+251912345678',
      selectedPlan: 'free_trial',
      maxUsers: 5,
      adminFirstName: 'Test',
      adminLastName: 'Admin',
      adminEmail: 'admin@pointsdisabled.com',
      adminPhone: '+251912345678',
      adminPassword: 'testpass123',
      adminUsername: 'testadmin_disabled',
      pointsEnabled: false // DISABLED
    };

    const selfRegResponse = await axios.post(`${BASE_URL}/company/create`, selfRegData);
    
    if (selfRegResponse.status === 201) {
      console.log('✅ Self-registration successful');
      const companyId = selfRegResponse.data.companyId;
      console.log(`   Company ID: ${companyId}`);
      
      // Login and check points status
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        username: selfRegData.adminUsername,
        password: selfRegData.adminPassword,
        companyId: companyId
      });
      
      if (loginResponse.status === 200) {
        const token = loginResponse.data.token;
        
        // Check company settings
        const companyResponse = await axios.get(`${BASE_URL}/company/my-company`, {
          headers: { 'x-auth-token': token }
        });
        
        console.log(`   Points Enabled: ${companyResponse.data.pointsEnabled}`);
        
        if (companyResponse.data.pointsEnabled === false) {
          console.log('✅ Points correctly DISABLED for self-registration');
        } else {
          console.log('❌ Points should be DISABLED but are enabled');
        }
      }
    }

    console.log('\n2️⃣ Testing admin creation with points DISABLED...');
    
    // First, login as super admin (you'll need to create one or use existing credentials)
    // For this test, we'll assume super admin exists
    console.log('   Note: This test requires super admin credentials');
    console.log('   Super admin should create a company with points disabled and verify');

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Manual verification steps:');
    console.log('1. Create company with points toggle OFF');
    console.log('2. Login to the company');
    console.log('3. Go to Settings → Company tab (admin only)');
    console.log('4. Check if points system shows as DISABLED');
    console.log('5. Try completing a project - no points should be awarded');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already in use')) {
      console.log('\n💡 Tip: The test company might already exist. Try changing the email/username in the test data.');
    }
  }
}

// Run the test
testPointsToggle();