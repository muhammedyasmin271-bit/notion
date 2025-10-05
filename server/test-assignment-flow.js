const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Notification = require('./models/Notification');

mongoose.connect('mongodb://localhost:27017/notion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAssignmentFlow() {
  try {
    console.log('Testing full assignment flow...');
    
    // Get users
    const manager = await User.findOne({ role: 'manager' });
    const worker = await User.findOne({ username: 'jemal' }) || await User.findOne({ name: /jemal/i });
    
    console.log('Manager:', manager?.name, manager?._id);
    console.log('Worker:', worker?.name, worker?.username, worker?._id);
    
    if (!manager || !worker) {
      console.log('Missing users - creating test user jemal');
      
      if (!worker) {
        const newWorker = new User({
          name: 'Jemal Worker',
          username: 'jemal',
          password: 'password123',
          email: 'jemal@test.com',
          role: 'user',
          isActive: true,
          status: 'approved'
        });
        await newWorker.save();
        console.log('Created worker:', newWorker.name, newWorker.username);
      }
      return;
    }
    
    // Test project visibility query
    console.log('\nTesting project visibility query...');
    const visibleProjects = await Project.find({
      archived: false,
      $or: [
        { owner: worker._id },
        { assignedTo: { $exists: true, $in: [worker.username, worker.name] } },
        { viewers: { $exists: true, $in: [worker.username, worker.name] } }
      ]
    });
    
    console.log(`Worker can see ${visibleProjects.length} projects`);
    visibleProjects.forEach(p => {
      console.log(`- ${p.title} (assigned: ${p.assignedTo}, viewers: ${p.viewers})`);
    });
    
    // Check notifications
    const notifications = await Notification.find({ recipient: worker._id })
      .populate('sender', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`\nWorker has ${notifications.length} notifications:`);
    notifications.forEach(n => {
      console.log(`- ${n.title}: ${n.message} (from ${n.sender?.name})`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAssignmentFlow();