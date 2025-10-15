require('dotenv').config();
const emailService = require('./services/emailService');

console.log('📧 Testing Email Configuration\n');
console.log('Email Settings:');
console.log('  Host:', process.env.EMAIL_HOST);
console.log('  Port:', process.env.EMAIL_PORT);
console.log('  Secure:', process.env.EMAIL_SECURE);
console.log('  User:', process.env.EMAIL_USER);
console.log('  Pass:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-3) : 'NOT SET');
console.log('\n' + '='.repeat(60) + '\n');

emailService.sendEmail({
  to: process.env.EMAIL_USER,
  subject: 'Test Email - System Working!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4CAF50;">✅ Email System is Working!</h1>
      <p>This is a test email from your Notion App.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
      </div>
      <p>If you receive this, email notifications are working correctly!</p>
    </div>
  `
})
.then(result => {
  if (result.success) {
    console.log('✅ SUCCESS! Email sent');
    console.log('📬 Message ID:', result.messageId);
    console.log('\n🎉 Check your inbox at:', process.env.EMAIL_USER);
    process.exit(0);
  } else {
    console.log('❌ FAILED:', result.message || result.error);
    process.exit(1);
  }
})
.catch(error => {
  console.error('❌ ERROR:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
});

