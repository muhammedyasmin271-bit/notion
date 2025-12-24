const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app');

const Company = require('./server/models/Company');

async function testPaymentModeSystem() {
  try {
    console.log('🧪 Testing Payment Mode System...\n');

    // Find a test company
    const companies = await Company.find().limit(1);
    if (companies.length === 0) {
      console.log('❌ No companies found for testing');
      return;
    }

    const company = companies[0];
    console.log(`📋 Testing with company: ${company.name} (${company.companyId})`);
    console.log(`   Current payment mode: ${company.paymentMode || 'paid'}\n`);

    // Test 1: Switch to FREE mode
    console.log('🔄 Test 1: Switching to FREE mode...');
    const now = new Date();
    await Company.findByIdAndUpdate(company._id, {
      paymentMode: 'free',
      paymentModeChangedAt: now,
      paymentCountdownStart: null,
      paymentDeadline: null,
      gracePeriodDeadline: null,
      status: 'active'
    });
    console.log('✅ Company switched to FREE mode');
    console.log('   - No payment deadlines');
    console.log('   - Company should show "FREE" in calendar\n');

    // Test 2: Switch to PAID mode (start 24-hour countdown)
    console.log('🔄 Test 2: Switching to PAID mode (24-hour countdown)...');
    const countdownStart = new Date();
    const paymentDeadline = new Date(countdownStart.getTime() + 24 * 60 * 60 * 1000);
    const gracePeriodDeadline = new Date(paymentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000);

    await Company.findByIdAndUpdate(company._id, {
      paymentMode: 'paid',
      paymentModeChangedAt: countdownStart,
      paymentCountdownStart: countdownStart,
      paymentDeadline: paymentDeadline,
      gracePeriodDeadline: gracePeriodDeadline,
      status: 'active'
    });

    console.log('✅ Company switched to PAID mode');
    console.log(`   - 24-hour countdown started: ${countdownStart}`);
    console.log(`   - Payment deadline: ${paymentDeadline}`);
    console.log(`   - Grace period deadline: ${gracePeriodDeadline}`);
    console.log('   - Company should show countdown in calendar\n');

    // Test 3: Check current status
    const updatedCompany = await Company.findById(company._id);
    console.log('📊 Current Company Status:');
    console.log(`   Payment Mode: ${updatedCompany.paymentMode}`);
    console.log(`   Status: ${updatedCompany.status}`);
    console.log(`   Payment Deadline: ${updatedCompany.paymentDeadline}`);
    console.log(`   Countdown Start: ${updatedCompany.paymentCountdownStart}`);

    // Calculate time remaining
    const timeRemaining = updatedCompany.paymentDeadline.getTime() - new Date().getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`   Time Remaining: ${hoursRemaining}h ${minutesRemaining}m\n`);

    console.log('🎉 Payment Mode System Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start the application: npm run dev');
    console.log('2. Login as super admin');
    console.log('3. View company details to see the new payment status');
    console.log('4. Toggle between FREE and PAID modes');
    console.log('5. Observe the countdown timer and calendar changes');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPaymentModeSystem();