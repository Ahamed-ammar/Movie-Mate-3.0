import User from '../models/User.js';

/**
 * Middleware to check if the authenticated user is an admin
 * Must be used after the protect middleware
 */
export const adminOnly = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by protect middleware)
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get user from database to check role
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during authorization'
    });
  }
};
