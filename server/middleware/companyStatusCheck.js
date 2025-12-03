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
    
    // Automatically pause company when payment deadline passes
    if (company.paymentMode === 'paid' && 
        company.selectedPlan !== 'free_trial' && 
        !company.hasPaid && 
        company.paymentDeadline &&
        company.status === 'active') {
      
      const paymentDeadline = new Date(company.paymentDeadline);
      
      // If payment deadline has passed, pause the company immediately
      // This applies whether it's the original deadline or a new deadline after unpause
      if (now >= paymentDeadline) {
        company.status = 'paused';
        company.pausedAt = now;
        if (!company.gracePeriodDeadline) {
          company.gracePeriodDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Set grace period
        }
        // Clear unpausedAt since we're pausing again
        company.unpausedAt = undefined;
        await company.save();
        
        console.log(`⏸️ Company auto-paused: ${company.companyId} - Payment deadline passed`);
      }
    }
    
    // Also check if grace period has expired (for companies that were unpaused)
    if (company.paymentMode === 'paid' && 
        company.selectedPlan !== 'free_trial' && 
        !company.hasPaid && 
        company.gracePeriodDeadline &&
        company.status === 'active') {
      
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
    
    // Find all active companies that should be paused (deadline passed or grace period expired)
    const companiesToPause = await Company.find({
      status: 'active',
      paymentMode: 'paid',
      selectedPlan: { $ne: 'free_trial' },
      hasPaid: false,
      $or: [
        // Payment deadline passed (applies to both original and unpaused deadlines)
        { 
          paymentDeadline: { $lt: now }
        },
        // Grace period expired
        { 
          gracePeriodDeadline: { $lte: now }
        }
      ]
    });

    if (companiesToPause.length > 0) {
      console.log(`🔍 Found ${companiesToPause.length} companies to pause`);
      
      for (const company of companiesToPause) {
        const paymentDeadline = company.paymentDeadline ? new Date(company.paymentDeadline) : null;
        const gracePeriodDeadline = company.gracePeriodDeadline ? new Date(company.gracePeriodDeadline) : null;
        
        company.status = 'paused';
        company.pausedAt = now;
        
        // Set grace period if not set and deadline passed
        if (paymentDeadline && now >= paymentDeadline && !company.gracePeriodDeadline) {
          company.gracePeriodDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        
        await company.save();
        
        const reason = (paymentDeadline && now >= paymentDeadline) ? 'Payment deadline passed' : 'Grace period expired';
        console.log(`⏸️ Company paused: ${company.companyId} (${company.name}) - ${reason}`);
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

