const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Project = require('./models/Project');
const Document = require('./models/Document');
const Note = require('./models/Note');
const Goal = require('./models/Goal');
const MeetingNote = require('./models/MeetingNote');
const Task = require('./models/Task');

async function migrateData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('Connected to MongoDB');

    // Update all existing records to have companyId: 'default' if not set
    console.log('Migrating Projects...');
    const projectsUpdated = await Project.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: 'default' } }
    );
    console.log(`Updated ${projectsUpdated.modifiedCount} projects`);

    console.log('Migrating Documents...');
    const documentsUpdated = await Document.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: 'default' } }
    );
    console.log(`Updated ${documentsUpdated.modifiedCount} documents`);

    console.log('Migrating Notes...');
    const notesUpdated = await Note.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: 'default' } }
    );
    console.log(`Updated ${notesUpdated.modifiedCount} notes`);

    console.log('Migrating Goals...');
    const goalsUpdated = await Goal.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: 'default' } }
    );
    console.log(`Updated ${goalsUpdated.modifiedCount} goals`);

    console.log('Migrating Meeting Notes...');
    const meetingsUpdated = await MeetingNote.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: 'default' } }
    );
    console.log(`Updated ${meetingsUpdated.modifiedCount} meeting notes`);

    console.log('Migrating Tasks...');
    const tasksUpdated = await Task.updateMany(
      { companyId: { $exists: false } },
      { $set: { companyId: 'default' } }
    );
    console.log(`Updated ${tasksUpdated.modifiedCount} tasks`);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
