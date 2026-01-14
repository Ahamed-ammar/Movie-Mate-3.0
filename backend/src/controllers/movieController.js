import mongoose from 'mongoose';
import fs from 'fs';
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
  transformMovieData,
  searchPerson,
  getPersonMovieCredits
} from '../services/tmdbService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const logPath = 'f:\\Main Projects\\Movie-Mate\\.cursor\\debug.log';

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

  // Check if ID is a valid number (TMDB ID) or MongoDB ObjectId
  const tmdbId = parseInt(id);
  if (isNaN(tmdbId) || tmdbId <= 0) {
    // If not a valid TMDB ID, check if it's a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      // It's a MongoDB ObjectId, find the movie and get its tmdbId
      const movie = await Movie.findById(id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          error: 'Movie not found'
        });
      }
      // Use the movie's tmdbId to fetch from TMDB
      const tmdbMovie = await getTMDBMovieDetails(movie.tmdbId);
      // Continue with existing logic...
      const movieData = transformMovieData(tmdbMovie);
      
      // Update existing cached movie
      Object.assign(movie, movieData);
      await movie.save();

      // Extract credits from TMDB response
      const credits = tmdbMovie.credits || {};
      const director = credits.crew?.find(person => person.job === 'Director');
      const actors = credits.cast?.slice(0, 10) || [];

      return res.json({
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
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid movie ID format. Expected TMDB ID (number) or MongoDB ObjectId.'
      });
    }
  }

  // Try to find movie in cache first
  let movie = await Movie.findOne({ tmdbId: tmdbId });
  
  // Always try to fetch fresh data from TMDB to get credits (director, actors)
  let tmdbMovie;
  try {
    tmdbMovie = await getTMDBMovieDetails(tmdbId);
  } catch (error) {
    // If TMDB API fails but we have cached movie, use cached data
    if (movie) {
      console.warn(`TMDB API failed for movie ${tmdbId}, using cached data:`, error.message);
      // Return cached movie without credits
      return res.json({
        success: true,
        data: { 
          movie: {
            ...movie.toObject(),
            director: null,
            actors: []
          }
        }
      });
    } else {
      // No cached movie and TMDB failed, return error
      throw error;
    }
  }
  
  // Transform movie data
  const movieData = transformMovieData(tmdbMovie);
  
  // Update or create movie in cache
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
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:233',message:'getPopular called',data:{page:req.query.page},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n'); } catch(e) {}
  // #endregion
  const { page = 1 } = req.query;
  
  try {
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:236',message:'Calling getPopularMovies',data:{page},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n'); } catch(e) {}
    // #endregion
    const results = await getPopularMovies(page);
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:238',message:'getPopularMovies successful',data:{resultCount:results?.results?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n'); } catch(e) {}
    // #endregion

    const movies = results.results.map(movie => transformMovieData(movie));
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:240',message:'Sending response',data:{movieCount:movies.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n'); } catch(e) {}
    // #endregion

    res.json({
      success: true,
      data: {
        movies,
        page: results.page,
        totalPages: results.total_pages
      }
    });
  } catch (error) {
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:248',message:'Error in getPopular',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'}) + '\n'); } catch(e) {}
    // #endregion
    throw error;
  }
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
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:295',message:'getGenresList called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n'); } catch(e) {}
  // #endregion
  try {
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:296',message:'Calling getGenres',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n'); } catch(e) {}
    // #endregion
    const results = await getGenres();
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:298',message:'getGenres successful',data:{genreCount:results?.genres?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n'); } catch(e) {}
    // #endregion

    res.json({
      success: true,
      data: {
        genres: results.genres
      }
    });
  } catch (error) {
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'movieController.js:304',message:'Error in getGenresList',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'}) + '\n'); } catch(e) {}
    // #endregion
    throw error;
  }
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

// @desc    Get movies by person (actor/director)
// @route   GET /api/movies/person/:personName
// @access  Public
export const getByPerson = asyncHandler(async (req, res) => {
  const { personName } = req.params;
  const { page = 1, role } = req.query; // role can be 'cast' or 'crew'

  // First, search for the person by name
  const personResults = await searchPerson(personName);
  
  if (!personResults.results || personResults.results.length === 0) {
    return res.json({
      success: true,
      data: {
        movies: [],
        page: 1,
        totalPages: 0,
        person: null
      }
    });
  }

  // Get the first matching person
  const person = personResults.results[0];
  
  // Get their movie credits
  const credits = await getPersonMovieCredits(person.id);
  
  let movies = [];
  
  if (role === 'cast') {
    // Get movies where they acted
    movies = credits.cast || [];
  } else if (role === 'crew') {
    // Get movies where they were crew (director, writer, etc.)
    movies = credits.crew || [];
  } else {
    // Get all their movies (both cast and crew)
    movies = [...(credits.cast || []), ...(credits.crew || [])];
  }
  
  // Remove duplicates by movie id (person might have multiple roles in same movie)
  const uniqueMoviesMap = new Map();
  movies.forEach(movie => {
    if (!uniqueMoviesMap.has(movie.id)) {
      uniqueMoviesMap.set(movie.id, movie);
    }
  });
  movies = Array.from(uniqueMoviesMap.values());
  
  // Sort by popularity
  movies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  
  const startIndex = (page - 1) * 20;
  const endIndex = startIndex + 20;
  const paginatedMovies = movies.slice(startIndex, endIndex);
  
  const transformedMovies = paginatedMovies.map(movie => transformMovieData(movie));

  res.json({
    success: true,
    data: {
      movies: transformedMovies,
      page: parseInt(page),
      totalPages: Math.ceil(movies.length / 20),
      person: {
        id: person.id,
        name: person.name,
        profile_path: person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : null
      }
    }
  });
});
