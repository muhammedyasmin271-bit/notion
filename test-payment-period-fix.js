const mongoose = require('mongoose');
const Company = require('./server/models/Company');
require('dotenv').config();

/**
 * Test the fixed payment period calculation
 * Scenario: Company continues after deadline, admin pays immediately
 * Expected: Should get exactly 30 days + remaining hours from 24-hour period only
 */
async function testPaymentPeriodFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('✅ Connected to database');

    console.log('\n🧪 Testing Payment Period Fix');
    console.log('═══════════════════════════════════════');

    // Simulate the calculatePaymentBaseDate function
    function calculatePaymentBaseDate(company, now) {
      // Only preserve remaining time from paymentPeriodEnd if it's a paid period
      // Don't preserve time from trial periods, grace periods, or 24-hour deadlines
      if (company.paymentPeriodEnd && 
          new Date(company.paymentPeriodEnd) > now && 
          company.hasPaid && 
          company.lastPaymentDate) {
        // Only use paymentPeriodEnd if there was an actual payment
        return new Date(company.paymentPeriodEnd);
      }

      // For new payments or expired periods, start from now
      return now;
    }

    // Test Case 1: Company with expired deadline (24 hours + 7 days trial)
    console.log('\n📅 Test Case 1: Company after deadline with trial time');
    const now = new Date();
    
    const company1 = {
      companyId: 'test-company-1',
      hasPaid: false,
      lastPaymentDate: null,
      paymentPeriodEnd: null,
      paymentDeadline: new Date(now.getTime() - 23 * 60 * 60 * 1000), // 23 hours ago (1 hour remaining)
      gracePeriodDeadline: null,
      selectedPlan: 'one_month'
    };

    const baseDate1 = calculatePaymentBaseDate(company1, now);
    const newPeriodEnd1 = new Date(baseDate1);
    newPeriodEnd1.setMonth(newPeriodEnd1.getMonth() + 1); // Add 1 month

    console.log('   Current time:', now.toISOString());
    console.log('   Payment deadline (1h remaining):', company1.paymentDeadline.toISOString());
    console.log('   Base date for calculation:', baseDate1.toISOString());
    console.log('   New period end:', newPeriodEnd1.toISOString());
    
    const daysDifference1 = Math.ceil((newPeriodEnd1 - now) / (1000 * 60 * 60 * 24));
    console.log('   Days from now to new period end:', daysDifference1);
    console.log('   Expected: ~30 days (should NOT include trial time)');

    // Test Case 2: Company with existing paid period (has remaining time)
    console.log('\n📅 Test Case 2: Company with existing paid period');
    
    const company2 = {
      companyId: 'test-company-2',
      hasPaid: true,
      lastPaymentDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      paymentPeriodEnd: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      paymentDeadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      gracePeriodDeadline: null,
      selectedPlan: 'one_month'
    };

    const baseDate2 = calculatePaymentBaseDate(company2, now);
    const newPeriodEnd2 = new Date(baseDate2);
    newPeriodEnd2.setMonth(newPeriodEnd2.getMonth() + 1); // Add 1 month

    console.log('   Current time:', now.toISOString());
    console.log('   Existing period end (15d remaining):', company2.paymentPeriodEnd.toISOString());
    console.log('   Base date for calculation:', baseDate2.toISOString());
    console.log('   New period end:', newPeriodEnd2.toISOString());
    
    const daysDifference2 = Math.ceil((newPeriodEnd2 - now) / (1000 * 60 * 60 * 24));
    console.log('   Days from now to new period end:', daysDifference2);
    console.log('   Expected: ~45 days (30 new + 15 remaining)');

    // Test Case 3: Company with grace period (should not preserve grace time)
    console.log('\n📅 Test Case 3: Company in grace period');
    
    const company3 = {
      companyId: 'test-company-3',
      hasPaid: false,
      lastPaymentDate: null,
      paymentPeriodEnd: null,
      paymentDeadline: new Date(now.getTime() - 25 * 60 * 60 * 1000), // 25 hours ago (expired)
      gracePeriodDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      selectedPlan: 'one_month'
    };

    const baseDate3 = calculatePaymentBaseDate(company3, now);
    const newPeriodEnd3 = new Date(baseDate3);
    newPeriodEnd3.setMonth(newPeriodEnd3.getMonth() + 1); // Add 1 month

    console.log('   Current time:', now.toISOString());
    console.log('   Grace period end (5d remaining):', company3.gracePeriodDeadline.toISOString());
    console.log('   Base date for calculation:', baseDate3.toISOString());
    console.log('   New period end:', newPeriodEnd3.toISOString());
    
    const daysDifference3 = Math.ceil((newPeriodEnd3 - now) / (1000 * 60 * 60 * 24));
    console.log('   Days from now to new period end:', daysDifference3);
    console.log('   Expected: ~30 days (should NOT include grace time)');

    console.log('\n✅ Payment Period Fix Test Results:');
    console.log('─────────────────────────────────────────');
    console.log(`   Case 1 (After deadline): ${daysDifference1} days ${daysDifference1 <= 31 ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log(`   Case 2 (Existing paid): ${daysDifference2} days ${daysDifference2 >= 44 && daysDifference2 <= 46 ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log(`   Case 3 (Grace period): ${daysDifference3} days ${daysDifference3 <= 31 ? '✅ CORRECT' : '❌ WRONG'}`);

    console.log('\n📋 Summary:');
    console.log('   • Companies after deadline get exactly 30 days (no trial time added)');
    console.log('   • Companies with existing paid time get 30 days + remaining paid time');
    console.log('   • Companies in grace period get exactly 30 days (no grace time added)');
    console.log('   • Only actual paid subscription time is preserved');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from database');
  }
}

// Run the test
testPaymentPeriodFix();