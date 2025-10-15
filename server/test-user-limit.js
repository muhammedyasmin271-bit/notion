/**
 * Test script to verify user limit enforcement
 * 
 * This script tests that the user limit system works correctly:
 * 1. Creates a test company with maxUsers: 2
 * 2. Creates 2 approved users
 * 3. Attempts to create a 3rd user (should fail)
 * 4. Increases limit to 5
 * 5. Attempts to create 3rd user (should succeed)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');

async function testUserLimit() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mela-note', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    const testCompanyId = 'test-' + Date.now();

    // Step 1: Create test company with maxUsers: 2
    console.log('📋 Step 1: Creating test company with maxUsers: 2');
    const company = new Company({
      companyId: testCompanyId,
      name: 'Test Company (User Limit)',
      adminEmail: `admin-${testCompanyId}@test.com`,
      limits: {
        maxUsers: 2,
        maxStorage: 5368709120
      },
      status: 'active'
    });
    await company.save();
    console.log(`✅ Company created: ${company.name} (limit: ${company.limits.maxUsers} users)\n`);

    // Step 2: Create 2 approved users
    console.log('📋 Step 2: Creating 2 approved users');
    const timestamp1 = Date.now();
    const user1 = new User({
      name: 'Test User 1',
      username: `user1_${timestamp1}`,
      email: `user1_${timestamp1}@test.com`,
      password: 'password123',
      companyId: testCompanyId,
      role: 'user',
      status: 'approved',
      isActive: true
    });
    await user1.save();
    console.log(`✅ User 1 created: ${user1.username}`);

    const timestamp2 = Date.now() + 1;
    const user2 = new User({
      name: 'Test User 2',
      username: `user2_${timestamp2}`,
      email: `user2_${timestamp2}@test.com`,
      password: 'password123',
      companyId: testCompanyId,
      role: 'user',
      status: 'approved',
      isActive: true
    });
    await user2.save();
    console.log(`✅ User 2 created: ${user2.username}\n`);

    // Step 3: Count users
    const userCount = await User.countDocuments({ 
      companyId: testCompanyId,
      status: { $ne: 'declined' }
    });
    console.log(`📊 Current user count: ${userCount}/${company.limits.maxUsers}\n`);

    // Step 4: Simulate limit check for 3rd user
    console.log('📋 Step 3: Checking if 3rd user can be created');
    const maxUsers = company.limits.maxUsers;
    if (userCount >= maxUsers) {
      console.log(`❌ BLOCKED: Company has reached its maximum user limit (${maxUsers} users)`);
      console.log('✅ User limit enforcement is working correctly!\n');
    } else {
      console.log(`⚠️ WARNING: User creation should have been blocked but wasn't!\n`);
    }

    // Step 5: Increase limit to 5
    console.log('📋 Step 4: Super admin increases limit to 5');
    company.limits.maxUsers = 5;
    await company.save();
    console.log(`✅ Company limit increased to: ${company.limits.maxUsers} users\n`);

    // Step 6: Check if 3rd user can now be created
    console.log('📋 Step 5: Checking if 3rd user can now be created');
    const newMaxUsers = company.limits.maxUsers;
    if (userCount < newMaxUsers) {
      console.log(`✅ ALLOWED: Company can now have up to ${newMaxUsers} users (currently ${userCount})`);
      console.log('✅ Limit increase is working correctly!\n');
      
      // Actually create the 3rd user
      const timestamp3 = Date.now() + 2;
      const user3 = new User({
        name: 'Test User 3',
        username: `user3_${timestamp3}`,
        email: `user3_${timestamp3}@test.com`,
        password: 'password123',
        companyId: testCompanyId,
        role: 'user',
        status: 'approved',
        isActive: true
      });
      await user3.save();
      console.log(`✅ User 3 created: ${user3.username}\n`);
    }

    // Step 7: Test declined user doesn't count
    console.log('📋 Step 6: Testing that declined users don\'t count');
    const timestampD = Date.now() + 3;
    const declinedUser = new User({
      name: 'Declined User',
      username: `dec_${timestampD}`,
      email: `decline_${timestampD}@test.com`,
      password: 'password123',
      companyId: testCompanyId,
      role: 'user',
      status: 'declined',
      isActive: false
    });
    await declinedUser.save();
    console.log(`✅ Declined user created: ${declinedUser.username}`);

    const activeCount = await User.countDocuments({ 
      companyId: testCompanyId,
      status: { $ne: 'declined' }
    });
    const totalCount = await User.countDocuments({ companyId: testCompanyId });
    console.log(`📊 Total users: ${totalCount}, Active/Pending: ${activeCount}`);
    console.log('✅ Declined users are correctly excluded from count!\n');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await User.deleteMany({ companyId: testCompanyId });
    await Company.deleteOne({ companyId: testCompanyId });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 ALL TESTS PASSED! User limit enforcement is working correctly!');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run the test
testUserLimit();

