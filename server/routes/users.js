const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Lightweight in-file cache with TTL (avoids external dependency)
class SimpleCache {
  constructor({ stdTTL = 300, checkperiod = 350 } = {}) {
    this.ttlMs = stdTTL * 1000; // seconds to ms
    this.store = new Map();
    const periodMs = checkperiod * 1000;
    this._interval = setInterval(() => this._cleanup(), periodMs);
    if (this._interval.unref) this._interval.unref();
  }
  set(key, value) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }
  del(key) {
    this.store.delete(key);
  }
  keys() {
    return Array.from(this.store.keys());
  }
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }
}

// Initialize cache with 5 minute TTL
const cache = new SimpleCache({ stdTTL: 300, checkperiod: 350 });

// Helper to delete cached keys by prefix (NodeCache doesn't provide this natively)
const delKeysByPrefix = (prefix) => {
  try {
    const keys = cache.keys();
    keys.forEach((k) => {
      if (k.startsWith(prefix)) cache.del(k);
    });
  } catch (e) {
    // no-op
  }
};

// Rate limiter for sensitive endpoints
const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Rate limiter for read operations
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200
});

// @route   POST /api/users
// @desc    Create a new user (Manager+)
// @access  Private (Manager+)
router.post('/',
  updateLimiter,
  [auth, auth.managerOnly],
  [
    body('name', 'Name is required').not().isEmpty().trim().escape(),
    body('username', 'Username is required').not().isEmpty().trim(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'manager', 'admin']),
    body('phone').optional().isMobilePhone(),
    body('department').optional().trim().escape()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, username, password, email, role, phone, department } = req.body;
      const normalizedUsername = String(username).toLowerCase();

      // Check if user already exists
      let existingUser = await User.findOne({ username: normalizedUsername });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Check if email is already in use
      if (email) {
        existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      // Create new user
      const user = new User({
        name,
        username: normalizedUsername,
        password,
        email,
        role: role || 'user',
        phone,
        department,
        createdBy: req.user.id
      });

      await user.save();

      // Clear cache
      delKeysByPrefix('users_');
      cache.del('user_stats_overview');

      res.status(201).json({
        message: 'User created successfully',
        user: {
          _id: user._id,
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (err) {
      console.error('Create user error:', err);
      if (err && err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return res.status(400).json({ message: `${field} already exists` });
      }
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users
// @desc    Get all users with advanced filtering and pagination
// @access  Private (Any authenticated user)
router.get('/',
  readLimiter,
  auth,
  [
    // Allow 'all' to pass through so frontend can send default filters safely
    query('role').optional().isIn(['user', 'manager', 'all']),
    query('isActive').optional().isIn(['true', 'false', 'all']),
    query('search').optional().trim().escape(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { role, isActive, search } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const cacheKey = `users_${role}_${isActive}_${search}_${page}_${limit}`;

      // Check cache
      const cachedUsers = cache.get(cacheKey);
      if (cachedUsers) {
        return res.json(cachedUsers);
      }

      let query = {};

      // Apply filters
      if (role && role !== 'all') query.role = role;
      if (isActive !== undefined && isActive !== 'all') query.isActive = isActive === 'true';
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      const total = await User.countDocuments(query);

      const response = {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Cache the response
      cache.set(cacheKey, response);

      res.json(response);
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users/:id
// @desc    Get user by ID with extended profile info
// @access  Private
router.get('/:id',
  readLimiter,
  auth,
  [param('id').isMongoId()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const cacheKey = `user_${req.params.id}`;
      const cachedUser = cache.get(cacheKey);
      if (cachedUser) {
        return res.json(cachedUser);
      }

      const user = await User.findById(req.params.id)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (req.user.id !== req.params.id && !['manager', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      cache.set(cacheKey, user);
      res.json(user);
    } catch (err) {
      console.error('Get user error:', err);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Invalid user ID' });
      }
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   PUT /api/users/:id
// @desc    Update user with extended validation
// @access  Private
router.put('/:id',
  updateLimiter,
  [auth, auth.managerOnly],
  [
    param('id').isMongoId(),
    body('name').optional().not().isEmpty().trim().escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'manager']),
    body('phone').optional().isMobilePhone(),
    body('department').optional().trim().escape()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user.id !== req.params.id && !['manager', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Managers are allowed to change roles between 'user' and 'manager'

      // Check if email is already in use
      if (req.body.email) {
        const existingUser = await User.findOne({
          email: req.body.email,
          _id: { $ne: req.params.id }
        });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      const updateData = { ...req.body, updatedAt: new Date() };
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Clear cache
      cache.del(`user_${req.params.id}`);
      delKeysByPrefix('users_');

      res.json(user);
    } catch (err) {
      console.error('Update user error:', err);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Invalid user ID' });
      }
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   PUT /api/users/:id/status
// @desc    Toggle user active status
// @access  Private (Manager+)
router.put('/:id/status',
  updateLimiter,
  [auth, auth.managerOnly],
  [param('id').isMongoId()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Only 'user' and 'manager' roles exist; no special admin handling required

      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: 'Cannot modify own account status' });
      }

      user.isActive = !user.isActive;
      user.updatedAt = new Date();
      await user.save();

      // Clear cache
      cache.del(`user_${req.params.id}`);
      delKeysByPrefix('users_');

      res.json({
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      });
    } catch (err) {
      console.error('Toggle status error:', err);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Invalid user ID' });
      }
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   PUT /api/users/:id/approve
// @desc    Approve a pending user (sets status=approved, isActive=true)
// @access  Private (Manager+)
router.put('/:id/approve',
  updateLimiter,
  [auth, auth.managerOnly],
  [param('id').isMongoId()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: 'Cannot approve own account' });
      }

      user.status = 'approved';
      user.isActive = true;
      user.updatedAt = new Date();
      await user.save();

      cache.del(`user_${req.params.id}`);
      delKeysByPrefix('users_');

      return res.json({
        message: 'User approved successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      });
    } catch (err) {
      console.error('Approve user error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PUT /api/users/:id/decline
// @desc    Decline a pending user (sets status=declined, isActive=false)
// @access  Private (Manager+)
router.put('/:id/decline',
  updateLimiter,
  [auth, auth.managerOnly],
  [param('id').isMongoId()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: 'Cannot decline own account' });
      }

      user.status = 'declined';
      user.isActive = false;
      user.updatedAt = new Date();
      await user.save();

      cache.del(`user_${req.params.id}`);
      delKeysByPrefix('users_');

      return res.json({
        message: 'User declined successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      });
    } catch (err) {
      console.error('Decline user error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (manager only)
// @access  Private (Manager)
router.delete('/:id',
  updateLimiter,
  [auth, auth.managerOnly],
  [param('id').isMongoId()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete own account' });
      }

      await User.findByIdAndDelete(req.params.id);

      // Clear cache
      cache.del(`user_${req.params.id}`);
      delKeysByPrefix('users_');

      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      console.error('Delete user error:', err);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Invalid user ID' });
      }
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users/role/:role
// @desc    Get users by role with caching
// @access  Private (Manager+)
router.get('/role/:role',
  readLimiter,
  auth,
  auth.managerOnly,
  [param('role').isIn(['user', 'manager', 'admin'])],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const role = req.params.role;
      const cacheKey = `users_role_${role}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const users = await User.find({ role, isActive: true })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

      const response = { users };
      cache.set(cacheKey, response);
      res.json(response);
    } catch (err) {
      console.error('Get users by role error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// @route   GET /api/users/stats-overview
// @desc    Get user statistics overview with detailed metrics
// @access  Private (Manager+)
router.get('/stats-overview',
    readLimiter,
    auth,
    auth.managerOnly,
    async (req, res) => {
      try {
        const cacheKey = 'user_stats_overview';
        const cachedStats = cache.get(cacheKey);
        if (cachedStats) {
          return res.json(cachedStats);
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
          totalUsers,
          managers,
          regularUsers,
          admins,
          recentUsers,
          monthlyUsers,
          inactiveUsers
        ] = await Promise.all([
          User.countDocuments({ isActive: true }),
          User.countDocuments({ role: 'manager', isActive: true }),
          User.countDocuments({ role: 'user', isActive: true }),
          User.countDocuments({ role: 'admin', isActive: true }),
          User.countDocuments({
            isActive: true,
            createdAt: { $gte: sevenDaysAgo }
          }),
          User.countDocuments({
            isActive: true,
            createdAt: { $gte: thirtyDaysAgo }
          }),
          User.countDocuments({ isActive: false })
        ]);

        const stats = {
          total: totalUsers,
          managers,
          users: regularUsers,
          admins,
          recentUsers,
          monthlyUsers,
          inactiveUsers,
          lastUpdated: new Date().toISOString(),
          roleDistribution: {
            users: regularUsers,
            managers,
            admins
          },
          growthMetrics: {
            weekly: recentUsers,
            monthly: monthlyUsers
          }
        };

        cache.set(cacheKey, stats);
        res.json(stats);
      } catch (err) {
        console.error('Stats overview error:', err);
        res.status(500).json({
          message: 'Server error',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    });

// @route   POST /api/users/bulk-update
// @desc    Bulk update user roles or status
// @access  Private (Admin)
router.post('/bulk-update',
  updateLimiter,
  auth.adminOnly,
  [
    body('userIds').isArray().notEmpty(),
    body('updates.role').optional().isIn(['user', 'manager', 'admin']),
    body('updates.isActive').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userIds, updates } = req.body;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      const updateData = { ...updates, updatedAt: new Date() };
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: updateData }
      );

      // Clear cache
      userIds.forEach(id => cache.del(`user_${id}`));
      delKeysByPrefix('users_');
      cache.del('user_stats_overview');

      res.json({
        message: `Updated ${result.nModified} users successfully`,
        modifiedCount: result.nModified
      });
    } catch (err) {
      console.error('Bulk update error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   POST /api/users/share-report
// @desc    Share report with selected user
// @access  Private
router.post('/share-report',
  updateLimiter,
  auth,
  [
    body('recipientId', 'Recipient ID is required').isMongoId(),
    body('reportData', 'Report data is required').notEmpty(),
    body('reportType').optional().trim().escape()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipientId, reportData, reportType } = req.body;
      
      // Simple sharing without database models for now
      // const SharedReport = require('../models/SharedReport');
      // const Notification = require('../models/Notification');

      // Verify recipient exists
      const recipient = await User.findById(recipientId).select('-password');
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }

      if (!recipient.isActive) {
        return res.status(400).json({ message: 'Cannot share with inactive user' });
      }

      // Get sender info
      const sender = await User.findById(req.user.id).select('name');

      // For now, just simulate sharing without database
      const sharedReport = {
        id: `shared-${Date.now()}`,
        sharedBy: req.user.id,
        sharedWith: recipientId,
        reportType: reportType || 'management_report',
        reportData,
        sharedAt: new Date()
      };

      res.json({
        message: `Report shared successfully with ${recipient.name}`,
        sharedReport: {
          id: sharedReport.id,
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          sharedAt: sharedReport.sharedAt
        }
      });
    } catch (err) {
      console.error('Share report error:', err);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Invalid recipient ID' });
      }
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users/shared-reports
// @desc    Get reports shared with current user
// @access  Private
router.get('/shared-reports',
  readLimiter,
  auth,
  async (req, res) => {
    try {
      const SharedReport = require('../models/SharedReport');
      
      const sharedReports = await SharedReport.find({ sharedWith: req.user.id })
        .populate('sharedBy', 'name email')
        .sort({ sharedAt: -1 })
        .lean();

      res.json({ sharedReports });
    } catch (err) {
      console.error('Get shared reports error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users/team-members
// @desc    Get all team members for sharing
// @access  Private
router.get('/team-members',
  readLimiter,
  auth,
  async (req, res) => {
    try {
      const cacheKey = `team_members_${req.user.id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Get all active users except the current user
      const teamMembers = await User.find({
        _id: { $ne: req.user.id },
        isActive: true
      })
        .select('name email role')
        .sort({ name: 1 })
        .lean();

      const response = { teamMembers };
      cache.set(cacheKey, response);
      res.json(response);
    } catch (err) {
      console.error('Get team members error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

module.exports = router;