const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('Connected to MongoDB');

    // Check existing users
    const existingUsers = await User.find({}).select('name username role isActive');
    console.log('Existing users:', existingUsers);

    // Create test users if they don't exist
    const testUsers = [
      { name: 'John Smith', username: 'john', password: 'password123', role: 'user', email: 'john@example.com' },
      { name: 'Sarah Johnson', username: 'sarah', password: 'password123', role: 'user', email: 'sarah@example.com' },
      { name: 'Mike Wilson', username: 'mike', password: 'password123', role: 'manager', email: 'mike@example.com' },
      { name: 'Lisa Brown', username: 'lisa', password: 'password123', role: 'user', email: 'lisa@example.com' }
    ];

    for (const userData of testUsers) {
      const existing = await User.findOne({ username: userData.username });
      if (!existing) {
        const user = new User({
          ...userData,
          isActive: true,
          status: 'approved'
        });
        await user.save();
        console.log(`✅ Created user: ${userData.name} (${userData.username})`);
      } else {
        console.log(`⚠️ User already exists: ${userData.username}`);
      }
    }

    // Show final user list
    const allUsers = await User.find({}).select('name username role isActive');
    console.log('\nFinal user list:');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.username}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUsers();