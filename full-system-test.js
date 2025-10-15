/**
 * COMPLETE SYSTEM TEST - Tests all pages and functionality
 * This script performs real API calls to test all features
 */

const fetch = require('node-fetch');
const readline = require('readline');

const BASE_URL = 'http://localhost:9000/api';
const FRONTEND_URL = 'http://localhost:3000';

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

function log(msg, color = 'white') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(colors.cyan + question + colors.reset, answer => {
      resolve(answer.trim());
    });
  });
}

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function recordTest(category, name, status, details = '') {
  results.total++;
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.skipped++;
  
  results.tests.push({ category, name, status, details });
  
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`  ${icon} ${name}${details ? ' - ' + details : ''}`, color);
}

async function makeRequest(endpoint, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

// ============================================
// TEST SECTIONS
// ============================================

async function testHealthAndConnectivity() {
  log('\n' + '='.repeat(80), 'magenta');
  log('1. TESTING HEALTH & CONNECTIVITY', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Backend health
  const health = await makeRequest('/health');
  recordTest('Health', 'Backend Server Health', 
    health.ok && health.data?.status === 'OK' ? 'pass' : 'fail',
    health.data?.database);
  
  // Frontend accessibility
  try {
    const frontendRes = await fetch(FRONTEND_URL);
    recordTest('Health', 'Frontend Server Accessible',
      frontendRes.ok ? 'pass' : 'fail',
      `Status: ${frontendRes.status}`);
  } catch (e) {
    recordTest('Health', 'Frontend Server Accessible', 'fail', e.message);
  }
}

async function testAuthentication() {
  log('\n' + '='.repeat(80), 'magenta');
  log('2. TESTING AUTHENTICATION & LOGIN', 'magenta');
  log('='.repeat(80), 'magenta');
  
  log('\n📝 Please provide login credentials to test:', 'cyan');
  const username = await ask('Username: ');
  const password = await ask('Password: ');
  const companyId = await ask('Company ID (press Enter if none): ');
  
  const loginBody = { username, password };
  if (companyId) loginBody.companyId = companyId;
  
  const loginRes = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginBody)
  });
  
  const loginSuccess = loginRes.ok && loginRes.data?.token;
  recordTest('Auth', 'User Login', loginSuccess ? 'pass' : 'fail',
    loginSuccess ? 'Token received' : loginRes.data?.message);
  
  if (!loginSuccess) {
    log('\n⚠️  Cannot proceed with authenticated tests without login', 'yellow');
    log('Please ensure you have valid credentials', 'yellow');
    return null;
  }
  
  const token = loginRes.data.token;
  const user = loginRes.data.user;
  
  log(`\n✅ Logged in as: ${user.username} (${user.role})`, 'green');
  
  // Test get current user
  const meRes = await makeRequest('/auth/me', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Auth', 'Get Current User', meRes.ok ? 'pass' : 'fail',
    meRes.data ? meRes.data.username : '');
  
  // Test invalid token rejection
  const badTokenRes = await makeRequest('/users', {
    headers: { 'x-auth-token': 'invalid-token' }
  });
  recordTest('Auth', 'Reject Invalid Token', !badTokenRes.ok ? 'pass' : 'fail',
    'Security check');
  
  return { token, user };
}

async function testUserManagement(token, user) {
  log('\n' + '='.repeat(80), 'magenta');
  log('3. TESTING USER MANAGEMENT', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Get all users
  const usersRes = await makeRequest('/users', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Users', 'Fetch Users List', usersRes.ok ? 'pass' : 'fail',
    usersRes.ok ? `${usersRes.data?.length || 0} users` : usersRes.data?.message);
  
  // Get user stats
  const statsRes = await makeRequest('/users/stats', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Users', 'Get User Statistics', statsRes.ok ? 'pass' : 'fail',
    statsRes.data ? `Total: ${statsRes.data.total}` : '');
  
  // Get team members
  const teamRes = await makeRequest('/users/team-members', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Users', 'Get Team Members', teamRes.ok ? 'pass' : 'fail',
    teamRes.data?.teamMembers ? `${teamRes.data.teamMembers.length} members` : '');
  
  // Get pending users (admin only)
  const pendingRes = await makeRequest('/users/pending', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Users', 'Get Pending Users', 
    pendingRes.ok || pendingRes.status === 403 ? 'pass' : 'fail',
    pendingRes.ok ? `${pendingRes.data?.length || 0} pending` : 'Admin only');
}

async function testProjectManagement(token) {
  log('\n' + '='.repeat(80), 'magenta');
  log('4. TESTING PROJECT MANAGEMENT (CRUD)', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Get existing projects
  const getRes = await makeRequest('/projects', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Projects', 'Fetch Projects List', getRes.ok ? 'pass' : 'fail',
    getRes.ok ? `${getRes.data?.length || 0} projects` : '');
  
  log('\n📝 Testing project CRUD operations...', 'cyan');
  
  // CREATE
  const createRes = await makeRequest('/projects', {
    method: 'POST',
    headers: { 'x-auth-token': token },
    body: JSON.stringify({
      title: 'TEST PROJECT - Automated Test',
      description: 'This is a test project created by the automated test suite',
      status: 'active',
      priority: 'medium'
    })
  });
  recordTest('Projects', 'Create New Project', createRes.ok ? 'pass' : 'fail',
    createRes.data?._id ? `ID: ${createRes.data._id.substring(0, 8)}...` : createRes.data?.message);
  
  if (createRes.ok && createRes.data?._id) {
    const projectId = createRes.data._id;
    
    // READ
    const readRes = await makeRequest(`/projects/${projectId}`, {
      headers: { 'x-auth-token': token }
    });
    recordTest('Projects', 'Read Project by ID', readRes.ok ? 'pass' : 'fail',
      readRes.data?.title || '');
    
    // UPDATE
    const updateRes = await makeRequest(`/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'x-auth-token': token },
      body: JSON.stringify({
        title: 'TEST PROJECT - Updated',
        status: 'completed',
        priority: 'high'
      })
    });
    recordTest('Projects', 'Update Project', updateRes.ok ? 'pass' : 'fail',
      'Status changed to completed');
    
    // DELETE
    const deleteRes = await makeRequest(`/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
    recordTest('Projects', 'Delete Project', deleteRes.ok ? 'pass' : 'fail',
      'Test cleanup');
  }
}

async function testDocumentManagement(token) {
  log('\n' + '='.repeat(80), 'magenta');
  log('5. TESTING DOCUMENT MANAGEMENT', 'magenta');
  log('='.repeat(80), 'magenta');
  
  const docsRes = await makeRequest('/documents', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Documents', 'Fetch Documents List', docsRes.ok ? 'pass' : 'fail',
    docsRes.ok ? `${docsRes.data?.length || 0} documents` : '');
}

async function testNotepadFeatures(token) {
  log('\n' + '='.repeat(80), 'magenta');
  log('6. TESTING NOTEPAD / NOTES', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Get notes
  const getRes = await makeRequest('/notepad', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Notes', 'Fetch Notes List', getRes.ok ? 'pass' : 'fail',
    getRes.ok ? `${getRes.data?.length || 0} notes` : '');
  
  // Create note
  const createRes = await makeRequest('/notepad', {
    method: 'POST',
    headers: { 'x-auth-token': token },
    body: JSON.stringify({
      title: 'TEST NOTE - Automated',
      content: '# Test Note\n\nThis is a test note with **bold** and *italic* text.',
      tags: ['test', 'automated']
    })
  });
  recordTest('Notes', 'Create New Note', createRes.ok ? 'pass' : 'fail',
    createRes.data?._id ? 'Created successfully' : createRes.data?.message);
  
  // Cleanup
  if (createRes.ok && createRes.data?._id) {
    await makeRequest(`/notepad/${createRes.data._id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
  }
}

async function testMeetingNotes(token) {
  log('\n' + '='.repeat(80), 'magenta');
  log('7. TESTING MEETING NOTES', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Get meetings
  const meetingsRes = await makeRequest('/meetings', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Meetings', 'Fetch Meetings List', meetingsRes.ok ? 'pass' : 'fail',
    meetingsRes.ok ? `${meetingsRes.data?.length || 0} meetings` : '');
  
  // Get templates
  const templatesRes = await makeRequest('/meeting-templates', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Meetings', 'Fetch Meeting Templates', templatesRes.ok ? 'pass' : 'fail',
    templatesRes.ok ? `${templatesRes.data?.length || 0} templates` : '');
  
  // Create meeting
  const createRes = await makeRequest('/meetings', {
    method: 'POST',
    headers: { 'x-auth-token': token },
    body: JSON.stringify({
      title: 'TEST MEETING - Automated',
      date: new Date().toISOString(),
      attendees: [],
      agenda: 'Test agenda items',
      notes: 'Test meeting notes'
    })
  });
  recordTest('Meetings', 'Create New Meeting', createRes.ok ? 'pass' : 'fail',
    createRes.data?._id ? 'Created successfully' : createRes.data?.message);
  
  // Cleanup
  if (createRes.ok && createRes.data?._id) {
    await makeRequest(`/meetings/${createRes.data._id}`, {
      method: 'DELETE',
      headers: { 'x-auth-token': token }
    });
  }
}

async function testTasksAndGoals(token) {
  log('\n' + '='.repeat(80), 'magenta');
  log('8. TESTING TASKS & GOALS', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Tasks
  const tasksRes = await makeRequest('/tasks', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Tasks', 'Fetch Tasks List', tasksRes.ok ? 'pass' : 'fail',
    tasksRes.ok ? `${tasksRes.data?.length || 0} tasks` : '');
  
  // Goals
  const goalsRes = await makeRequest('/goals', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Goals', 'Fetch Goals List', goalsRes.ok ? 'pass' : 'fail',
    goalsRes.ok ? `${goalsRes.data?.length || 0} goals` : '');
}

async function testReportsAndAnalytics(token) {
  log('\n' + '='.repeat(80), 'magenta');
  log('9. TESTING REPORTS & ANALYTICS', 'magenta');
  log('='.repeat(80), 'magenta');
  
  const reportsRes = await makeRequest('/reports', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Reports', 'Fetch Reports List', reportsRes.ok ? 'pass' : 'fail',
    reportsRes.ok ? `${reportsRes.data?.length || 0} reports` : '');
  
  const sharedRes = await makeRequest('/reports/shared', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Reports', 'Fetch Shared Reports', sharedRes.ok ? 'pass' : 'fail',
    sharedRes.ok ? `${sharedRes.data?.length || 0} shared` : '');
}

async function testNotifications(token) {
  log('\n' + '='.repeat(80), 'magenta');
  log('10. TESTING NOTIFICATIONS', 'magenta');
  log('='.repeat(80), 'magenta');
  
  const notifsRes = await makeRequest('/notifications', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Notifications', 'Fetch Notifications', notifsRes.ok ? 'pass' : 'fail',
    notifsRes.ok ? `${notifsRes.data?.length || 0} notifications` : '');
  
  const unreadRes = await makeRequest('/notifications/unread-count', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Notifications', 'Get Unread Count', unreadRes.ok ? 'pass' : 'fail',
    unreadRes.data ? `Unread: ${unreadRes.data.count}` : '');
}

async function testPaymentSystem(token, user) {
  log('\n' + '='.repeat(80), 'magenta');
  log('11. TESTING PAYMENT SYSTEM', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Get payment settings
  const settingsRes = await makeRequest('/settings/payment', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Payments', 'Fetch Payment Settings', settingsRes.ok ? 'pass' : 'fail',
    settingsRes.data ? 'Settings loaded' : '');
  
  // Get company payments
  const paymentsRes = await makeRequest('/payments/my-company', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Payments', 'Fetch Company Payments', paymentsRes.ok ? 'pass' : 'fail',
    paymentsRes.ok ? `${paymentsRes.data?.length || 0} payments` : '');
  
  // Test all payments (super admin only)
  if (user.role === 'superadmin' || user.role === 'admin') {
    const allPaymentsRes = await makeRequest('/payments', {
      headers: { 'x-auth-token': token }
    });
    recordTest('Payments', 'Fetch All Payments (Admin)', 
      allPaymentsRes.ok || allPaymentsRes.status === 403 ? 'pass' : 'fail',
      allPaymentsRes.ok ? `${allPaymentsRes.data?.length || 0} total` : 'Admin only');
  }
}

async function testCompanyManagement(token, user) {
  log('\n' + '='.repeat(80), 'magenta');
  log('12. TESTING COMPANY MANAGEMENT', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Get companies
  const companiesRes = await makeRequest('/admin/companies', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Company', 'Fetch Companies List', 
    companiesRes.ok || companiesRes.status === 403 ? 'pass' : 'fail',
    companiesRes.ok ? `${companiesRes.data?.length || 0} companies` : 'Super admin only');
  
  // Get current company
  const myCompanyRes = await makeRequest('/auth/my-company', {
    headers: { 'x-auth-token': token }
  });
  recordTest('Company', 'Get My Company Info', myCompanyRes.ok ? 'pass' : 'fail',
    myCompanyRes.data?.name || '');
  
  // Get system stats (super admin only)
  if (user.role === 'superadmin') {
    const statsRes = await makeRequest('/admin/stats', {
      headers: { 'x-auth-token': token }
    });
    recordTest('Company', 'Get System Statistics', statsRes.ok ? 'pass' : 'fail',
      'Super admin access');
  }
}

async function testSecurityFeatures() {
  log('\n' + '='.repeat(80), 'magenta');
  log('13. TESTING SECURITY FEATURES', 'magenta');
  log('='.repeat(80), 'magenta');
  
  // Test no auth access
  const noAuthRes = await makeRequest('/users');
  recordTest('Security', 'Block Unauthenticated Access', !noAuthRes.ok ? 'pass' : 'fail',
    'Protected route');
  
  // Test invalid token
  const badTokenRes = await makeRequest('/users', {
    headers: { 'x-auth-token': 'invalid-token-xyz' }
  });
  recordTest('Security', 'Reject Invalid Token', !badTokenRes.ok ? 'pass' : 'fail',
    'Token validation');
  
  // Test SQL injection
  const sqlRes = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: "admin' OR '1'='1",
      password: "' OR '1'='1"
    })
  });
  recordTest('Security', 'Prevent SQL Injection', !sqlRes.ok ? 'pass' : 'fail',
    'Input sanitization');
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  log('\n' + '█'.repeat(80), 'magenta');
  log('  🧪 COMPREHENSIVE SYSTEM TEST SUITE', 'white');
  log('  Testing All Pages and Functionality', 'white');
  log('█'.repeat(80) + '\n', 'magenta');
  
  log(`Frontend: ${FRONTEND_URL}`, 'cyan');
  log(`Backend:  ${BASE_URL}`, 'cyan');
  log(`Started:  ${new Date().toLocaleString()}\n`, 'cyan');
  
  try {
    // 1. Health check
    await testHealthAndConnectivity();
    
    // 2. Authentication (interactive)
    const authData = await testAuthentication();
    
    if (!authData) {
      log('\n⚠️  Skipping authenticated tests - login required', 'yellow');
      await testSecurityFeatures();
    } else {
      const { token, user } = authData;
      
      // 3-13. All feature tests
      await testUserManagement(token, user);
      await testProjectManagement(token);
      await testDocumentManagement(token);
      await testNotepadFeatures(token);
      await testMeetingNotes(token);
      await testTasksAndGoals(token);
      await testReportsAndAnalytics(token);
      await testNotifications(token);
      await testPaymentSystem(token, user);
      await testCompanyManagement(token, user);
      await testSecurityFeatures();
    }
    
  } catch (error) {
    log(`\n💥 Error: ${error.message}`, 'red');
    console.error(error);
  }
  
  // Print summary
  log('\n' + '='.repeat(80), 'cyan');
  log('  📊 TEST SUMMARY', 'cyan');
  log('='.repeat(80), 'cyan');
  
  log(`  Total Tests:    ${results.total}`, 'white');
  log(`  ✅ Passed:      ${results.passed}`, 'green');
  log(`  ❌ Failed:      ${results.failed}`, 'red');
  log(`  ⏭️  Skipped:     ${results.skipped}`, 'yellow');
  
  const successRate = results.total > 0 
    ? ((results.passed / results.total) * 100).toFixed(1)
    : 0;
  
  const rateColor = successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red';
  log(`\n  🎯 Success Rate: ${successRate}%`, rateColor);
  
  if (results.failed > 0) {
    log('\n  Failed Tests:', 'red');
    results.tests.filter(t => t.status === 'fail').forEach(t => {
      log(`    • [${t.category}] ${t.name}`, 'red');
      if (t.details) log(`      ${t.details}`, 'yellow');
    });
  }
  
  log(`\n  Completed: ${new Date().toLocaleString()}`, 'cyan');
  log('='.repeat(80) + '\n', 'cyan');
  
  // Next steps
  log('📋 NEXT STEPS:', 'cyan');
  log('  1. Review the test results above', 'white');
  log('  2. Open your browser and test the UI manually', 'white');
  log(`  3. Visit: ${FRONTEND_URL}`, 'white');
  log('  4. Follow COMPLETE_TESTING_GUIDE.md for detailed manual tests\n', 'white');
  
  rl.close();
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runAllTests();

