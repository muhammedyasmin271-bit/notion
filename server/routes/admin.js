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
    const now = new Date();
    const { checkAndPauseCompanies } = require('../middleware/companyStatusCheck');
    
    // Check and auto-pause companies before fetching
    await checkAndPauseCompanies();
    
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
      
      // Auto-update status if grace period expired
      if (companyObj.paymentMode === 'paid' && !companyObj.hasPaid) {
        const gracePeriodDeadline = companyObj.gracePeriodDeadline ? new Date(companyObj.gracePeriodDeadline) : null;
        if (gracePeriodDeadline && now >= gracePeriodDeadline && companyObj.status !== 'paused') {
          // Auto-pause company
          await Company.findByIdAndUpdate(company._id, { 
            status: 'paused', 
            pausedAt: now 
          });
          companyObj.status = 'paused';
          companyObj.pausedAt = now;
        }
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
    const { name, adminEmail, adminPhone, subdomain, maxUsers, maxStorage, adminUsername, adminPassword, logo, selectedPlan, pointsEnabled } = req.body;
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
    const companyLink = `${process.env.APP_URL || 'process.env.Backendurl'}/login?company=${companyId}`;
    
    // Set pointsEnabledAt to now (company creation date) since points are enabled by default
    const now = new Date();
    
    // Ensure logo has proper data URL format if it's base64
    let processedLogo = logo;
    if (logo && !logo.startsWith('data:')) {
      processedLogo = `data:image/png;base64,${logo}`;
    }
    
    // Set payment deadline based on selected plan
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
    
    console.log(`🔧 Admin creating company - Points system setting: pointsEnabled = ${pointsEnabled} (type: ${typeof pointsEnabled})`);
    
    // Handle pointsEnabled properly - convert string 'false' to boolean false
    let finalPointsEnabled;
    if (pointsEnabled === 'false' || pointsEnabled === false) {
      finalPointsEnabled = false;
    } else if (pointsEnabled === 'true' || pointsEnabled === true) {
      finalPointsEnabled = true;
    } else {
      finalPointsEnabled = true; // Default to true if undefined
    }
    
    console.log(`🔧 Admin - Final points setting: ${finalPointsEnabled}`);
    
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
      companyLink,
      pointsEnabled: finalPointsEnabled,
      pointsEnabledAt: finalPointsEnabled ? now : null
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

// Toggle rating block for company
router.patch('/companies/:companyId/rating-block', auth, isSuperAdmin, async (req, res) => {
  try {
    const { blocked } = req.body;
    
    const company = await Company.findOneAndUpdate(
      { companyId: req.params.companyId },
      { ratingBlocked: blocked !== undefined ? blocked : false },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    console.log(`✅ Company rating ${company.ratingBlocked ? 'blocked' : 'unblocked'} for ${company.companyId}`);

    res.json(company);
  } catch (error) {
    console.error('Error toggling rating block:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update company limits
router.patch('/companies/:companyId/limits', auth, isSuperAdmin, async (req, res) => {
  try {
    const { maxUsers, maxStorage } = req.body;
    
    // Validate user limit change if maxUsers is being updated
    if (maxUsers !== undefined) {
      const { validateLimitChange } = require('../services/userLimitService');
      const validation = await validateLimitChange(req.params.companyId, parseInt(maxUsers));
      
      if (!validation.canUpdate) {
        return res.status(400).json({ message: validation.message });
      }
    }
    
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

// Toggle company points system (enable/disable)
router.patch('/companies/:companyId/points-toggle', auth, isSuperAdmin, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.params.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Toggle pointsEnabled (default to true if not set)
    const currentStatus = company.pointsEnabled !== false; // Default to true
    const newStatus = !currentStatus;

    // If we're ENABLING points (was disabled, now enabling), reset all points and history
    if (currentStatus === false && newStatus === true) {
      console.log(`🔄 Re-enabling points for company ${company.companyId} - RESETTING all points and history`);
      
      const User = require('../models/User');
      const PointsHistory = require('../models/PointsHistory');
      
      // Reset all user points to 0 for this company
      const usersUpdated = await User.updateMany(
        { companyId: req.params.companyId },
        { $set: { points: 0 } }
      );
      console.log(`✅ Reset points to 0 for ${usersUpdated.modifiedCount} users`);
      
      // Delete all points history for this company
      const historyDeleted = await PointsHistory.deleteMany({ companyId: req.params.companyId });
      console.log(`✅ Deleted ${historyDeleted.deletedCount} points history records`);
      
      console.log(`🔄 Fresh start: All users start from 0 points, all history cleared`);
      
      // Set pointsEnabledAt to now (fresh start date)
      company.pointsEnabledAt = new Date();
    } else if (newStatus === true && !company.pointsEnabledAt) {
      // If enabling and pointsEnabledAt is not set (first time enabling), set it to now
      company.pointsEnabledAt = new Date();
    }

    company.pointsEnabled = newStatus;
    await company.save();

    console.log(`✅ Points system ${newStatus ? 'ENABLED' : 'DISABLED'} for company ${company.companyId} (${company.name})`);

    res.json({
      message: newStatus 
        ? 'Points system enabled successfully. All points and history have been reset to start fresh.' 
        : 'Points system disabled successfully',
      pointsEnabled: newStatus,
      reset: currentStatus === false && newStatus === true // Indicate if reset happened
    });
  } catch (error) {
    console.error('Error toggling points:', error);
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

    const company = await Company.findOne({ companyId: req.params.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const now = new Date();
    const currentMode = company.paymentMode || 'paid';
    
    // Update payment mode with proper timing logic
    const updateData = {
      paymentMode: paymentMode,
      paymentModeChangedAt: now
    };

    if (paymentMode === 'paid' && currentMode === 'free') {
      // Switching from free to paid - start 24-hour countdown
      updateData.paymentCountdownStart = now;
      updateData.paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Exactly 24 hours
      updateData.gracePeriodDeadline = new Date(updateData.paymentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days grace after payment deadline
      updateData.status = 'active';
      updateData.hasPaid = false; // Ensure hasPaid is false when switching to paid mode
      updateData.deadlineStart = null; // Clear any old deadline data
      
      console.log(`✅ Company ${company.name} switched to PAID mode - 24 hour countdown started`);
      console.log(`   Payment deadline: ${updateData.paymentDeadline}`);
    } else if (paymentMode === 'free' && currentMode === 'paid') {
      // Switching from paid to free - remove all payment deadlines
      updateData.paymentCountdownStart = null;
      updateData.paymentDeadline = null;
      updateData.gracePeriodDeadline = null;
      updateData.deadlineStart = null;
      updateData.status = 'active'; // Ensure company is active when switching to free
      
      console.log(`✅ Company ${company.name} switched to FREE mode - no payment required`);
    }

    const updatedCompany = await Company.findOneAndUpdate(
      { companyId: req.params.companyId },
      { $set: updateData },
      { new: true }
    );

    res.json({ 
      message: `Payment mode updated to ${paymentMode.toUpperCase()} successfully`, 
      company: updatedCompany,
      countdown: paymentMode === 'paid' && currentMode === 'free' ? {
        started: updateData.paymentCountdownStart,
        deadline: updateData.paymentDeadline,
        hoursRemaining: 24,
        minutesRemaining: 0
      } : null
    });
  } catch (error) {
    console.error('Error updating payment mode:', error);
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

// Get company payment status with countdown
router.get('/companies/:companyId/payment-status', auth, isSuperAdmin, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.params.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const now = new Date();
    const paymentMode = company.paymentMode || 'paid';
    
    let status = {
      paymentMode,
      isCountingDown: false,
      hoursRemaining: null,
      minutesRemaining: null,
      deadline: null,
      isFree: paymentMode === 'free',
      expired: false
    };

    if (paymentMode === 'paid' && !company.hasPaid) {
      // Check if company has a valid payment deadline
      if (company.paymentDeadline) {
        const timeRemaining = new Date(company.paymentDeadline).getTime() - now.getTime();
        
        if (timeRemaining > 0) {
          // Still within payment window
          status.isCountingDown = true;
          status.hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
          status.minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));
          status.deadline = company.paymentDeadline;
          
          // Ensure we don't show more than 24 hours for a 24-hour window
          if (status.hoursRemaining > 24) {
            status.hoursRemaining = 24;
            status.minutesRemaining = 0;
          }
        } else {
          // Payment deadline expired
          status.isCountingDown = false;
          status.hoursRemaining = 0;
          status.minutesRemaining = 0;
          status.expired = true;
        }
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Error getting payment status:', error);
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
    const now = new Date();
    company.status = 'active';
    company.unpausedAt = now;
    
    // Give exactly 24 hours to pay after unpause
    company.paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    company.gracePeriodDeadline = new Date(company.paymentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Clear any old countdown data
    company.paymentCountdownStart = now;
    company.deadlineStart = null;
    
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
