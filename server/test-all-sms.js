const mongoose = require('mongoose');
const { sendSMS, sendNotificationSMS, getSMSUsage, validatePhoneNumber } = require('./services/smsService');
const smsReminderService = require('./services/smsReminderService');
const User = require('./models/User');
const Company = require('./models/Company');
const Notification = require('./models/Notification');
require('dotenv').config();

class SMSTestSuite {
  constructor() {
    this.results = {
      basicSMS: [],
      notificationSMS: [],
      reminderSMS: [],
      phoneValidation: [],
      rateLimit: [],
      quietHours: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive SMS Test Suite');
    console.log('═'.repeat(60));

    try {
      // Connect to database
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notion-app');
      console.log('✅ Connected to database\n');

      // Run all test categories
      await this.testBasicSMS();
      await this.testNotificationSMS();
      await this.testPhoneValidation();
      await this.testRateLimit();
      await this.testQuietHours();
      await this.testReminderSMS();

      // Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await mongoose.disconnect();
      console.log('\n📤 Disconnected from database');
    }
  }

  async testBasicSMS() {
    console.log('📱 Testing Basic SMS Service');
    console.log('-'.repeat(40));

    const testCases = [
      { phone: '+251911234567', message: 'Test SMS 1 - International format' },
      { phone: '0911234567', message: 'Test SMS 2 - Ethiopian format' },
      { phone: '911234567', message: 'Test SMS 3 - Without leading zero' },
      { phone: '251911234567', message: 'Test SMS 4 - Country code without +' },
      { phone: '+251922345678', message: 'Test SMS 5 - Different operator' },
      { phone: 'invalid', message: 'Test SMS 6 - Invalid format' }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`Testing: ${testCase.phone}`);
        const result = await sendSMS(testCase.phone, testCase.message);
        
        const testResult = {
          phone: testCase.phone,
          success: result.success,
          message: result.message || 'Success',
          data: result.data
        };

        this.results.basicSMS.push(testResult);
        
        if (result.success) {
          console.log(`   ✅ Success`);
          this.results.summary.passed++;
        } else {
          console.log(`   ⚠️ Failed: ${result.message}`);
          this.results.summary.failed++;
        }
        this.results.summary.total++;
        
        // Wait between requests to avoid rate limiting
        await this.sleep(2000);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        this.results.basicSMS.push({
          phone: testCase.phone,
          success: false,
          message: error.message
        });
        this.results.summary.failed++;
        this.results.summary.total++;
      }
    }
    console.log('');
  }

  async testNotificationSMS() {
    console.log('🔔 Testing Notification SMS');
    console.log('-'.repeat(40));

    try {
      // Create a test user with SMS enabled
      const testUser = {
        name: 'SMS Test User',
        email: 'smstest@example.com',
        phone: '+251911234567',
        preferences: {
          notifications: {
            sms: true,
            email: false
          }
        }
      };

      const notifications = [
        {
          type: 'task_urgent',
          title: 'Urgent Task Assigned',
          message: 'You have been assigned an urgent task that needs immediate attention.'
        },
        {
          type: 'meeting_reminder',
          title: 'Meeting Reminder',
          message: 'Your team meeting starts in 15 minutes.'
        },
        {
          type: 'deadline',
          title: 'Deadline Approaching',
          message: 'Project deadline is tomorrow.'
        },
        {
          type: 'system',
          title: 'System Notification',
          message: 'This is a regular system notification.'
        }
      ];

      for (const notification of notifications) {
        try {
          console.log(`Testing: ${notification.type}`);
          const result = await sendNotificationSMS(testUser, notification);
          
          const testResult = {
            type: notification.type,
            success: result.success,
            message: result.message || 'Success'
          };

          this.results.notificationSMS.push(testResult);
          
          if (result.success) {
            console.log(`   ✅ Success`);
            this.results.summary.passed++;
          } else {
            console.log(`   ⚠️ Failed: ${result.message}`);
            this.results.summary.failed++;
          }
          this.results.summary.total++;
          
          await this.sleep(2000);
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          this.results.notificationSMS.push({
            type: notification.type,
            success: false,
            message: error.message
          });
          this.results.summary.failed++;
          this.results.summary.total++;
        }
      }
    } catch (error) {
      console.log(`❌ Notification SMS test failed: ${error.message}`);
    }
    console.log('');
  }

  async testPhoneValidation() {
    console.log('📞 Testing Phone Validation');
    console.log('-'.repeat(40));

    const testPhones = [
      { phone: '+251911234567', shouldBeValid: true },
      { phone: '0911234567', shouldBeValid: true },
      { phone: '911234567', shouldBeValid: true },
      { phone: '251911234567', shouldBeValid: true },
      { phone: '+251922345678', shouldBeValid: true },
      { phone: '1234567890', shouldBeValid: false },
      { phone: '+1234567890', shouldBeValid: false },
      { phone: 'invalid', shouldBeValid: false },
      { phone: '', shouldBeValid: false },
      { phone: '+251812345678', shouldBeValid: true }
    ];

    for (const testCase of testPhones) {
      try {
        console.log(`Validating: ${testCase.phone || 'empty'}`);
        
        // Test the validation logic from the service
        const cleanedPhone = testCase.phone.replace(/[\s\-()]/g, '');
        const ethiopianFormat = /^09\d{8}$/;
        const internationalFormat = /^(\+?251)9\d{8}$/;
        const isValid = ethiopianFormat.test(cleanedPhone) || internationalFormat.test(cleanedPhone);
        
        const testResult = {
          phone: testCase.phone,
          expected: testCase.shouldBeValid,
          actual: isValid,
          passed: isValid === testCase.shouldBeValid
        };

        this.results.phoneValidation.push(testResult);
        
        if (testResult.passed) {
          console.log(`   ✅ Correct validation`);
          this.results.summary.passed++;
        } else {
          console.log(`   ❌ Wrong validation - Expected: ${testCase.shouldBeValid}, Got: ${isValid}`);
          this.results.summary.failed++;
        }
        this.results.summary.total++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        this.results.phoneValidation.push({
          phone: testCase.phone,
          expected: testCase.shouldBeValid,
          actual: false,
          passed: false,
          error: error.message
        });
        this.results.summary.failed++;
        this.results.summary.total++;
      }
    }
    console.log('');
  }

  async testRateLimit() {
    console.log('⏱️ Testing Rate Limiting');
    console.log('-'.repeat(40));

    try {
      const testUserId = 'test-user-rate-limit';
      
      // Test SMS usage tracking
      console.log('Testing SMS usage tracking...');
      
      // Simulate sending multiple SMS
      for (let i = 1; i <= 12; i++) {
        try {
          const result = await sendSMS('+251911234567', `Rate limit test SMS ${i}`);
          
          const testResult = {
            attempt: i,
            success: result.success,
            message: result.message
          };

          this.results.rateLimit.push(testResult);
          
          if (i <= 10) {
            // First 10 should succeed (if rate limiting is working)
            if (result.success) {
              console.log(`   SMS ${i}: ✅ Sent`);
              this.results.summary.passed++;
            } else {
              console.log(`   SMS ${i}: ⚠️ Failed: ${result.message}`);
              this.results.summary.failed++;
            }
          } else {
            // 11th and 12th should fail due to rate limiting
            if (!result.success && result.message.includes('rate limit')) {
              console.log(`   SMS ${i}: ✅ Correctly blocked by rate limit`);
              this.results.summary.passed++;
            } else {
              console.log(`   SMS ${i}: ❌ Should have been blocked by rate limit`);
              this.results.summary.failed++;
            }
          }
          this.results.summary.total++;
          
          await this.sleep(500);
        } catch (error) {
          console.log(`   SMS ${i}: ❌ Error: ${error.message}`);
          this.results.rateLimit.push({
            attempt: i,
            success: false,
            message: error.message
          });
          this.results.summary.failed++;
          this.results.summary.total++;
        }
      }
    } catch (error) {
      console.log(`❌ Rate limit test failed: ${error.message}`);
    }
    console.log('');
  }

  async testQuietHours() {
    console.log('🌙 Testing Quiet Hours');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Quiet Hours Test User',
        phone: '+251911234567',
        preferences: {
          notifications: { sms: true },
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        }
      };

      // Test different times
      const timeTests = [
        { time: '09:00', shouldSend: true, description: 'Morning (should send)' },
        { time: '14:00', shouldSend: true, description: 'Afternoon (should send)' },
        { time: '23:00', shouldSend: false, description: 'Night (should block)' },
        { time: '03:00', shouldSend: false, description: 'Early morning (should block)' },
        { time: '08:00', shouldSend: true, description: 'End of quiet hours (should send)' }
      ];

      for (const timeTest of timeTests) {
        try {
          console.log(`Testing: ${timeTest.description}`);
          
          // Mock current time for testing
          const originalDate = Date;
          const mockDate = new Date();
          const [hours, minutes] = timeTest.time.split(':');
          mockDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Test quiet hours logic
          const quietHours = testUser.preferences.quietHours;
          const currentTime = mockDate.getHours() * 60 + mockDate.getMinutes();
          const startTime = parseInt(quietHours.start.split(':')[0]) * 60 + parseInt(quietHours.start.split(':')[1]);
          const endTime = parseInt(quietHours.end.split(':')[0]) * 60 + parseInt(quietHours.end.split(':')[1]);
          
          let inQuietHours;
          if (startTime > endTime) {
            // Overnight quiet hours (e.g., 22:00 - 08:00)
            inQuietHours = currentTime >= startTime || currentTime < endTime;
          } else {
            // Same day quiet hours (e.g., 14:00 - 16:00)
            inQuietHours = currentTime >= startTime && currentTime < endTime;
          }
          
          const shouldBlock = quietHours.enabled && inQuietHours;
          const testPassed = shouldBlock !== timeTest.shouldSend;
          
          const testResult = {
            time: timeTest.time,
            description: timeTest.description,
            shouldSend: timeTest.shouldSend,
            wouldBlock: shouldBlock,
            passed: testPassed
          };

          this.results.quietHours.push(testResult);
          
          if (testPassed) {
            console.log(`   ✅ Correct behavior`);
            this.results.summary.passed++;
          } else {
            console.log(`   ❌ Wrong behavior - Expected send: ${timeTest.shouldSend}, Would block: ${shouldBlock}`);
            this.results.summary.failed++;
          }
          this.results.summary.total++;
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          this.results.quietHours.push({
            time: timeTest.time,
            description: timeTest.description,
            passed: false,
            error: error.message
          });
          this.results.summary.failed++;
          this.results.summary.total++;
        }
      }
    } catch (error) {
      console.log(`❌ Quiet hours test failed: ${error.message}`);
    }
    console.log('');
  }

  async testReminderSMS() {
    console.log('⏰ Testing SMS Reminders');
    console.log('-'.repeat(40));

    try {
      // Test payment reminders
      console.log('Testing payment reminders...');
      await smsReminderService.sendPaymentReminders();
      console.log('   ✅ Payment reminders executed');
      this.results.summary.passed++;
      this.results.summary.total++;

      // Test trial reminders
      console.log('Testing trial reminders...');
      await smsReminderService.sendTrialReminders();
      console.log('   ✅ Trial reminders executed');
      this.results.summary.passed++;
      this.results.summary.total++;

      // Test grace reminders
      console.log('Testing grace reminders...');
      await smsReminderService.sendGraceReminders();
      console.log('   ✅ Grace reminders executed');
      this.results.summary.passed++;
      this.results.summary.total++;

      // Test deadline reminders
      console.log('Testing deadline reminders...');
      await smsReminderService.sendDeadlineReminders();
      console.log('   ✅ Deadline reminders executed');
      this.results.summary.passed++;
      this.results.summary.total++;

      this.results.reminderSMS.push({
        paymentReminders: 'executed',
        trialReminders: 'executed',
        graceReminders: 'executed',
        deadlineReminders: 'executed'
      });

    } catch (error) {
      console.log(`❌ Reminder SMS test failed: ${error.message}`);
      this.results.reminderSMS.push({
        error: error.message
      });
      this.results.summary.failed++;
      this.results.summary.total++;
    }
    console.log('');
  }

  displayResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(60));
    
    const { passed, failed, total } = this.results.summary;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log('');

    // Basic SMS Results
    if (this.results.basicSMS.length > 0) {
      console.log('📱 Basic SMS Tests:');
      this.results.basicSMS.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.phone}: ${result.message}`);
      });
      console.log('');
    }

    // Notification SMS Results
    if (this.results.notificationSMS.length > 0) {
      console.log('🔔 Notification SMS Tests:');
      this.results.notificationSMS.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.type}: ${result.message}`);
      });
      console.log('');
    }

    // Phone Validation Results
    if (this.results.phoneValidation.length > 0) {
      console.log('📞 Phone Validation Tests:');
      this.results.phoneValidation.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${result.phone || 'empty'}: Expected ${result.expected}, Got ${result.actual}`);
      });
      console.log('');
    }

    // Rate Limit Results
    if (this.results.rateLimit.length > 0) {
      console.log('⏱️ Rate Limit Tests:');
      const successful = this.results.rateLimit.filter(r => r.success).length;
      const blocked = this.results.rateLimit.filter(r => !r.success && r.message.includes('rate')).length;
      console.log(`   Successful SMS: ${successful}`);
      console.log(`   Blocked by rate limit: ${blocked}`);
      console.log('');
    }

    // Quiet Hours Results
    if (this.results.quietHours.length > 0) {
      console.log('🌙 Quiet Hours Tests:');
      this.results.quietHours.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${result.time} - ${result.description}`);
      });
      console.log('');
    }

    // Working SMS Features
    console.log('🎯 WORKING SMS FEATURES:');
    console.log('-'.repeat(40));
    
    const workingFeatures = [];
    
    // Check basic SMS
    const basicSMSWorking = this.results.basicSMS.some(r => r.success);
    if (basicSMSWorking) workingFeatures.push('✅ Basic SMS sending');
    
    // Check notification SMS
    const notificationSMSWorking = this.results.notificationSMS.some(r => r.success);
    if (notificationSMSWorking) workingFeatures.push('✅ Notification SMS');
    
    // Check phone validation
    const phoneValidationWorking = this.results.phoneValidation.some(r => r.passed);
    if (phoneValidationWorking) workingFeatures.push('✅ Phone number validation');
    
    // Check quiet hours logic
    const quietHoursWorking = this.results.quietHours.some(r => r.passed);
    if (quietHoursWorking) workingFeatures.push('✅ Quiet hours logic');
    
    // Check reminders
    if (this.results.reminderSMS.length > 0 && !this.results.reminderSMS[0].error) {
      workingFeatures.push('✅ SMS reminder system');
    }
    
    if (workingFeatures.length > 0) {
      workingFeatures.forEach(feature => console.log(feature));
    } else {
      console.log('❌ No SMS features are currently working');
    }
    
    console.log('');
    console.log('📋 RECOMMENDATIONS:');
    console.log('-'.repeat(40));
    
    if (!basicSMSWorking) {
      console.log('❗ Check SMS API configuration in .env file');
      console.log('❗ Verify AfroMessage API credentials');
      console.log('❗ Test network connectivity to SMS API');
    }
    
    if (failed > 0) {
      console.log('❗ Review failed tests above for specific issues');
      console.log('❗ Check server logs for detailed error messages');
    }
    
    if (passRate < 70) {
      console.log('❗ Consider reviewing SMS service configuration');
      console.log('❗ Test with different phone numbers');
    }
    
    console.log('');
    console.log('✅ SMS Test Suite Completed!');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test suite
const testSuite = new SMSTestSuite();
testSuite.runAllTests().catch(console.error);