import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Movie from '../models/Movie.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get reviews for a movie (public only)
// @route   GET /api/reviews/movie/:movieId
// @access  Public
export const getMovieReviews = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Try to find movie - could be MongoDB _id or TMDB ID
  let movie;
  
  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(movieId) && movieId.length === 24) {
    movie = await Movie.findById(movieId);
  }
  
  // If not found and it's a number, try finding by tmdbId
  if (!movie && !isNaN(movieId)) {
    movie = await Movie.findOne({ tmdbId: parseInt(movieId) });
  }
  
  if (!movie) {
    return res.status(404).json({
      success: false,
      error: 'Movie not found'
    });
  }

  // Use the movie's MongoDB _id to find reviews
  const movieMongoId = movie._id;

  // Only get parent reviews (not replies)
  const reviews = await Review.find({
    movieId: movieMongoId,
    visibility: 'public',
    parentReviewId: null
  })
    .populate('userId', 'username profilePicture')
    .populate({
      path: 'likes',
      select: '_id'
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get replies for each review and check if user liked them
  const currentUserId = req.user?.userId?.toString();
  
  const reviewsWithReplies = await Promise.all(reviews.map(async (review) => {
    // Get replies for this review
    const replies = await Review.find({
      parentReviewId: review._id,
      visibility: 'public'
    })
      .populate('userId', 'username profilePicture')
      .populate({
        path: 'likes',
        select: '_id'
      })
      .sort({ createdAt: 1 });

    // Check if current user liked each reply
    const repliesWithLikeStatus = await Promise.all(replies.map(async (reply) => {
      const replyObj = reply.toObject();
      return {
        ...replyObj,
        likesCount: reply.likes?.length || 0,
        isLiked: currentUserId ? reply.likes?.some(like => like._id.toString() === currentUserId) : false
      };
    }));

    // Check if current user liked this review
    const isLiked = currentUserId ? review.likes?.some(like => like._id.toString() === currentUserId) : false;
    
    return {
      ...review.toObject(),
      likesCount: review.likes?.length || 0,
      isLiked,
      replies: repliesWithLikeStatus
    };
  }));

  const total = await Review.countDocuments({ 
    movieId: movieMongoId, 
    visibility: 'public',
    parentReviewId: null 
  });

  res.json({
    success: true,
    data: {
      reviews: reviewsWithReplies,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Public (own reviews show all, others show public only)
export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const isOwnReviews = req.user && req.user.userId === userId;
  const query = { userId };
  if (!isOwnReviews) {
    query.visibility = 'public';
  }

  const reviews = await Review.find(query)
    .populate('movieId', 'title poster releaseDate')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Review.countDocuments(query);

  res.json({
    success: true,
    data: {
      reviews,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  const { movieId, ratingInteger, ratingStars, reviewText, visibility = 'public', parentReviewId } = req.body;
  const userId = req.user.userId;

  // If it's a reply, only reviewText is required
  if (parentReviewId) {
    if (!reviewText || reviewText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply text is required'
      });
    }

    // Validate parent review exists
    const parentReview = await Review.findById(parentReviewId);
    if (!parentReview) {
      return res.status(404).json({
        success: false,
        error: 'Parent review not found'
      });
    }

    // Get movieId from parent review for the reply
    const movieMongoId = parentReview.movieId;

    const review = await Review.create({
      userId,
      movieId: movieMongoId,
      reviewText,
      visibility: 'public', // Replies are always public
      parentReviewId
    });

    await review.populate('userId', 'username profilePicture');
    review.likesCount = 0;
    review.isLiked = false;

    res.status(201).json({
      success: true,
      data: { review }
    });
    return;
  }

  // For regular reviews, at least one rating is required
  if (!ratingInteger && ratingStars === undefined) {
    return res.status(400).json({
      success: false,
      error: 'At least one rating (integer or stars) is required'
    });
  }

  // Check if movie exists - could be MongoDB _id or TMDB ID
  let movie;
  
  // Check if it's a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(movieId) && movieId.length === 24) {
    movie = await Movie.findById(movieId);
  }
  
  // If not found and it's a number, try finding by tmdbId
  if (!movie && !isNaN(movieId)) {
    movie = await Movie.findOne({ tmdbId: parseInt(movieId) });
  }
  
  if (!movie) {
    return res.status(404).json({
      success: false,
      error: 'Movie not found'
    });
  }
  
  // Use the movie's MongoDB _id for the review
  const movieMongoId = movie._id;

  // Check if review already exists (only for parent reviews)
  const existingReview = await Review.findOne({ userId, movieId: movieMongoId, parentReviewId: null });
  if (existingReview) {
    return res.status(400).json({
      success: false,
      error: 'Review already exists for this movie. Use update instead.'
    });
  }

  const review = await Review.create({
    userId,
    movieId: movieMongoId,
    ratingInteger,
    ratingStars,
    reviewText,
    visibility
  });

  await review.populate('userId', 'username profilePicture');
  await review.populate('movieId', 'title poster releaseDate');
  review.likesCount = 0;
  review.isLiked = false;

  res.status(201).json({
    success: true,
    data: { review }
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ratingInteger, ratingStars, reviewText, visibility } = req.body;
  const userId = req.user.userId;

  const review = await Review.findOne({ _id: id, userId });
  if (!review) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  // Update fields
  if (ratingInteger !== undefined) review.ratingInteger = ratingInteger;
  if (ratingStars !== undefined) review.ratingStars = ratingStars;
  if (reviewText !== undefined) review.reviewText = reviewText;
  if (visibility !== undefined) review.visibility = visibility;

  await review.save();
  await review.populate('userId', 'username profilePicture');
  await review.populate('movieId', 'title poster releaseDate');

  res.json({
    success: true,
    data: { review }
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const review = await Review.findOne({ _id: id, userId });
  if (!review) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  await Review.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Get popular reviews this week
// @route   GET /api/reviews/popular
// @access  Public
export const getPopularReviews = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  // Get reviews from the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const reviews = await Review.find({
    visibility: 'public',
    createdAt: { $gte: oneWeekAgo }
  })
    .populate('userId', 'username profilePicture')
    .populate('movieId', 'title poster poster_path releaseDate tmdbId')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { reviews }
  });
});

// @desc    Like a review
// @route   POST /api/reviews/:id/like
// @access  Private
export const likeReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  // Check if user already liked
  const alreadyLiked = review.likes.some(like => like.toString() === userId.toString());
  
  if (alreadyLiked) {
    // Unlike: remove user from likes
    review.likes = review.likes.filter(like => like.toString() !== userId.toString());
  } else {
    // Like: add user to likes
    review.likes.push(userId);
  }

  await review.save();
  
  // Populate and return updated review
  await review.populate('userId', 'username profilePicture');
  await review.populate({
    path: 'likes',
    select: 'username profilePicture'
  });

  res.json({
    success: true,
    data: {
      review: {
        ...review.toObject(),
        likesCount: review.likes.length,
        isLiked: !alreadyLiked
      }
    }
  });
});

// @desc    Create reply to a review
// @route   POST /api/reviews/:id/reply
// @access  Private
export const replyToReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewText } = req.body;
  const userId = req.user.userId;

  if (!reviewText || reviewText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Reply text is required'
    });
  }

  const parentReview = await Review.findById(id);
  if (!parentReview) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  const reply = await Review.create({
    userId,
    movieId: parentReview.movieId,
    reviewText,
    visibility: 'public',
    parentReviewId: id
  });

  await reply.populate('userId', 'username profilePicture');

  res.status(201).json({
    success: true,
    data: {
      review: {
        ...reply.toObject(),
        likesCount: 0,
        isLiked: false
      }
    }
  });
});
