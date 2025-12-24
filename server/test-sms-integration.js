const mongoose = require('mongoose');
const { sendSMS, sendNotificationSMS } = require('./services/smsService');
const User = require('./models/User');
const Notification = require('./models/Notification');
require('dotenv').config();

class SMSIntegrationTest {
  constructor() {
    this.results = {
      userRegistration: { tested: false, working: false, details: '' },
      userApproval: { tested: false, working: false, details: '' },
      userDecline: { tested: false, working: false, details: '' },
      passwordChange: { tested: false, working: false, details: '' },
      documentShare: { tested: false, working: false, details: '' },
      meetingInvite: { tested: false, working: false, details: '' },
      meetingUpdate: { tested: false, working: false, details: '' },
      reportShare: { tested: false, working: false, details: '' },
      notepadShare: { tested: false, working: false, details: '' },
      summary: { total: 0, working: 0, notWorking: 0 }
    };
  }

  async runAllTests() {
    console.log('🧪 Starting SMS Integration Test Suite');
    console.log('═'.repeat(60));

    try {
      // Connect to database
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app');
      console.log('✅ Connected to database\n');

      // Test all SMS integrations
      await this.testUserRegistrationSMS();
      await this.testUserApprovalSMS();
      await this.testUserDeclineSMS();
      await this.testPasswordChangeSMS();
      await this.testDocumentShareSMS();
      await this.testMeetingInviteSMS();
      await this.testMeetingUpdateSMS();
      await this.testReportShareSMS();
      await this.testNotepadShareSMS();

      // Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await mongoose.disconnect();
      console.log('\n📤 Disconnected from database');
    }
  }

  async testUserRegistrationSMS() {
    console.log('👤 Testing User Registration SMS');
    console.log('-'.repeat(40));

    try {
      // Test pending registration SMS
      const testUser = {
        name: 'Test User',
        phone: '+251911234567',
        username: 'testuser',
        status: 'pending'
      };

      const pendingMessage = `Hello ${testUser.name},

Your registration has been received and is pending approval. You will be notified once your account is approved.

Thank you for registering!

- mela note`;

      const pendingResult = await sendSMS(testUser.phone, pendingMessage);
      
      // Test approved registration SMS
      const approvedMessage = `Hello ${testUser.name},

Your registration was successful! Your account has been approved and you can now log in.

Username: ${testUser.username}

- mela note`;

      const approvedResult = await sendSMS(testUser.phone, approvedMessage);

      const bothWorking = pendingResult.success && approvedResult.success;
      
      this.results.userRegistration = {
        tested: true,
        working: bothWorking,
        details: bothWorking ? 'Both pending and approved registration SMS working' : 
                `Pending: ${pendingResult.success ? '✅' : '❌'}, Approved: ${approvedResult.success ? '✅' : '❌'}`
      };

      console.log(`   Registration SMS: ${bothWorking ? '✅ Working' : '❌ Not working'}`);
      if (!bothWorking) {
        console.log(`   Details: ${this.results.userRegistration.details}`);
      }

    } catch (error) {
      this.results.userRegistration = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testUserApprovalSMS() {
    console.log('✅ Testing User Approval SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567',
        username: 'testuser'
      };

      const approvalMessage = `Hello ${testUser.name},

Your account has been approved! You can now log in to your account.

Username: ${testUser.username}

- mela note`;

      const result = await sendSMS(testUser.phone, approvalMessage);
      
      this.results.userApproval = {
        tested: true,
        working: result.success,
        details: result.success ? 'User approval SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Approval SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.userApproval = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testUserDeclineSMS() {
    console.log('❌ Testing User Decline SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567'
      };

      const declineMessage = `Hello ${testUser.name},

We regret to inform you that your registration has been declined. Please contact the administrator for more information.

- mela note`;

      const result = await sendSMS(testUser.phone, declineMessage);
      
      this.results.userDecline = {
        tested: true,
        working: result.success,
        details: result.success ? 'User decline SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Decline SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.userDecline = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testPasswordChangeSMS() {
    console.log('🔑 Testing Password Change SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567'
      };

      const newPassword = 'newpassword123';
      const passwordMessage = `Your password has been changed successfully.
New Password: ${newPassword}

Please keep this password secure.

- mela note`;

      const result = await sendSMS(testUser.phone, passwordMessage);
      
      this.results.passwordChange = {
        tested: true,
        working: result.success,
        details: result.success ? 'Password change SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Password Change SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.passwordChange = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testDocumentShareSMS() {
    console.log('📄 Testing Document Share SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567',
        preferences: {
          notifications: {
            sms: true
          }
        }
      };

      const testNotification = {
        type: 'document',
        title: 'New document shared with you',
        message: 'John Doe shared a document: Project Requirements'
      };

      const result = await sendNotificationSMS(testUser, testNotification);
      
      this.results.documentShare = {
        tested: true,
        working: result.success,
        details: result.success ? 'Document share SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Document Share SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.documentShare = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testMeetingInviteSMS() {
    console.log('📅 Testing Meeting Invite SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567',
        preferences: {
          notifications: {
            sms: true
          }
        }
      };

      const testNotification = {
        type: 'meeting',
        title: 'Meeting Invitation: Team Standup',
        message: 'Date: 12/25/2024\nTime: 09:00\nDuration: 30 minutes'
      };

      const result = await sendNotificationSMS(testUser, testNotification);
      
      this.results.meetingInvite = {
        tested: true,
        working: result.success,
        details: result.success ? 'Meeting invite SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Meeting Invite SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.meetingInvite = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testMeetingUpdateSMS() {
    console.log('📅 Testing Meeting Update SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567',
        preferences: {
          notifications: {
            sms: true
          }
        }
      };

      const testNotification = {
        type: 'meeting',
        title: 'Meeting Updated: Team Standup',
        message: "You've been added to a meeting.\nDate: 12/25/2024\nTime: 09:00\nDuration: 30 minutes"
      };

      const result = await sendNotificationSMS(testUser, testNotification);
      
      this.results.meetingUpdate = {
        tested: true,
        working: result.success,
        details: result.success ? 'Meeting update SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Meeting Update SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.meetingUpdate = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testReportShareSMS() {
    console.log('📊 Testing Report Share SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567',
        preferences: {
          notifications: {
            sms: true
          }
        }
      };

      const testNotification = {
        type: 'report',
        title: 'Report Shared With You',
        message: 'John Doe shared a report: Monthly Performance Report'
      };

      const result = await sendNotificationSMS(testUser, testNotification);
      
      this.results.reportShare = {
        tested: true,
        working: result.success,
        details: result.success ? 'Report share SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Report Share SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.reportShare = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  async testNotepadShareSMS() {
    console.log('📝 Testing Notepad Share SMS');
    console.log('-'.repeat(40));

    try {
      const testUser = {
        name: 'Test User',
        phone: '+251911234567',
        preferences: {
          notifications: {
            sms: true
          }
        }
      };

      const testNotification = {
        type: 'notepad',
        title: 'Note shared with you',
        message: 'John Doe shared a note: Project Ideas'
      };

      const result = await sendNotificationSMS(testUser, testNotification);
      
      this.results.notepadShare = {
        tested: true,
        working: result.success,
        details: result.success ? 'Notepad share SMS working' : `Failed: ${result.message}`
      };

      console.log(`   Notepad Share SMS: ${result.success ? '✅ Working' : '❌ Not working'}`);
      if (!result.success) {
        console.log(`   Details: ${result.message}`);
      }

    } catch (error) {
      this.results.notepadShare = {
        tested: true,
        working: false,
        details: `Error: ${error.message}`
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  displayResults() {
    console.log('📊 SMS INTEGRATION TEST RESULTS');
    console.log('═'.repeat(60));

    // Calculate summary
    const features = Object.keys(this.results).filter(key => key !== 'summary');
    let working = 0;
    let notWorking = 0;

    features.forEach(feature => {
      if (this.results[feature].tested) {
        if (this.results[feature].working) {
          working++;
        } else {
          notWorking++;
        }
      }
    });

    this.results.summary = {
      total: features.length,
      working: working,
      notWorking: notWorking
    };

    // Display individual results
    console.log('\n🔍 DETAILED RESULTS:');
    console.log('-'.repeat(40));

    features.forEach(feature => {
      const result = this.results[feature];
      const status = result.working ? '✅ WORKING' : '❌ NOT WORKING';
      const featureName = feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      console.log(`${featureName}: ${status}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });

    // Display summary
    console.log('\n📈 SUMMARY:');
    console.log('-'.repeat(40));
    console.log(`Total Features Tested: ${this.results.summary.total}`);
    console.log(`Working: ${this.results.summary.working} ✅`);
    console.log(`Not Working: ${this.results.summary.notWorking} ❌`);
    
    const successRate = this.results.summary.total > 0 ? 
      ((this.results.summary.working / this.results.summary.total) * 100).toFixed(1) : 0;
    console.log(`Success Rate: ${successRate}%`);

    // Working features list
    console.log('\n🎯 WORKING SMS FEATURES:');
    console.log('-'.repeat(40));
    
    const workingFeatures = features.filter(feature => this.results[feature].working);
    if (workingFeatures.length > 0) {
      workingFeatures.forEach(feature => {
        const featureName = feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`✅ ${featureName}`);
      });
    } else {
      console.log('❌ No SMS features are currently working');
    }

    // Not working features list
    const notWorkingFeatures = features.filter(feature => !this.results[feature].working);
    if (notWorkingFeatures.length > 0) {
      console.log('\n⚠️ NOT WORKING SMS FEATURES:');
      console.log('-'.repeat(40));
      notWorkingFeatures.forEach(feature => {
        const featureName = feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`❌ ${featureName}`);
      });
    }

    // Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('-'.repeat(40));
    
    if (this.results.summary.working === this.results.summary.total) {
      console.log('🎉 All SMS features are working perfectly!');
      console.log('✅ Your SMS integration is production-ready');
    } else if (this.results.summary.working > 0) {
      console.log(`✅ ${this.results.summary.working} SMS features are working`);
      console.log(`⚠️ ${this.results.summary.notWorking} SMS features need attention`);
      console.log('🔧 Review the failed features and check SMS service configuration');
    } else {
      console.log('❌ No SMS features are working');
      console.log('🔧 Check SMS API configuration in .env file');
      console.log('🔧 Verify AfroMessage API credentials');
      console.log('🔧 Test network connectivity to SMS API');
    }

    console.log('\n✅ SMS Integration Test Suite Completed!');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test suite
const testSuite = new SMSIntegrationTest();
testSuite.runAllTests().catch(console.error);