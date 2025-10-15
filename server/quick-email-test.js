require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing Email Configuration...\n');
console.log('Host:', process.env.EMAIL_HOST);
console.log('Port:', process.env.EMAIL_PORT);
console.log('User:', process.env.EMAIL_USER);
console.log('Pass:', process.env.EMAIL_PASS ? 'Set (***' + process.env.EMAIL_PASS.slice(-3) + ')' : 'NOT SET');
console.log('\n---\n');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true,
  logger: true
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: 'Test Email - ' + new Date().toLocaleTimeString(),
  html: '<h1>Email is Working!</h1><p>Sent at: ' + new Date().toLocaleString() + '</p>'
})
.then(info => {
  console.log('\n✅ SUCCESS!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
  console.log('\nCheck your inbox at:', process.env.EMAIL_USER);
  process.exit(0);
})
.catch(err => {
  console.log('\n❌ ERROR:');
  console.error(err);
  process.exit(1);
});

