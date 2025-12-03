const { sendSMS } = require('./smsService');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Check user limit and send SMS notifications
 * @param {string} companyId - Company ID
 * @param {boolean} isAddingUser - Whether we're adding a new user
 * @returns {Object} - { canAdd: boolean, message: string, isAtLimit: boolean }
 */
const checkUserLimit = async (companyId, isAddingUser = false) => {
  try {
    const company = await Company.findOne({ companyId });
    if (!company) {
      return { canAdd: false, message: 'Company not found', isAtLimit: false };
    }

    const currentUserCount = await User.countDocuments({ 
      companyId,
      status: { $ne: 'declined' }
    });

    const maxUsers = company.limits?.maxUsers || 50;
    const wouldExceedLimit = currentUserCount + (isAddingUser ? 1 : 0) > maxUsers;
    const isAtLimit = currentUserCount >= maxUsers;
    const willReachLimit = currentUserCount + 1 === maxUsers;

    // If trying to add user but already at limit
    if (isAddingUser && isAtLimit) {
      // Send SMS to admin about limit reached
      await sendLimitReachedSMS(company, currentUserCount, maxUsers);
      return { 
        canAdd: false, 
        message: `Company has reached its maximum user limit (${maxUsers} users). Please contact the super administrator to increase the limit.`,
        isAtLimit: true 
      };
    }

    // If adding user will reach exactly the limit (100%)
    if (isAddingUser && willReachLimit) {
      // Allow the addition but send warning SMS
      await send100PercentLimitSMS(company, maxUsers);
      return { 
        canAdd: true, 
        message: 'User added successfully. Company has reached 100% of user limit.',
        isAtLimit: false,
        reachedLimit: true 
      };
    }

    return { 
      canAdd: true, 
      message: 'User can be added',
      isAtLimit: false 
    };

  } catch (error) {
    console.error('Error checking user limit:', error);
    return { canAdd: false, message: 'Error checking user limit', isAtLimit: false };
  }
};

/**
 * Send SMS when company reaches 100% of user limit
 * Sends SMS to all admin users in the company
 */
const send100PercentLimitSMS = async (company, maxUsers) => {
  try {
    // Find all admin users in the company
    const adminUsers = await User.find({
      companyId: company.companyId,
      role: 'admin',
      isActive: true,
      status: 'approved'
    }).select('name phone');

    if (adminUsers.length === 0) {
      console.log(`⚠️ No active admin users found for company ${company.companyId}`);
      // Fallback to company admin phone if available
      if (company.adminPhone) {
        const message = `${company.name} Alert: You have reached 100% of your user limit (${maxUsers} users). To add more users, you need to talk to the super admin to adjust the limit.`;
        const result = await sendSMS(company.adminPhone, message);
        if (result.success) {
          console.log(`✅ 100% limit SMS sent to company admin phone ${company.adminPhone}`);
        }
      }
      return;
    }

    // Send SMS to each admin user
    const message = `${company.name} Alert: You have reached 100% of your user limit (${maxUsers} users). To add more users, you need to talk to the super admin to adjust the limit.`;
    
    let successCount = 0;
    for (const admin of adminUsers) {
      if (admin.phone) {
        const result = await sendSMS(admin.phone, message);
        if (result.success) {
          console.log(`✅ 100% limit SMS sent to admin ${admin.name} (${admin.phone})`);
          successCount++;
        } else {
          console.log(`⚠️ Failed to send SMS to admin ${admin.name} (${admin.phone}): ${result.message}`);
        }
      } else {
        console.log(`⚠️ Admin ${admin.name} has no phone number, skipping SMS`);
      }
    }

    // Also send to company admin phone if it's different from user phones
    if (company.adminPhone) {
      const phoneExists = adminUsers.some(admin => admin.phone === company.adminPhone);
      if (!phoneExists) {
        const result = await sendSMS(company.adminPhone, message);
        if (result.success) {
          console.log(`✅ 100% limit SMS sent to company admin phone ${company.adminPhone}`);
          successCount++;
        }
      }
    }

    console.log(`📱 Sent 100% limit SMS to ${successCount} admin(s)`);
  } catch (error) {
    console.error('Error sending 100% limit SMS:', error);
  }
};

/**
 * Send SMS when trying to add user but limit is already reached
 * Sends SMS to all admin users in the company
 */
const sendLimitReachedSMS = async (company, currentUsers, maxUsers) => {
  try {
    // Find all admin users in the company
    const adminUsers = await User.find({
      companyId: company.companyId,
      role: 'admin',
      isActive: true,
      status: 'approved'
    }).select('name phone');

    if (adminUsers.length === 0) {
      console.log(`⚠️ No active admin users found for company ${company.companyId}`);
      // Fallback to company admin phone if available
      if (company.adminPhone) {
        const message = `${company.name} Alert: Cannot add new user. You have reached your maximum user limit (${currentUsers}/${maxUsers} users). You need to talk to the super admin to adjust the limit.`;
        const result = await sendSMS(company.adminPhone, message);
        if (result.success) {
          console.log(`✅ Limit reached SMS sent to company admin phone ${company.adminPhone}`);
        }
      }
      return;
    }

    // Send SMS to each admin user
    const message = `${company.name} Alert: Cannot add new user. You have reached your maximum user limit (${currentUsers}/${maxUsers} users). You need to talk to the super admin to adjust the limit.`;
    
    let successCount = 0;
    for (const admin of adminUsers) {
      if (admin.phone) {
        const result = await sendSMS(admin.phone, message);
        if (result.success) {
          console.log(`✅ Limit reached SMS sent to admin ${admin.name} (${admin.phone})`);
          successCount++;
        } else {
          console.log(`⚠️ Failed to send SMS to admin ${admin.name} (${admin.phone}): ${result.message}`);
        }
      } else {
        console.log(`⚠️ Admin ${admin.name} has no phone number, skipping SMS`);
      }
    }

    // Also send to company admin phone if it's different from user phones
    if (company.adminPhone) {
      const phoneExists = adminUsers.some(admin => admin.phone === company.adminPhone);
      if (!phoneExists) {
        const result = await sendSMS(company.adminPhone, message);
        if (result.success) {
          console.log(`✅ Limit reached SMS sent to company admin phone ${company.adminPhone}`);
          successCount++;
        }
      }
    }

    console.log(`📱 Sent limit reached SMS to ${successCount} admin(s)`);
  } catch (error) {
    console.error('Error sending limit reached SMS:', error);
  }
};

/**
 * Validate user limit change for super admin
 * @param {string} companyId - Company ID
 * @param {number} newLimit - New user limit
 * @returns {Object} - { canUpdate: boolean, message: string }
 */
const validateLimitChange = async (companyId, newLimit) => {
  try {
    const currentUserCount = await User.countDocuments({ 
      companyId,
      status: { $ne: 'declined' }
    });

    if (newLimit < currentUserCount) {
      return { 
        canUpdate: false, 
        message: `Cannot set limit to ${newLimit}. Company currently has ${currentUserCount} users. Limit must be at least ${currentUserCount}.`
      };
    }

    return { canUpdate: true, message: 'Limit can be updated' };
  } catch (error) {
    console.error('Error validating limit change:', error);
    return { canUpdate: false, message: 'Error validating limit change' };
  }
};

module.exports = {
  checkUserLimit,
  validateLimitChange,
  send100PercentLimitSMS,
  sendLimitReachedSMS
};