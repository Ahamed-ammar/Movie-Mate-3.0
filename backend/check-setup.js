// Comprehensive setup checker for backend
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

console.log('\n🔍 Checking Backend Setup...\n');

let hasErrors = false;

// Check environment variables
console.log('1. Checking Environment Variables:');
const requiredEnvVars = {
  'PORT': process.env.PORT || '5000 (using default)',
  'MONGODB_URI': process.env.MONGODB_URI ? '✓ Set' : '✗ NOT SET',
  'JWT_ACCESS_SECRET': process.env.JWT_ACCESS_SECRET ? 
    (process.env.JWT_ACCESS_SECRET.length > 30 ? '✓ Set' : '✗ Too short') : '✗ NOT SET',
  'JWT_REFRESH_SECRET': process.env.JWT_REFRESH_SECRET ? 
    (process.env.JWT_REFRESH_SECRET.length > 30 ? '✓ Set' : '✗ Too short') : '✗ NOT SET',
  'TMDB_API_KEY': process.env.TMDB_API_KEY ? 
    (process.env.TMDB_API_KEY === 'your_tmdb_api_key_here' ? '✗ Using placeholder' :
     process.env.TMDB_API_KEY.startsWith('eyJ') ? '✗ This is a JWT token, not TMDB API key' :
     process.env.TMDB_API_KEY.length < 10 ? '✗ Too short' : '✓ Set') : '✗ NOT SET',
  'NODE_ENV': process.env.NODE_ENV || 'development (using default)',
  'FRONTEND_URL': process.env.FRONTEND_URL || 'http://localhost:5173 (using default)'
};

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  const status = value.startsWith('✗') ? '❌' : value.startsWith('✓') ? '✅' : 'ℹ️';
  console.log(`   ${status} ${key}: ${value}`);
  if (value.startsWith('✗')) hasErrors = true;
});

// Test MongoDB connection
console.log('\n2. Testing MongoDB Connection:');
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb+srv://username:password@cluster.mongodb.net/moviemate?retryWrites=true&w=majority') {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('   ✅ MongoDB connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  Skipping (MONGODB_URI not configured)');
  hasErrors = true;
}

// Test TMDB API
console.log('\n3. Testing TMDB API:');
if (process.env.TMDB_API_KEY && 
    process.env.TMDB_API_KEY !== 'your_tmdb_api_key_here' &&
    !process.env.TMDB_API_KEY.startsWith('eyJ')) {
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
      params: { api_key: process.env.TMDB_API_KEY },
      timeout: 10000
    });
    console.log('   ✅ TMDB API connection successful');
    console.log(`   ℹ️  Found ${response.data.genres.length} movie genres`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ❌ TMDB API key is invalid or expired');
    } else if (error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
      console.log('   ❌ Cannot connect to TMDB API. Check internet connection.');
    } else {
      console.log('   ❌ TMDB API error:', error.message);
    }
    hasErrors = true;
  }
} else {
  console.log('   ⚠️  Skipping (TMDB_API_KEY not configured or invalid)');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Setup incomplete. Please fix the errors above.\n');
  console.log('📝 Quick fixes:');
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('username:password')) {
    console.log('   - Set MONGODB_URI in backend/.env');
  }
  if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === 'your_tmdb_api_key_here') {
    console.log('   - Set TMDB_API_KEY in backend/.env');
    console.log('   - See backend/HOW_TO_GET_TMDB_API_KEY.md for instructions');
  }
  process.exit(1);
} else {
  console.log('✅ All checks passed! Backend is ready to run.\n');
  process.exit(0);
}

