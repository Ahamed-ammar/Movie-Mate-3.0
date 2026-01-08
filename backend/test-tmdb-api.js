// Script to test TMDB API connection and key
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables BEFORE importing services
// Explicitly specify the .env file path
dotenv.config({ path: join(__dirname, '.env') });

import { getGenres, getPopularMovies } from './src/services/tmdbService.js';

console.log('\n🔍 Testing TMDB API Connection...\n');

// Check if API key is set
const apiKey = process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.trim() : null;

if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
  console.error('❌ ERROR: TMDB_API_KEY is not set in .env file!');
  console.error('\n📝 Steps to fix:');
  console.error('   1. Get your API key from: https://www.themoviedb.org/settings/api');
  console.error('   2. Add it to backend/.env file as: TMDB_API_KEY=your_actual_key_here');
  console.error('   3. See backend/HOW_TO_GET_TMDB_API_KEY.md for detailed instructions');
  process.exit(1);
}

// Check if it's a JWT token (Bearer token) - this is valid for TMDB API v4
const isBearerToken = apiKey.startsWith('eyJhbGci') || apiKey.startsWith('eyJ');

if (isBearerToken) {
  console.log('✓ TMDB Bearer Token detected (JWT format)');
  console.log(`✓ Token found: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
} else {
  console.log(`✓ TMDB API Key found: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
}
console.log('');

// Test API connection
async function testConnection() {
  try {
    console.log('Testing: Get Genres...');
    const genres = await getGenres();
    console.log(`✓ Success! Found ${genres.genres.length} genres`);
    
    console.log('\nTesting: Get Popular Movies...');
    const movies = await getPopularMovies(1);
    console.log(`✓ Success! Found ${movies.results.length} popular movies`);
    
    console.log('\n✅ TMDB API is working correctly!\n');
  } catch (error) {
    console.error('\n❌ TMDB API Error:', error.message);
    console.error('\n📝 Troubleshooting:');
    
    if (error.message.includes('API key')) {
      console.error('   - Check if your API key is correct');
      console.error('   - Verify your API key at: https://www.themoviedb.org/settings/api');
      console.error('   - Make sure there are no extra spaces in .env file');
    } else if (error.message.includes('No response')) {
      console.error('   - Check your internet connection');
      console.error('   - TMDB API might be temporarily unavailable');
    } else if (error.message.includes('Rate limit')) {
      console.error('   - Too many requests. Wait a few minutes and try again');
    } else {
      console.error('   - Check the error message above for details');
    }
    
    process.exit(1);
  }
}

testConnection();
