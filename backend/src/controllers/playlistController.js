import fs from 'fs';
import PlayList from '../models/PlayList.js';
import Movie from '../models/Movie.js';
import {
  getMovieDetails as getTMDBMovieDetails,
  transformMovieData
} from '../services/tmdbService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const logPath = 'f:\\Main Projects\\Movie-Mate\\.cursor\\debug.log';

// @desc    Get all playlists for a user
// @route   GET /api/playlists
// @access  Private
export const getPlaylists = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { username } = req.query;

  let query = {};
  
  // If username is provided, get that user's public playlists
  if (username) {
    // We need to get the user ID from username - you might need to import User model
    // For now, we'll just get the current user's playlists
    query = { userId };
  } else {
    query = { userId };
  }

  const playlists = await PlayList.find(query)
    .populate('movies.movieId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { playlists }
  });
});

// @desc    Get user's playlists (for profile)
// @route   GET /api/playlists/user/:userId
// @access  Public (for viewing other users' public playlists)
export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?.userId;

  // Check if userId is a valid ObjectId, if not, try to find by username
  let targetUserId = userId;
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    // Not a valid ObjectId, try username
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    targetUserId = user._id.toString();
  }

  let query = { userId: targetUserId };
  
  // If viewing someone else's playlists, only show public ones
  if (!currentUserId || currentUserId.toString() !== targetUserId) {
    query.isPublic = true;
  }

  const playlists = await PlayList.find(query)
    .populate('movies.movieId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { playlists }
  });
});

// @desc    Get single playlist
// @route   GET /api/playlists/:id
// @access  Private
export const getPlaylist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const playlist = await PlayList.findById(id)
    .populate('movies.movieId')
    .populate('userId', 'username profilePicture');

  if (!playlist) {
    return res.status(404).json({
      success: false,
      error: 'Playlist not found'
    });
  }

  // Check if user has access (owner or public)
  if (playlist.userId.toString() !== userId && !playlist.isPublic) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { playlist }
  });
});

// @desc    Create playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, movieIds, isPublic } = req.body;
  const userId = req.user.userId;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Playlist name is required'
    });
  }

  // Process movie IDs - fetch or cache movies
  const movies = [];
  if (movieIds && movieIds.length > 0) {
    for (const movieIdData of movieIds) {
      // Handle both object and primitive values
      let tmdbId, movieId;
      
      if (typeof movieIdData === 'object' && movieIdData !== null) {
        tmdbId = movieIdData.tmdbId || movieIdData.id;
        movieId = movieIdData._id || movieIdData.movieId;
      } else {
        // If it's a primitive, treat it as tmdbId
        tmdbId = movieIdData;
        movieId = null;
      }

      let movie = movieId ? await Movie.findById(movieId) : null;

      // If not in cache, try to fetch from TMDB
      if (!movie && tmdbId) {
        try {
          // Convert to number if it's a string
          const tmdbIdNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
          if (isNaN(tmdbIdNum)) {
            console.error(`Invalid TMDB ID: ${tmdbId}`);
            continue;
          }
          
          // Check if movie already exists in database by tmdbId
          movie = await Movie.findOne({ tmdbId: tmdbIdNum });
          
          if (!movie) {
            // Movie doesn't exist, fetch from TMDB and create it
            const tmdbMovie = await getTMDBMovieDetails(tmdbIdNum);
            const movieData = transformMovieData(tmdbMovie);
            movie = await Movie.create(movieData);
          }
        } catch (error) {
          console.error(`Error fetching movie ${tmdbId}:`, error);
          // If it's a duplicate key error, try to find the existing movie
          if (error.code === 11000 || error.name === 'MongoServerError') {
            try {
              const tmdbIdNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
              movie = await Movie.findOne({ tmdbId: tmdbIdNum });
            } catch (findError) {
              // Ignore find error
            }
          }
          // Skip this movie if it fails
          continue;
        }
      }

      if (movie) {
        movies.push({
          movieId: movie._id,
          addedAt: new Date()
        });
      }
    }
  }

  const playlist = await PlayList.create({
    userId,
    name: name.trim(),
    description: description?.trim() || '',
    movies,
    isPublic: isPublic !== undefined ? isPublic : true
  });

  await playlist.populate('movies.movieId');

  res.status(201).json({
    success: true,
    data: { playlist }
  });
});

// @desc    Update playlist
// @route   PUT /api/playlists/:id
// @access  Private
export const updatePlaylist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, movieIds, isPublic } = req.body;
  const userId = req.user.userId;

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res.status(404).json({
      success: false,
      error: 'Playlist not found'
    });
  }

  // Check ownership
  if (playlist.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  // Update basic fields
  if (name !== undefined) {
    playlist.name = name.trim();
  }
  if (description !== undefined) {
    playlist.description = description?.trim() || '';
  }
  if (isPublic !== undefined) {
    playlist.isPublic = isPublic;
  }

  // Update movies if provided
  if (movieIds !== undefined) {
    const movies = [];
    const errors = [];
    
    for (const movieIdData of movieIds) {
      // Handle both object and primitive values
      let tmdbId, movieId;
      
      if (typeof movieIdData === 'object' && movieIdData !== null) {
        tmdbId = movieIdData.tmdbId || movieIdData.id;
        movieId = movieIdData._id || movieIdData.movieId;
      } else {
        // If it's a primitive, treat it as tmdbId
        tmdbId = movieIdData;
        movieId = null;
      }

      let movie = movieId ? await Movie.findById(movieId) : null;

      // If not in cache, try to fetch from TMDB
      if (!movie && tmdbId) {
        try {
          // Convert to number if it's a string
          const tmdbIdNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
          if (isNaN(tmdbIdNum)) {
            errors.push(`Invalid TMDB ID: ${tmdbId}`);
            continue;
          }
          
          // Check if movie already exists in database by tmdbId
          movie = await Movie.findOne({ tmdbId: tmdbIdNum });
          
          if (!movie) {
            // Movie doesn't exist, fetch from TMDB and create it
            const tmdbMovie = await getTMDBMovieDetails(tmdbIdNum);
            const movieData = transformMovieData(tmdbMovie);
            movie = await Movie.create(movieData);
          }
        } catch (error) {
          console.error(`Error fetching movie ${tmdbId}:`, error);
          // If it's a duplicate key error, try to find the existing movie
          if (error.code === 11000 || error.name === 'MongoServerError') {
            try {
              const tmdbIdNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
              movie = await Movie.findOne({ tmdbId: tmdbIdNum });
              if (movie) {
                // Found the existing movie, proceed to add it
                // Don't continue, let it fall through to add the movie
              } else {
                errors.push(`Failed to fetch movie with ID ${tmdbId}: ${error.message}`);
                continue;
              }
            } catch (findError) {
              errors.push(`Failed to fetch movie with ID ${tmdbId}: ${error.message}`);
              continue;
            }
          } else {
            errors.push(`Failed to fetch movie with ID ${tmdbId}: ${error.message}`);
            continue;
          }
        }
      }

      if (!movie) {
        errors.push(`Movie not found: ${movieId || tmdbId || 'unknown'}`);
        continue;
      }

      if (movie) {
        // Check if movie already exists in playlist
        const exists = movies.some(m => m.movieId.toString() === movie._id.toString());
        if (!exists) {
          movies.push({
            movieId: movie._id,
            addedAt: new Date()
          });
        }
      }
    }
    
    playlist.movies = movies;
    
    // If there were errors but we still have some movies, log the errors
    if (errors.length > 0 && movies.length > 0) {
      console.warn('Some movies failed to add:', errors);
    } else if (errors.length > 0 && movies.length === 0 && movieIds.length > 0) {
      // If all movies failed and we had movies to add, return an error
      return res.status(400).json({
        success: false,
        error: `Failed to add movies: ${errors.join('; ')}`
      });
    }
  }

  await playlist.save();
  await playlist.populate('movies.movieId');

  res.json({
    success: true,
    data: { playlist }
  });
});

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private
export const deletePlaylist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res.status(404).json({
      success: false,
      error: 'Playlist not found'
    });
  }

  // Check ownership
  if (playlist.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  await PlayList.findByIdAndDelete(id);

  res.json({
    success: true,
    data: {}
  });
});

// @desc    Add movies to playlist
// @route   POST /api/playlists/:id/movies
// @access  Private
export const addMoviesToPlaylist = asyncHandler(async (req, res) => {
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'playlistController.js:374',message:'addMoviesToPlaylist called',data:{playlistId:req.params.id,movieIdsCount:req.body?.movieIds?.length,userId:req.user?.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n'); } catch(e) {}
  // #endregion
  const { id } = req.params;
  const { movieIds } = req.body;
  const userId = req.user.userId;

  const playlist = await PlayList.findById(id);
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'playlistController.js:380',message:'Playlist found',data:{hasPlaylist:!!playlist,playlistUserId:playlist?.userId?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n'); } catch(e) {}
  // #endregion

  if (!playlist) {
    return res.status(404).json({
      success: false,
      error: 'Playlist not found'
    });
  }

  // Check ownership
  if (playlist.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Movie IDs array is required'
    });
  }

  // Process movie IDs
  const errors = [];
  let addedCount = 0;
  
  for (const movieIdData of movieIds) {
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'playlistController.js:368',message:'Processing movie',data:{movieIdData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n'); } catch(e) {}
    // #endregion
    // Handle both object and primitive values
    let tmdbId, movieId;
    
    if (typeof movieIdData === 'object' && movieIdData !== null) {
      tmdbId = movieIdData.tmdbId || movieIdData.id;
      movieId = movieIdData._id || movieIdData.movieId;
    } else {
      // If it's a primitive, treat it as tmdbId
      tmdbId = movieIdData;
      movieId = null;
    }
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'playlistController.js:381',message:'Extracted IDs',data:{tmdbId,movieId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n'); } catch(e) {}
    // #endregion

    let movie = movieId ? await Movie.findById(movieId) : null;

    // If not in cache, try to fetch from TMDB
    if (!movie && tmdbId) {
      try {
        // Convert to number if it's a string
        const tmdbIdNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
        if (isNaN(tmdbIdNum)) {
          errors.push(`Invalid TMDB ID: ${tmdbId}`);
          continue;
        }
        
        // Check if movie already exists in database by tmdbId
        movie = await Movie.findOne({ tmdbId: tmdbIdNum });
        
        if (!movie) {
          // Movie doesn't exist, fetch from TMDB and create it
          const tmdbMovie = await getTMDBMovieDetails(tmdbIdNum);
          const movieData = transformMovieData(tmdbMovie);
          movie = await Movie.create(movieData);
        }
      } catch (error) {
        console.error(`Error fetching movie ${tmdbId}:`, error);
        // If it's a duplicate key error, try to find the existing movie
        if (error.code === 11000 || error.name === 'MongoServerError') {
          try {
            const tmdbIdNum = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
            movie = await Movie.findOne({ tmdbId: tmdbIdNum });
            if (movie) {
              // Found the existing movie, continue
              continue;
            }
          } catch (findError) {
            // Ignore find error
          }
        }
        errors.push(`Failed to fetch movie with ID ${tmdbId}: ${error.message}`);
        continue;
      }
    }

    if (!movie) {
      errors.push(`Movie not found: ${movieId || tmdbId || 'unknown'}`);
      continue;
    }

    if (movie) {
      // Check if movie already exists in playlist
      const exists = playlist.movies.some(
        m => m.movieId.toString() === movie._id.toString()
      );
      if (!exists) {
        playlist.movies.push({
          movieId: movie._id,
          addedAt: new Date()
        });
        addedCount++;
      }
    }
  }
  
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'playlistController.js:430',message:'Processing complete',data:{addedCount,errorCount:errors.length,movieIdsLength:movieIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n'); } catch(e) {}
  // #endregion
  
  // If no movies were added and we had movies to add, return an error
  if (addedCount === 0 && movieIds.length > 0) {
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'playlistController.js:433',message:'No movies added, returning error',data:{errors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n'); } catch(e) {}
    // #endregion
    return res.status(400).json({
      success: false,
      error: errors.length > 0 
        ? `Failed to add movies: ${errors.join('; ')}`
        : 'Failed to add movies to playlist'
    });
  }
  
  // If some movies failed but some succeeded, log warnings but still succeed
  if (errors.length > 0 && addedCount > 0) {
    console.warn('Some movies failed to add:', errors);
  }
  
  // #region agent log
  try { fs.appendFileSync(logPath, JSON.stringify({location:'playlistController.js:445',message:'Saving playlist',data:{movieCount:playlist.movies.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n'); } catch(e) {}
  // #endregion

  await playlist.save();
  await playlist.populate('movies.movieId');

  res.json({
    success: true,
    data: { playlist }
  });
});

// @desc    Remove movie from playlist
// @route   DELETE /api/playlists/:id/movies/:movieId
// @access  Private
export const removeMovieFromPlaylist = asyncHandler(async (req, res) => {
  const { id, movieId } = req.params;
  const userId = req.user.userId;

  const playlist = await PlayList.findById(id);

  if (!playlist) {
    return res.status(404).json({
      success: false,
      error: 'Playlist not found'
    });
  }

  // Check ownership
  if (playlist.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  playlist.movies = playlist.movies.filter(
    m => m.movieId.toString() !== movieId
  );

  await playlist.save();
  await playlist.populate('movies.movieId');

  res.json({
    success: true,
    data: { playlist }
  });
});
