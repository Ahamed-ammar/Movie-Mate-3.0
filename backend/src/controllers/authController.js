import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  bio: user.bio,
  profilePicture: user.profilePicture,
  joinedDate: user.joinedDate,
  role: user.role
});

const generateUniqueUsername = async (base) => {
  const normalized = (base || 'movie-mate-user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20) || 'moviemate';
  let candidate = normalized;
  let counter = 1;

  // Ensure uniqueness
  while (await User.findOne({ username: candidate })) {
    candidate = `${normalized}${counter}`;
    counter += 1;
  }
  return candidate;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: userExists.email === email ? 'Email already exists' : 'Username already taken'
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    data: {
      user: buildUserResponse(user),
      accessToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'Password is required'
    });
  }

  // Support both username and email login
  // If username is provided, use it (for admin); otherwise use email
  let user;
  if (username && username.trim()) {
    // Username login (for admin)
    user = await User.findOne({ username: username.trim() }).select('+password');
  } else if (email && email.trim()) {
    // Email login (for regular users)
    user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  } else {
    return res.status(400).json({
      success: false,
      error: 'Username or email is required'
    });
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data: {
      user: buildUserResponse(user),
      accessToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from database
  const user = await User.findById(req.user.userId);
  if (user) {
    user.refreshToken = '';
    await user.save();
  }

  // Clear cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'No refresh token provided'
    });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Verify token exists in database
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  res.json({
    success: true,
    data: {
      user: buildUserResponse(user)
    }
  });
});

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      success: false,
      error: 'Google client ID is not configured'
    });
  }

  if (!idToken) {
    return res.status(400).json({
      success: false,
      error: 'Google ID token is required'
    });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();

  if (!payload?.email) {
    return res.status(400).json({
      success: false,
      error: 'Google account email is required'
    });
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const displayName = payload.name || email.split('@')[0];
  const picture = payload.picture || '';

  let user = await User.findOne({ email });

  if (user) {
    if (user.googleId && user.googleId !== googleId) {
      return res.status(409).json({
        success: false,
        error: 'This email is already linked to another Google account'
      });
    }
    // Link account by email if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      user.provider = 'google';
      if (!user.profilePicture && picture) {
        user.profilePicture = picture;
      }
    }
  } else {
    const username = await generateUniqueUsername(displayName);
    user = await User.create({
      username,
      email,
      googleId,
      provider: 'google',
      profilePicture: picture
    });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data: {
      user: buildUserResponse(user),
      accessToken
    }
  });
});
