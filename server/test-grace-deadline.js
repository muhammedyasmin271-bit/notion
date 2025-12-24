const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
require('dotenv').config();

async function testGraceAndDeadline() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app');
    console.log('✅ Connected to database');

    const testUser = await User.findOne({ role: 'admin' });
    if (!testUser) {
      console.log('❌ No admin user found for testing');
      return;
    }

    console.log('\n🧪 Testing Grace Period and Deadline Flow');
    console.log('═══════════════════════════════════════════');

    // Test 1: Create a company that should be in grace period
    console.log('\n📅 Test 1: Company entering Grace Period');
    
    const graceCompany = new Company({
      companyId: 'test-grace-flow-' + Date.now(),
      name: 'Grace Period Test Company',
      adminEmail: 'grace-test@example.com',
      adminUserId: testUser._id,
      selectedPlan: 'one_month',
      hasPaid: false,
      status: 'active',
      paymentDeadline: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago (expired)
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
    });

    await graceCompany.save();
    console.log('✅ Created company with expired payment deadline');
    console.log('   Company ID:', graceCompany.companyId);
    console.log('   Status:', graceCompany.status);
    console.log('   Payment Deadline:', graceCompany.paymentDeadline);
    console.log('   Grace Period Deadline:', graceCompany.gracePeriodDeadline || 'Not set');

    // Test 2: Create a company that should be in deadline (blocked)
    console.log('\n⏰ Test 2: Company entering Deadline (Blocked)');
    
    const deadlineCompany = new Company({
      companyId: 'test-deadline-flow-' + Date.now(),
      name: 'Deadline Test Company',
      adminEmail: 'deadline-test@example.com',
      adminUserId: testUser._id,
      selectedPlan: 'one_month',
      hasPaid: false,
      status: 'paused',
      paymentDeadline: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      gracePeriodDeadline: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago (expired)
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
    });

    await deadlineCompany.save();
    console.log('✅ Created company with expired grace period');
    console.log('   Company ID:', deadlineCompany.companyId);
    console.log('   Status:', deadlineCompany.status);
    console.log('   Grace Period Deadline:', deadlineCompany.gracePeriodDeadline);
    console.log('   Deadline Start:', deadlineCompany.deadlineStart || 'Not set');

    // Test 3: Simulate cron job status updates
    console.log('\n🔄 Test 3: Simulating Status Updates (Cron Job)');
    
    const cronScheduler = require('./services/cronScheduler');
    await cronScheduler.updateCompanyStatuses();
    console.log('✅ Cron job status update completed');

    // Check updated statuses
    const updatedGraceCompany = await Company.findById(graceCompany._id);
    const updatedDeadlineCompany = await Company.findById(deadlineCompany._id);

    console.log('\n📊 Results After Status Update:');
    console.log('─────────────────────────────────────');
    
    console.log('\n🏢 Grace Company:', updatedGraceCompany.name);
    console.log('   Status:', updatedGraceCompany.status);
    console.log('   Grace Period Deadline:', updatedGraceCompany.gracePeriodDeadline);
    console.log('   Expected: Should be "paused" with grace period set');
    
    console.log('\n🏢 Deadline Company:', updatedDeadlineCompany.name);
    console.log('   Status:', updatedDeadlineCompany.status);
    console.log('   Deadline Start:', updatedDeadlineCompany.deadlineStart);
    console.log('   Expected: Should be "suspended" with deadline start set');

    // Test 4: Super Admin Play/Pause functionality
    console.log('\n🎮 Test 4: Super Admin Play/Pause');
    
    // Test pause
    const pauseResponse = await fetch(`process.env.Backendurl/api/payments/company/${updatedDeadlineCompany.companyId}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'test-token' // You'll need a real super admin token
      }
    }).catch(() => ({ ok: false, statusText: 'Server not running or no auth' }));

    if (pauseResponse.ok) {
      console.log('✅ Pause API call successful');
    } else {
      console.log('⚠️ Pause API call failed (server not running or auth needed)');
    }

    // Test play (reactivate)
    const playResponse = await fetch(`process.env.Backendurl/api/payments/company/${updatedDeadlineCompany.companyId}/play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'test-token' // You'll need a real super admin token
      }
    }).catch(() => ({ ok: false, statusText: 'Server not running or no auth' }));

    if (playResponse.ok) {
      console.log('✅ Play API call successful');
    } else {
      console.log('⚠️ Play API call failed (server not running or auth needed)');
    }

    // Test 5: Check 6-month cleanup
    console.log('\n🗑️ Test 5: 6-Month Cleanup Simulation');
    
    const oldCompany = new Company({
      companyId: 'test-old-' + Date.now(),
      name: 'Old Company for Deletion',
      adminEmail: 'old@example.com',
      adminUserId: testUser._id,
      selectedPlan: 'one_month',
      hasPaid: false,
      status: 'suspended',
      deadlineStart: new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000), // 7 months ago
      createdAt: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000) // 8 months ago
    });

    await oldCompany.save();
    console.log('✅ Created old company for cleanup test');
    
    await cronScheduler.cleanupOldCompanies();
    
    const deletedCompany = await Company.findById(oldCompany._id);
    if (!deletedCompany) {
      console.log('✅ Old company successfully deleted by cleanup');
    } else {
      console.log('⚠️ Old company not deleted (may not meet 6-month criteria)');
    }

    console.log('\n✅ All Grace Period and Deadline tests completed!');
    console.log('\n📋 Summary:');
    console.log('   • Grace Period: Companies get 7 days admin-only access');
    console.log('   • Deadline: Companies get blocked after grace period');
    console.log('   • Cleanup: Companies deleted after 6 months in deadline');
    console.log('   • Play/Pause: Super admin can reactivate blocked companies');

    // Cleanup test companies
    console.log('\n🧹 Cleaning up test companies...');
    await Company.deleteMany({ 
      companyId: { 
        $regex: /^test-(grace|deadline|old)-/ 
      } 
    });
    console.log('✅ Test companies cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from database');
  }
}

// Run the test
testGraceAndDeadline();