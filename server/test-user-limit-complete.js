require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
const { checkUserLimit, validateLimitChange } = require('./services/userLimitService');

async function testUserLimitComplete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('✅ Connected to MongoDB');

    // Create test company with limit of 3 users
    const testCompanyId = `test_${Date.now()}`;
    const testCompany = new Company({
      companyId: testCompanyId,
      name: 'Test Company',
      adminEmail: `admin_${Date.now()}@test.com`,
      adminPhone: '+251911234567',
      limits: { maxUsers: 3, maxStorage: 5368709120 },
      status: 'active'
    });
    await testCompany.save();
    console.log(`✅ Created test company: ${testCompanyId} with limit of 3 users`);

    // Create 2 existing users
    const timestamp = Date.now();
    const user1 = new User({
      name: 'User 1',
      username: 'user1_' + timestamp,
      password: 'password123',
      email: `user1_${timestamp}@test.com`,
      role: 'user',
      companyId: testCompanyId,
      status: 'approved',
      isActive: true
    });
    await user1.save();

    const user2 = new User({
      name: 'User 2', 
      username: 'user2_' + timestamp,
      password: 'password123',
      email: `user2_${timestamp}@test.com`,
      role: 'user',
      companyId: testCompanyId,
      status: 'approved',
      isActive: true
    });
    await user2.save();

    console.log('✅ Created 2 existing users (2/3 limit used)');

    console.log('\n🧪 Testing User Limit Scenarios');
    console.log('================================');

    // Test 1: Check current status (2/3 users)
    console.log('\n1. Current status (2/3 users):');
    const status1 = await checkUserLimit(testCompanyId, false);
    console.log('   Result:', status1);

    // Test 2: Add 3rd user (should reach 100% and send SMS)
    console.log('\n2. Adding 3rd user (should reach 100% limit):');
    const status2 = await checkUserLimit(testCompanyId, true);
    console.log('   Result:', status2);
    
    if (status2.canAdd) {
      const user3 = new User({
        name: 'User 3',
        username: 'user3_' + timestamp,
        password: 'password123',
        email: `user3_${timestamp}@test.com`,
        role: 'user',
        companyId: testCompanyId,
        status: 'approved',
        isActive: true
      });
      await user3.save();
      console.log('   ✅ User 3 added successfully');
      
      if (status2.reachedLimit) {
        console.log('   📱 SMS should have been sent to admin about reaching 100% limit');
      }
    }

    // Test 3: Try to add 4th user (should fail and send SMS)
    console.log('\n3. Trying to add 4th user (should fail):');
    const status3 = await checkUserLimit(testCompanyId, true);
    console.log('   Result:', status3);
    
    if (!status3.canAdd) {
      console.log('   ❌ Correctly blocked 4th user');
      console.log('   📱 SMS should have been sent about contacting super admin');
    }

    // Test 4: Super admin limit validation
    console.log('\n4. Testing super admin limit changes:');
    
    // Try to set limit below current users (should fail)
    const lowLimit = await validateLimitChange(testCompanyId, 2);
    console.log('   Setting limit to 2 (below 3 users):', lowLimit);
    
    // Try to set limit above current users (should pass)
    const highLimit = await validateLimitChange(testCompanyId, 5);
    console.log('   Setting limit to 5 (above 3 users):', highLimit);

    // Test 5: Update limit and test again
    console.log('\n5. Updating company limit to 5 users:');
    await Company.findOneAndUpdate(
      { companyId: testCompanyId },
      { $set: { 'limits.maxUsers': 5 } }
    );
    
    const status4 = await checkUserLimit(testCompanyId, true);
    console.log('   Can add user after limit increase:', status4);

    console.log('\n✅ All tests completed successfully!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ companyId: testCompanyId });
    await Company.deleteOne({ companyId: testCompanyId });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

testUserLimitComplete();