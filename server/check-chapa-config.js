/**
 * Quick script to check if Chapa is configured
 * Run: node check-chapa-config.js
 */

require('dotenv').config();

const CHAPA_TOKEN = process.env.CHAPA_TOKEN || process.env.CHAPA_SECRET_KEY;
const CHAPA_API = process.env.CHAPA_API || 'https://api.chapa.co/v1';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

console.log('\n🔍 Checking Chapa Configuration...\n');

if (!CHAPA_TOKEN) {
  console.error('❌ CHAPA_TOKEN is NOT configured!');
  console.error('\n📝 To fix this:');
  console.error('1. Open server/.env file');
  console.error('2. Add this line:');
  console.error('   CHAPA_TOKEN=your_chapa_api_key_here');
  console.error('3. Get your API key from: https://developer.chapa.co/');
  console.error('4. Restart your server after adding the token\n');
  process.exit(1);
} else {
  console.log('✅ CHAPA_TOKEN is configured');
  console.log(`   Token: ${CHAPA_TOKEN.substring(0, 20)}...`);
}

console.log(`✅ CHAPA_API: ${CHAPA_API}`);
console.log(`✅ BASE_URL: ${BASE_URL}`);

console.log('\n✅ Chapa is properly configured!');
console.log('   You can now use the payment feature.\n');

