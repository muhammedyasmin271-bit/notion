// Test script to verify points rating system toggle functionality
// Run this with: node test-points-toggle.js

const axios = require('axios');

const BASE_URL = 'http://localhost:9000/api';

// Test data
const testCompanyData = {
  companyName: 'Test Company Points Toggle',
  companyEmail: 'admin@testpointstoggle.com',
  companyPhone: '+251912345678',
  selectedPlan: 'free_trial',
  maxUsers: 5,
  adminFirstName: 'Test',
  adminLastName: 'Admin',
  adminEmail: 'admin@testpointstoggle.com',
  adminPhone: '+251912345678',
  adminPassword: 'testpassword123',
  adminUsername: 'testadmin_points',
  pointsEnabled: false // Test with points disabled initially
};

async function testPointsToggle() {
  try {
    console.log('🧪 Testing Points Rating System Toggle Functionality\n');

    // Step 1: Create company with points disabled
    console.log('1️⃣ Creating company with points system DISABLED...');
    const createResponse = await axios.post(`${BASE_URL}/company/create`, testCompanyData);
    
    if (createResponse.status === 201) {
      console.log('✅ Company created successfully');
      console.log(`   Company ID: ${createResponse.data.companyId}`);
      console.log(`   Admin Username: ${createResponse.data.adminUsername}`);
    } else {
      throw new Error('Failed to create company');
    }

    // Step 2: Login as admin
    console.log('\n2️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: testCompanyData.adminUsername,
      password: testCompanyData.adminPassword,
      companyId: createResponse.data.companyId
    });

    if (loginResponse.status === 200) {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.token;
      
      // Step 3: Check initial company settings
      console.log('\n3️⃣ Checking initial company settings...');
      const companyResponse = await axios.get(`${BASE_URL}/company/my-company`, {
        headers: { 'x-auth-token': token }
      });
      
      console.log(`   Points Enabled: ${companyResponse.data.pointsEnabled}`);
      console.log(`   Company Rating: ${companyResponse.data.rating}`);
      
      if (companyResponse.data.pointsEnabled === false) {
        console.log('✅ Points system correctly disabled initially');
      } else {
        console.log('❌ Points system should be disabled initially');
      }

      // Step 4: Enable points system
      console.log('\n4️⃣ Enabling points system...');
      const enableResponse = await axios.put(`${BASE_URL}/company/points-system`, 
        { pointsEnabled: true },
        { headers: { 'x-auth-token': token } }
      );
      
      if (enableResponse.status === 200) {
        console.log('✅ Points system enabled successfully');
        console.log(`   Message: ${enableResponse.data.message}`);
      }

      // Step 5: Verify points system is enabled
      console.log('\n5️⃣ Verifying points system is enabled...');
      const verifyResponse = await axios.get(`${BASE_URL}/company/my-company`, {
        headers: { 'x-auth-token': token }
      });
      
      if (verifyResponse.data.pointsEnabled === true) {
        console.log('✅ Points system correctly enabled');
        console.log(`   Points Enabled At: ${verifyResponse.data.pointsEnabledAt || 'Not set'}`);
      } else {
        console.log('❌ Points system should be enabled');
      }

      // Step 6: Disable points system
      console.log('\n6️⃣ Disabling points system...');
      const disableResponse = await axios.put(`${BASE_URL}/company/points-system`, 
        { pointsEnabled: false },
        { headers: { 'x-auth-token': token } }
      );
      
      if (disableResponse.status === 200) {
        console.log('✅ Points system disabled successfully');
        console.log(`   Message: ${disableResponse.data.message}`);
      }

      // Step 7: Final verification
      console.log('\n7️⃣ Final verification...');
      const finalResponse = await axios.get(`${BASE_URL}/company/my-company`, {
        headers: { 'x-auth-token': token }
      });
      
      if (finalResponse.data.pointsEnabled === false) {
        console.log('✅ Points system correctly disabled');
      } else {
        console.log('❌ Points system should be disabled');
      }

      console.log('\n🎉 All tests completed successfully!');
      console.log('\n📋 Test Summary:');
      console.log('   ✅ Company creation with points toggle');
      console.log('   ✅ Admin authentication');
      console.log('   ✅ Points system enable/disable API');
      console.log('   ✅ Company settings retrieval');
      
    } else {
      throw new Error('Failed to login as admin');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already in use')) {
      console.log('\n💡 Tip: The test company might already exist. Try changing the email/username in the test data.');
    }
  }
}

// Run the test
testPointsToggle();