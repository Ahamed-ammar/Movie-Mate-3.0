import User from '../models/User.js';
import Review from '../models/Review.js';
import Movie from '../models/Movie.js';
import Network from '../models/Network.js';
import Journal from '../models/Journal.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Get counts
  const totalUsers = await User.countDocuments();
  const totalReviews = await Review.countDocuments();
  const totalMovies = await Movie.countDocuments();
  const totalConnections = await Network.countDocuments({ status: 'accepted' });
  const totalJournals = await Journal.countDocuments();

  // Get recent users (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });

  // Get recent reviews (last 7 days)
  const recentReviews = await Review.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });

  // Get top reviewers
  const topReviewers = await Review.aggregate([
    {
      $group: {
        _id: '$userId',
        reviewCount: { $sum: 1 }
      }
    },
    { $sort: { reviewCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        username: '$user.username',
        email: '$user.email',
        reviewCount: 1
      }
    }
  ]);

  // Get most reviewed movies
  const mostReviewedMovies = await Review.aggregate([
    {
      $group: {
        _id: '$movieId',
        reviewCount: { $sum: 1 }
      }
    },
    { $sort: { reviewCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'movies',
        localField: '_id',
        foreignField: '_id',
        as: 'movie'
      }
    },
    { $unwind: '$movie' },
    {
      $project: {
        title: '$movie.title',
        tmdbId: '$movie.tmdbId',
        reviewCount: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalReviews,
        totalMovies,
        totalConnections,
        totalJournals,
        recentUsers,
        recentReviews
      },
      topReviewers,
      mostReviewedMovies
    }
  });
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const search = req.query.search || '';
  const role = req.query.role || '';

  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.role = role;
  }

  // Get users
  const users = await User.find(query)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count
  const total = await User.countDocuments(query);

  // Get review counts for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const reviewCount = await Review.countDocuments({ userId: user._id });
      const connectionCount = await Network.countDocuments({
        $or: [{ user1: user._id }, { user2: user._id }],
        status: 'accepted'
      });
      return {
        ...user,
        reviewCount,
        connectionCount
      };
    })
  );

  res.json({
    success: true,
    data: {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user details by ID
// @route   GET /api/admin/users/:userId
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password -refreshToken');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Get user's reviews
  const reviews = await Review.find({ userId: user._id })
    .populate('movieId', 'title tmdbId')
    .sort({ createdAt: -1 })
    .limit(10);

  // Get user's connections
  const connections = await Network.find({
    $or: [{ user1: user._id }, { user2: user._id }],
    status: 'accepted'
  }).countDocuments();

  // Get user's journals
  const journals = await Journal.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      user: {
        ...user.toObject(),
        reviewCount: reviews.length,
        connectionCount: connections,
        journalCount: journals.length
      },
      recentReviews: reviews,
      recentJournals: journals
    }
  });
});

// @desc    Delete user (and all their data)
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Prevent deleting other admins
  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Cannot delete admin users'
    });
  }

  // Delete user's reviews
  await Review.deleteMany({ userId: user._id });

  // Delete user's connections
  await Network.deleteMany({
    $or: [{ user1: user._id }, { user2: user._id }]
  });

  // Delete user's journals
  await Journal.deleteMany({ userId: user._id });

  // Delete the user
  await user.deleteOne();

  res.json({
    success: true,
    message: `User ${user.username} and all associated data deleted successfully`
  });
});

// @desc    Get all reviews with pagination
// @route   GET /api/admin/reviews
// @access  Private/Admin
export const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Get reviews
  const reviews = await Review.find()
    .populate('userId', 'username email')
    .populate('movieId', 'title tmdbId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await Review.countDocuments();

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Delete any user's review
// @route   DELETE /api/admin/reviews/:reviewId
// @access  Private/Admin
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);

  if (!review) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  await review.deleteOne();

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Get all journals with pagination
// @route   GET /api/admin/journals
// @access  Private/Admin
export const getAllJournals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Get journals
  const journals = await Journal.find()
    .populate('userId', 'username email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await Journal.countDocuments();

  res.json({
    success: true,
    data: {
      journals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Delete any user's journal
// @route   DELETE /api/admin/journals/:journalId
// @access  Private/Admin
export const deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findById(req.params.journalId);

  if (!journal) {
    return res.status(404).json({
      success: false,
      error: 'Journal not found'
    });
  }

  await journal.deleteOne();

  res.json({
    success: true,
    message: 'Journal deleted successfully'
  });
});

// @desc    Update user role
// @route   PATCH /api/admin/users/:userId/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Must be "user" or "admin"'
    });
  }

  const user = await User.findById(req.params.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.username} role updated to ${role}`,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }
  });
});
