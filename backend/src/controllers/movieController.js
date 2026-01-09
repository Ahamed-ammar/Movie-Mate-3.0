import Movie from '../models/Movie.js';
import {
  searchMovies,
  getMovieDetails as getTMDBMovieDetails,
  getTrendingMovies,
  getPopularMovies,
  getMoviesByGenre,
  getMoviesByYear,
  getGenres,
  getWatchProviders,
  getMoviesByProvider,
  getMoviesByFilter,
  transformMovieData
} from '../services/tmdbService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Search movies
// @route   GET /api/movies/search
// @access  Public
export const searchMoviesHandler = asyncHandler(async (req, res) => {
  const { query, page = 1 } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const results = await searchMovies(query, page);

  // Check which movies are already cached
  const tmdbIds = results.results.map(movie => movie.id);
  const cachedMovies = await Movie.find({ tmdbId: { $in: tmdbIds } });

  // Transform results and mark cached status
  const movies = results.results.map(tmdbMovie => {
    const cached = cachedMovies.find(m => m.tmdbId === tmdbMovie.id);
    return {
      ...transformMovieData(tmdbMovie),
      cached: !!cached,
      _id: cached?._id
    };
  });

  res.json({
    success: true,
    data: {
      movies,
      page: results.page,
      totalPages: results.total_pages,
      totalResults: results.total_results
    }
  });
});

// @desc    Get movie by ID (from cache or TMDB)
// @route   GET /api/movies/:id
// @access  Public
export const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Always fetch fresh data from TMDB to get credits (director, actors)
  const tmdbMovie = await getTMDBMovieDetails(parseInt(id));
  
  // Transform movie data
  const movieData = transformMovieData(tmdbMovie);
  
  // Try to find in cache and update, or create new
  let movie = await Movie.findOne({ tmdbId: parseInt(id) });
  if (movie) {
    // Update existing cached movie
    Object.assign(movie, movieData);
    await movie.save();
  } else {
    // Create new cached movie
    movie = await Movie.create(movieData);
  }

  // Extract credits from TMDB response
  const credits = tmdbMovie.credits || {};
  const director = credits.crew?.find(person => person.job === 'Director');
  const actors = credits.cast?.slice(0, 10) || []; // Top 10 actors

  res.json({
    success: true,
    data: { 
      movie: {
        ...movie.toObject(),
        director: director ? {
          name: director.name,
          profile_path: director.profile_path ? `https://image.tmdb.org/t/p/w200${director.profile_path}` : null
        } : null,
        actors: actors.map(actor => ({
          name: actor.name,
          character: actor.character,
          profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : null
        }))
      }
    }
  });
});

// @desc    Cache movie from TMDB
// @route   POST /api/movies/cache
// @access  Private (internal use)
export const cacheMovie = asyncHandler(async (req, res) => {
  const { tmdbId } = req.body;

  // Check if already cached
  let movie = await Movie.findOne({ tmdbId: parseInt(tmdbId) });
  if (movie) {
    return res.json({
      success: true,
      data: { movie },
      message: 'Movie already cached'
    });
  }

  // Fetch from TMDB
  const tmdbMovie = await getTMDBMovieDetails(parseInt(tmdbId));
  
  // Transform and save
  const movieData = transformMovieData(tmdbMovie);
  movie = await Movie.create(movieData);

  res.status(201).json({
    success: true,
    data: { movie }
  });
});

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
export const getTrending = asyncHandler(async (req, res) => {
  const { timeWindow = 'day', page = 1 } = req.query;
  
  const results = await getTrendingMovies(timeWindow, page);

  const movies = results.results.map(movie => transformMovieData(movie));

  res.json({
    success: true,
    data: {
      movies,
      page: results.page,
      totalPages: results.total_pages
    }
  });
});

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
export const getPopular = asyncHandler(async (req, res) => {
  const { page = 1 } = req.query;
  
  const results = await getPopularMovies(page);

  const movies = results.results.map(movie => transformMovieData(movie));

  res.json({
    success: true,
    data: {
      movies,
      page: results.page,
      totalPages: results.total_pages
    }
  });
});

// @desc    Get movies by genre
// @route   GET /api/movies/genre/:genreId
// @access  Public
export const getByGenre = asyncHandler(async (req, res) => {
  const { genreId } = req.params;
  const { page = 1 } = req.query;

  const results = await getMoviesByGenre(genreId, page);

  const movies = results.results.map(movie => transformMovieData(movie));

  res.json({
    success: true,
    data: {
      movies,
      page: results.page,
      totalPages: results.total_pages
    }
  });
});

// @desc    Get movies by year
// @route   GET /api/movies/year/:year
// @access  Public
export const getByYear = asyncHandler(async (req, res) => {
  const { year } = req.params;
  const { page = 1 } = req.query;

  const results = await getMoviesByYear(year, page);

  const movies = results.results.map(movie => transformMovieData(movie));

  res.json({
    success: true,
    data: {
      movies,
      page: results.page,
      totalPages: results.total_pages
    }
  });
});

// @desc    Get genres list
// @route   GET /api/movies/genres
// @access  Public
export const getGenresList = asyncHandler(async (req, res) => {
  const results = await getGenres();

  res.json({
    success: true,
    data: {
      genres: results.genres
    }
  });
});

// @desc    Get watch providers list
// @route   GET /api/movies/providers
// @access  Public
export const getProvidersList = asyncHandler(async (req, res) => {
  try {
    const results = await getWatchProviders();
    // Results are already filtered to flatrate providers
    const streamingProviders = results.results || [];
    
    res.json({
      success: true,
      data: {
        providers: streamingProviders.map(provider => ({
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          logo_path: provider.logo_path
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.json({
      success: true,
      data: {
        providers: []
      }
    });
  }
});

// @desc    Get movies by watch provider
// @route   GET /api/movies/provider/:providerId
// @access  Public
export const getByProvider = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { page = 1 } = req.query;

  const results = await getMoviesByProvider(providerId, page);

  const movies = results.results.map(movie => transformMovieData(movie));

  res.json({
    success: true,
    data: {
      movies,
      page: results.page,
      totalPages: results.total_pages
    }
  });
});

// @desc    Get movies by filter (top_rated, now_playing, upcoming)
// @route   GET /api/movies/filter/:filterType
// @access  Public
export const getByFilter = asyncHandler(async (req, res) => {
  const { filterType } = req.params;
  const { page = 1 } = req.query;

  const results = await getMoviesByFilter(filterType, page);

  const movies = results.results.map(movie => transformMovieData(movie));

  res.json({
    success: true,
    data: {
      movies,
      page: results.page,
      totalPages: results.total_pages
    }
  });
});
