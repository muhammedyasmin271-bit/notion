const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleAuth');
const Company = require('../models/Company');
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for logos
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

// @route   GET /api/company/my-company
// @desc    Get current company details
// @access  Private (Admin)
router.get('/my-company', auth, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      companyId: company.companyId,
      name: company.name,
      adminEmail: company.adminEmail,
      adminPhone: company.adminPhone,
      branding: company.branding || {},
      limits: company.limits || {},
      status: company.status,
      subscriptionStatus: company.subscriptionStatus,
      createdAt: company.createdAt
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/company/branding
// @desc    Update company branding (logo, name, colors)
// @access  Private (Admin)
router.put('/branding', auth, requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    console.log('🎨 Branding update request received');
    console.log('User companyId:', req.user.companyId);
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.filename : 'No file');
    
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      console.log('❌ Company not found:', req.user.companyId);
      return res.status(404).json({ message: 'Company not found' });
    }
    
    console.log('✅ Company found:', company.name);
    console.log('Current branding:', company.branding);
    
    // Update branding fields
    if (!company.branding) {
      company.branding = {};
    }
    
    if (req.body.companyName) {
      console.log('Updating company name from', company.branding.companyName, 'to', req.body.companyName);
      company.branding.companyName = req.body.companyName;
    }
    
    if (req.body.primaryColor) {
      console.log('Updating primary color from', company.branding.primaryColor, 'to', req.body.primaryColor);
      company.branding.primaryColor = req.body.primaryColor;
    }
    
    // If logo was uploaded, update it
    if (req.file) {
      const logoUrl = `/uploads/company-logos/${req.file.filename}`;
      console.log('Updating logo to:', logoUrl);
      company.branding.logo = logoUrl;
    }
    
    console.log('New branding data:', company.branding);
    console.log('Saving to database...');
    
    await company.save();
    
    console.log('✅ Company branding saved successfully to database');
    
    // Verify the save by fetching again
    const updatedCompany = await Company.findOne({ companyId: req.user.companyId });
    console.log('Verification - branding after save:', updatedCompany.branding);
    
    res.json({
      message: 'Company branding updated successfully',
      branding: company.branding
    });
  } catch (error) {
    console.error('❌ Error updating company branding:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/company/contact
// @desc    Update company contact information
// @access  Private (Admin)
router.put('/contact', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📧 Contact info update request received');
    console.log('User companyId:', req.user.companyId);
    console.log('Request body:', req.body);
    
    const { adminEmail, adminPhone } = req.body;
    
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      console.log('❌ Company not found:', req.user.companyId);
      return res.status(404).json({ message: 'Company not found' });
    }
    
    console.log('✅ Company found:', company.name);
    console.log('Current contact info - Email:', company.adminEmail, 'Phone:', company.adminPhone);
    
    if (adminEmail) {
      // Check if email is already used by another company
      const existingCompany = await Company.findOne({
        adminEmail,
        companyId: { $ne: req.user.companyId }
      });
      
      if (existingCompany) {
        console.log('❌ Email already in use by another company');
        return res.status(400).json({ message: 'This email is already in use by another company' });
      }
      
      console.log('Updating admin email from', company.adminEmail, 'to', adminEmail);
      company.adminEmail = adminEmail;
    }
    
    if (adminPhone) {
      console.log('Updating admin phone from', company.adminPhone, 'to', adminPhone);
      company.adminPhone = adminPhone;
    }
    
    console.log('Saving to database...');
    await company.save();
    console.log('✅ Contact information saved successfully to database');
    
    // Verify the save by fetching again
    const updatedCompany = await Company.findOne({ companyId: req.user.companyId });
    console.log('Verification - Email:', updatedCompany.adminEmail, 'Phone:', updatedCompany.adminPhone);
    
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

// @route   GET /api/company/stats
// @desc    Get company statistics
// @access  Private (Admin)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Get user count
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
    
    // Get projects count
    const Project = require('../models/Project');
    const projectCount = await Project.countDocuments({ companyId: req.user.companyId });
    
    // Get documents count
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

module.exports = router;

