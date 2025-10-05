const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Notification = require('./models/Notification');

mongoose.connect('mongodb://localhost:27017/notion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testProjectAssignment() {
  try {
    console.log('Testing project assignment notification...');
    
    // Get users
    const manager = await User.findOne({ role: 'manager' });
    const user = await User.findOne({ role: 'user' });
    
    if (!manager || !user) {
      console.log('Need both manager and user for test');
      return;
    }
    
    console.log('Manager:', manager.name, manager._id);
    console.log('User:', user.name, user._id);
    
    // Create a test project
    const project = new Project({
      title: 'Test Assignment Project',
      description: 'Testing project assignment notifications',
      owner: manager._id,
      assignedTo: [user.name], // Assign by name
      status: 'Not started',
      priority: 'Medium'
    });
    
    await project.save();
    console.log('Project created:', project._id);
    
    // Simulate the assignment notification logic from the backend
    const assignedUserName = user.name;
    const assignedUser = await User.findOne({
      $or: [
        { name: { $regex: new RegExp(assignedUserName, 'i') } },
        { username: { $regex: new RegExp(assignedUserName, 'i') } },
        { email: { $regex: new RegExp(assignedUserName, 'i') } }
      ]
    });
    
    if (assignedUser) {
      console.log('Found assigned user:', assignedUser.name);
      
      // Create notification
      const notification = new Notification({
        recipient: assignedUser._id,
        sender: manager._id,
        type: 'project',
        title: 'New Project Assignment',
        message: `You have been assigned to project: ${project.title}`,
        entityType: 'Project',
        entityId: project._id,
        metadata: {
          projectTitle: project.title,
          assignedBy: manager.name
        }
      });
      
      await notification.save();
      console.log('Assignment notification created:', notification._id);
      
      // Check notifications for the user
      const userNotifications = await Notification.find({ recipient: user._id })
        .populate('sender', 'name')
        .sort({ createdAt: -1 });
      
      console.log('User notifications:');
      userNotifications.forEach(n => {
        console.log(`- ${n.title}: ${n.message} (from ${n.sender?.name})`);
      });
      
    } else {
      console.log('Could not find assigned user');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testProjectAssignment();