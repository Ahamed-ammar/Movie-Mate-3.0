import axios from 'axios';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

// Helper function to extract API key from JWT token
const extractApiKeyFromJWT = (token) => {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Extract API key from 'aud' (audience) claim 
    return payload.aud || null;
  } catch (error) {
    return null;
  }
};

// Function to get the API key (with JWT extraction if needed)
// This is called lazily to ensure environment variables are loaded
const getApiKey = () => {
  let apiKey = process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.trim() : null;
  
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    return null;
  }
  
  // Check if it's a JWT token and extract the API key
  const isJWT = apiKey.startsWith('eyJhbGci') || apiKey.startsWith('eyJ');
  if (isJWT) {
    const extractedKey = extractApiKeyFromJWT(apiKey);
    if (extractedKey) {
      return extractedKey;
    }
  }
  
  return apiKey;
};

// Cached API key (extracted lazily)
let cachedApiKey = null;
let extractionLogged = false;

// Function to get API key with caching and logging
const getCachedApiKey = () => {
  if (cachedApiKey === null) {
    cachedApiKey = getApiKey();
    
    if (!cachedApiKey || cachedApiKey === 'your_tmdb_api_key_here' || cachedApiKey.length < 10) {
      console.warn('⚠️  WARNING: TMDB_API_KEY is not set or using default value!');
      console.warn('   Please set a valid TMDB API key in your .env file');
      console.warn('   Get your API key at: https://www.themoviedb.org/settings/api');
    } else {
      // Only log extraction if we extracted from JWT (once)
      if (!extractionLogged) {
        const originalKey = process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.trim() : null;
        const isJWT = originalKey && (originalKey.startsWith('eyJhbGci') || originalKey.startsWith('eyJ'));
        if (isJWT) {
          console.log('✓ Extracted TMDB API key from JWT token');
        }
        extractionLogged = true;
      }
    }
  }
  return cachedApiKey;
};

// Get TMDB API instance - use interceptor to add API key dynamically
const tmdbAPI = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000 // 10 second timeout
});

// Add request interceptor to inject API key dynamically
tmdbAPI.interceptors.request.use((config) => {
  const apiKey = getCachedApiKey();
  if (apiKey) {
    config.params = config.params || {};
    config.params.api_key = apiKey;
  }
  return config;
});

// Helper function to handle TMDB API errors
const handleTMDBError = (error, operation) => {
  const apiKey = getCachedApiKey();
  if (!apiKey || apiKey === 'your_tmdb_api_key_here' || apiKey.length < 10) {
    return new Error('TMDB API key is not configured. Please set a valid TMDB_API_KEY in your .env file. Get your key at: https://www.themoviedb.org/settings/api');
  }

  if (error.response) {
    // TMDB API returned an error response
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      return new Error('TMDB API key is invalid or expired. Please check your TMDB_API_KEY in .env file');
    }
    
    if (status === 404) {
      return new Error(`TMDB API: Resource not found (${operation})`);
    }
    
    if (status === 429) {
      return new Error('TMDB API: Rate limit exceeded. Please try again later');
    }
    
    return new Error(`TMDB API Error (${operation}): ${data.status_message || data.message || error.message} (Status: ${status})`);
  }
  
  if (error.request) {
    // Request was made but no response received
    return new Error(`TMDB API: No response received (${operation}). Check your internet connection.`);
  }
  
  // Something else happened
  return new Error(`TMDB API Error (${operation}): ${error.message}`);
};

// Search movies by title
export const searchMovies = async (query, page = 1) => {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }
  
  try {
    const response = await tmdbAPI.get('/search/movie', {
      params: {
        query: query.trim(),
        page,
        include_adult: false
      }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'searchMovies');
  }
};

// Get movie details by TMDB ID
export const getMovieDetails = async (tmdbId) => {
  if (!tmdbId) {
    throw new Error('TMDB ID is required');
  }
  
  try {
    const response = await tmdbAPI.get(`/movie/${tmdbId}`, {
      params: {
        append_to_response: 'credits'
      }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getMovieDetails');
  }
};

// Get trending movies
export const getTrendingMovies = async (timeWindow = 'day', page = 1) => {
  if (!['day', 'week'].includes(timeWindow)) {
    throw new Error('Time window must be "day" or "week"');
  }
  
  try {
    const response = await tmdbAPI.get(`/trending/movie/${timeWindow}`, {
      params: { page }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getTrendingMovies');
  }
};

// Get popular movies
export const getPopularMovies = async (page = 1) => {
  try {
    const response = await tmdbAPI.get('/movie/popular', {
      params: { page }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getPopularMovies');
  }
};

// Get movies by genre
export const getMoviesByGenre = async (genreId, page = 1) => {
  if (!genreId) {
    throw new Error('Genre ID is required');
  }
  
  try {
    const response = await tmdbAPI.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc'
      }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getMoviesByGenre');
  }
};

// Get movies by year
export const getMoviesByYear = async (year, page = 1) => {
  if (!year || isNaN(year)) {
    throw new Error('Valid year is required');
  }
  
  try {
    const response = await tmdbAPI.get('/discover/movie', {
      params: {
        primary_release_year: parseInt(year),
        page,
        sort_by: 'popularity.desc'
      }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getMoviesByYear');
  }
};

// Get genre list
export const getGenres = async () => {
  try {
    const response = await tmdbAPI.get('/genre/movie/list');
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getGenres');
  }
};

// Get watch providers (streaming services)
export const getWatchProviders = async (region = 'US') => {
  try {
    const response = await tmdbAPI.get('/watch/providers/movie', {
      params: {
        watch_region: region
      }
    });
    // TMDB returns { results: { US: { flatrate: [...], rent: [...], buy: [...] }, ... } }
    // We want the flatrate (streaming) providers for the specified region
    const regionData = response.data.results?.[region] || {};
    return {
      results: regionData.flatrate || [],
      region
    };
  } catch (error) {
    throw handleTMDBError(error, 'getWatchProviders');
  }
};

// Get movies by watch provider
export const getMoviesByProvider = async (providerId, page = 1) => {
  if (!providerId) {
    throw new Error('Provider ID is required');
  }
  
  try {
    const response = await tmdbAPI.get('/discover/movie', {
      params: {
        with_watch_providers: providerId,
        watch_region: 'US',
        page,
        sort_by: 'popularity.desc'
      }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getMoviesByProvider');
  }
};

// Get movies by filter type (for "OTHER" category)
export const getMoviesByFilter = async (filterType, page = 1) => {
  let endpoint = '';
  let params = { page };
  
  switch (filterType) {
    case 'top_rated':
      endpoint = '/movie/top_rated';
      break;
    case 'now_playing':
      endpoint = '/movie/now_playing';
      break;
    case 'upcoming':
      endpoint = '/movie/upcoming';
      break;
    default:
      throw new Error(`Invalid filter type: ${filterType}`);
  }
  
  try {
    const response = await tmdbAPI.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getMoviesByFilter');
  }
};

// Transform TMDB movie data to our format
export const transformMovieData = (tmdbMovie) => {
  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    overview: tmdbMovie.overview || '',
    poster: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
    backdrop: tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}` : '',
    releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
    genres: tmdbMovie.genres ? tmdbMovie.genres.map(g => g.name) : [],
    rating: tmdbMovie.vote_average || 0
  };
};
