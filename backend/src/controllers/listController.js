import ListEntry from '../models/ListEntry.js';
import Movie from '../models/Movie.js';
import {
  getMovieDetails as getTMDBMovieDetails,
  transformMovieData
} from '../services/tmdbService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all user's lists
// @route   GET /api/lists
// @access  Private
export const getAllLists = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const lists = {
    watched: [],
    watching: [],
    wishlist: [],
    favorites: []
  };

  const listTypes = Object.keys(lists);

  for (const type of listTypes) {
    const entries = await ListEntry.find({ userId, listType: type })
      .populate('movieId')
      .sort({ dateAdded: -1 });
    lists[type] = entries;
  }

  res.json({
    success: true,
    data: { lists }
  });
});

// @desc    Get specific list
// @route   GET /api/lists/:type
// @access  Private
export const getList = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const userId = req.user.userId;

  const validTypes = ['watched', 'watching', 'wishlist', 'favorites'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid list type'
    });
  }

  const entries = await ListEntry.find({ userId, listType: type })
    .populate('movieId')
    .sort({ dateAdded: -1 });

  res.json({
    success: true,
    data: {
      listType: type,
      entries
    }
  });
});

// @desc    Add movie to list
// @route   POST /api/lists
// @access  Private
export const addToList = asyncHandler(async (req, res) => {
  const { movieId, listType, ratingInteger, ratingStars, reviewText, dateWatched } = req.body;
  const userId = req.user.userId;

  const validTypes = ['watched', 'watching', 'wishlist', 'favorites'];
  if (!validTypes.includes(listType)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid list type'
    });
  }

  // Check if movie exists in cache
  let movie = await Movie.findById(movieId);
  
  // If not in cache, try to fetch from TMDB using tmdbId
  if (!movie && req.body.tmdbId) {
    try {
      const tmdbMovie = await getTMDBMovieDetails(req.body.tmdbId);
      const movieData = transformMovieData(tmdbMovie);
      movie = await Movie.create(movieData);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }
  }

  if (!movie) {
    return res.status(404).json({
      success: false,
      error: 'Movie not found'
    });
  }

  // Check if entry already exists
  const existingEntry = await ListEntry.findOne({ userId, movieId: movie._id, listType });
  if (existingEntry) {
    return res.status(400).json({
      success: false,
      error: 'Movie already exists in this list'
    });
  }

  const entryData = {
    userId,
    movieId: movie._id,
    listType,
    dateAdded: new Date()
  };

  if (ratingInteger !== undefined) entryData.ratingInteger = ratingInteger;
  if (ratingStars !== undefined) entryData.ratingStars = ratingStars;
  if (reviewText !== undefined) entryData.reviewText = reviewText;
  if (dateWatched && listType === 'watched') entryData.dateWatched = new Date(dateWatched);

  const entry = await ListEntry.create(entryData);
  await entry.populate('movieId');

  res.status(201).json({
    success: true,
    data: { entry }
  });
});

// @desc    Update list entry
// @route   PUT /api/lists/:id
// @access  Private
export const updateListEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ratingInteger, ratingStars, reviewText, dateWatched, listType } = req.body;
  const userId = req.user.userId;

  const entry = await ListEntry.findOne({ _id: id, userId });
  if (!entry) {
    return res.status(404).json({
      success: false,
      error: 'List entry not found'
    });
  }

  if (ratingInteger !== undefined) entry.ratingInteger = ratingInteger;
  if (ratingStars !== undefined) entry.ratingStars = ratingStars;
  if (reviewText !== undefined) entry.reviewText = reviewText;
  if (dateWatched !== undefined) entry.dateWatched = dateWatched ? new Date(dateWatched) : null;
  if (listType !== undefined) entry.listType = listType;

  await entry.save();
  await entry.populate('movieId');

  res.json({
    success: true,
    data: { entry }
  });
});

// @desc    Remove movie from list
// @route   DELETE /api/lists/:id
// @access  Private
export const removeFromList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const entry = await ListEntry.findOne({ _id: id, userId });
  if (!entry) {
    return res.status(404).json({
      success: false,
      error: 'List entry not found'
    });
  }

  await ListEntry.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Movie removed from list successfully'
  });
});
