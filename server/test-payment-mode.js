const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/Company');

async function testPaymentModeSystem() {
  try {
    console.log('🧪 Testing Payment Mode System...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app');

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

    // Test 2: Switch to PAID mode (start 24-hour countdown)
    console.log('🔄 Test 2: Switching to PAID mode (24-hour countdown)...');
    const countdownStart = new Date();
    const paymentDeadline = new Date(countdownStart.getTime() + 24 * 60 * 60 * 1000);

    await Company.findByIdAndUpdate(company._id, {
      paymentMode: 'paid',
      paymentModeChangedAt: countdownStart,
      paymentCountdownStart: countdownStart,
      paymentDeadline: paymentDeadline,
      status: 'active'
    });

    console.log('✅ Company switched to PAID mode');
    console.log(`   - Payment deadline: ${paymentDeadline}`);

    // Test 3: Check current status
    const updatedCompany = await Company.findById(company._id);
    const timeRemaining = updatedCompany.paymentDeadline.getTime() - new Date().getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    
    console.log(`   Time Remaining: ${hoursRemaining}h\n`);
    console.log('🎉 Payment Mode System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testPaymentModeSystem();