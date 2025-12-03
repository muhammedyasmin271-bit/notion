const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/Company');

async function checkCompanyStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');

    const companies = await Company.find().limit(3);
    
    console.log('📊 Current Company Status:\n');
    
    for (const company of companies) {
      const now = new Date();
      const paymentDeadline = company.paymentDeadline ? new Date(company.paymentDeadline) : null;
      const timeRemaining = paymentDeadline ? paymentDeadline.getTime() - now.getTime() : null;
      const hoursRemaining = timeRemaining ? Math.floor(timeRemaining / (1000 * 60 * 60)) : null;
      
      console.log(`🏢 ${company.name} (${company.companyId})`);
      console.log(`   Payment Mode: ${company.paymentMode || 'paid'}`);
      console.log(`   Status: ${company.status}`);
      console.log(`   Has Paid: ${company.hasPaid}`);
      
      if (company.paymentMode === 'free') {
        console.log('   💚 FREE MODE - No payment required');
      } else if (paymentDeadline) {
        if (hoursRemaining > 0) {
          console.log(`   ⏰ ${hoursRemaining}h remaining in 24-hour window`);
          console.log('   ✅ Can access app during countdown');
        } else {
          console.log('   ❌ Payment deadline passed - payment required');
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCompanyStatus();