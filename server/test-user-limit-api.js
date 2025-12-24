require('dotenv').config();
const axios = require('axios');

const API_BASE = 'process.env.Backendurl/api';

async function testUserLimitAPI() {
  try {
    console.log('🧪 Testing User Limit API Endpoints');
    console.log('===================================');

    // First, create a test company via super admin
    console.log('\n1. Creating test company with 2 user limit...');
    
    const companyData = {
      name: 'API Test Company',
      adminEmail: `api_admin_${Date.now()}@test.com`,
      adminPhone: '+251911234567',
      adminUsername: `api_admin_${Date.now()}`,
      adminPassword: 'password123',
      maxUsers: 2,
      selectedPlan: 'free_trial'
    };

    // Note: This would require super admin authentication in real scenario
    console.log('   Company data prepared:', companyData.name);
    console.log('   Max users:', companyData.maxUsers);
    console.log('   Admin phone:', companyData.adminPhone);

    console.log('\n2. Testing user registration with limit...');
    
    // Simulate user registration that would hit the limit
    const userData1 = {
      name: 'Test User 1',
      username: `testuser1_${Date.now()}`,
      password: 'password123',
      email: `testuser1_${Date.now()}@test.com`,
      companyId: 'existing_company_id' // Would use real company ID
    };

    console.log('   User 1 data prepared:', userData1.name);

    const userData2 = {
      name: 'Test User 2', 
      username: `testuser2_${Date.now()}`,
      password: 'password123',
      email: `testuser2_${Date.now()}@test.com`,
      companyId: 'existing_company_id'
    };

    console.log('   User 2 data prepared:', userData2.name);

    console.log('\n✅ API test data prepared successfully');
    console.log('\n📝 To test the full API flow:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Create a company via super admin');
    console.log('   3. Register users until limit is reached');
    console.log('   4. Try to register one more user (should fail)');
    console.log('   5. Check SMS notifications');

  } catch (error) {
    console.error('❌ API test preparation failed:', error.message);
  }
}

testUserLimitAPI();