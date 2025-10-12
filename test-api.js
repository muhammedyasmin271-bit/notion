// Simple test script to verify the API is working
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoints...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:9000/api/health');
    const healthData = await healthResponse.json();
    console.log('🏥 Health check:', healthData);
    
    // Test login to get token
    const loginResponse = await fetch('http://localhost:9000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'aymen',
        password: '7749'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // Test team members endpoint
    const teamResponse = await fetch('http://localhost:9000/api/users/team-members', {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (teamResponse.ok) {
      const teamData = await teamResponse.json();
      console.log('👥 Team members:', teamData.teamMembers?.length || 0);
    } else {
      console.log('❌ Team members failed:', await teamResponse.text());
    }
    
    // Test creating a simple report
    const reportData = {
      title: 'Test Report API',
      description: 'Testing API functionality',
      blocks: [{ id: 'block-1', type: 'text', content: 'Test content', style: {} }],
      tableData: {},
      attachments: [],
      sharedWith: []
    };
    
    const reportResponse = await fetch('http://localhost:9000/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(reportData)
    });
    
    const reportResult = await reportResponse.json();
    console.log('📝 Report creation:', {
      status: reportResponse.status,
      success: reportResult.success,
      message: reportResult.message
    });
    
    if (reportResponse.ok) {
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Report creation failed:', reportResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();