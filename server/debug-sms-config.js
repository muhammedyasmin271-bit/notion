require('dotenv').config();

console.log('🔍 SMS Configuration Debug:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`SMS_API: "${process.env.SMS_API}"`);
console.log(`SMS_TOKEN: "${process.env.SMS_TOKEN ? process.env.SMS_TOKEN.substring(0, 20) + '...' : 'NOT SET'}"`);
console.log(`IDENTIFIER_ID: "${process.env.IDENTIFIER_ID}"`);
console.log(`SENDER_NAME: "${process.env.SENDER_NAME}"`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check for any hidden characters or encoding issues
if (process.env.SMS_API) {
  console.log('\n🔍 URL Analysis:');
  console.log(`Length: ${process.env.SMS_API.length}`);
  console.log(`Char codes: ${Array.from(process.env.SMS_API).map(c => c.charCodeAt(0)).join(', ')}`);
  console.log(`Contains "coom": ${process.env.SMS_API.includes('coom')}`);
  console.log(`Contains "com": ${process.env.SMS_API.includes('com')}`);
}

// Test SMS service import
try {
  const { sendSMS } = require('./services/smsService');
  console.log('\n✅ SMS Service imported successfully');
  
  // Test with a dummy phone number to see the actual error
  sendSMS('251911234567', 'Test message').then(result => {
    console.log('\n📱 Test SMS Result:', result);
  }).catch(error => {
    console.log('\n❌ SMS Error Details:', error.message);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
  });
} catch (error) {
  console.log('\n❌ Failed to import SMS service:', error.message);
}