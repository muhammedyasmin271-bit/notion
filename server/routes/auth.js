const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { requireManager } = require('../middleware/roleAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  // App supports only user and manager roles; admin not used
  body('role').optional().isIn(['user', 'manager'])
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

    // Determine role with bootstrap rule: allow first manager if none exists
    let finalRole = 'user';
    let finalStatus = 'pending';
    let finalIsActive = false;
    
    if (role === 'manager') {
      const managersCount = await User.countDocuments({ role: 'manager', status: 'approved' });
      if (managersCount === 0) {
        // First manager gets auto-approved
        finalRole = 'manager';
        finalStatus = 'approved';
        finalIsActive = true;
      } else {
        // Subsequent managers need approval from existing managers
        finalRole = 'manager';
        finalStatus = 'pending';
        finalIsActive = false;
      }
    }

    // Map uploaded files (if any) to model structure
    const uploadedFiles = Array.isArray(req.files) ? req.files.map(f => ({
      name: f.originalname,
      type: f.mimetype,
      size: f.size,
      url: `/uploads/${path.basename(f.path)}`,
      uploadedAt: new Date()
    })) : [];

    // Create new user, attach uploaded files
    user = new User({
      name,
      username: normalizedUsername,
      password,
      role: finalRole,
      files: uploadedFiles,
      status: finalStatus,
      isActive: finalIsActive
    });

    await user.save();

    // If user needs approval, don't create token - redirect to pending page
    if (user.status === 'pending') {
      return res.json({
        message: 'Registration successful. Your account is pending approval.',
        requiresApproval: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          status: user.status
        }
      });
    }

    // Create JWT token for approved users
    const payload = {
      user: {
        id: user.id,
        role: user.role
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
            email: user.email,
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

    const { username, password } = req.body;
    const normalizedUsername = String(username).toLowerCase();

    // Check if user exists by username
    const user = await User.findOne({ username: normalizedUsername }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
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

    // Disallow admin logins
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts are not allowed to log in.' });
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
        role: user.role
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
            email: user.email,
            role: user.role,
            preferences: user.preferences
          }
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
        role: user.role
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

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register-user
// @desc    Register a new user (Manager only)
// @access  Private (Manager/Admin)
router.post('/register-user', requireManager, [
  body('name', 'Name is required').not().isEmpty().trim().escape(),
  body('username', 'Username is required').not().isEmpty().trim(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  // Only 'user' and 'manager' roles are supported in this app
  body('role', 'Role must be user or manager').isIn(['user', 'manager'])
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

    // Create new user
    user = new User({
      name,
      username: normalizedUsername,
      password,
      role: role || 'user',
      status: 'approved',
      isActive: true,
      createdBy: req.user.id
    });

    await user.save();

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
// @desc    Get all users (Manager only)
// @access  Private (Manager)
router.get('/users', requireManager, async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    let query = {};

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
// @desc    Toggle user active status (Manager only)
// @access  Private (Manager)
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
// @desc    Approve user registration (Manager only)
// @access  Private (Manager)
router.put('/users/:id/approve', requireManager, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ message: 'User is already approved' });
    }

    user.status = 'approved';
    user.isActive = true;
    await user.save();

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
// @desc    Decline user registration (Manager only)
// @access  Private (Manager)
router.put('/users/:id/decline', requireManager, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'declined') {
      return res.status(400).json({ message: 'User is already declined' });
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
// @desc    Delete user (Manager only)
// @access  Private (Manager)
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

module.exports = router;
