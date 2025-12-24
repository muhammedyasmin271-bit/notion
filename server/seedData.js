const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Company = require('./models/Company');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Goal = require('./models/Goal');
const Document = require('./models/Document');
const SystemSettings = require('./models/SystemSettings');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB - use local for development if Atlas fails
    let mongoUri = process.env.MONGODB_URI;
    
    // If Atlas connection fails, fallback to local
    if (mongoUri.includes('mongodb+srv')) {
      console.log('⚠️  Using local MongoDB for seeding (Atlas connection may be restricted)');
      mongoUri = 'mongodb://localhost:27017/notion';
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Goal.deleteMany({});
    await Document.deleteMany({});
    await SystemSettings.deleteMany({});

    // Create companies
    console.log('🏢 Creating companies...');
    const companies = await Company.insertMany([
      {
        companyId: 'demo-corp',
        name: 'Demo Corporation',
        subdomain: 'demo',
        status: 'active',
        subscriptionStatus: 'paid',
        adminEmail: 'admin@demo.com',
        adminPhone: '+1234567890',
        branding: {
          companyName: 'Demo Corporation',
          primaryColor: '#3B82F6'
        },
        limits: {
          maxUsers: 100,
          maxStorage: 10737418240 // 10GB
        },
        pricing: {
          monthlyAmount: 2000,
          currency: 'ETB'
        },
        selectedPlan: 'one_month',
        paymentMode: 'paid',
        hasPaid: true,
        pointsEnabled: true,
        lastPaymentDate: new Date(),
        paymentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        companyId: 'tech-startup',
        name: 'Tech Startup Inc',
        subdomain: 'techstartup',
        status: 'active',
        subscriptionStatus: 'trial',
        adminEmail: 'founder@techstartup.com',
        adminPhone: '+1987654321',
        branding: {
          companyName: 'Tech Startup Inc',
          primaryColor: '#10B981'
        },
        limits: {
          maxUsers: 25,
          maxStorage: 5368709120 // 5GB
        },
        selectedPlan: 'free_trial',
        paymentMode: 'paid',
        hasPaid: false,
        pointsEnabled: true,
        paymentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    ]);

    // Create users
    console.log('👥 Creating users...');
    const users = await User.insertMany([
      // Super Admin
      {
        name: 'Super Admin',
        username: 'superadmin',
        email: 'superadmin@notion.com',
        password: 'admin123',
        companyId: 'system',
        role: 'superadmin',
        status: 'approved',
        isActive: true,
        jobTitle: 'System Administrator',
        department: 'IT'
      },
      // Demo Corp Users
      {
        name: 'John Manager',
        username: 'johnmanager',
        email: 'john@demo.com',
        password: 'manager123',
        companyId: 'demo-corp',
        role: 'manager',
        status: 'approved',
        isActive: true,
        jobTitle: 'Project Manager',
        department: 'Operations',
        points: 150
      },
      {
        name: 'Alice Developer',
        username: 'alicedev',
        email: 'alice@demo.com',
        password: 'user123',
        companyId: 'demo-corp',
        role: 'user',
        status: 'approved',
        isActive: true,
        jobTitle: 'Senior Developer',
        department: 'Engineering',
        points: 200
      },
      {
        name: 'Bob Designer',
        username: 'bobdesign',
        email: 'bob@demo.com',
        password: 'user123',
        companyId: 'demo-corp',
        role: 'user',
        status: 'approved',
        isActive: true,
        jobTitle: 'UI/UX Designer',
        department: 'Design',
        points: 120
      },
      // Tech Startup Users
      {
        name: 'Sarah Founder',
        username: 'sarahfounder',
        email: 'sarah@techstartup.com',
        password: 'founder123',
        companyId: 'tech-startup',
        role: 'manager',
        status: 'approved',
        isActive: true,
        jobTitle: 'CEO & Founder',
        department: 'Executive',
        points: 300
      },
      {
        name: 'Mike Engineer',
        username: 'mikeeng',
        email: 'mike@techstartup.com',
        password: 'user123',
        companyId: 'tech-startup',
        role: 'user',
        status: 'approved',
        isActive: true,
        jobTitle: 'Full Stack Engineer',
        department: 'Engineering',
        points: 180
      }
    ]);

    // Update company admin references
    await Company.findOneAndUpdate(
      { companyId: 'demo-corp' },
      { adminUserId: users.find(u => u.username === 'johnmanager')._id }
    );
    await Company.findOneAndUpdate(
      { companyId: 'tech-startup' },
      { adminUserId: users.find(u => u.username === 'sarahfounder')._id }
    );

    // Create projects
    console.log('📋 Creating projects...');
    const projects = await Project.insertMany([
      {
        title: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI/UX',
        status: 'In Progress',
        priority: 'High',
        owner: users.find(u => u.username === 'johnmanager')._id,
        companyId: 'demo-corp',
        team: [
          users.find(u => u.username === 'alicedev')._id,
          users.find(u => u.username === 'bobdesign')._id
        ],
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        progress: 65,
        tags: ['web', 'design', 'frontend'],
        milestones: [
          {
            title: 'Design Mockups',
            description: 'Create initial design mockups',
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            completed: true,
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          },
          {
            title: 'Frontend Development',
            description: 'Implement the new design',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            completed: false
          }
        ]
      },
      {
        title: 'Mobile App Development',
        description: 'Develop cross-platform mobile application',
        status: 'Not started',
        priority: 'Medium',
        owner: users.find(u => u.username === 'sarahfounder')._id,
        companyId: 'tech-startup',
        team: [users.find(u => u.username === 'mikeeng')._id],
        startDate: new Date(),
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        progress: 0,
        tags: ['mobile', 'react-native', 'ios', 'android'],
        budget: {
          estimated: 50000,
          actual: 0,
          currency: 'USD'
        }
      },
      {
        title: 'Database Migration',
        description: 'Migrate legacy database to new cloud infrastructure',
        status: 'Done',
        priority: 'Critical',
        owner: users.find(u => u.username === 'alicedev')._id,
        companyId: 'demo-corp',
        team: [users.find(u => u.username === 'alicedev')._id],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        progress: 100,
        tags: ['database', 'migration', 'cloud'],
        pointsAwarded: true
      }
    ]);

    // Create tasks
    console.log('✅ Creating tasks...');
    await Task.insertMany([
      {
        text: 'Create wireframes',
        description: 'Design initial wireframes for homepage',
        completed: true,
        priority: 'high',
        assignee: users.find(u => u.username === 'bobdesign')._id,
        createdBy: users.find(u => u.username === 'johnmanager')._id,
        projectId: projects.find(p => p.title === 'Website Redesign')._id,
        companyId: 'demo-corp',
        status: 'Completed',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        text: 'Setup development environment',
        description: 'Configure local development environment for new project',
        completed: false,
        priority: 'medium',
        assignee: users.find(u => u.username === 'mikeeng')._id,
        createdBy: users.find(u => u.username === 'sarahfounder')._id,
        projectId: projects.find(p => p.title === 'Mobile App Development')._id,
        companyId: 'tech-startup',
        status: 'Not Started',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        text: 'Code review',
        description: 'Review frontend implementation',
        completed: false,
        priority: 'high',
        assignee: users.find(u => u.username === 'johnmanager')._id,
        createdBy: users.find(u => u.username === 'alicedev')._id,
        projectId: projects.find(p => p.title === 'Website Redesign')._id,
        companyId: 'demo-corp',
        status: 'In Progress',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      }
    ]);

    // Create goals
    console.log('🎯 Creating goals...');
    await Goal.insertMany([
      {
        name: 'Increase Team Productivity',
        description: 'Improve overall team productivity by 25% this quarter',
        status: 'In progress',
        priority: 'High',
        owner: users.find(u => u.username === 'johnmanager')._id,
        companyId: 'demo-corp',
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        progress: 40,
        tags: ['productivity', 'team', 'development']
      },
      {
        name: 'Launch MVP',
        description: 'Successfully launch minimum viable product',
        status: 'Not started',
        priority: 'Critical',
        owner: users.find(u => u.username === 'sarahfounder')._id,
        companyId: 'tech-startup',
        dueDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
        progress: 0,
        tags: ['mvp', 'product', 'launch']
      }
    ]);

    // Create documents
    console.log('📄 Creating documents...');
    await Document.insertMany([
      {
        title: 'Project Requirements',
        content: 'Detailed requirements for the website redesign project...',
        type: 'requirements',
        author: users.find(u => u.username === 'johnmanager')._id,
        companyId: 'demo-corp',
        tags: ['requirements', 'website', 'project'],
        isPublic: false,
        sharedWith: [
          {
            user: users.find(u => u.username === 'alicedev')._id,
            permission: 'read'
          },
          {
            user: users.find(u => u.username === 'bobdesign')._id,
            permission: 'write'
          }
        ]
      },
      {
        title: 'Company Handbook',
        content: 'Employee handbook with policies and procedures...',
        type: 'policy',
        author: users.find(u => u.username === 'sarahfounder')._id,
        companyId: 'tech-startup',
        tags: ['handbook', 'policy', 'hr'],
        isPublic: true
      }
    ]);

    // Initialize system settings using the model's built-in method
    console.log('⚙️ Creating system settings...');
    await SystemSettings.ensureDefaults();

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`- Companies: ${await Company.countDocuments()}`);
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Projects: ${await Project.countDocuments()}`);
    console.log(`- Tasks: ${await Task.countDocuments()}`);
    console.log(`- Goals: ${await Goal.countDocuments()}`);
    console.log(`- Documents: ${await Document.countDocuments()}`);
    console.log(`- System Settings: ${await SystemSettings.countDocuments()}`);

    console.log('\n🔑 Login credentials:');
    console.log('Super Admin: superadmin / admin123');
    console.log('Demo Corp Manager: johnmanager / manager123');
    console.log('Demo Corp User: alicedev / user123');
    console.log('Tech Startup Manager: sarahfounder / founder123');
    console.log('Tech Startup User: mikeeng / user123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedData();