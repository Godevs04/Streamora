const jwt = require('jsonwebtoken');
const { sendErrorResponse } = require('../utils/sendResponse');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token and set req.user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token payload
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        return sendErrorResponse(res, 401, 'User not found');
      }

      next();
    } catch (error) {
      return sendErrorResponse(res, 401, 'Not authorized, invalid token');
    }
  }

  if (!token) {
    return sendErrorResponse(res, 401, 'Not authorized, no token provided');
  }
};

/**
 * Check if user has admin role
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const admin = (req, res, next) => {
  if (req.user && req.user.roles.includes('admin')) {
    next();
  } else {
    return sendErrorResponse(res, 403, 'Not authorized as admin');
  }
};

module.exports = { protect, admin };
