const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: 'default' } }
    );

    console.log(`Updated ${result.modifiedCount} users with default companyId`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

migrateUsers();
