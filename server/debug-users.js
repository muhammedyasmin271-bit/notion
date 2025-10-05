const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/notion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugUsers() {
  try {
    console.log('Checking database connection...');
    
    // Check if we can connect to the database
    const dbState = mongoose.connection.readyState;
    console.log('Database state:', dbState); // 1 = connected
    
    // Get all users
    const users = await User.find({});
    console.log('Total users in database:', users.length);
    
    if (users.length > 0) {
      console.log('Users found:');
      users.forEach(user => {
        console.log(`- ID: ${user._id}, Name: ${user.name}, Username: ${user.username}, Role: ${user.role}, Active: ${user.isActive}`);
      });
    } else {
      console.log('No users found in database');
      
      // Create test users
      console.log('Creating test users...');
      
      const manager = new User({
        name: 'Test Manager',
        username: 'manager',
        password: 'password123',
        email: 'manager@test.com',
        role: 'manager',
        isActive: true,
        status: 'approved'
      });
      
      const user = new User({
        name: 'Test User',
        username: 'testuser',
        password: 'password123',
        email: 'user@test.com',
        role: 'user',
        isActive: true,
        status: 'approved'
      });
      
      await manager.save();
      await user.save();
      
      console.log('Test users created:');
      console.log(`Manager: ${manager._id} - ${manager.name}`);
      console.log(`User: ${user._id} - ${user.name}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugUsers();