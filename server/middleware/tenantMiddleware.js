const Company = require('../models/Company');

const tenantMiddleware = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.user?.companyId;
    
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID required' });
    }

    const company = await Company.findOne({ companyId });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.status !== 'active') {
      return res.status(403).json({ message: `Service ${company.status}. Contact support.` });
    }

    req.companyId = companyId;
    req.company = company;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Tenant validation failed', error: error.message });
  }
};

module.exports = tenantMiddleware;
