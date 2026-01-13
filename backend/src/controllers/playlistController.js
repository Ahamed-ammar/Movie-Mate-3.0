import PlayList from '../models/PlayList.js';
import Movie from '../models/Movie.js';
import {
  getMovieDetails as getTMDBMovieDetails,
  transformMovieData
} from '../services/tmdbService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

  const playlist = await PlayList.findById(id).populate('movies.movieId');

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
      const tmdbId = movieIdData.tmdbId || movieIdData.id || movieIdData;
      const movieId = movieIdData._id || movieIdData.movieId;

      let movie = movieId ? await Movie.findById(movieId) : null;

      // If not in cache, try to fetch from TMDB
      if (!movie && tmdbId) {
        try {
          const tmdbMovie = await getTMDBMovieDetails(tmdbId);
          const movieData = transformMovieData(tmdbMovie);
          movie = await Movie.create(movieData);
        } catch (error) {
          console.error(`Error fetching movie ${tmdbId}:`, error);
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
    for (const movieIdData of movieIds) {
      const tmdbId = movieIdData.tmdbId || movieIdData.id || movieIdData;
      const movieId = movieIdData._id || movieIdData.movieId;

      let movie = movieId ? await Movie.findById(movieId) : null;

      // If not in cache, try to fetch from TMDB
      if (!movie && tmdbId) {
        try {
          const tmdbMovie = await getTMDBMovieDetails(tmdbId);
          const movieData = transformMovieData(tmdbMovie);
          movie = await Movie.create(movieData);
        } catch (error) {
          console.error(`Error fetching movie ${tmdbId}:`, error);
          continue;
        }
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
  const { id } = req.params;
  const { movieIds } = req.body;
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

  if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Movie IDs array is required'
    });
  }

  // Process movie IDs
  for (const movieIdData of movieIds) {
    const tmdbId = movieIdData.tmdbId || movieIdData.id || movieIdData;
    const movieId = movieIdData._id || movieIdData.movieId;

    let movie = movieId ? await Movie.findById(movieId) : null;

    // If not in cache, try to fetch from TMDB
    if (!movie && tmdbId) {
      try {
        const tmdbMovie = await getTMDBMovieDetails(tmdbId);
        const movieData = transformMovieData(tmdbMovie);
        movie = await Movie.create(movieData);
      } catch (error) {
        console.error(`Error fetching movie ${tmdbId}:`, error);
        continue;
      }
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
      }
    }
  }

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
