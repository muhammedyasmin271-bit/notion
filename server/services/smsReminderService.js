const Company = require('../models/Company');
const { sendSMS } = require('./smsService');

class SMSReminderService {
  
  // Send payment reminders (every 6 hours for 24 hours = 4 SMS)
  async sendPaymentReminders() {
    try {
      const companies = await Company.find({
        selectedPlan: { $in: ['one_month', 'three_month', 'six_month'] },
        hasPaid: false,
        status: 'active',
        paymentDeadline: { $exists: true, $gte: new Date() }
      }).populate('adminUserId', 'phone name');

      for (const company of companies) {
        const now = new Date();
        const paymentStart = new Date(company.paymentDeadline.getTime() - 24 * 60 * 60 * 1000);
        const hoursElapsed = Math.floor((now - paymentStart) / (1000 * 60 * 60));
        
        // Send SMS at 6, 12, 18, 24 hours
        const reminderHours = [6, 12, 18, 24];
        const currentReminderHour = reminderHours.find(h => hoursElapsed >= h && hoursElapsed < h + 1);
        
        if (currentReminderHour && !this.hasRecentSMS(company, 5)) {
          const hoursLeft = 24 - hoursElapsed;
          await this.sendPaymentReminderSMS(company, hoursLeft);
        }
      }
    } catch (error) {
      console.error('Error sending payment reminders:', error);
    }
  }

  // Send trial reminders (day 5, 6, 7)
  async sendTrialReminders() {
    try {
      const companies = await Company.find({
        selectedPlan: 'free_trial',
        hasPaid: false,
        status: 'active'
      }).populate('adminUserId', 'phone name');

      for (const company of companies) {
        const now = new Date();
        const trialStart = company.createdAt;
        const daysElapsed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
        
        // Send SMS on days 5, 6, 7
        if ([5, 6, 7].includes(daysElapsed) && !this.hasRecentSMS(company, 23)) {
          const daysLeft = 7 - daysElapsed;
          await this.sendTrialReminderSMS(company, daysLeft);
        }
      }
    } catch (error) {
      console.error('Error sending trial reminders:', error);
    }
  }

  // Send grace period reminders (day 5, 6, 7 of grace period)
  async sendGraceReminders() {
    try {
      const companies = await Company.find({
        hasPaid: false,
        status: 'paused',
        gracePeriodDeadline: { $exists: true, $gte: new Date() }
      }).populate('adminUserId', 'phone name');

      for (const company of companies) {
        const now = new Date();
        const graceStart = new Date(company.gracePeriodDeadline.getTime() - 7 * 24 * 60 * 60 * 1000);
        const daysElapsed = Math.floor((now - graceStart) / (1000 * 60 * 60 * 24));
        
        // Send SMS on days 5, 6, 7 of grace period
        if ([5, 6, 7].includes(daysElapsed) && !this.hasRecentSMS(company, 23)) {
          const daysLeft = 7 - daysElapsed;
          const isLastDay = daysLeft === 0;
          await this.sendGraceReminderSMS(company, daysLeft, isLastDay);
        }
      }
    } catch (error) {
      console.error('Error sending grace reminders:', error);
    }
  }

  // Send deadline reminders (5 SMS in 24 hours after super admin clicks play)
  async sendDeadlineReminders() {
    try {
      const companies = await Company.find({
        status: 'active',
        hasPaid: false,
        unpausedAt: { $exists: true },
        paymentDeadline: { $exists: true, $gte: new Date() }
      }).populate('adminUserId', 'phone name');

      for (const company of companies) {
        const now = new Date();
        const unpausedTime = company.unpausedAt;
        const hoursElapsed = Math.floor((now - unpausedTime) / (1000 * 60 * 60));
        
        // Send 5 SMS in 24 hours: at 4, 8, 12, 16, 20 hours
        const reminderHours = [4, 8, 12, 16, 20];
        const currentReminderHour = reminderHours.find(h => hoursElapsed >= h && hoursElapsed < h + 1);
        
        if (currentReminderHour && !this.hasRecentSMS(company, 3)) {
          const hoursLeft = 24 - hoursElapsed;
          await this.sendDeadlineReminderSMS(company, hoursLeft);
        }
      }
    } catch (error) {
      console.error('Error sending deadline reminders:', error);
    }
  }

  // Check if SMS was sent recently (within specified hours)
  hasRecentSMS(company, withinHours) {
    if (!company.smsReminders?.lastSent) return false;
    const hoursSinceLastSMS = (new Date() - company.smsReminders.lastSent) / (1000 * 60 * 60);
    return hoursSinceLastSMS < withinHours;
  }

  // Send payment reminder SMS
  async sendPaymentReminderSMS(company, hoursLeft) {
    const phone = company.adminUserId?.phone;
    if (!phone) return;

    const message = `⏰ Payment Reminder: Your ${company.name} subscription expires in ${hoursLeft} hours. Please complete payment to avoid service interruption. Pay now: ${process.env.BASE_URL}/${company.companyId}/admin/payments`;
    
    await sendSMS(phone, message);
    await this.updateSMSLog(company, 'payment');
  }

  // Send trial reminder SMS
  async sendTrialReminderSMS(company, daysLeft) {
    const phone = company.adminUserId?.phone;
    if (!phone) return;

    let message;
    if (daysLeft === 0) {
      message = `🚨 Final Notice: Your ${company.name} free trial ends today! Subscribe now to continue using all features. Pay now: ${process.env.BASE_URL}/${company.companyId}/admin/payments`;
    } else {
      message = `⏰ Trial Reminder: Your ${company.name} free trial expires in ${daysLeft} days. Subscribe now to avoid interruption. Pay now: ${process.env.BASE_URL}/${company.companyId}/admin/payments`;
    }
    
    await sendSMS(phone, message);
    await this.updateSMSLog(company, 'trial');
  }

  // Send grace period reminder SMS
  async sendGraceReminderSMS(company, daysLeft, isLastDay) {
    const phone = company.adminUserId?.phone;
    if (!phone) return;

    let message;
    if (isLastDay) {
      message = `🚨 FINAL WARNING: Your ${company.name} account will be permanently blocked today! Pay immediately or contact support to avoid data loss. Pay now: ${process.env.BASE_URL}/${company.companyId}/admin/payments`;
    } else {
      message = `⚠️ Grace Period: Your ${company.name} account will be blocked in ${daysLeft} days. Only admin access available. Pay now to restore full access: ${process.env.BASE_URL}/${company.companyId}/admin/payments`;
    }
    
    await sendSMS(phone, message);
    await this.updateSMSLog(company, 'grace');
  }

  // Send deadline reminder SMS (after super admin unpauses)
  async sendDeadlineReminderSMS(company, hoursLeft) {
    const phone = company.adminUserId?.phone;
    if (!phone) return;

    const message = `🔄 Account Reactivated: Your ${company.name} account has ${hoursLeft} hours to complete payment. Pay now to avoid re-blocking: ${process.env.BASE_URL}/${company.companyId}/admin/payments`;
    
    await sendSMS(phone, message);
    await this.updateSMSLog(company, 'deadline');
  }

  // Update SMS log
  async updateSMSLog(company, type) {
    const now = new Date();
    
    if (!company.smsReminders) {
      company.smsReminders = {
        paymentReminders: [],
        trialReminders: [],
        graceReminders: [],
        lastSent: now
      };
    }

    company.smsReminders.lastSent = now;
    
    switch (type) {
      case 'payment':
        company.smsReminders.paymentReminders.push(now);
        break;
      case 'trial':
        company.smsReminders.trialReminders.push(now);
        break;
      case 'grace':
        company.smsReminders.graceReminders.push(now);
        break;
    }

    await company.save();
  }
}

module.exports = new SMSReminderService();