const { sendSMS } = require('./services/smsService');

// Test SMS sending
async function testSMS() {
  console.log('🧪 Testing SMS Service...\n');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   SMS_API: ${process.env.SMS_API ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   SMS_TOKEN: ${process.env.SMS_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   IDENTIFIER_ID: ${process.env.IDENTIFIER_ID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   SENDER_NAME: ${process.env.SENDER_NAME ? '✅ Configured' : '❌ Not configured'}\n`);
  
  if (!process.env.SMS_API || !process.env.SMS_TOKEN) {
    console.log('❌ SMS service not properly configured. Please set SMS_API and SMS_TOKEN in .env\n');
    return;
  }
  
  // Test phone numbers
  const testPhones = [
    '+251911234567',
    '0911234567',
    '911234567',
    '251911234567'
  ];
  
  const testMessage = 'Test SMS from Mela Note - Company Creation Notification';
  
  console.log('📱 Testing with different phone formats:\n');
  
  for (const phone of testPhones) {
    console.log(`Testing: ${phone}`);
    try {
      const result = await sendSMS(phone, testMessage);
      if (result.success) {
        console.log(`   ✅ Success\n`);
      } else {
        console.log(`   ⚠️ Failed: ${result.message}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('✅ SMS test completed');
}

testSMS().catch(console.error);
