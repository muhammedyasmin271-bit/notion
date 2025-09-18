const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingUser = await User.findOne({ username: 'abubeker' });
    if (existingUser) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('061827', salt);

    // Create admin user
    const adminUser = new User({
      name: 'Abubeker Admin',
      username: 'abubeker',
      email: 'admin@darulkubra.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      status: 'approved'
    });
    
    // Set custom ID after creation
    adminUser._id = 'admin-001';

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: abubeker');
    console.log('Password: 061827');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
};

createAdminUser();