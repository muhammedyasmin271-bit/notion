const express = require('express');
const router = express.Router();

// @route   GET /api/company/search
// @desc    Search companies by name (Public)
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }
    
    const searchTerm = q.trim();
    
    // Search companies by name or companyId (case insensitive)
    const companies = await Company.find({
      $and: [
        { status: 'active' }, // Only active companies
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { companyId: { $regex: searchTerm, $options: 'i' } },
            { 'branding.companyName': { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    })
    .select('companyId name branding')
    .limit(10) // Limit results to prevent overload
    .sort({ name: 1 });
    
    res.json({
      companies: companies.map(company => ({
        companyId: company.companyId,
        name: company.name,
        branding: company.branding || {}
      }))
    });
  } catch (error) {
    console.error('Error searching companies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');
const Company = require('../models/Company');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const { sendSMS } = require('../services/smsService');
const { schedulePaymentReminders, cancelPaymentReminders } = require('../services/paymentReminder');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup Multer for logo uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'company-logos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.get('/my-company', auth, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    console.log(`🔍 Company ${company.companyId} points status: pointsEnabled = ${company.pointsEnabled} (type: ${typeof company.pointsEnabled})`);
    
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ companyId: company.companyId })
      .sort({ createdAt: -1 })
      .select('_id amount paymentDate status period createdAt');
    
    res.json({
      companyId: company.companyId,
      name: company.name,
      adminEmail: company.adminEmail,
      adminPhone: company.adminPhone,
      branding: company.branding || {},
      limits: company.limits || {},
      status: company.status,
      subscriptionStatus: company.subscriptionStatus,
      selectedPlan: company.selectedPlan,
      hasPaid: company.hasPaid,
      pointsEnabled: company.pointsEnabled, // Return actual stored value
      rating: company.rating || 0, // Include company rating
      paymentMode: company.paymentMode || 'paid',
      pricePerUserPerMonth: company.pricePerUserPerMonth,
      createdAt: company.createdAt,
      paymentDeadline: company.paymentDeadline,
      gracePeriodDeadline: company.gracePeriodDeadline,
      paymentPeriodEnd: company.paymentPeriodEnd,
      lastPaymentDate: company.lastPaymentDate,
      pausedAt: company.pausedAt,
      unpausedAt: company.unpausedAt,
      paymentCountdownStart: company.paymentCountdownStart, // When 24-hour countdown started
      payments: payments || []
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/branding', auth, requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    console.log('🎨 Branding update request received');
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    if (!company.branding) {
      company.branding = {};
    }
    
    if (req.body.companyName) {
      company.branding.companyName = req.body.companyName;
    }
    
    if (req.body.primaryColor) {
      company.branding.primaryColor = req.body.primaryColor;
    }
    
    if (req.file) {
      // Store full URL for consistency
      const baseUrl = process.env.BACKEND_URL || process.env.API_URL || 'https://notion-l9ti.onrender.com';
      const logoUrl = `${baseUrl}/uploads/company-logos/${req.file.filename}`;
      company.branding.logo = logoUrl;
    }
    
    await company.save();
    console.log('✅ Company branding saved successfully');
    
    res.json({
      message: 'Company branding updated successfully',
      branding: company.branding
    });
  } catch (error) {
    console.error('❌ Error updating company branding:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/contact', auth, requireAdmin, async (req, res) => {
  try {
    const { adminEmail, adminPhone } = req.body;
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    if (adminEmail) {
      const existingCompany = await Company.findOne({
        adminEmail,
        companyId: { $ne: req.user.companyId }
      });
      
      if (existingCompany) {
        return res.status(400).json({ message: 'This email is already in use by another company' });
      }
      
      company.adminEmail = adminEmail;
    }
    
    if (adminPhone) {
      company.adminPhone = adminPhone;
    }
    
    await company.save();
    
    res.json({
      message: 'Contact information updated successfully',
      adminEmail: company.adminEmail,
      adminPhone: company.adminPhone
    });
  } catch (error) {
    console.error('❌ Error updating contact info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/points-system', auth, requireAdmin, async (req, res) => {
  try {
    const { pointsEnabled } = req.body;
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    const wasEnabled = company.pointsEnabled !== false;
    const willBeEnabled = pointsEnabled !== false;
    
    company.pointsEnabled = willBeEnabled;
    
    // Set pointsEnabledAt when enabling for the first time or re-enabling
    if (willBeEnabled && (!wasEnabled || !company.pointsEnabledAt)) {
      company.pointsEnabledAt = new Date();
    }
    
    await company.save();
    
    res.json({
      message: `Points system ${willBeEnabled ? 'enabled' : 'disabled'} successfully`,
      pointsEnabled: company.pointsEnabled,
      pointsEnabledAt: company.pointsEnabledAt
    });
  } catch (error) {
    console.error('❌ Error updating points system:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    const User = require('../models/User');
    const totalUsers = await User.countDocuments({
      companyId: req.user.companyId,
      status: { $ne: 'declined' }
    });
    
    const activeUsers = await User.countDocuments({
      companyId: req.user.companyId,
      status: 'approved',
      isActive: true
    });
    
    const pendingUsers = await User.countDocuments({
      companyId: req.user.companyId,
      status: 'pending'
    });
    
    const Project = require('../models/Project');
    const projectCount = await Project.countDocuments({ companyId: req.user.companyId });
    
    const Document = require('../models/Document');
    const documentCount = await Document.countDocuments({ companyId: req.user.companyId });
    
    res.json({
      company: {
        name: company.name,
        status: company.status,
        subscriptionStatus: company.subscriptionStatus,
        createdAt: company.createdAt
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        limit: company.limits?.maxUsers || 50
      },
      resources: {
        projects: projectCount,
        documents: documentCount
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/create', upload.single('logo'), async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      selectedPlan,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPhone,
      adminPassword,
      adminUsername,
      maxUsers,
      logo,
      pointsEnabled
    } = req.body;

    if (!companyName || !companyEmail || !adminEmail || !adminPassword || !adminPhone) {
      return res.status(400).json({ message: 'Missing required fields. Phone number is required.' });
    }

    const companyId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const existingCompany = await Company.findOne({ adminEmail });
    if (existingCompany) {
      return res.status(400).json({ message: 'Admin email already in use' });
    }

    const finalAdminUsername = (adminUsername || adminEmail.split('@')[0] + '_admin').toLowerCase();

    const existingUser = await User.findOne({ username: finalAdminUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin username already exists' });
    }

    const pricePerUserSetting = await SystemSettings.findOne({ settingKey: 'payment.pricePerUserPerMonth' });
    const pricePerUserPerMonth = pricePerUserSetting ? pricePerUserSetting.value : 1;

    const now = new Date();
    let paymentDeadline;
    let hasPaid = false;
    let gracePeriodDeadline = null;
    
    if (selectedPlan === 'free_trial') {
      paymentDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      hasPaid = false;
    } else {
      paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      gracePeriodDeadline = new Date(paymentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000);
      hasPaid = false;
    }

    const adminUser = new User({
      name: `${adminFirstName || 'Admin'} ${adminLastName || 'User'}`,
      username: finalAdminUsername,
      password: adminPassword,
      email: adminEmail,
      phone: adminPhone,
      role: 'admin',
      companyId,
      isActive: true,
      status: 'approved'
    });

    await adminUser.save();
    console.log(`✅ Admin user created: ${adminUser.name}`);

    let logoUrl = null;
    if (logo && logo.startsWith('data:image')) {
      logoUrl = logo;
    } else if (req.file) {
      const baseUrl = process.env.BACKEND_URL || process.env.API_URL || 'https://notion-l9ti.onrender.com';
      logoUrl = `${baseUrl}/uploads/company-logos/${req.file.filename}`;
    }

    const companyLink = `${process.env.FRONTEND_URL || 'https://melafront.vercel.app'}/login?company=${companyId}`;

    console.log(`🔧 Points system setting: pointsEnabled = ${pointsEnabled} (type: ${typeof pointsEnabled})`);
    
    // Handle pointsEnabled properly - convert string 'false' to boolean false
    let finalPointsEnabled;
    if (pointsEnabled === 'false' || pointsEnabled === false) {
      finalPointsEnabled = false;
    } else if (pointsEnabled === 'true' || pointsEnabled === true) {
      finalPointsEnabled = true;
    } else {
      finalPointsEnabled = true; // Default to true if undefined
    }
    
    console.log(`🔧 Final points setting: ${finalPointsEnabled}`);

    const company = new Company({
      companyId,
      name: companyName,
      adminEmail,
      adminPhone: companyPhone,
      adminUserId: adminUser._id,
      selectedPlan: selectedPlan || 'free_trial',
      paymentDeadline,
      gracePeriodDeadline,
      pricePerUserPerMonth: pricePerUserPerMonth,
      hasPaid: hasPaid,
      paymentMode: 'paid',
      subscriptionStatus: selectedPlan === 'free_trial' ? 'trial' : 'trial',
      pointsEnabled: finalPointsEnabled,
      pointsEnabledAt: finalPointsEnabled ? new Date() : null,
      branding: {
        logo: logoUrl,
        companyName: companyName
      },
      limits: {
        maxUsers: maxUsers ? parseInt(maxUsers) : 50,
        maxStorage: 5368709120
      },
      pricing: {
        monthlyAmount: 1000,
        currency: 'ETB'
      },
      companyLink,
      status: 'active',
      paymentCountdownStart: selectedPlan === 'free_trial' ? null : now
    });

    await company.save();
    console.log(`✅ Company created: ${company.name}`);

    // Send SMS notification (non-blocking - don't fail company creation if SMS fails)
    if (adminPhone) {
      try {
        let smsMessage;
        
        if (selectedPlan === 'free_trial') {
          smsMessage = `Welcome to ${companyName}!\n\nYour login credentials:\nUsername: ${finalAdminUsername}\nPassword: ${adminPassword}\nCompany ID: ${companyId}\n\nYou have 7 days free trial.\n\nLogin: ${companyLink}`;
        } else {
          smsMessage = `Welcome to ${companyName}!\n\nYour login credentials:\nUsername: ${finalAdminUsername}\nPassword: ${adminPassword}\nCompany ID: ${companyId}\n\nComplete payment within 24 hours.\n\nLogin: ${companyLink}`;
        }

        const smsResult = await sendSMS(adminPhone, smsMessage);
        
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

    if (selectedPlan !== 'free_trial' && adminPhone && process.env.SMS_API && process.env.SMS_TOKEN) {
      schedulePaymentReminders(companyId, adminPhone, companyName, paymentDeadline);
    }

    res.status(201).json({
      message: 'Company created successfully',
      companyId: company.companyId,
      companyName: company.name,
      adminEmail: adminEmail,
      adminUsername: finalAdminUsername,
      companyLink: companyLink,
      paymentDeadline: paymentDeadline,
      selectedPlan: selectedPlan
    });
  } catch (error) {
    console.error('❌ Error creating company:', error);
    res.status(500).json({ message: 'Failed to create company', error: error.message });
  }
});

module.exports = router;
