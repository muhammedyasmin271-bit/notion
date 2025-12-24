const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const PointsHistory = require('./models/PointsHistory');
const User = require('./models/User');
const Project = require('./models/Project');

async function createTestPoints() {
  try {
    console.log('🎯 Creating test points data...');
    
    // Find a user to assign points to
    const users = await User.find({ role: { $ne: 'superadmin' } }).limit(5);
    console.log(`Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please create some users first.');
      return;
    }
    
    // Create a test project for points history
    let testProject = await Project.findOne({ title: 'Test Project for Points' });
    if (!testProject) {
      const firstUser = users[0];
      testProject = new Project({
        title: 'Test Project for Points',
        description: 'A test project used for generating points history data',
        status: 'Done', // Use correct enum value
        priority: 'Medium',
        owner: firstUser._id, // Use owner instead of createdBy
        companyId: firstUser.companyId,
        assignedTo: [firstUser.username],
        dueDate: new Date(),
        completedDate: new Date(),
        pointsAwarded: true
      });
      await testProject.save();
      console.log('📋 Created test project:', testProject._id);
    }
    
    const testPoints = [];
    const months = [
      { month: '2024-01', name: 'JAN 24' },
      { month: '2024-02', name: 'FEB 24' },
      { month: '2024-03', name: 'MAR 24' },
      { month: '2024-04', name: 'APR 24' },
      { month: '2024-05', name: 'MAY 24' },
      { month: '2024-06', name: 'JUN 24' },
    ];
    
    for (const user of users) {
      for (const monthData of months) {
        const [year, month] = monthData.month.split('-');
        const randomDay = Math.floor(Math.random() * 28) + 1;
        const createdAt = new Date(parseInt(year), parseInt(month) - 1, randomDay);
        
        const pointsRecord = {
          userId: user._id,
          companyId: user.companyId,
          projectId: testProject._id, // Use the test project ID
          points: Math.floor(Math.random() * 50) + 10, // Random points between 10-60
          description: `Test project completion - ${monthData.name}`,
          completedDate: createdAt,
          dueDate: createdAt,
          daysDifference: 0,
          reversed: false,
          createdAt: createdAt
        };
        
        testPoints.push(pointsRecord);
      }
    }
    
    console.log(`📊 Creating ${testPoints.length} test points records...`);
    
    // Clear existing test data first
    await PointsHistory.deleteMany({ description: { $regex: /Test project completion/ } });
    console.log('🗑️ Cleared existing test data');
    
    // Insert new test data
    const result = await PointsHistory.insertMany(testPoints);
    console.log(`✅ Created ${result.length} test points records`);
    
    // Update user points totals
    for (const user of users) {
      const userPoints = testPoints
        .filter(p => p.userId.toString() === user._id.toString())
        .reduce((sum, p) => sum + p.points, 0);
      
      await User.findByIdAndUpdate(user._id, { points: userPoints });
      console.log(`📊 Updated user ${user.name} with ${userPoints} total points`);
    }
    
    console.log('🎉 Test points data created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating test points:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestPoints();