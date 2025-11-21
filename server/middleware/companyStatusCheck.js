const Company = require('../models/Company');

/**
 * Middleware to check and automatically pause companies after grace period expires
 * This runs on each request to ensure companies are paused in real-time
 */
const checkCompanyStatus = async (req, res, next) => {
  try {
    // Only check if user is authenticated and has a companyId
    // Skip for super admin routes and public routes
    if (!req.user || !req.user.companyId || req.user.role === 'superadmin') {
      return next();
    }

    const company = await Company.findOne({ companyId: req.user.companyId });
    
    if (!company) {
      return next();
    }

    // Skip if company is already paused
    if (company.status === 'paused') {
      return next();
    }

    const now = new Date();
    
    // Check if grace period has expired for paid plans
    if (company.paymentMode === 'paid' && 
        company.selectedPlan !== 'free_trial' && 
        !company.hasPaid && 
        company.gracePeriodDeadline) {
      
      const gracePeriodDeadline = new Date(company.gracePeriodDeadline);
      
      // If grace period has passed, pause the company
      if (now >= gracePeriodDeadline) {
        company.status = 'paused';
        company.pausedAt = now;
        await company.save();
        
        console.log(`⏸️ Company auto-paused: ${company.companyId} - Grace period expired`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking company status:', error);
    // Don't block the request if there's an error
    next();
  }
};

/**
 * Background job to check and pause companies (can be called periodically)
 */
const checkAndPauseCompanies = async () => {
  try {
    const now = new Date();
    
    // Find all active companies that should be paused
    const companiesToPause = await Company.find({
      status: 'active',
      paymentMode: 'paid',
      selectedPlan: { $ne: 'free_trial' },
      hasPaid: false,
      gracePeriodDeadline: { $lte: now }
    });

    if (companiesToPause.length > 0) {
      console.log(`🔍 Found ${companiesToPause.length} companies to pause`);
      
      for (const company of companiesToPause) {
        company.status = 'paused';
        company.pausedAt = now;
        await company.save();
        
        console.log(`⏸️ Company paused: ${company.companyId} (${company.name}) - Grace period expired`);
      }
    }
  } catch (error) {
    console.error('Error in checkAndPauseCompanies:', error);
  }
};

module.exports = {
  checkCompanyStatus,
  checkAndPauseCompanies
};

