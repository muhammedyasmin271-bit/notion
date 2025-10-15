const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Company = require('./models/Company');
const Project = require('./models/Project');
const Document = require('./models/Document');
const Note = require('./models/Note');

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('Connected to MongoDB');

    // Delete all users except superadmin
    const deletedUsers = await User.deleteMany({ role: { $ne: 'superadmin' } });
    console.log(`Deleted ${deletedUsers.deletedCount} users`);

    // Delete all companies
    const deletedCompanies = await Company.deleteMany({});
    console.log(`Deleted ${deletedCompanies.deletedCount} companies`);

    // Delete all projects
    const deletedProjects = await Project.deleteMany({});
    console.log(`Deleted ${deletedProjects.deletedCount} projects`);

    // Delete all documents
    const deletedDocuments = await Document.deleteMany({});
    console.log(`Deleted ${deletedDocuments.deletedCount} documents`);

    // Delete all notes
    const deletedNotes = await Note.deleteMany({});
    console.log(`Deleted ${deletedNotes.deletedCount} notes`);

    console.log('\n✅ Database cleaned successfully!');
    console.log('You can now create fresh companies from super admin dashboard.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
