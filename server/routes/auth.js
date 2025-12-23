const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireManager, requireAdmin } = require('../middleware/roleAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

const router = express.Router();

// Configure multer storage for user registration uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create uploads directory:', e.message);
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${unique}-${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file, up to 10 files
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', upload.array('files'), [
  body('name', 'Name is required').not().isEmpty().trim().escape(),
  body('username', 'Username is required').not().isEmpty().trim(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  body('phone').optional().trim(),
  // App supports user, manager, and admin roles
  body('role').optional().isIn(['user', 'manager', 'admin'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, email, password, role, phone } = req.body;
    const normalizedUsername = String(username).toLowerCase();

    console.log('🔵 Registration Request Body:', JSON.stringify(req.body, null, 2));
    console.log('🔵 CompanyId from request:', req.body.companyId);

    // Check if user already exists
    let user = await User.findOne({ username: normalizedUsername });
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists (only if provided)
    if (email && email.trim()) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const existingEmail = await User.findOne({ email: normalizedEmail });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Get companyId from request body or default to melanote
    const userCompanyId = req.body.companyId || 'melanote';
    console.log('🔵 User will be assigned companyId:', userCompanyId);

    // Check if company exists and is active
    const Company = require('../models/Company');
    const company = await Company.findOne({ companyId: userCompanyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found. Please check your registration link.' });
    }

    if (company.status === 'paused') {
      return res.status(403).json({ message: 'This company is currently paused and not accepting new registrations.' });
    }

    // Check user limit with SMS notifications
    const { checkUserLimit } = require('../services/userLimitService');
    const limitCheck = await checkUserLimit(userCompanyId, true);
    
    if (!limitCheck.canAdd) {
      return res.status(403).json({ message: limitCheck.message });
    }
    
    // Determine role with bootstrap rule: allow first manager if none exists
    let finalRole = 'user';
    let finalStatus = 'pending';
    let finalIsActive = false;

    if (role === 'admin') {
      // Special case for admin - check if admin already exists in this company
      const adminCount = await User.countDocuments({ role: 'admin', companyId: userCompanyId });
      if (adminCount === 0) {
        // First admin gets auto-approved
        finalRole = 'admin';
        finalStatus = 'approved';
        finalIsActive = true;
      } else {
        // Additional admins need approval from existing admins
        finalRole = 'admin';
        finalStatus = 'pending';
        finalIsActive = false;
      }
    } else if (role === 'manager') {
      // All managers need approval - no auto-approval even for first manager
      finalRole = 'manager';
      finalStatus = 'pending';
      finalIsActive = false;
    }

    // Map uploaded files (if any) to model structure
    const uploadedFiles = Array.isArray(req.files) ? req.files.map(f => ({
      name: f.originalname,
      type: f.mimetype,
      size: f.size,
      url: `/uploads/${path.basename(f.path)}`,
      uploadedAt: new Date()
    })) : [];

    // Create new user, attach uploaded files and companyId
    user = new User({
      name,
      username: normalizedUsername,
      password,
      email: email && email.trim() ? email.toLowerCase().trim() : undefined, // Normalize email or set undefined
      phone: phone || '',
      role: finalRole,
      companyId: userCompanyId,
      files: uploadedFiles,
      status: finalStatus,
      isActive: finalIsActive
    });

    await user.save();

    console.log('✅ User saved successfully:', {
      name: user.name,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
      status: user.status,
      isActive: user.isActive
    });

    // Check if we reached 100% limit and send SMS if needed
    if (limitCheck.reachedLimit) {
      console.log('📱 Company reached 100% user limit, SMS notification sent');
    }

    // Send SMS notification after registration
    if (user.phone) {
      try {
        let smsMessage = '';
        if (user.status === 'pending') {
          smsMessage = `Hello ${user.name},\n\nYour registration has been received and is pending approval. You will be notified once your account is approved.\n\nThank you for registering!\n\n- mela note`;
        } else {
          smsMessage = `Hello ${user.name},\n\nYour registration was successful! Your account has been approved and you can now log in.\n\nUsername: ${user.username}\n\n- mela note`;
        }
        const smsResult = await sendSMS(user.phone, smsMessage);
        if (smsResult.success) {
          console.log(`Registration SMS sent to ${user.phone}`);
        } else {
          console.log(`Failed to send registration SMS to ${user.phone}: ${smsResult.message}`);
        }
      } catch (smsError) {
        console.error(`Error sending registration SMS to ${user.phone}:`, smsError.message);
        // Don't fail registration if SMS fails
      }
    }

    // If user needs approval, don't create token - redirect to pending page
    if (user.status === 'pending') {
      return res.json({
        message: 'Registration successful. Your account is pending approval.',
        requiresApproval: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          role: user.role,
          status: user.status,
          companyId: user.companyId
        }
      });
    }

    // Create JWT token for approved users
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username,

      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    // Handle duplicate key errors for username/email
    if (err && err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/company/:companyId
// @desc    Get company branding info
// @access  Public
router.get('/company/:companyId', async (req, res) => {
  try {
    const Company = require('../models/Company');
    const company = await Company.findOne({ companyId: req.params.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({
      companyId: company.companyId,
      name: company.name,
      branding: company.branding
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/company-status
// @desc    Get current user's company status and points enabled status
// @access  Private (Any authenticated user)
router.get('/company-status', auth, async (req, res) => {
  try {
    const Company = require('../models/Company');
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      companyId: company.companyId,
      status: company.status,
      pointsEnabled: company.pointsEnabled !== false, // Default to true
      isPointsBlocked: company.status === 'paused' || company.pointsEnabled === false
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/my-company
// @desc    Get current user's company branding
// @access  Private
router.get('/my-company', auth, async (req, res) => {
  try {
    const Company = require('../models/Company');
    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      // Return default branding if no company found
      return res.json({
        companyId: req.user.companyId || 'melanote',
        name: 'Mela Note',
        branding: {
          logo: '/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png',
          companyName: 'Mela Note',
          primaryColor: '#3B82F6'
        }
      });
    }
    
    res.json({
      companyId: company.companyId,
      name: company.name,
      branding: company.branding || {
        logo: '/ChatGPT_Image_Sep_24__2025__11_09_34_AM-removebg-preview.png',
        companyName: company.name,
        primaryColor: '#3B82F6'
      }
    });
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('username', 'Username is required').not().isEmpty().trim(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, companyId } = req.body;
    const normalizedUsername = String(username).toLowerCase();

    // Build query - if companyId provided, filter by it
    const query = { username: normalizedUsername };
    if (companyId) {
      query.companyId = companyId;
    }

    // Check if user exists by username and companyId
    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Skip company validation for super admins
    let company = null;
    if (user.role !== 'superadmin') {
      // Check if company exists and is active
      const Company = require('../models/Company');
      company = await Company.findOne({ companyId: user.companyId });
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found. Please contact support.' });
      }

      if (company.status === 'paused') {
        return res.status(403).json({ message: 'This company is currently paused. Please contact the super administrator.' });
      }
    }

    // Check approval status first
    if (user.status && user.status !== 'approved') {
      const msg = user.status === 'pending'
        ? 'Your account is pending approval. Please wait for a manager to approve your registration.'
        : 'Your account registration was declined. Please contact a manager.';
      return res.status(403).json({ message: msg });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await user.updateLastLogin();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        companyId: user.companyId
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' },
      async (err, token) => {
        if (err) throw err;
        
        // Check payment deadline for non-superadmin users
        let paymentInfo = null;
        if (company && user.role !== 'superadmin') {
          const now = new Date();
          const paymentDeadline = company.paymentDeadline;
          const isDeadlinePassed = paymentDeadline && new Date(paymentDeadline) < now;
          // Needs payment if: trial status, not free trial plan, deadline exists and not passed
          const needsPayment = company.subscriptionStatus === 'trial' && 
                               company.selectedPlan !== 'free_trial' && 
                               paymentDeadline &&
                               !isDeadlinePassed;
          
          paymentInfo = {
            paymentDeadline: paymentDeadline,
            isDeadlinePassed: isDeadlinePassed,
            needsPayment: needsPayment,
            selectedPlan: company.selectedPlan,
            subscriptionStatus: company.subscriptionStatus
          };
        }
        
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            companyId: user.companyId,
            preferences: user.preferences
          },
          paymentInfo: paymentInfo
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Update last login to track logout
    await User.findByIdAndUpdate(req.user.id, { lastLogin: new Date() });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, [
  body('theme').optional().isIn(['light', 'dark', 'auto']),
  body('notifications.email').optional().isBoolean(),
  body('notifications.push').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { theme, notifications } = req.body;
    const updateFields = {};

    if (theme) updateFields['preferences.theme'] = theme;
    if (notifications) {
      if (notifications.email !== undefined) updateFields['preferences.notifications.email'] = notifications.email;
      if (notifications.push !== undefined) updateFields['preferences.notifications.push'] = notifications.push;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, [
  body('currentPassword', 'Current password is required').exists(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password phone');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send SMS with new password if user has phone number
    if (user.phone) {
      try {
        const smsMessage = `Your password has been changed successfully.\nNew Password: ${newPassword}\n\nPlease keep this password secure.\n\n- mela note`;
        const smsResult = await sendSMS(user.phone, smsMessage);
        if (smsResult.success) {
          console.log(`Password change SMS sent to ${user.phone}`);
        } else {
          console.log(`Failed to send password change SMS to ${user.phone}: ${smsResult.message}`);
        }
      } catch (smsError) {
        console.error(`Error sending password change SMS to ${user.phone}:`, smsError.message);
        // Don't fail the password change if SMS fails
      }
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register-user
// @desc    Register a new user (Manager/Admin only)
// @access  Private (Manager/Admin)
router.post('/register-user', requireManager, [
  body('name', 'Name is required').not().isEmpty().trim().escape(),
  body('username', 'Username is required').not().isEmpty().trim(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  // Support all roles in this app
  body('role', 'Role must be user, manager, or admin').isIn(['user', 'manager', 'admin'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, password, role } = req.body;
    const normalizedUsername = String(username).toLowerCase();

    // Check if user already exists
    let user = await User.findOne({ username: normalizedUsername });
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check user limit with SMS notifications
    const { checkUserLimit } = require('../services/userLimitService');
    const limitCheck = await checkUserLimit(req.user.companyId, true);
    
    if (!limitCheck.canAdd) {
      return res.status(403).json({ message: limitCheck.message });
    }

    // Create new user
    user = new User({
      name,
      username: normalizedUsername,
      password,
      email: undefined, // Explicitly set to undefined to avoid empty string
      role: role || 'user',
      status: 'approved',
      isActive: true,
      createdBy: req.user.id
    });

    await user.save();

    // Check if we reached 100% limit and send SMS if needed
    if (limitCheck.reachedLimit) {
      console.log('📱 Company reached 100% user limit, SMS notification sent');
    }

    // Send welcome email if user has email
    if (user.email) {
      try {
        await emailService.sendWelcomeEmail(user);
        console.log(`Welcome email sent to ${user.email}`);
      } catch (emailError) {
        console.error(`Error sending welcome email to ${user.email}:`, emailError.message);
      }
    }

    // Return user info without token (manager creates, user logs in separately)
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err && err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (Manager/Admin only)
// @access  Private (Manager/Admin)
router.get('/users', requireManager, async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    let query = { role: { $ne: 'superadmin' } };

    // Apply filters
    if (role && role !== 'all') query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id/status
// @desc    Toggle user active status (Manager/Admin only)
// @access  Private (Manager/Admin)
router.put('/users/:id/status', requireManager, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent users from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: 'Cannot modify your own account status'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id/approve
// @desc    Approve user registration (Manager/Admin only)
// @access  Private (Manager/Admin)
router.put('/users/:id/approve', requireManager, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ message: 'User is already approved' });
    }

    // Check user limit with SMS notifications (only if approving from pending status)
    let limitCheck = null;
    if (user.status === 'pending') {
      const { checkUserLimit } = require('../services/userLimitService');
      limitCheck = await checkUserLimit(user.companyId, true);
      
      if (!limitCheck.canAdd) {
        return res.status(403).json({ message: limitCheck.message });
      }
    }

    user.status = 'approved';
    user.isActive = true;
    await user.save();

    // Check if we reached 100% limit and send SMS if needed
    if (limitCheck?.reachedLimit) {
      console.log('📱 Company reached 100% user limit after approval, SMS notification sent');
    }

    res.json({
      message: 'User approved successfully',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        status: user.status,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id/decline
// @desc    Decline user registration (Manager/Admin only)
// @access  Private (Manager/Admin)
router.put('/users/:id/decline', requireManager, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'declined') {
      return res.status(400).json({ message: 'User is already declined' });
    }

    // Send SMS notification to user about decline before deleting
    if (user.phone) {
      try {
        const smsMessage = `Hello ${user.name},\n\nWe regret to inform you that your registration has been declined. Please contact the administrator for more information.\n\n- mela note`;
        const smsResult = await sendSMS(user.phone, smsMessage);
        if (smsResult.success) {
          console.log(`Decline SMS sent to ${user.phone}`);
        } else {
          console.log(`Failed to send decline SMS to ${user.phone}: ${smsResult.message}`);
        }
      } catch (smsError) {
        console.error(`Error sending decline SMS to ${user.phone}:`, smsError.message);
        // Don't fail decline if SMS fails
      }
    }

    // Delete the user instead of just marking as declined
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User registration declined and removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (Manager/Admin only)
// @access  Private (Manager/Admin)
router.delete('/users/:id', [auth, auth.managerOnly], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deletion of self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/admin/users
// @desc    Get all users for admin (Admin only)
// @access  Private (Admin only)
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    let query = { role: { $ne: 'superadmin' } };

    // Apply filters
    if (role && role !== 'all') query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/admin/users/:id/approve
// @desc    Approve user registration (Admin only)
// @access  Private (Admin only)
router.put('/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ message: 'User is already approved' });
    }

    // Check user limit with SMS notifications (only if approving from pending status)
    let limitCheck = null;
    if (user.status === 'pending') {
      const { checkUserLimit } = require('../services/userLimitService');
      limitCheck = await checkUserLimit(user.companyId, true);
      
      if (!limitCheck.canAdd) {
        return res.status(403).json({ message: limitCheck.message });
      }
    }

    user.status = 'approved';
    user.isActive = true;
    await user.save();

    // Check if we reached 100% limit and send SMS if needed
    if (limitCheck?.reachedLimit) {
      console.log('📱 Company reached 100% user limit after approval, SMS notification sent');
    }

    // Send SMS notification to user about approval
    if (user.phone) {
      try {
        const smsMessage = `Hello ${user.name},\n\nYour account has been approved! You can now log in to your account.\n\nUsername: ${user.username}\n\n- mela note`;
        const smsResult = await sendSMS(user.phone, smsMessage);
        if (smsResult.success) {
          console.log(`Approval SMS sent to ${user.phone}`);
        } else {
          console.log(`Failed to send approval SMS to ${user.phone}: ${smsResult.message}`);
        }
      } catch (smsError) {
        console.error(`Error sending approval SMS to ${user.phone}:`, smsError.message);
        // Don't fail approval if SMS fails
      }
    }

    res.json({
      message: 'User approved successfully',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        status: user.status,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/admin/users/:id/make-manager
// @desc    Make user a manager (Admin only)
// @access  Private (Admin only)
router.put('/admin/users/:id/make-manager', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'manager') {
      return res.status(400).json({ message: 'User is already a manager' });
    }

    user.role = 'manager';
    await user.save();

    res.json({
      message: 'User is now a manager',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/admin/users/:id/make-user
// @desc    Make manager a regular user (Admin only)
// @access  Private (Admin only)
router.put('/admin/users/:id/make-user', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'user') {
      return res.status(400).json({ message: 'User is already a regular user' });
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: 'Cannot change your own role'
      });
    }

    user.role = 'user';
    await user.save();

    res.json({
      message: 'User is now a regular user',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;