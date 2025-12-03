const cron = require('node-cron');
const smsReminderService = require('./smsReminderService');
const Company = require('../models/Company');

class CronScheduler {
  
  start() {
    console.log('🕐 Starting SMS reminder cron jobs...');

    // Run every hour to check for SMS reminders
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running hourly SMS reminder check...');
      
      try {
        await Promise.all([
          smsReminderService.sendPaymentReminders(),
          smsReminderService.sendTrialReminders(),
          smsReminderService.sendGraceReminders(),
          smsReminderService.sendDeadlineReminders()
        ]);
        
        console.log('✅ SMS reminder check completed');
      } catch (error) {
        console.error('❌ Error in SMS reminder cron:', error);
      }
    });

    // Run daily to update company statuses
    cron.schedule('0 0 * * *', async () => {
      console.log('🔄 Running daily company status update...');
      
      try {
        await this.updateCompanyStatuses();
        console.log('✅ Company status update completed');
      } catch (error) {
        console.error('❌ Error in company status cron:', error);
      }
    });

    // Clean up old companies (run weekly)
    cron.schedule('0 0 * * 0', async () => {
      console.log('🗑️ Running weekly cleanup...');
      
      try {
        await this.cleanupOldCompanies();
        console.log('✅ Weekly cleanup completed');
      } catch (error) {
        console.error('❌ Error in cleanup cron:', error);
      }
    });
  }

  async updateCompanyStatuses() {
    const now = new Date();

    // Automatically pause companies when payment deadline passes (immediately, not after grace period)
    // This blocks ALL users until super admin clicks "Play"
    // Applies to both original deadlines and new deadlines after unpause
    const pausedDeadlineCount = await Company.updateMany(
      {
        hasPaid: false,
        paymentMode: 'paid',
        paymentDeadline: { $lt: now },
        status: 'active'
      },
      {
        $set: {
          status: 'paused',
          pausedAt: now,
          unpausedAt: undefined, // Clear unpausedAt since we're pausing again
          gracePeriodDeadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Set grace period for reference
        }
      }
    );

    if (pausedDeadlineCount.modifiedCount > 0) {
      console.log(`⏸️ Auto-paused ${pausedDeadlineCount.modifiedCount} companies after payment deadline passed`);
    }

    // Also pause companies after grace period expires (for companies that were unpaused)
    const pausedGraceCount = await Company.updateMany(
      {
        hasPaid: false,
        paymentMode: 'paid',
        gracePeriodDeadline: { $lt: now },
        status: { $ne: 'paused' }
      },
      {
        $set: {
          status: 'paused',
          pausedAt: now
        }
      }
    );

    if (pausedGraceCount.modifiedCount > 0) {
      console.log(`⏸️ Auto-paused ${pausedGraceCount.modifiedCount} companies after grace period expired`);
    }
  }

  async cleanupOldCompanies() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Delete companies that have been in deadline for 6 months
    const result = await Company.deleteMany({
      status: 'suspended',
      deadlineStart: { $lt: sixMonthsAgo }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} expired companies`);
  }
}

module.exports = new CronScheduler();