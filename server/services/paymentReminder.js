const { sendSMS } = require('./smsService');
const Company = require('../models/Company');

const reminders = new Map();

const schedulePaymentReminders = (companyId, adminPhone, companyName, paymentDeadline) => {
  console.log(`⏰ Scheduling payment reminders for ${companyName}`);
  
  const now = new Date();
  const timeUntilDeadline = paymentDeadline.getTime() - now.getTime();
  
  // Schedule reminders at 18h, 12h, 6h before deadline
  const reminderTimes = [18, 12, 6];
  
  reminderTimes.forEach(hoursBeforeDeadline => {
    const reminderTime = paymentDeadline.getTime() - (hoursBeforeDeadline * 60 * 60 * 1000);
    const delayMs = reminderTime - now.getTime();
    
    if (delayMs > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          const hoursRemaining = hoursBeforeDeadline;
          const message = `⏰ Payment Reminder: ${companyName} - You have ${hoursRemaining} hours to complete payment before your company is suspended. Login: https://melafront.vercel.app/login?company=${companyId}`;
          
          console.log(`📤 Sending ${hoursRemaining}h reminder to ${adminPhone}`);
          await sendSMS(adminPhone, message);
          console.log(`✅ ${hoursRemaining}h reminder sent`);
        } catch (error) {
          console.error(`❌ Error sending ${hoursBeforeDeadline}h reminder:`, error.message);
        }
      }, delayMs);
      
      reminders.set(`${companyId}-${hoursBeforeDeadline}h`, timeoutId);
      console.log(`   ✓ ${hoursBeforeDeadline}h reminder scheduled`);
    }
  });
};

const cancelPaymentReminders = (companyId) => {
  console.log(`🛑 Cancelling payment reminders for ${companyId}`);
  
  const reminderTimes = [18, 12, 6];
  reminderTimes.forEach(hours => {
    const key = `${companyId}-${hours}h`;
    if (reminders.has(key)) {
      clearTimeout(reminders.get(key));
      reminders.delete(key);
      console.log(`   ✓ ${hours}h reminder cancelled`);
    }
  });
};

module.exports = {
  schedulePaymentReminders,
  cancelPaymentReminders
};
