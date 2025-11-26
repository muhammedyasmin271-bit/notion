const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const auth = require('../middleware/auth');
const smsService = require('../services/smsService');

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
      const companyObj = company.toObject();
      // Ensure paymentMode defaults to 'paid' if not set (for existing companies)
      if (!companyObj.paymentMode) {
        companyObj.paymentMode = 'paid';
        // Update the company in database to set paymentMode
        await Company.findByIdAndUpdate(company._id, { paymentMode: 'paid' }, { new: true });
      }
      return { ...companyObj, userCount };
    }));
    res.json(companiesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new company with admin user
router.post('/companies', auth, isSuperAdmin, async (req, res) => {
  try {
    const { name, adminEmail, adminPhone, subdomain, maxUsers, maxStorage, adminUsername, adminPassword, logo, selectedPlan } = req.body;
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
    
    // Ensure logo has proper data URL format if it's base64
    let processedLogo = logo;
    if (logo && !logo.startsWith('data:')) {
      processedLogo = `data:image/png;base64,${logo}`;
    }
    

    
    // Set payment deadline based on selected plan
    const now = new Date();
    let paymentDeadline;
    let hasPaid = false;
    let gracePeriodDeadline = null;
    
    if (selectedPlan === 'free_trial') {
      paymentDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      hasPaid = false;
    } else {
      paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      gracePeriodDeadline = new Date(paymentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days grace period
      hasPaid = false;
    }
    
    const company = new Company({
      companyId,
      name,
      adminEmail,
      adminPhone,
      subdomain: subdomain || undefined,
      adminUserId: adminUser._id,
      limits: { maxUsers: maxUsers || 50, maxStorage: maxStorage || 5368709120 },
      selectedPlan: selectedPlan || 'free_trial',
      paymentDeadline,
      gracePeriodDeadline,
      hasPaid,
      paymentMode: 'paid',
      subscriptionStatus: selectedPlan === 'free_trial' ? 'trial' : 'trial',
      branding: { logo: processedLogo, companyName: name },
      companyLink
    });
    
    await company.save();
    
    console.log(`✅ Company created successfully: ${company.name} (${company.companyId})`);
    console.log(`   Admin: ${adminUsername}`);
    console.log(`   Company Link: ${companyLink}`);
    
    // Send SMS with credentials (non-blocking - don't fail company creation if SMS fails)
    if (adminPhone) {
      try {
        let smsMessage;
        if (selectedPlan === 'free_trial') {
          smsMessage = `Welcome to ${name}!\n\nUsername: ${normalizedUsername}\nPassword: ${adminPassword}\nCompany ID: ${companyId}\n\nYou have 7 days free trial.\n\nLogin: ${companyLink}`;
        } else {
          smsMessage = `Welcome to ${name}!\n\nUsername: ${normalizedUsername}\nPassword: ${adminPassword}\nCompany ID: ${companyId}\n\nComplete payment within 24 hours.\n\nLogin: ${companyLink}`;
        }
        const smsResult = await smsService.sendSMS(adminPhone, smsMessage);
        
        if (smsResult.success) {
          console.log(`✅ SMS notification sent successfully to ${adminPhone}`);
        } else {
          console.log(`⚠️ SMS notification failed: ${smsResult.message}`);
        }
      } catch (smsError) {
        console.error('❌ SMS notification error (non-blocking):', smsError.message);
        // Don't fail company creation if SMS fails
      }
    } else {
      console.log('⚠️ No phone number provided, skipping SMS notification');
    }
    
    res.status(201).json({ company, adminUsername: normalizedUsername, companyLink });
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
    const companyObj = company.toObject();
    // Ensure paymentMode defaults to 'paid' if not set (for existing companies)
    if (!companyObj.paymentMode) {
      companyObj.paymentMode = 'paid';
      // Update the company in database to set paymentMode
      await Company.findByIdAndUpdate(company._id, { paymentMode: 'paid' }, { new: true });
    }
    res.json(companyObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update company payment mode
router.patch('/companies/:companyId/payment-mode', auth, isSuperAdmin, async (req, res) => {
  try {
    const { paymentMode } = req.body;
    
    if (!paymentMode || !['paid', 'free'].includes(paymentMode)) {
      return res.status(400).json({ message: 'Invalid payment mode. Must be "paid" or "free"' });
    }

    const company = await Company.findOneAndUpdate(
      { companyId: req.params.companyId },
      { paymentMode: paymentMode },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Payment mode updated successfully', company });
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

// Unpause company (Super Admin only)
router.patch('/companies/:companyId/unpause', auth, isSuperAdmin, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.params.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.status !== 'paused') {
      return res.status(400).json({ message: 'Company is not paused' });
    }

    // Unpause the company
    company.status = 'active';
    company.unpausedAt = new Date();
    
    // Give 24 hours to pay after unpause
    const now = new Date();
    company.paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    company.gracePeriodDeadline = new Date(company.paymentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    await company.save();

    console.log(`✅ Company unpaused: ${company.companyId} - New payment deadline: ${company.paymentDeadline}`);

    res.json({ 
      message: 'Company unpaused successfully. Company has 24 hours to complete payment.',
      company: {
        companyId: company.companyId,
        name: company.name,
        status: company.status,
        paymentDeadline: company.paymentDeadline,
        gracePeriodDeadline: company.gracePeriodDeadline
      }
    });
  } catch (error) {
    console.error('Error unpausing company:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
