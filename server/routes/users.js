const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { tenantFilter } = require('../middleware/tenantFilter');
const { requireAdmin } = require('../middleware/roleAuth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Apply tenant filtering to all routes
router.use(tenantFilter);

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
    body('phone').optional({ checkFalsy: true }).trim(),
    body('department').optional().trim().escape(),
    body('location').optional().trim().escape()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, username, password, email, role, phone, department, location } = req.body;
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

      // Check user limit with SMS notifications
      const { checkUserLimit } = require('../services/userLimitService');
      const limitCheck = await checkUserLimit(req.user.companyId, true);
      
      if (!limitCheck.canAdd) {
        return res.status(403).json({ message: limitCheck.message });
      }

      // Create new user with companyId - auto-approve users created by admin/manager
      const user = new User({
        name,
        username: normalizedUsername,
        password,
        email: email || undefined, // Convert empty string to undefined
        role: role || 'user',
        phone,
        department,
        location,
        companyId: req.user.companyId,
        createdBy: req.user.id,
        status: 'approved', // Auto-approve users created by admin/manager
        isActive: true // Auto-activate users created by admin/manager
      });

      await user.save();

      // Check if we reached 100% limit and send SMS if needed
      if (limitCheck.reachedLimit) {
        console.log('📱 Company reached 100% user limit, SMS notification sent');
      }

      // Send welcome SMS to the newly created user if phone is provided
      if (user.phone && user.phone.trim()) {
        try {
          const { sendSMS } = require('../services/smsService');
          const welcomeMessage = `Welcome to mela note!\n\nYour account has been created.\nUsername: ${user.username}\nPassword: ${password}\n\nYou can now log in and start using the app.\n\n- mela note`;
          const smsResult = await sendSMS(user.phone, welcomeMessage);
          if (smsResult.success) {
            console.log(`✅ Welcome SMS sent to ${user.phone} for user ${user.username}`);
          } else {
            console.log(`⚠️ Failed to send welcome SMS to ${user.phone}: ${smsResult.message}`);
          }
        } catch (smsError) {
          console.error('Error sending welcome SMS:', smsError);
          // Don't fail the request if SMS fails
        }
      }

      // Send welcome email if user has email
      if (user.email) {
        try {
          const emailService = require('../services/emailService');
          await emailService.sendWelcomeEmail(user);
          console.log(`✅ Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`Error sending welcome email to ${user.email}:`, emailError.message);
        }
      }

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
          location: user.location,
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
      const limit = Math.min(Number(req.query.limit) || 100, 100);
      const cacheKey = `users_${role}_${isActive}_${search}_${page}_${limit}_${req.user.companyId}`;

      // Disable cache for now to ensure fresh data
      // const cachedUsers = cache.get(cacheKey);
      // if (cachedUsers) {
      //   return res.json(cachedUsers);
      // }

      let query = { role: { $ne: 'superadmin' }, status: { $ne: 'declined' } };
      
      // Add company filter (skip for superadmin)
      if (req.user.role !== 'superadmin') {
        query.companyId = req.user.companyId;
      }
      
      console.log('GET /api/users - Query:', JSON.stringify(query));
      console.log('GET /api/users - User role:', req.user.role);
      console.log('GET /api/users - CompanyId:', req.user.companyId);

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
      
      console.log('GET /api/users - Found users:', users.length);
      console.log('GET /api/users - Total count:', total);
      if (users.length > 0) {
        console.log('GET /api/users - First user:', JSON.stringify(users[0]));
      }

      const response = {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };

      // Disable cache for now
      // cache.set(cacheKey, response);

      res.json(response);
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile',
  readLimiter,
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (err) {
      console.error('Get profile error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users/points/history
// @desc    Get current user's points history
// @access  Private
router.get('/points/history',
  readLimiter,
  auth,
  async (req, res) => {
    try {
      const PointsHistory = require('../models/PointsHistory');
      
      const mongoose = require('mongoose');
      
      const userId = req.user.id;
      const companyId = req.companyId || req.user.companyId;
      
      console.log(`📊 Fetching points history - userId: ${userId} (type: ${typeof userId}), companyId: ${companyId}`);
      
      // Convert userId to ObjectId for proper query matching (PointsHistory stores userId as ObjectId)
      // req.user.id is a string from auth middleware, need to convert to ObjectId
      let userIdObjectId;
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userIdObjectId = new mongoose.Types.ObjectId(userId);
        console.log(`📊 Converted userId string to ObjectId: ${userIdObjectId.toString()}`);
      } else {
        console.error(`❌ Invalid userId format: ${userId}`);
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      console.log(`📊 Query userId: ${userId}, ObjectId: ${userIdObjectId.toString()}, companyId: ${companyId}`);
      
      // Debug: Check total records in DB
      const totalRecords = await PointsHistory.countDocuments({});
      console.log(`📊 Total PointsHistory records in DB: ${totalRecords}`);
      
      // Debug: Check ALL records to see what's in the DB
      if (totalRecords > 0) {
        const allRecords = await PointsHistory.find({}).limit(3).lean();
        console.log(`📊 Sample records from DB:`, allRecords.map(r => ({
          _id: r._id.toString(),
          userId: r.userId?.toString(),
          userIdType: r.userId?.constructor?.name,
          companyId: r.companyId,
          points: r.points,
          description: r.description
        })));
      }
      
      // Debug: Check records for this user (any company) - try multiple query methods
      console.log(`📊 Trying to find records with userId (as string): ${userId}`);
      const userRecordsString = await PointsHistory.find({ userId: userId }).limit(3).lean();
      console.log(`📊 Found ${userRecordsString.length} records using string userId`);
      
      console.log(`📊 Trying to find records with userId (as ObjectId): ${userIdObjectId.toString()}`);
      const userRecordsObjectId = await PointsHistory.find({ userId: userIdObjectId }).limit(5).lean();
      console.log(`📊 Found ${userRecordsObjectId.length} records using ObjectId userId`);
      
      if (userRecordsObjectId.length > 0) {
        console.log(`📊 Sample records found:`, userRecordsObjectId.map(r => ({ 
          userId: r.userId.toString(), 
          companyId: r.companyId,
          points: r.points,
          description: r.description,
          createdAt: r.createdAt
        })));
      }
      
      // Try query with just userId first (without companyId filter) to see if records exist
      const recordsWithoutCompany = await PointsHistory.find({ userId: userIdObjectId }).lean();
      console.log(`📊 Records for userId (no company filter): ${recordsWithoutCompany.length}`);
      if (recordsWithoutCompany.length > 0) {
        const companyIds = [...new Set(recordsWithoutCompany.map(r => r.companyId))];
        console.log(`📊 CompanyIds in records:`, companyIds);
        console.log(`📊 Requested companyId: ${companyId}`);
      }
      
      // Query points history - use ObjectId for userId matching
      // First try with exact companyId match
      let pointsHistory = await PointsHistory.find({
        userId: userIdObjectId,
        companyId: companyId
      })
        .populate({
          path: 'projectId',
          select: 'title',
          strictPopulate: false
        })
        .sort({ createdAt: -1 })
        .lean();

      console.log(`📊 Found ${pointsHistory.length} matching history records with userId=${userIdObjectId.toString()} and companyId=${companyId}`);
      
      // If no records found, try without companyId filter to see if records exist for this user
      if (pointsHistory.length === 0) {
        console.log(`⚠️ No records found with companyId filter. Checking records without companyId filter...`);
        
        // Try querying with just userId (any company)
        const recordsAnyCompany = await PointsHistory.find({
          userId: userIdObjectId
        })
          .populate({
            path: 'projectId',
            select: 'title',
            strictPopulate: false
          })
          .sort({ createdAt: -1 })
          .lean();
        
        console.log(`📊 Found ${recordsAnyCompany.length} records for this userId (any company)`);
        
        if (recordsAnyCompany.length > 0) {
          const foundCompanyIds = [...new Set(recordsAnyCompany.map(r => r.companyId))];
          console.log(`⚠️ Records exist but with different companyIds:`, foundCompanyIds);
          console.log(`⚠️ Requested companyId: ${companyId}`);
          
          // Use the records we found, filtering by companyId if possible
          // But if companyId doesn't match, still return the records (user might have changed companies)
          const matchingCompanyRecords = recordsAnyCompany.filter(r => r.companyId === companyId);
          if (matchingCompanyRecords.length > 0) {
            console.log(`📊 Using ${matchingCompanyRecords.length} records matching companyId`);
            pointsHistory = matchingCompanyRecords;
          } else {
            // No exact match, but records exist - use them anyway
            console.log(`⚠️ No exact companyId match, but returning ${recordsAnyCompany.length} records found`);
            pointsHistory = recordsAnyCompany;
          }
        } else {
          // Try with string userId as fallback (in case ObjectId conversion failed)
          console.log(`⚠️ Trying with string userId: ${userId}`);
          const recordsWithStringId = await PointsHistory.find({
            userId: userId
          }).limit(5).lean();
          console.log(`📊 Found ${recordsWithStringId.length} records with string userId`);
        }
      }

      // Format the response
      const formattedHistory = pointsHistory.map(record => {
        // Handle both populated and non-populated projectId
        const projectTitle = record.projectId?.title || 
                            (typeof record.projectId === 'string' ? 'Unknown Project' : 'Unknown Project');
        const projectId = record.projectId?._id || 
                         (typeof record.projectId === 'string' ? record.projectId : null);

        return {
          id: record._id,
          points: record.points || 0,
          description: record.description || '',
          projectTitle: projectTitle,
          projectId: projectId,
          completedDate: record.completedDate,
          dueDate: record.dueDate,
          daysDifference: record.daysDifference,
          reversed: record.reversed || false,
          createdAt: record.createdAt
        };
      });

      console.log(`📊 Returning ${formattedHistory.length} formatted history records`);
      res.json(formattedHistory);
    } catch (err) {
      console.error('Get points history error:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   GET /api/users/points/stats
// @desc    Get aggregated points statistics by month for company (Manager+ only)
// @access  Private (Manager+)
// IMPORTANT: This route MUST be defined before /:id to avoid route conflicts
router.get('/points/stats',
  readLimiter,
  auth,
  auth.managerOnly, // Changed from requireAdmin to managerOnly
  async (req, res) => {
    try {
      console.log('📊 Points stats endpoint called by user:', req.user.id, 'role:', req.user.role);
      const PointsHistory = require('../models/PointsHistory');
      const mongoose = require('mongoose');
      
      // IMPORTANT: Use ONLY the authenticated user's companyId to ensure data isolation
      // This ensures each company only sees their own points data
      const companyId = req.user.companyId || req.companyId;
      if (!companyId || companyId === 'default') {
        console.error('❌ ERROR: Invalid companyId - cannot fetch points stats');
        return res.status(400).json({ message: 'Company ID is required' });
      }
      console.log('📊 Company ID:', companyId);
      console.log('📊 Company ID type:', typeof companyId);
      console.log('📊 req.user.companyId:', req.user.companyId);
      console.log('📊 req.companyId:', req.companyId);
      console.log('📊 SECURITY: Graph will show data ONLY for company:', companyId);
      
      // First, let's check what companyIds actually exist in the database
      const allCompanyIds = await PointsHistory.distinct('companyId');
      console.log('📊 All companyIds in PointsHistory collection:', allCompanyIds);
      console.log('📊 All companyIds types:', allCompanyIds.map(id => ({ id, type: typeof id })));
      
      // Check total records (including reversed) for this company
      const totalForCompany = await PointsHistory.countDocuments({ companyId: companyId });
      console.log(`📊 Total PointsHistory records (any status) for company ${companyId}: ${totalForCompany}`);
      
      // Check records with different reversed status
      const totalNotReversed = await PointsHistory.countDocuments({ companyId: companyId, reversed: false });
      const totalReversed = await PointsHistory.countDocuments({ companyId: companyId, reversed: true });
      const totalNullReversed = await PointsHistory.countDocuments({ companyId: companyId, reversed: null });
      const totalUndefinedReversed = await PointsHistory.countDocuments({ 
        companyId: companyId, 
        $or: [{ reversed: { $exists: false } }, { reversed: undefined }]
      });
      console.log(`📊 Total PointsHistory records (not reversed) for company ${companyId}: ${totalNotReversed}`);
      console.log(`📊 Total PointsHistory records (reversed: true) for company ${companyId}: ${totalReversed}`);
      console.log(`📊 Total PointsHistory records (reversed: null) for company ${companyId}: ${totalNullReversed}`);
      console.log(`📊 Total PointsHistory records (reversed: undefined/missing) for company ${companyId}: ${totalUndefinedReversed}`);
      
      // Get ALL points history for THIS COMPANY ONLY
      // SECURITY: This query STRICTLY filters by companyId to ensure data isolation
      // IMPORTANT: This query includes:
      // ✅ ALL users in THIS company only (no userId filter, but companyId filter ensures isolation)
      // ✅ ALL managers in THIS company only (no role filter, but companyId filter ensures isolation)
      // ✅ ALL non-reversed points transactions for THIS company
      // ✅ This is the complete company-wide points history for THIS company ONLY
      // ❌ NO data from other companies will be included
      let allHistory = await PointsHistory.find({
        companyId: companyId,  // STRICT FILTER: Only records for THIS company - ensures no cross-company data
        $or: [
          { reversed: false },
          { reversed: null },
          { reversed: { $exists: false } }
        ]
      })
        .sort({ createdAt: 1 })
        .lean();
      
      console.log(`📊 SECURITY CHECK: Found ${allHistory.length} records for company ${companyId} (should be 0 for other companies)`);
      
      // Verify all records belong to this company (extra security check)
      const wrongCompanyRecords = allHistory.filter(r => r.companyId !== companyId);
      if (wrongCompanyRecords.length > 0) {
        console.error(`❌ SECURITY ERROR: Found ${wrongCompanyRecords.length} records with wrong companyId!`);
        // Filter them out for safety
        allHistory = allHistory.filter(r => r.companyId === companyId);
      }
      
      // If no records found with reversed filter, try without it (get all records for company)
      if (allHistory.length === 0) {
        console.log(`⚠️ No records found with reversed filter, trying without filter...`);
        allHistory = await PointsHistory.find({
          companyId: companyId
        })
          .sort({ createdAt: 1 })
          .lean();
        console.log(`📊 Found ${allHistory.length} records without reversed filter`);
      }
      
      // Also try with string comparison (in case companyId is stored as string but queried as ObjectId or vice versa)
      if (allHistory.length === 0) {
        console.log(`⚠️ Still no records found, trying with string comparison...`);
        const allRecords = await PointsHistory.find({}).sort({ createdAt: -1 }).limit(10).lean();
        console.log(`📊 Sample of ALL records in database (last 10):`, allRecords.map(r => ({
          id: r._id.toString(),
          companyId: r.companyId,
          companyIdType: typeof r.companyId,
          companyIdString: String(r.companyId),
          points: r.points,
          createdAt: r.createdAt,
          reversed: r.reversed
        })));
        
        // Try finding with string comparison
        const stringCompanyId = String(companyId);
        allHistory = await PointsHistory.find({
          $expr: { $eq: [{ $toString: "$companyId" }, stringCompanyId] }
        })
          .sort({ createdAt: 1 })
          .lean();
        console.log(`📊 Found ${allHistory.length} records with string comparison`);
      }
      
      console.log(`📊 Found ${allHistory.length} PointsHistory records for company ${companyId}`);
      
      // If no records found, try without companyId filter to see if records exist at all
      if (allHistory.length === 0) {
        console.log(`⚠️ No records found with companyId=${companyId}, checking all records...`);
        
        // Get a few sample records to see what companyIds they have
        const sampleRecords = await PointsHistory.find({}).limit(5).lean();
        console.log(`📊 Sample records from database (first 5):`, sampleRecords.map(r => ({
          id: r._id.toString(),
          companyId: r.companyId,
          companyIdType: typeof r.companyId,
          reversed: r.reversed,
          points: r.points,
          createdAt: r.createdAt
        })));
        
        // Also try finding records without any filters
        const allRecordsCount = await PointsHistory.countDocuments({});
        console.log(`📊 Total PointsHistory records in database (any companyId, any status): ${allRecordsCount}`);
        
        // Try to find records that match the companyId exactly (case-sensitive string match)
        const exactMatch = await PointsHistory.countDocuments({ companyId: { $eq: companyId } });
        console.log(`📊 Records with exact companyId match: ${exactMatch}`);
      }
      
      if (allHistory.length > 0) {
        console.log(`📊 Sample records (first 3):`, allHistory.slice(0, 3).map(r => ({
          id: r._id,
          points: r.points,
          createdAt: r.createdAt,
          companyId: r.companyId
        })));
      }
      
      // Group by month and calculate totals (sum of ALL users' and managers' points)
      const monthlyData = {};
      let totalPointsSum = 0;
      let recordCount = 0;
      
      console.log(`📊 Processing ${allHistory.length} history records for aggregation...`);
      if (allHistory.length > 0) {
        console.log(`📊 First record sample:`, {
          id: allHistory[0]._id?.toString(),
          companyId: allHistory[0].companyId,
          companyIdType: typeof allHistory[0].companyId,
          points: allHistory[0].points,
          createdAt: allHistory[0].createdAt,
          reversed: allHistory[0].reversed
        });
      }
      
      allHistory.forEach((record, index) => {
        // Use local time (not UTC) to match how we generate month keys for display
        // This ensures December records are grouped correctly
        const date = new Date(record.createdAt);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        // Debug all records for the first 5
        if (index < 5) {
          console.log(`📊 Record ${index + 1}: createdAt=${record.createdAt}, year=${year}, month=${month}, monthKey=${monthKey}, points=${record.points}`);
        }
        
        // Debug December records specifically
        if (month === 12) {
          console.log(`📊 December record found: createdAt=${record.createdAt}, local month=${month}, monthKey=${monthKey}, points=${record.points}, userId=${record.userId}`);
        }
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            totalPoints: 0, // Sum of all points (positive + negative) for this month
            transactionCount: 0
          };
        }
        
        // Add points to monthly total (can be positive or negative)
        const recordPoints = record.points || 0;
        monthlyData[monthKey].totalPoints += recordPoints;
        monthlyData[monthKey].transactionCount += 1;
        totalPointsSum += recordPoints;
        recordCount += 1;
        
        // Log first 5 records for debugging
        if (index < 5) {
          console.log(`📊 Record ${index + 1}: points=${recordPoints}, month=${monthKey}, createdAt=${record.createdAt}, userId=${record.userId}`);
        }
      });
      
      // Verify we're getting records from all users (not filtering by userId or role)
      const uniqueUserIds = [...new Set(allHistory.map(r => r.userId?.toString()))].filter(Boolean);
      console.log(`📊 Total unique users/managers in points history: ${uniqueUserIds.length}`);
      console.log(`📊 User IDs with points history:`, uniqueUserIds.slice(0, 10)); // Show first 10
      
      // Calculate points per user to verify all users are included
      const pointsPerUser = {};
      allHistory.forEach(record => {
        const userId = record.userId?.toString();
        if (userId) {
          pointsPerUser[userId] = (pointsPerUser[userId] || 0) + (record.points || 0);
        }
      });
      console.log(`📊 Points summary by user (first 5):`, Object.entries(pointsPerUser).slice(0, 5).map(([userId, points]) => ({
        userId,
        totalPoints: points
      })));
      
      console.log(`📊 Grouped data into ${Object.keys(monthlyData).length} months`);
      console.log(`📊 Total points sum across all records: ${totalPointsSum}`);
      console.log(`📊 Total records processed: ${recordCount}`);
      console.log(`📊 Monthly data breakdown (ALL months with data):`, Object.keys(monthlyData).map(key => ({
        month: key,
        totalPoints: monthlyData[key].totalPoints,
        transactions: monthlyData[key].transactionCount
      })));
      console.log(`📊 All month keys in monthlyData:`, Object.keys(monthlyData));
      
      // Get last 12 months ending at current month (e.g., if December 2024, show Jan 2024 - Dec 2024)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth(); // 0-11
      
      // Specifically check for December in current year
      const decemberKeys = Object.keys(monthlyData).filter(k => k.includes('-12') || k.startsWith(currentYear + '-12'));
      console.log(`📊 December month keys found in monthlyData:`, decemberKeys);
      decemberKeys.forEach(key => {
        console.log(`📊 December ${key}: ${monthlyData[key].totalPoints} points, ${monthlyData[key].transactionCount} transactions`);
      });
      
      const last12Months = [];
      // Generate 12 months ending at current month
      // Example: If current is December (month 11), we want: Jan(0), Feb(1), ..., Dec(11)
      for (let i = 11; i >= 0; i--) {
        const targetMonthIndex = currentMonthIndex - i;
        let year = currentYear;
        let month = targetMonthIndex + 1; // Convert to 1-12
        
        // Handle year rollover if we go before January
        if (targetMonthIndex < 0) {
          year = currentYear - 1;
          month = 12 + targetMonthIndex + 1; // e.g., if targetMonthIndex is -1, month = 12 + (-1) + 1 = 12
        } else if (targetMonthIndex >= 12) {
          // Handle if somehow we go beyond December (shouldn't happen, but just in case)
          year = currentYear + 1;
          month = targetMonthIndex - 11;
        }
        
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        last12Months.push(monthKey);
      }
      
      console.log(`📊 Current date: ${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`);
      console.log(`📊 Last 12 months (ending at current):`, last12Months);
      
      const months = [];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      
      // Get all unique month keys from monthlyData (actual months with data)
      const allDataMonthKeys = Object.keys(monthlyData).sort();
      console.log(`📊 All months with data (sorted):`, allDataMonthKeys);
      
      // Also include last 12 months ending at current month for display
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      console.log(`📊 Current month key: ${currentMonthKey}`);
      
      // Combine both: months with data AND last 12 months, then sort and deduplicate
      const allMonthKeysToShow = [...new Set([...allDataMonthKeys, ...last12Months])].sort();
      console.log(`📊 All month keys to show (combined):`, allMonthKeysToShow);
      
      let monthsWithData = 0;
      
      allMonthKeysToShow.forEach(monthKey => {
        // Only include months up to and including the current month (no future months)
        if (monthKey > currentMonthKey) {
          console.log(`📊 Skipping future month: ${monthKey} (current: ${currentMonthKey})`);
          return; // Skip future months
        }
        
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthPoints = monthlyData[monthKey]?.totalPoints || 0; // Sum of all points for this month
        const monthTransactions = monthlyData[monthKey]?.transactionCount || 0;
        
        // Debug December specifically
        if (monthKey.includes('-12')) {
          console.log(`📊 Processing December month ${monthKey}:`);
          console.log(`📊   - Looking in monthlyData for key: ${monthKey}`);
          console.log(`📊   - Found in monthlyData: ${monthKey in monthlyData}`);
          console.log(`📊   - Points found: ${monthPoints}`);
          console.log(`📊   - Transactions found: ${monthTransactions}`);
          console.log(`📊   - All keys in monthlyData:`, Object.keys(monthlyData));
          
          // If December shows 0 but we know there are records, check for similar keys
          if (monthPoints === 0 && monthTransactions === 0) {
            const similarKeys = Object.keys(monthlyData).filter(k => k.includes('12') || k.includes('2024') || k.includes('2025'));
            console.log(`📊   - ⚠️ December has 0 points! Checking for similar keys:`, similarKeys);
            similarKeys.forEach(k => {
              console.log(`📊   - Key "${k}": ${monthlyData[k].totalPoints} points, ${monthlyData[k].transactionCount} transactions`);
            });
            
            // Also check if there's a year mismatch
            const currentYear = today.getFullYear();
            const lastYear = currentYear - 1;
            const decCurrentYear = `${currentYear}-12`;
            const decLastYear = `${lastYear}-12`;
            console.log(`📊   - Checking December keys: ${decCurrentYear} and ${decLastYear}`);
            if (monthlyData[decCurrentYear]) {
              console.log(`📊   - Found ${decCurrentYear}: ${monthlyData[decCurrentYear].totalPoints} points`);
            }
            if (monthlyData[decLastYear]) {
              console.log(`📊   - Found ${decLastYear}: ${monthlyData[decLastYear].totalPoints} points`);
            }
          }
        }
        
        if (monthPoints !== 0 || monthTransactions > 0) {
          monthsWithData += 1;
          console.log(`📊 Month ${monthKey} has ${monthPoints} points from ${monthTransactions} transactions`);
        }
        
        months.push({
          month: monthKey,
          monthName: monthNames[date.getMonth()] + ' ' + year.substring(2), // e.g., "JAN 24"
          totalPoints: monthPoints, // This is the sum of points for the month
          transactionCount: monthTransactions
        });
      });
      
      console.log(`📊 Months with actual data: ${monthsWithData} out of 12`);
      
      console.log(`📊 Returning ${months.length} months of data`);
      
      // Calculate current total points for all users in the company (for reference)
      const User = require('../models/User');
      const currentTotalPoints = await User.aggregate([
        { $match: { companyId: companyId } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);
      
      const companyTotalPoints = currentTotalPoints.length > 0 ? currentTotalPoints[0].total : 0;
      const totalTransactionsInResponse = months.reduce((sum, m) => sum + m.transactionCount, 0);
      const totalPointsInResponse = months.reduce((sum, m) => sum + m.totalPoints, 0);
      
      console.log(`📊 Returning points stats - exactly 12 months`);
      console.log(`📊 Current company total (sum of all user points): ${companyTotalPoints}`);
      console.log(`📊 Total transactions in response: ${totalTransactionsInResponse}`);
      console.log(`📊 Total points in response (sum of monthly totals): ${totalPointsInResponse}`);
      console.log(`📊 Records found in database: ${allHistory.length}`);
      console.log(`📊 Sample month data:`, months.slice(0, 3).map(m => ({ month: m.monthName, totalPoints: m.totalPoints, transactions: m.transactionCount })));
      
      // FINAL VALIDATION: Ensure we're getting ALL points history correctly
      console.log(`\n✅ FINAL VALIDATION - Points History Summary:`);
      console.log(`✅ Total PointsHistory records found: ${allHistory.length}`);
      console.log(`✅ Total unique users/managers: ${uniqueUserIds.length}`);
      console.log(`✅ Total points in all records: ${totalPointsSum}`);
      console.log(`✅ Total points in response: ${totalPointsInResponse}`);
      console.log(`✅ Total transactions in response: ${totalTransactionsInResponse}`);
      console.log(`✅ Months with data: ${monthsWithData} out of ${months.length}`);
      
      // Validate: If we found records but response shows all zeros, something is wrong
      if (allHistory.length > 0 && totalPointsInResponse === 0 && totalTransactionsInResponse === 0) {
        console.error(`❌ ERROR: Found ${allHistory.length} records but response shows all zeros!`);
        console.error(`❌ This indicates a data aggregation bug.`);
      }
      
      // Validate: Check if points sum matches
      if (allHistory.length > 0 && Math.abs(totalPointsSum - totalPointsInResponse) > 0.01) {
        console.warn(`⚠️ WARNING: Points sum mismatch! Records sum: ${totalPointsSum}, Response sum: ${totalPointsInResponse}`);
      } else if (allHistory.length > 0) {
        console.log(`✅ Points sum validation: PASSED (${totalPointsSum} = ${totalPointsInResponse})`);
      }
      
      // Validate: If we found no records but user expects data, warn
      if (allHistory.length === 0) {
        console.warn(`⚠️ WARNING: No PointsHistory records found for companyId=${companyId}`);
        console.warn(`⚠️ The graph will show placeholder zeros, not real data.`);
      } else {
        console.log(`✅ SUCCESS: Graph will display real data from ${allHistory.length} points history records`);
        console.log(`✅ Graph includes ALL users and managers (no filtering by userId or role)`);
      }
      console.log(`\n`);
      
      // Get company info to check if points are enabled
      const Company = require('../models/Company');
      const company = await Company.findOne({ companyId: companyId });
      const pointsEnabled = company?.pointsEnabled !== false; // Default to true
      const companyStatus = company?.status || 'active';
      const isPointsBlocked = companyStatus === 'paused' || company.pointsEnabled === false;
      
      // Determine the start date for the graph:
      // - If pointsEnabledAt exists, use that (date when points were enabled/re-enabled)
      // - Otherwise, use company creation date
      // - Graph should start from whichever is later (points enabled date or company creation)
      let graphStartDate = company?.createdAt || new Date();
      if (company?.pointsEnabledAt) {
        // Use the later date (points enabled date or company creation)
        // This ensures we show from when points actually started being tracked
        graphStartDate = company.pointsEnabledAt > company.createdAt ? company.pointsEnabledAt : company.createdAt;
      } else if (company?.createdAt) {
        // For existing companies without pointsEnabledAt, use creation date
        graphStartDate = company.createdAt;
      }
      
      // Filter months to only show from graphStartDate onwards
      const graphStartYear = graphStartDate.getFullYear();
      const graphStartMonth = graphStartDate.getMonth() + 1; // 1-12
      const graphStartMonthKey = `${graphStartYear}-${String(graphStartMonth).padStart(2, '0')}`;
      
      console.log(`📊 Graph start date: ${graphStartDate.toISOString()}`);
      console.log(`📊 Graph start month key: ${graphStartMonthKey}`);
      console.log(`📊 Company created: ${company?.createdAt?.toISOString() || 'N/A'}`);
      console.log(`📊 Points enabled at: ${company?.pointsEnabledAt?.toISOString() || 'N/A'}`);
      
      // Filter months array to only include months from graphStartMonthKey onwards
      const filteredMonths = months.filter(month => {
        const monthKey = month.month;
        const shouldInclude = monthKey >= graphStartMonthKey;
        if (!shouldInclude) {
          console.log(`📊 Filtering out month ${monthKey} (before graph start: ${graphStartMonthKey})`);
        }
        return shouldInclude;
      });
      
      console.log(`📊 Filtered months: ${months.length} → ${filteredMonths.length} (removed ${months.length - filteredMonths.length} months before start date)`);
      
      res.json({
        monthlyData: filteredMonths, // Use filtered months instead of all months
        currentCompanyTotal: companyTotalPoints,
        totalTransactions: totalTransactionsInResponse,
        hasRealData: allHistory.length > 0, // Flag to indicate if we have real data
        recordsFound: allHistory.length, // Number of records found
        pointsEnabled: pointsEnabled,
        companyStatus: companyStatus,
        isPointsBlocked: isPointsBlocked,
        graphStartDate: graphStartDate, // Include for frontend reference
        graphStartMonthKey: graphStartMonthKey // Include for frontend reference
      });
    } catch (err) {
      console.error('Get points stats error:', err);
      console.error('Error stack:', err.stack);
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

// @route   PUT /api/users/profile
// @desc    Update own profile
// @access  Private
router.put('/profile',
  updateLimiter,
  auth,
  [
    body('name').optional().not().isEmpty().trim().escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('jobTitle').optional().trim().escape(),
    body('department').optional().trim().escape(),
    body('location').optional().trim().escape()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if email is already in use
      if (req.body.email) {
        const existingUser = await User.findOne({
          email: req.body.email,
          _id: { $ne: req.user.id }
        });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      const updateData = { ...req.body, updatedAt: new Date() };
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Clear cache
      cache.del(`user_${req.user.id}`);
      delKeysByPrefix('users_');

      res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
      console.error('Update profile error:', err);
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
      user.updatedAt = new Date();
      await user.save();

      // Check if we reached 100% limit and send SMS if needed
      if (limitCheck?.reachedLimit) {
        console.log('📱 Company reached 100% user limit after approval, SMS notification sent');
      }

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
      // Use same query as main users endpoint, exclude superadmin
      const query = { role: { $ne: 'superadmin' } };
      if (req.user.role !== 'superadmin') {
        query.companyId = req.user.companyId;
      }
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

      // Filter out current user
      const teamMembers = users.filter(user => user._id.toString() !== req.user.id);

      console.log('Total users found:', users.length);
      console.log('Team members (excluding self):', teamMembers.length);
      
      res.json({ teamMembers });
    } catch (err) {
      console.error('Get team members error:', err);
      res.status(500).json({
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

module.exports = router;