const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('Connected to MongoDB');

    const username = 'adminadmin';
    const password = '06827';
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('Super admin already exists');
      process.exit(0);
    }

    const user = new User({
      name: 'Super Admin',
      username,
      password,
      role: 'superadmin',
      companyId: 'master',
      isActive: true,
      status: 'approved'
    });

    await user.save();
    console.log('Super admin created successfully');
    console.log('Username:', username);
    console.log('Password:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createSuperAdmin();
