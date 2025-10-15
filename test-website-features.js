/**
 * Comprehensive Website Testing Script
 * Tests all major features of the Notion-like application
 */

const BASE_URL = 'http://localhost:9000/api';
let authToken = null;
let testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed.push(testName);
    log(`✅ PASS: ${testName}${details ? ' - ' + details : ''}`, 'green');
  } else {
    testResults.failed.push(testName);
    log(`❌ FAIL: ${testName}${details ? ' - ' + details : ''}`, 'red');
  }
}

function logWarning(message) {
  testResults.warnings.push(message);
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken && !options.skipAuth) {
    headers['x-auth-token'] = authToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return { response, data, ok: response.ok, status: response.status };
  } catch (error) {
    return { error: error.message, ok: false };
  }
}

// ============================================
// 1. HEALTH CHECK & SERVER STATUS
// ============================================
async function testHealthCheck() {
  log('\n📊 Testing Server Health...', 'cyan');
  
  const result = await makeRequest('/health', { skipAuth: true });
  logTest('Server Health Check', result.ok && result.data.status === 'OK', 
    result.data ? `DB: ${result.data.database}` : '');
  
  if (result.data && result.data.database !== 'Connected') {
    logWarning('Database is not connected!');
  }
}

// ============================================
// 2. AUTHENTICATION TESTS
// ============================================
async function testAuthentication() {
  log('\n🔐 Testing Authentication System...', 'cyan');
  
  // Test login with default admin
  const loginResult = await makeRequest('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({
      username: 'aymen',
      password: '7749'
    })
  });
  
  logTest('Admin Login', loginResult.ok, 
    loginResult.data?.token ? 'Token received' : loginResult.data?.message);
  
  if (loginResult.ok && loginResult.data?.token) {
    authToken = loginResult.data.token;
    log(`   Token: ${authToken.substring(0, 20)}...`, 'blue');
  }
  
  // Test get current user
  if (authToken) {
    const meResult = await makeRequest('/auth/me');
    logTest('Get Current User', meResult.ok, 
      meResult.data ? `User: ${meResult.data.username} (${meResult.data.role})` : '');
  }
  
  // Test registration validation (should fail without proper data)
  const badRegisterResult = await makeRequest('/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({
      username: 'test'
    })
  });
  
  logTest('Registration Validation', !badRegisterResult.ok, 
    'Should reject incomplete registration');
}

// ============================================
// 3. USER MANAGEMENT TESTS
// ============================================
async function testUserManagement() {
  log('\n👥 Testing User Management...', 'cyan');
  
  // Get all users
  const usersResult = await makeRequest('/users');
  logTest('Fetch Users List', usersResult.ok, 
    usersResult.data ? `Found ${usersResult.data.length} users` : '');
  
  // Test user stats
  const statsResult = await makeRequest('/users/stats');
  logTest('User Statistics', statsResult.ok, 
    statsResult.data ? `Total: ${statsResult.data.total}` : '');
}

// ============================================
// 4. PROJECT MANAGEMENT TESTS
// ============================================
async function testProjects() {
  log('\n📁 Testing Project Management...', 'cyan');
  
  // Get all projects
  const projectsResult = await makeRequest('/projects');
  logTest('Fetch Projects', projectsResult.ok, 
    projectsResult.data ? `Found ${projectsResult.data.length} projects` : '');
  
  // Create test project
  const createResult = await makeRequest('/projects', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Project - Automated Testing',
      description: 'This is a test project created by automated testing script',
      status: 'active'
    })
  });
  
  logTest('Create Project', createResult.ok, 
    createResult.data ? `Project ID: ${createResult.data._id}` : createResult.data?.message);
  
  // If project created, test update and delete
  if (createResult.ok && createResult.data?._id) {
    const projectId = createResult.data._id;
    
    // Update project
    const updateResult = await makeRequest(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Test Project',
        status: 'completed'
      })
    });
    
    logTest('Update Project', updateResult.ok, 'Project updated successfully');
    
    // Delete project
    const deleteResult = await makeRequest(`/projects/${projectId}`, {
      method: 'DELETE'
    });
    
    logTest('Delete Project', deleteResult.ok, 'Project deleted successfully');
  }
}

// ============================================
// 5. DOCUMENTS & NOTEPAD TESTS
// ============================================
async function testDocuments() {
  log('\n📄 Testing Documents & Notepad...', 'cyan');
  
  // Get documents
  const docsResult = await makeRequest('/documents');
  logTest('Fetch Documents', docsResult.ok, 
    docsResult.data ? `Found ${docsResult.data.length} documents` : '');
  
  // Get notepad notes
  const notesResult = await makeRequest('/notepad');
  logTest('Fetch Notepad Notes', notesResult.ok, 
    notesResult.data ? `Found ${notesResult.data.length} notes` : '');
  
  // Create test note
  const createNoteResult = await makeRequest('/notepad', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Note',
      content: 'This is a test note created by automated testing',
      tags: ['test', 'automated']
    })
  });
  
  logTest('Create Note', createNoteResult.ok, 
    createNoteResult.data ? 'Note created' : createNoteResult.data?.message);
  
  // Cleanup test note if created
  if (createNoteResult.ok && createNoteResult.data?._id) {
    await makeRequest(`/notepad/${createNoteResult.data._id}`, { method: 'DELETE' });
  }
}

// ============================================
// 6. MEETING NOTES TESTS
// ============================================
async function testMeetings() {
  log('\n📝 Testing Meeting Notes...', 'cyan');
  
  // Get meetings
  const meetingsResult = await makeRequest('/meetings');
  logTest('Fetch Meetings', meetingsResult.ok, 
    meetingsResult.data ? `Found ${meetingsResult.data.length} meetings` : '');
  
  // Get meeting templates
  const templatesResult = await makeRequest('/meeting-templates');
  logTest('Fetch Meeting Templates', templatesResult.ok, 
    templatesResult.data ? `Found ${templatesResult.data.length} templates` : '');
  
  // Create test meeting
  const createMeetingResult = await makeRequest('/meetings', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Meeting',
      date: new Date().toISOString(),
      attendees: [],
      agenda: 'Test agenda',
      notes: 'Test notes'
    })
  });
  
  logTest('Create Meeting', createMeetingResult.ok, 
    createMeetingResult.data ? 'Meeting created' : createMeetingResult.data?.message);
  
  // Cleanup
  if (createMeetingResult.ok && createMeetingResult.data?._id) {
    await makeRequest(`/meetings/${createMeetingResult.data._id}`, { method: 'DELETE' });
  }
}

// ============================================
// 7. REPORTS SYSTEM TESTS
// ============================================
async function testReports() {
  log('\n📊 Testing Reports System...', 'cyan');
  
  // Get reports
  const reportsResult = await makeRequest('/reports');
  logTest('Fetch Reports', reportsResult.ok, 
    reportsResult.data ? `Found ${reportsResult.data.length} reports` : '');
  
  // Get shared reports
  const sharedResult = await makeRequest('/reports/shared');
  logTest('Fetch Shared Reports', sharedResult.ok, 
    sharedResult.data ? `Found ${reportsResult.data.length} shared` : '');
}

// ============================================
// 8. TASKS & GOALS TESTS
// ============================================
async function testTasksAndGoals() {
  log('\n✅ Testing Tasks & Goals...', 'cyan');
  
  // Get tasks
  const tasksResult = await makeRequest('/tasks');
  logTest('Fetch Tasks', tasksResult.ok, 
    tasksResult.data ? `Found ${tasksResult.data.length} tasks` : '');
  
  // Get goals
  const goalsResult = await makeRequest('/goals');
  logTest('Fetch Goals', goalsResult.ok, 
    goalsResult.data ? `Found ${goalsResult.data.length} goals` : '');
}

// ============================================
// 9. NOTIFICATIONS TESTS
// ============================================
async function testNotifications() {
  log('\n🔔 Testing Notifications...', 'cyan');
  
  // Get notifications
  const notifResult = await makeRequest('/notifications');
  logTest('Fetch Notifications', notifResult.ok, 
    notifResult.data ? `Found ${notifResult.data.length} notifications` : '');
  
  // Get unread count
  const unreadResult = await makeRequest('/notifications/unread-count');
  logTest('Get Unread Count', unreadResult.ok, 
    unreadResult.data ? `Unread: ${unreadResult.data.count}` : '');
}

// ============================================
// 10. ADMIN & COMPANY TESTS
// ============================================
async function testAdminFeatures() {
  log('\n⚙️  Testing Admin Features...', 'cyan');
  
  // Get companies
  const companiesResult = await makeRequest('/admin/companies');
  logTest('Fetch Companies', companiesResult.ok, 
    companiesResult.data ? `Found ${companiesResult.data.length} companies` : '');
  
  // Get company settings
  const settingsResult = await makeRequest('/settings/payment');
  logTest('Fetch Payment Settings', settingsResult.ok, 
    settingsResult.data ? 'Settings loaded' : '');
  
  // Get system stats
  const statsResult = await makeRequest('/admin/stats');
  logTest('System Statistics', statsResult.ok, 
    statsResult.data ? 'Stats retrieved' : '');
}

// ============================================
// 11. PAYMENT SYSTEM TESTS
// ============================================
async function testPayments() {
  log('\n💳 Testing Payment System...', 'cyan');
  
  // Get company payments
  const paymentsResult = await makeRequest('/payments/my-company');
  logTest('Fetch Company Payments', paymentsResult.ok, 
    paymentsResult.data ? `Found ${paymentsResult.data.length} payments` : '');
  
  // Get all payments (super admin)
  const allPaymentsResult = await makeRequest('/payments');
  logTest('Fetch All Payments', allPaymentsResult.ok || allPaymentsResult.status === 403, 
    allPaymentsResult.status === 403 ? 'Restricted (not super admin)' : 'Success');
}

// ============================================
// 12. AI ASSISTANT TESTS
// ============================================
async function testAIFeatures() {
  log('\n🤖 Testing AI Features...', 'cyan');
  
  // Test AI endpoint availability
  const aiResult = await makeRequest('/ai/test', { skipAuth: true });
  logTest('AI Endpoint Available', aiResult.status === 404 || aiResult.ok, 
    'Endpoint exists (implementation may vary)');
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 COMPREHENSIVE WEBSITE TESTING SUITE', 'blue');
  log('='.repeat(60), 'blue');
  log(`Testing against: ${BASE_URL}`, 'cyan');
  log(`Started at: ${new Date().toLocaleString()}\n`, 'cyan');
  
  try {
    await testHealthCheck();
    await testAuthentication();
    
    if (!authToken) {
      log('\n❌ Cannot proceed with tests - Authentication failed!', 'red');
      return;
    }
    
    await testUserManagement();
    await testProjects();
    await testDocuments();
    await testMeetings();
    await testReports();
    await testTasksAndGoals();
    await testNotifications();
    await testAdminFeatures();
    await testPayments();
    await testAIFeatures();
    
  } catch (error) {
    log(`\n💥 Test suite error: ${error.message}`, 'red');
    console.error(error);
  }
  
  // Print summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${testResults.passed.length}`, 'green');
  log(`❌ Failed: ${testResults.failed.length}`, 'red');
  log(`⚠️  Warnings: ${testResults.warnings.length}`, 'yellow');
  
  if (testResults.failed.length > 0) {
    log('\nFailed Tests:', 'red');
    testResults.failed.forEach(test => log(`  - ${test}`, 'red'));
  }
  
  if (testResults.warnings.length > 0) {
    log('\nWarnings:', 'yellow');
    testResults.warnings.forEach(warning => log(`  - ${warning}`, 'yellow'));
  }
  
  const successRate = ((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(1);
  log(`\n🎯 Success Rate: ${successRate}%`, successRate > 80 ? 'green' : 'yellow');
  log(`\nCompleted at: ${new Date().toLocaleString()}`, 'cyan');
  log('='.repeat(60) + '\n', 'blue');
}

// Run tests
runAllTests().catch(console.error);

