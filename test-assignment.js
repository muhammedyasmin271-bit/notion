// Test script to verify project assignment functionality
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔍 Project Assignment Test');
console.log('========================');
console.log('');
console.log('This test will help you verify the project assignment functionality.');
console.log('');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testAssignment() {
  try {
    console.log('📋 Steps to test project assignment:');
    console.log('');
    console.log('1. Open your browser and go to process.env.Backendurl');
    console.log('2. Login as a manager (admin@example.com / admin123)');
    console.log('3. Go to Projects page');
    console.log('4. Create a new project or edit an existing one');
    console.log('5. In the assignment field, enter a username (e.g., "john" or "jane")');
    console.log('6. Save the project');
    console.log('7. Login as the assigned user to check if they received the project');
    console.log('');
    
    await askQuestion('Press Enter when you have completed the test...');
    
    console.log('');
    console.log('🔧 Troubleshooting checklist:');
    console.log('');
    console.log('✅ Backend server running on port 9000?');
    console.log('✅ Frontend server running on port 3000?');
    console.log('✅ MongoDB database connected?');
    console.log('✅ Users exist in the database?');
    console.log('✅ Manager role has permission to assign projects?');
    console.log('✅ Assignment field is not disabled?');
    console.log('');
    
    const hasIssue = await askQuestion('Are you experiencing any issues? (y/n): ');
    
    if (hasIssue.toLowerCase() === 'y') {
      console.log('');
      console.log('🛠️  Common solutions:');
      console.log('');
      console.log('1. Check browser console for JavaScript errors');
      console.log('2. Check server logs for API errors');
      console.log('3. Verify the user exists in the database');
      console.log('4. Make sure you are logged in as a manager');
      console.log('5. Try refreshing the page and trying again');
      console.log('');
      console.log('💡 The assignment field should accept usernames like:');
      console.log('   - "john" (single user)');
      console.log('   - "john, jane" (multiple users)');
      console.log('');
    } else {
      console.log('');
      console.log('🎉 Great! The assignment functionality is working correctly.');
      console.log('');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    rl.close();
  }
}

testAssignment();