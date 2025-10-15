// Middleware to automatically filter queries by companyId
const tenantFilter = (req, res, next) => {
  // Skip for superadmin
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }

  // Get companyId from user
  const companyId = req.user?.companyId || 'default';
  
  // Attach companyId to request for use in routes
  req.companyId = companyId;
  
  next();
};

// Helper function to add companyId filter to query
const addCompanyFilter = (query, companyId) => {
  if (!companyId) return query;
  return { ...query, companyId };
};

module.exports = { tenantFilter, addCompanyFilter };
