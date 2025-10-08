const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

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

    // Create user (not verified initially)
    const user = await User.create({
      name,
      email,
      password,
      username: username || undefined,
      isEmailVerified: false
    });

    // Generate OTP
    const otp = user.generateEmailVerificationOTP();
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, name, otp);
    
    if (!emailResult.success) {
      // If email fails, still return success but log the error
      console.error('Failed to send OTP email:', emailResult.error);
    }

    // Return success response (don't include token until verified)
    sendSuccessResponse(res, 201, {
      message: 'Registration successful! Please check your email for verification code.',
      email: email,
      requiresVerification: true
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      return sendErrorResponse(res, 403, 'Please verify your email before logging in', {
        requiresVerification: true,
        email: user.email
      });
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

/**
 * Verify email with OTP
 * @route POST /api/auth/verify-email
 * @access Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+emailVerificationOTP +otpExpires');
    
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    if (user.isEmailVerified) {
      return sendErrorResponse(res, 400, 'Email is already verified');
    }

    // Verify OTP
    if (!user.verifyEmailOTP(otp)) {
      return sendErrorResponse(res, 400, 'Invalid or expired OTP');
    }

    // Mark email as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Generate token
    const token = generateToken(user._id);

    // Return success response with token
    sendSuccessResponse(res, 200, {
      message: 'Email verified successfully!',
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP for email verification
 * @route POST /api/auth/resend-otp
 * @access Public
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    if (user.isEmailVerified) {
      return sendErrorResponse(res, 400, 'Email is already verified');
    }

    // Generate new OTP
    const otp = user.generateEmailVerificationOTP();
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, user.name, otp);
    
    if (!emailResult.success) {
      return sendErrorResponse(res, 500, 'Failed to send OTP email');
    }

    sendSuccessResponse(res, 200, {
      message: 'OTP sent successfully! Please check your email.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmail,
  resendOTP
};
