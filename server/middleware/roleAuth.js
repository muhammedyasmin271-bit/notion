const auth = require('./auth');

// Middleware to check if user has required role
const requireRole = (roles) => {
  return [
    auth, // First authenticate the user
    (req, res, next) => {
      // roles can be a string or array of strings
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }
      
      next();
    }
  ];
};

// Specific role middlewares
const requireManager = requireRole(['manager']);
const requireAdmin = requireRole(['admin']);

module.exports = {
  requireRole,
  requireManager,
  requireAdmin
};
