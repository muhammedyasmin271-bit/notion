const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/Company');

async function testGracePeriod() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app');

    const company = await Company.findOne().limit(1);
    if (!company) {
      console.log('❌ No company found');
      return;
    }

    console.log('🧪 Testing Grace Period Flow...\n');
    console.log(`📋 Company: ${company.name} (${company.companyId})\n`);

    // Simulate: 24-hour deadline has passed (enter grace period)
    const now = new Date();
    const pastDeadline = new Date(now.getTime() - 1000); // 1 second ago
    const gracePeriodEnd = new Date(pastDeadline.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from deadline

    await Company.findByIdAndUpdate(company._id, {
      paymentMode: 'paid',
      paymentDeadline: pastDeadline,
      gracePeriodDeadline: gracePeriodEnd,
      hasPaid: false,
      status: 'active'
    });

    console.log('✅ Simulated: 24-hour deadline passed');
    console.log(`   Payment deadline: ${pastDeadline}`);
    console.log(`   Grace period ends: ${gracePeriodEnd}`);
    console.log('   Status: In grace period (7 days)');
    console.log('   Access: Admin only\n');

    // Calculate grace period remaining
    const graceTimeRemaining = gracePeriodEnd.getTime() - now.getTime();
    const daysRemaining = Math.floor(graceTimeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((graceTimeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    console.log(`⏰ Grace period remaining: ${daysRemaining}d ${hoursRemaining}h`);
    console.log('\n📝 Expected behavior:');
    console.log('   - Admin can login and access payment page');
    console.log('   - Regular users see "Admin Access Only" message');
    console.log('   - After grace period expires: all users blocked until payment');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testGracePeriod();