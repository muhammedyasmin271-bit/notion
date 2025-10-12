const mongoose = require('mongoose');
const MeetingNote = require('./models/MeetingNote');
const User = require('./models/User');

// Test the actual API query logic
async function testApiLogic() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/notion', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin user found');
      return;
    }

    console.log(`\nTesting with Admin: ${admin.name} (ID: ${admin._id})`);

    // Test the EXACT query from the meetings route
    const userId = admin._id;
    const userRole = admin.role;

    console.log(`User ID: ${userId}`);
    console.log(`User Role: ${userRole}`);

    // Build the exact query from the route
    let query = {
      $or: [
        { createdBy: userId }, // Owner can always see their meetings
        { 'sharedWith.user': userId } // Participants can see meetings shared with them
      ],
      deleted: false
    };

    // If user is admin, they can also see meetings that have participants
    if (userRole === 'admin') {
      query.$or.push({
        'sharedWith.0': { $exists: true } // Has at least one participant
      });
    }

    console.log('\nQuery being used:');
    console.log(JSON.stringify(query, null, 2));

    // Execute the query
    const meetings = await MeetingNote.find(query)
      .populate('createdBy', 'name email role')
      .populate('sharedWith.user', 'name email role')
      .lean();

    console.log(`\nAdmin can see ${meetings.length} meetings:`);
    
    meetings.forEach((meeting, i) => {
      console.log(`\n${i + 1}. ${meeting.title}`);
      console.log(`   Created by: ${meeting.createdBy.name} (${meeting.createdBy.role})`);
      console.log(`   Has participants: ${meeting.sharedWith && meeting.sharedWith.length > 0}`);
      console.log(`   Participants count: ${meeting.sharedWith ? meeting.sharedWith.length : 0}`);
      
      if (meeting.sharedWith && meeting.sharedWith.length > 0) {
        console.log('   Participants:');
        meeting.sharedWith.forEach((share, j) => {
          console.log(`     ${j + 1}. ${share.user.name} (${share.user.role})`);
        });
      }
    });

    // Also test what happens if we check each condition separately
    console.log('\n--- Testing each condition separately ---');
    
    // Condition 1: Created by admin
    const createdByAdmin = await MeetingNote.find({ createdBy: userId, deleted: false }).lean();
    console.log(`Meetings created by admin: ${createdByAdmin.length}`);
    
    // Condition 2: Shared with admin
    const sharedWithAdmin = await MeetingNote.find({ 'sharedWith.user': userId, deleted: false }).lean();
    console.log(`Meetings shared with admin: ${sharedWithAdmin.length}`);
    
    // Condition 3: Has participants (admin can see these)
    const hasParticipants = await MeetingNote.find({ 'sharedWith.0': { $exists: true }, deleted: false }).lean();
    console.log(`Meetings with participants: ${hasParticipants.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testApiLogic();
