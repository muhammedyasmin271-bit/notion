const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const fixUserCompanyIds = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app');
    console.log('✅ Connected to MongoDB');

    // Find all users with 'default' companyId
    const usersWithDefault = await User.find({ companyId: 'default' });
    console.log(`\n📊 Found ${usersWithDefault.length} users with 'default' companyId`);

    if (usersWithDefault.length === 0) {
      console.log('✅ No users need fixing!');
      process.exit(0);
    }

    // Update them to 'melanote'
    const result = await User.updateMany(
      { companyId: 'default' },
      { $set: { companyId: 'melanote' } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} users to companyId: 'melanote'`);
    
    // Show updated users
    const updatedUsers = await User.find({ companyId: 'melanote' }).select('name username role companyId');
    console.log('\n📋 Users now in melanote company:');
    updatedUsers.forEach(user => {
      console.log(`  - ${user.name} (@${user.username}) - ${user.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixUserCompanyIds();
