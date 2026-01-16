import axios from 'axios';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

const isJwtToken = (value) => {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split('.');
  return parts.length === 3 && value.startsWith('eyJ');
};

// Function to get the TMDB auth config (v3 API key or v4 access token)
const getAuthConfig = () => {
  const rawValue = process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.trim() : null;

  if (!rawValue || rawValue === 'your_tmdb_api_key_here') {
    return null;
  }

  if (isJwtToken(rawValue)) {
    return { type: 'v4', token: rawValue };
  }

  return { type: 'v3', key: rawValue };
};

// Cached auth config (resolved lazily)
let cachedAuth = null;
let authLogged = false;

const getCachedAuth = () => {
  if (cachedAuth === null) {
    cachedAuth = getAuthConfig();

    if (!cachedAuth || (cachedAuth.type === 'v3' && cachedAuth.key.length < 10)) {
      console.warn('⚠️  WARNING: TMDB_API_KEY is not set or invalid!');
      console.warn('   Use a TMDB v3 API key or v4 access token in your .env file');
      console.warn('   Get your API key at: https://www.themoviedb.org/settings/api');
    } else if (!authLogged) {
      console.log(`✓ TMDB auth configured (${cachedAuth.type})`);
      authLogged = true;
    }
  }
  return cachedAuth;
};

// Get TMDB API instance - use interceptor to add API key dynamically
const tmdbAPI = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000 // 10 second timeout
});

// Add request interceptor to inject API key dynamically
tmdbAPI.interceptors.request.use((config) => {
  const auth = getCachedAuth();
  if (auth?.type === 'v3') {
    config.params = config.params || {};
    config.params.api_key = auth.key;
  }
  if (auth?.type === 'v4') {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

// Helper function to handle TMDB API errors
const handleTMDBError = (error, operation) => {
  const auth = getCachedAuth();
  if (!auth || (auth.type === 'v3' && auth.key.length < 10)) {
    return new Error('TMDB API key is not configured. Please set a valid TMDB_API_KEY (v3 key or v4 token) in your .env file. Get your key at: https://www.themoviedb.org/settings/api');
  }

  if (error.response) {
    // TMDB API returned an error response
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      return new Error('TMDB API credentials are invalid or expired. Please check your TMDB_API_KEY in .env file');
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
// Search for a person by name
export const searchPerson = async (query) => {
  if (!query || query.trim().length === 0) {
    throw new Error('Person name cannot be empty');
  }
  
  try {
    const response = await tmdbAPI.get('/search/person', {
      params: {
        query: query.trim(),
        page: 1
      }
    });
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'searchPerson');
  }
};

// Get person's movie credits by person ID
export const getPersonMovieCredits = async (personId) => {
  if (!personId) {
    throw new Error('Person ID is required');
  }
  
  try {
    const response = await tmdbAPI.get(`/person/${personId}/movie_credits`);
    return response.data;
  } catch (error) {
    throw handleTMDBError(error, 'getPersonMovieCredits');
  }
};

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
