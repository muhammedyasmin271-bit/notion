const mongoose = require('mongoose');
const MeetingNote = require('./models/MeetingNote');
const User = require('./models/User');

// Test script to debug meeting visibility
async function debugMeetingVisibility() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/notion', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get all meetings with detailed info
    const meetings = await MeetingNote.find({ deleted: false })
      .populate('createdBy', 'name email role')
      .populate('sharedWith.user', 'name email role')
      .lean();

    console.log(`\nFound ${meetings.length} meetings:`);
    
    meetings.forEach((meeting, index) => {
      console.log(`\n--- Meeting ${index + 1} ---`);
      console.log(`ID: ${meeting._id}`);
      console.log(`Title: ${meeting.title}`);
      console.log(`Created by: ${meeting.createdBy.name} (${meeting.createdBy.role})`);
      console.log(`Has sharedWith: ${meeting.sharedWith ? 'Yes' : 'No'}`);
      console.log(`sharedWith length: ${meeting.sharedWith ? meeting.sharedWith.length : 0}`);
      
      if (meeting.sharedWith && meeting.sharedWith.length > 0) {
        console.log('sharedWith details:');
        meeting.sharedWith.forEach((share, i) => {
          console.log(`  ${i + 1}. User ID: ${share.user._id}, Name: ${share.user.name}, Role: ${share.user.role}`);
        });
      }
    });

    // Test the exact query logic from the route
    console.log('\n\n--- Testing Query Logic ---');
    
    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log(`\nTesting for Admin: ${admin.name} (ID: ${admin._id})`);
      
      // Test the exact query from the route
      const adminQuery = {
        $or: [
          { createdBy: admin._id },
          { 'sharedWith.user': admin._id },
          { 'sharedWith.0': { $exists: true } }
        ],
        deleted: false
      };
      
      console.log('Admin query:', JSON.stringify(adminQuery, null, 2));
      
      const adminMeetings = await MeetingNote.find(adminQuery)
        .populate('createdBy', 'name email role')
        .populate('sharedWith.user', 'name email role')
        .lean();
      
      console.log(`Admin can see ${adminMeetings.length} meetings:`);
      adminMeetings.forEach((meeting, i) => {
        console.log(`  ${i + 1}. ${meeting.title} (Created by: ${meeting.createdBy.name})`);
        console.log(`     Has participants: ${meeting.sharedWith && meeting.sharedWith.length > 0}`);
      });
    } else {
      console.log('No admin user found');
    }

    // Test with a regular user
    const regularUser = await User.findOne({ role: { $in: ['user', 'manager'] } });
    if (regularUser) {
      console.log(`\nTesting for Regular User: ${regularUser.name} (ID: ${regularUser._id})`);
      
      const userQuery = {
        $or: [
          { createdBy: regularUser._id },
          { 'sharedWith.user': regularUser._id }
        ],
        deleted: false
      };
      
      console.log('User query:', JSON.stringify(userQuery, null, 2));
      
      const userMeetings = await MeetingNote.find(userQuery)
        .populate('createdBy', 'name email role')
        .populate('sharedWith.user', 'name email role')
        .lean();
      
      console.log(`Regular user can see ${userMeetings.length} meetings:`);
      userMeetings.forEach((meeting, i) => {
        console.log(`  ${i + 1}. ${meeting.title} (Created by: ${meeting.createdBy.name})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
debugMeetingVisibility();
