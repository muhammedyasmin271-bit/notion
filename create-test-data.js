const mongoose = require('mongoose');
const User = require('./models/User');
const MeetingNote = require('./models/MeetingNote');

// Create test data to debug meeting visibility
async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/notion', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check existing users
    const users = await User.find({}).select('name email role');
    console.log(`\nExisting users (${users.length}):`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Create an admin user if none exists
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('\nCreating admin user...');
      admin = new User({
        name: 'Admin User',
        email: 'admin@test.com',
        username: 'admin',
        role: 'admin',
        password: 'password123',
        isActive: true
      });
      await admin.save();
      console.log('Admin user created:', admin.name);
    }

    // Create a regular user if needed
    let regularUser = await User.findOne({ role: { $in: ['user', 'manager'] } });
    if (!regularUser) {
      console.log('\nCreating regular user...');
      regularUser = new User({
        name: 'Regular User',
        email: 'user@test.com',
        username: 'user',
        role: 'user',
        password: 'password123',
        isActive: true
      });
      await regularUser.save();
      console.log('Regular user created:', regularUser.name);
    }

    // Create test meetings
    console.log('\nCreating test meetings...');

    // Meeting 1: Private meeting (no participants)
    const privateMeeting = new MeetingNote({
      title: 'Private Meeting',
      type: 'Team Sync',
      date: new Date(),
      time: '10:00',
      duration: '30',
      attendees: [], // No attendees
      notes: 'This is a private meeting',
      createdBy: regularUser._id,
      sharedWith: [] // Empty sharedWith array
    });
    await privateMeeting.save();
    console.log('Private meeting created:', privateMeeting.title);

    // Meeting 2: Shared meeting (with participants)
    const sharedMeeting = new MeetingNote({
      title: 'Shared Meeting',
      type: 'Planning',
      date: new Date(),
      time: '14:00',
      duration: '60',
      attendees: ['Admin User'], // Has attendees
      notes: 'This is a shared meeting',
      createdBy: regularUser._id,
      sharedWith: [{
        user: admin._id,
        permission: 'read',
        sharedAt: new Date()
      }] // Has participants in sharedWith
    });
    await sharedMeeting.save();
    console.log('Shared meeting created:', sharedMeeting.title);

    // Meeting 3: Admin's own meeting
    const adminMeeting = new MeetingNote({
      title: 'Admin Meeting',
      type: 'Review',
      date: new Date(),
      time: '16:00',
      duration: '45',
      attendees: ['Regular User'],
      notes: 'This is admin\'s meeting',
      createdBy: admin._id,
      sharedWith: [{
        user: regularUser._id,
        permission: 'read',
        sharedAt: new Date()
      }]
    });
    await adminMeeting.save();
    console.log('Admin meeting created:', adminMeeting.title);

    console.log('\nTest data created successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
createTestData();
