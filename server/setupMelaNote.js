const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/Company');
const User = require('./models/User');

const setupMelaNote = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
    console.log('Connected to MongoDB');

    // Check if Mela Note company already exists
    const existingCompany = await Company.findOne({ name: 'Mela Note' });
    if (existingCompany) {
      console.log('Mela Note company already exists');
      process.exit(0);
    }

    const companyId = 'melanote';
    const adminUsername = 'aymen';
    const adminPassword = '7749';

    // Check if admin user already exists
    let adminUser = await User.findOne({ username: adminUsername });
    if (!adminUser) {
      // Create Mela Note admin user
      adminUser = new User({
        name: 'Aymen Arega',
        username: adminUsername,
        password: adminPassword,
        email: 'admin@melanote.com',
        role: 'admin',
        companyId,
        isActive: true,
        status: 'approved'
      });
      await adminUser.save();
      console.log('Mela Note admin user created');
    } else {
      // Update existing user
      adminUser.role = 'admin';
      adminUser.companyId = companyId;
      adminUser.isActive = true;
      adminUser.status = 'approved';
      if (!adminUser.email) adminUser.email = 'admin@melanote.com';
      await adminUser.save();
      console.log('Existing user updated to Mela Note admin');
    }

    // Create Mela Note company
    const company = new Company({
      companyId,
      name: 'Mela Note',
      adminEmail: 'admin@melanote.com',
      adminUserId: adminUser._id,
      status: 'active',
      subscriptionStatus: 'paid',
      branding: {
        logo: '/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png',
        companyName: 'Mela Note'
      },
      limits: {
        maxUsers: 100,
        maxStorage: 10737418240 // 10GB
      },
      companyLink: `${process.env.APP_URL || 'http://localhost:3000'}/login?company=melanote`
    });
    await company.save();
    console.log('Mela Note company created');

    // Update existing users to belong to Mela Note
    await User.updateMany(
      { companyId: 'default', role: { $ne: 'superadmin' } },
      { companyId: 'melanote' }
    );
    console.log('Existing users migrated to Mela Note');

    console.log('\n✅ Setup Complete!');
    console.log('Company: Mela Note');
    console.log('Company ID: melanote');
    console.log('Admin Username:', adminUsername);
    console.log('Admin Password:', adminPassword);
    console.log('Company Link:', company.companyLink);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

setupMelaNote();
