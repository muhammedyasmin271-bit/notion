/**
 * Test script to verify company branding updates are saved to database
 * Run with: node test-company-update.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./server/models/Company');

async function testCompanyUpdate() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find a company to test with
    const company = await Company.findOne();
    
    if (!company) {
      console.log('❌ No company found in database. Please create a company first.');
      process.exit(1);
    }

    console.log('📊 Testing with company:', company.name);
    console.log('Company ID:', company.companyId);
    console.log('\n📝 Current branding:');
    console.log(JSON.stringify(company.branding, null, 2));

    // Test update
    console.log('\n🔄 Testing branding update...');
    const testColor = '#FF5733';
    const testName = 'Test Company Name';
    
    if (!company.branding) {
      company.branding = {};
    }
    
    company.branding.primaryColor = testColor;
    company.branding.companyName = testName;
    
    await company.save();
    console.log('✅ Save completed');

    // Verify by fetching again
    console.log('\n🔍 Verifying update by fetching from database...');
    const verifiedCompany = await Company.findOne({ companyId: company.companyId });
    
    console.log('📝 Updated branding:');
    console.log(JSON.stringify(verifiedCompany.branding, null, 2));

    if (verifiedCompany.branding.primaryColor === testColor && 
        verifiedCompany.branding.companyName === testName) {
      console.log('\n✅ SUCCESS! Company branding is being saved to database correctly.');
    } else {
      console.log('\n❌ FAILED! Branding was not saved correctly.');
    }

    // Restore original values
    console.log('\n♻️  Restoring original values...');
    verifiedCompany.branding = company.branding;
    await verifiedCompany.save();
    console.log('✅ Restored');

    mongoose.disconnect();
    console.log('\n👋 Test complete');

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

testCompanyUpdate();

