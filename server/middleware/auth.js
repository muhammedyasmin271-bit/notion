const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Load user from DB to enforce current status
    const dbUser = await User.findById(decoded.user && decoded.user.id).select('role isActive');
    if (!dbUser) {
      return res.status(401).json({ message: 'User not found or no longer exists' });
    }

    // Block deactivated accounts
    if (!dbUser.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Attach minimal user context
    req.user = { id: String(dbUser._id), role: dbUser.role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Optional auth middleware for routes that can work with or without authentication
module.exports.optional = async function (req, res, next) {
  const token = req.header('x-auth-token');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const dbUser = await User.findById(decoded.user && decoded.user.id).select('role isActive');
      if (dbUser && dbUser.isActive) {
        req.user = { id: String(dbUser._id), role: dbUser.role };
      } else {
        req.user = null;
      }
    } catch (err) {
      // Token is invalid, but continue without user
      req.user = null;
    }
  }

  next();
};

// Role-based authorization middleware
module.exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// Manager-only middleware
module.exports.managerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Allow both manager and admin roles
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      message: 'Access denied. Manager role required.'
    });
  }

  next();
};

// Admin-only middleware
module.exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Admin role required.'
    });
  }

  next();
};