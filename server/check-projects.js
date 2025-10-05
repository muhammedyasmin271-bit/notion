const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');

mongoose.connect('mongodb://localhost:27017/notion', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkProjects() {
  try {
    const projects = await Project.find({}).populate('owner', 'name');
    
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(p => {
      console.log(`\nProject: ${p.title}`);
      console.log(`  ID: ${p._id}`);
      console.log(`  Owner: ${p.owner?.name}`);
      console.log(`  AssignedTo: ${JSON.stringify(p.assignedTo)}`);
      console.log(`  Viewers: ${JSON.stringify(p.viewers)}`);
      console.log(`  Archived: ${p.archived}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkProjects();