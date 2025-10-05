const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/notion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testNotification() {
  try {
    console.log('Testing notification system...');
    
    // Get all users
    const users = await User.find({}).select('_id name username email role');
    console.log('Available users:', users.map(u => ({ id: u._id, name: u.name, username: u.username, role: u.role })));
    
    if (users.length < 2) {
      console.log('Need at least 2 users to test notifications');
      return;
    }
    
    const sender = users.find(u => u.role === 'manager') || users[0];
    const recipient = users.find(u => u._id.toString() !== sender._id.toString());
    
    console.log('Sender:', { id: sender._id, name: sender.name, role: sender.role });
    console.log('Recipient:', { id: recipient._id, name: recipient.name, role: recipient.role });
    
    // Create a test notification
    const notification = new Notification({
      recipient: recipient._id,
      sender: sender._id,
      type: 'project',
      title: 'Test Project Assignment',
      message: `You have been assigned to test project by ${sender.name}`,
      entityType: 'Project',
      entityId: new mongoose.Types.ObjectId(),
      metadata: {
        projectTitle: 'Test Project',
        assignedBy: sender.name
      }
    });
    
    await notification.save();
    console.log('Test notification created:', notification._id);
    
    // Fetch notifications for recipient
    const recipientNotifications = await Notification.find({ recipient: recipient._id })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 });
    
    console.log('Recipient notifications:', recipientNotifications.map(n => ({
      id: n._id,
      title: n.title,
      message: n.message,
      sender: n.sender?.name,
      read: n.read,
      createdAt: n.createdAt
    })));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNotification();