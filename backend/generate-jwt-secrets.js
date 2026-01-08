// Script to generate JWT secrets for .env file
import crypto from 'crypto';

const accessSecret = crypto.randomBytes(64).toString('hex');
const refreshSecret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Generated JWT Secrets:\n');
console.log('JWT_ACCESS_SECRET=' + accessSecret);
console.log('\nJWT_REFRESH_SECRET=' + refreshSecret);
console.log('\n✅ Copy these values to your .env file\n');
