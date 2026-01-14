import User from '../models/User.js';
import Review from '../models/Review.js';
import Network from '../models/Network.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username }).select('-password -refreshToken');
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Get user's review count (public only if not own profile)
  const isOwnProfile = req.user && req.user.userId === user._id.toString();
  const reviewQuery = { userId: user._id };
  if (!isOwnProfile) {
    reviewQuery.visibility = 'public';
  }

  const reviewCount = await Review.countDocuments(reviewQuery);

  // Get user's connection count (accepted connections only)
  const connectionCount = await Network.countDocuments({
    status: 'accepted',
    $or: [
      { requesterId: user._id },
      { receiverId: user._id }
    ]
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        joinedDate: user.joinedDate,
        reviewCount,
        connectionCount
      }
    }
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const currentUserId = req.user?.userId;

  // Build query
  const query = {};
  if (search) {
    query.username = { $regex: search, $options: 'i' };
  }

  // Get users with pagination
  const skip = (page - 1) * limit;
  const users = await User.find(query)
    .select('-password -refreshToken -email')
    .sort({ joinedDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalUsers = await User.countDocuments(query);

  // Get connection status for each user if current user is logged in
  let usersWithConnectionStatus = await Promise.all(users.map(async (user) => {
    const userObj = {
      id: user._id,
      username: user.username,
      bio: user.bio,
      profilePicture: user.profilePicture,
      joinedDate: user.joinedDate,
      connectionStatus: null,
      connectionId: null
    };

    if (currentUserId && currentUserId !== user._id.toString()) {
      // Check if there's a connection between current user and this user
      const connection = await Network.findOne({
        $or: [
          { requesterId: currentUserId, receiverId: user._id },
          { requesterId: user._id, receiverId: currentUserId }
        ]
      });

      if (connection) {
        userObj.connectionStatus = connection.status;
        userObj.connectionId = connection._id;
        // Determine if current user is the requester
        userObj.isRequester = connection.requesterId.toString() === currentUserId;
      }
    }

    return userObj;
  }));

  res.json({
    success: true,
    data: {
      users: usersWithConnectionStatus,
      page: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { bio, profilePicture } = req.body;
  const userId = req.user.userId;

  const updateData = {};
  if (bio !== undefined) updateData.bio = bio;
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        joinedDate: user.joinedDate
      }
    }
  });
});
