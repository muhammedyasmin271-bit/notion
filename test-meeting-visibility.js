const mongoose = require('mongoose');
const MeetingNote = require('./models/MeetingNote');
const User = require('./models/User');

// Test script to verify meeting visibility logic
async function testMeetingVisibility() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/notion', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get all meetings
    const meetings = await MeetingNote.find({ deleted: false })
      .populate('createdBy', 'name email role')
      .populate('sharedWith.user', 'name email role')
      .lean();

    console.log(`\nFound ${meetings.length} meetings:`);
    
    meetings.forEach((meeting, index) => {
      console.log(`\n--- Meeting ${index + 1} ---`);
      console.log(`Title: ${meeting.title}`);
      console.log(`Created by: ${meeting.createdBy.name} (${meeting.createdBy.role})`);
      console.log(`Has participants: ${meeting.sharedWith && meeting.sharedWith.length > 0}`);
      console.log(`Participants count: ${meeting.sharedWith ? meeting.sharedWith.length : 0}`);
      
      if (meeting.sharedWith && meeting.sharedWith.length > 0) {
        console.log('Participants:');
        meeting.sharedWith.forEach((share, i) => {
          console.log(`  ${i + 1}. ${share.user.name} (${share.user.role})`);
        });
      }
    });

    // Test visibility logic for different user types
    console.log('\n\n--- Testing Visibility Logic ---');
    
    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log(`\nTesting for Admin: ${admin.name}`);
      
      // Test the query that would be used for admin
      const adminQuery = {
        $or: [
          { createdBy: admin._id },
          { 'sharedWith.user': admin._id },
          { 'sharedWith.0': { $exists: true } }
        ],
        deleted: false
      };
      
      const adminMeetings = await MeetingNote.find(adminQuery).lean();
      console.log(`Admin can see ${adminMeetings.length} meetings`);
    }

    // Get regular user
    const regularUser = await User.findOne({ role: { $in: ['user', 'manager'] } });
    if (regularUser) {
      console.log(`\nTesting for Regular User: ${regularUser.name}`);
      
      // Test the query that would be used for regular user
      const userQuery = {
        $or: [
          { createdBy: regularUser._id },
          { 'sharedWith.user': regularUser._id }
        ],
        deleted: false
      };
      
      const userMeetings = await MeetingNote.find(userQuery).lean();
      console.log(`Regular user can see ${userMeetings.length} meetings`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testMeetingVisibility();
