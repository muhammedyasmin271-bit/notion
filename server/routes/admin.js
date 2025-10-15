const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Super admin check
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Get all companies
router.get('/companies', auth, isSuperAdmin, async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    const companiesWithStats = await Promise.all(companies.map(async (company) => {
      const userCount = await User.countDocuments({ companyId: company.companyId });
      return { ...company.toObject(), userCount };
    }));
    res.json(companiesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new company with admin user
router.post('/companies', auth, isSuperAdmin, async (req, res) => {
  try {
    const { name, adminEmail, adminPhone, subdomain, maxUsers, maxStorage, adminUsername, adminPassword, logo } = req.body;
    const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if admin username already exists
    const normalizedUsername = adminUsername.toLowerCase();
    const existingUser = await User.findOne({ username: normalizedUsername });
    
    if (existingUser) {
      console.log(`❌ Company creation failed: Username "${normalizedUsername}" already exists`);
      console.log(`   Existing user: ${existingUser.name} (${existingUser.role}) - Company: ${existingUser.companyId}`);
      return res.status(400).json({ 
        message: `Admin username "${adminUsername}" already exists`,
        details: `This username is already in use by ${existingUser.name} (${existingUser.companyId})`
      });
    }

    console.log(`✅ Creating company "${name}" with admin username "${normalizedUsername}"`);

    // Create company admin user
    const adminUser = new User({
      name: `${name} Admin`,
      username: normalizedUsername,
      password: adminPassword,
      email: adminEmail,
      phone: adminPhone,
      role: 'admin',
      companyId,
      isActive: true,
      status: 'approved'
    });
    
    await adminUser.save();
    console.log(`✅ Admin user created: ${adminUser.name} (${adminUser.username}) for company ${companyId}`);

    // Generate company link
    const companyLink = `${process.env.APP_URL || 'http://localhost:3000'}/login?company=${companyId}`;
    
    const company = new Company({
      companyId,
      name,
      adminEmail,
      adminPhone,
      subdomain: subdomain || undefined, // Use undefined instead of empty string
      adminUserId: adminUser._id,
      limits: { maxUsers, maxStorage },
      branding: { logo, companyName: name },
      companyLink
    });
    
    await company.save();
    
    console.log(`✅ Company created successfully: ${company.name} (${company.companyId})`);
    console.log(`   Admin: ${adminUsername}`);
    console.log(`   Company Link: ${companyLink}`);
    
    res.status(201).json({ company, adminUsername, companyLink });
  } catch (error) {
    console.error(`❌ Error creating company:`, error.message);
    res.status(400).json({ message: error.message });
  }
});

// Update company status
router.patch('/companies/:companyId/status', auth, isSuperAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const company = await Company.findOneAndUpdate(
      { companyId: req.params.companyId },
      { status },
      { new: true }
    );
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update company pricing
router.patch('/companies/:companyId/pricing', auth, isSuperAdmin, async (req, res) => {
  try {
    const { monthlyAmount, currency } = req.body;
    
    const updateData = {};
    if (monthlyAmount !== undefined) {
      updateData['pricing.monthlyAmount'] = parseFloat(monthlyAmount);
    }
    if (currency !== undefined) {
      updateData['pricing.currency'] = currency;
    }

    const company = await Company.findOneAndUpdate(
      { companyId: req.params.companyId },
      { $set: updateData },
      { new: true }
    );

    console.log('✅ Company pricing updated:', {
      companyId: req.params.companyId,
      companyName: company.name,
      monthlyAmount: company.pricing.monthlyAmount,
      currency: company.pricing.currency
    });

    res.json(company);
  } catch (error) {
    console.error('Error updating company pricing:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update company limits
router.patch('/companies/:companyId/limits', auth, isSuperAdmin, async (req, res) => {
  try {
    const { maxUsers, maxStorage } = req.body;
    
    const updateData = {};
    if (maxUsers !== undefined) {
      updateData['limits.maxUsers'] = parseInt(maxUsers);
    }
    if (maxStorage !== undefined) {
      updateData['limits.maxStorage'] = parseInt(maxStorage);
    }

    const company = await Company.findOneAndUpdate(
      { companyId: req.params.companyId },
      { $set: updateData },
      { new: true }
    );

    console.log('✅ Company limits updated:', {
      companyId: req.params.companyId,
      companyName: company.name,
      maxUsers: company.limits.maxUsers,
      maxStorage: company.limits.maxStorage
    });

    res.json(company);
  } catch (error) {
    console.error('Error updating company limits:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete company
router.delete('/companies/:companyId', auth, isSuperAdmin, async (req, res) => {
  try {
    const companyId = req.params.companyId;
    
    console.log('🗑️ Deleting company and all its data:', companyId);

    // Delete all company data
    const Project = require('../models/Project');
    const Document = require('../models/Document');
    const Note = require('../models/Note');
    const MeetingNote = require('../models/MeetingNote');
    const Task = require('../models/Task');
    const Report = require('../models/Report');
    const Payment = require('../models/Payment');
    const Notification = require('../models/Notification');

    // Delete all related data
    await Promise.all([
      Company.findOneAndDelete({ companyId }),
      User.deleteMany({ companyId }),
      Project.deleteMany({ companyId }),
      Document.deleteMany({ companyId }),
      Note.deleteMany({ companyId }),
      MeetingNote.deleteMany({ companyId }),
      Task.deleteMany({ companyId }),
      Report.deleteMany({ companyId }),
      Payment.deleteMany({ companyId }),
      Notification.deleteMany({ recipient: { $in: await User.find({ companyId }).select('_id') } })
    ]);

    console.log('✅ Company and all its data deleted successfully:', companyId);
    res.json({ message: 'Company and all its data deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single company details
router.get('/companies/:companyId', auth, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.params.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get company stats
router.get('/companies/:companyId/stats', auth, isSuperAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments({ companyId: req.params.companyId });
    const activeUsers = await User.countDocuments({ companyId: req.params.companyId, isActive: true });
    res.json({ userCount, activeUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
