require('dotenv').config();
const mongoose = require('mongoose');
const { checkUserLimit, validateLimitChange } = require('./services/userLimitService');

async function testUserLimit() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app');
    console.log('✅ Connected to MongoDB');

    // Test with a sample company ID
    const testCompanyId = 'comp_1763726923861_test';
    
    console.log('\n🧪 Testing User Limit Functionality');
    console.log('=====================================');
    
    // Test 1: Check current limit status
    console.log('\n1. Checking current user limit status...');
    const currentStatus = await checkUserLimit(testCompanyId, false);
    console.log('Current status:', currentStatus);
    
    // Test 2: Simulate adding a user
    console.log('\n2. Simulating adding a new user...');
    const addUserStatus = await checkUserLimit(testCompanyId, true);
    console.log('Add user status:', addUserStatus);
    
    // Test 3: Validate limit changes
    console.log('\n3. Testing limit validation...');
    
    // Try to set limit lower than current users
    const lowLimitValidation = await validateLimitChange(testCompanyId, 1);
    console.log('Low limit validation (should fail):', lowLimitValidation);
    
    // Try to set limit higher than current users
    const highLimitValidation = await validateLimitChange(testCompanyId, 100);
    console.log('High limit validation (should pass):', highLimitValidation);
    
    console.log('\n✅ User limit functionality test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

testUserLimit();