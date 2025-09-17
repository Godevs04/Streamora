const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, username } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendErrorResponse(res, 400, 'User with this email already exists');
    }

    // Check if username is taken (if provided)
    if (username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return sendErrorResponse(res, 400, 'Username is already taken');
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      username: username || undefined
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user data and token
    sendSuccessResponse(res, 201, {
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await user.matchPassword(password))) {
      return sendErrorResponse(res, 401, 'Invalid email or password');
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data and token
    sendSuccessResponse(res, 200, {
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res, next) => {
  try {
    // User is already attached to req by auth middleware
    sendSuccessResponse(res, 200, {
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
