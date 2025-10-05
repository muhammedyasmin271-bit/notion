const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Notification = require('./models/Notification');

mongoose.connect('mongodb://localhost:27017/notion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestProject() {
  try {
    const manager = await User.findOne({ role: 'manager' });
    const worker = await User.findOne({ username: 'jemal' });
    
    console.log('Creating test project assigned to jemal...');
    
    const project = new Project({
      title: 'Test Project for Jemal',
      description: 'Testing assignment to jemal user',
      owner: manager._id,
      assignedTo: ['jemal'], // Assign by username
      status: 'Not started',
      priority: 'Medium'
    });
    
    await project.save();
    console.log('Project created:', project._id);
    
    // Create notification
    const notification = new Notification({
      recipient: worker._id,
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
    console.log('Notification created:', notification._id);
    
    // Test visibility
    const visibleProjects = await Project.find({
      archived: false,
      $or: [
        { owner: worker._id },
        { assignedTo: { $exists: true, $in: [worker.username, worker.name] } },
        { viewers: { $exists: true, $in: [worker.username, worker.name] } }
      ]
    });
    
    console.log(`Worker can now see ${visibleProjects.length} projects`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestProject();