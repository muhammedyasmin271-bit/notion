const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
const smsReminderService = require('./services/smsReminderService');
require('dotenv').config();

async function testSMSReminders() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('✅ Connected to database');

    // Test 1: Create a test company with payment deadline in 6 hours
    console.log('\n🧪 Test 1: Payment Reminder (6 hours left)');
    
    const testUser = await User.findOne({ role: 'admin' });
    if (!testUser) {
      console.log('❌ No admin user found for testing');
      return;
    }

    const testCompany = new Company({
      companyId: 'test-sms-' + Date.now(),
      name: 'Test SMS Company',
      adminEmail: 'test@example.com',
      adminUserId: testUser._id,
      selectedPlan: 'one_month',
      hasPaid: false,
      status: 'active',
      paymentDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000) // Created 18 hours ago (so 6 hours into 24h period)
    });

    await testCompany.save();
    console.log('✅ Test company created:', testCompany.companyId);

    // Test payment reminders
    console.log('📱 Testing payment reminders...');
    await smsReminderService.sendPaymentReminders();

    // Test 2: Create a company in day 5 of trial
    console.log('\n🧪 Test 2: Trial Reminder (Day 5)');
    
    const trialCompany = new Company({
      companyId: 'test-trial-' + Date.now(),
      name: 'Test Trial Company',
      adminEmail: 'trial@example.com',
      adminUserId: testUser._id,
      selectedPlan: 'free_trial',
      hasPaid: false,
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    });

    await trialCompany.save();
    console.log('✅ Trial company created:', trialCompany.companyId);

    // Test trial reminders
    console.log('📱 Testing trial reminders...');
    await smsReminderService.sendTrialReminders();

    // Test 3: Create a company in grace period day 6
    console.log('\n🧪 Test 3: Grace Period Reminder (Day 6)');
    
    const graceCompany = new Company({
      companyId: 'test-grace-' + Date.now(),
      name: 'Test Grace Company',
      adminEmail: 'grace@example.com',
      adminUserId: testUser._id,
      selectedPlan: 'one_month',
      hasPaid: false,
      status: 'paused',
      gracePeriodDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day left
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // 12 days ago
    });

    await graceCompany.save();
    console.log('✅ Grace company created:', graceCompany.companyId);

    // Test grace reminders
    console.log('📱 Testing grace reminders...');
    await smsReminderService.sendGraceReminders();

    // Test 4: Create a company that was just unpaused (deadline reminders)
    console.log('\n🧪 Test 4: Deadline Reminder (After unpause)');
    
    const deadlineCompany = new Company({
      companyId: 'test-deadline-' + Date.now(),
      name: 'Test Deadline Company',
      adminEmail: 'deadline@example.com',
      adminUserId: testUser._id,
      selectedPlan: 'one_month',
      hasPaid: false,
      status: 'active',
      unpausedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Unpaused 4 hours ago
      paymentDeadline: new Date(Date.now() + 20 * 60 * 60 * 1000) // 20 hours left
    });

    await deadlineCompany.save();
    console.log('✅ Deadline company created:', deadlineCompany.companyId);

    // Test deadline reminders
    console.log('📱 Testing deadline reminders...');
    await smsReminderService.sendDeadlineReminders();

    console.log('\n✅ All SMS reminder tests completed!');
    console.log('📋 Check your SMS service logs to see if messages were sent.');

    // Cleanup test companies
    console.log('\n🧹 Cleaning up test companies...');
    await Company.deleteMany({ 
      companyId: { 
        $regex: /^test-(sms|trial|grace|deadline)-/ 
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
testSMSReminders();