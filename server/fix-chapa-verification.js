const fs = require('fs');

// Read the payments.js file
let content = fs.readFileSync('routes/payments.js', 'utf8');

// Replace all occurrences of 'successful' with 'success' in verification logic
content = content.replace(/transactionStatus === 'successful'/g, "transactionStatus === 'success'");

// Write back to file
fs.writeFileSync('routes/payments.js', content);

console.log('✅ Fixed Chapa verification logic - changed "successful" to "success"');