const Admin = require('../models/Admin');
const User = require('../models/User');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');
const { sendOTPEmail } = require('../utils/emailService');

// Simple hash-based encryption for React Native compatibility
const ENCRYPTION_SALT = 'streamora-admin-auth-salt-2024';

// Simple hash function for React Native
const simpleHash = (str) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

const encryptCredential = (credential) => {
  return simpleHash(credential + ENCRYPTION_SALT);
};

// Setup admin authentication
const setupAdminAuth = async (req, res, next) => {
  try {
    const { authMethod, credential } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!authMethod || !credential) {
      return sendErrorResponse(res, 400, 'Auth method and credential are required');
    }

    if (!['pin', 'password', 'pattern'].includes(authMethod)) {
      return sendErrorResponse(res, 400, 'Invalid auth method');
    }

    // Validate credential based on method
    if (authMethod === 'pin' && !/^\d{4,8}$/.test(credential)) {
      return sendErrorResponse(res, 400, 'PIN must be 4-8 digits');
    }

    if (authMethod === 'password' && credential.length < 6) {
      return sendErrorResponse(res, 400, 'Password must be at least 6 characters');
    }

    if (authMethod === 'pattern' && credential.length < 4) {
      return sendErrorResponse(res, 400, 'Pattern must be at least 4 characters');
    }

    const encryptedCredential = encryptCredential(credential);

    // Check if admin record exists
    let admin = await Admin.findOne({ userId });
    
    if (admin) {
      // Update existing admin
      admin.authMethod = authMethod;
      admin.encryptedCredentials = encryptedCredential;
      admin.hasSetup = true;
      admin.setupComplete = true;
      admin.authEnabled = true;
      await admin.save();
    } else {
      // Create new admin record
      admin = await Admin.create({
        userId,
        authMethod,
        encryptedCredentials: encryptedCredential,
        hasSetup: true,
        setupComplete: true,
        authEnabled: true
      });
    }

    sendSuccessResponse(res, 200, {
      message: 'Admin authentication setup successfully',
      hasSetup: admin.hasSetup,
      authMethod: admin.authMethod,
      authEnabled: admin.authEnabled
    });
  } catch (error) {
    console.error('Setup admin auth error:', error);
    next(error);
  }
};

// Authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    const userId = req.user.id;

    if (!credential) {
      return sendErrorResponse(res, 400, 'Credential is required');
    }

    let admin = await Admin.findOne({ userId }).select('+encryptedCredentials');
    
    // If admin doesn't exist, create a basic admin record
    if (!admin) {
      admin = await Admin.create({
        userId: userId,
        authMethod: 'pin', // Default method
        hasSetup: false,
        setupComplete: false,
        authEnabled: true
      });
    }

    if (!admin.hasSetup) {
      return sendErrorResponse(res, 400, 'Admin authentication not set up');
    }

    if (!admin.authEnabled) {
      return sendSuccessResponse(res, 200, {
        message: 'Admin authentication disabled',
        isAuthenticated: true,
        authEnabled: false
      });
    }

    // Check if account is locked out
    if (admin.isLockedOut) {
      return sendErrorResponse(res, 423, 'Account is temporarily locked due to too many failed attempts');
    }

    // Check if credentials are set up
    if (!admin.encryptedCredentials || admin.encryptedCredentials === '') {
      return sendErrorResponse(res, 400, 'Admin authentication not set up');
    }

    const encryptedCredential = encryptCredential(credential);
    const isValid = encryptedCredential === admin.encryptedCredentials;

    if (isValid) {
      // Reset login attempts and update last authenticated
      await admin.resetLoginAttempts();
      await admin.updateLastAuthenticated();
      
      sendSuccessResponse(res, 200, {
        message: 'Authentication successful',
        isAuthenticated: true,
        authMethod: admin.authMethod,
        authEnabled: admin.authEnabled
      });
    } else {
      // Increment login attempts
      await admin.incrementLoginAttempts();
      
      sendErrorResponse(res, 401, 'Invalid credentials');
    }
  } catch (error) {
    console.error('Authenticate admin error:', error);
    next(error);
  }
};

// Get admin settings
const getAdminSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    let admin = await Admin.findOne({ userId });
    const user = await User.findById(userId);

    // If admin doesn't exist, create a basic admin record
    if (!admin) {
      admin = await Admin.create({
        userId: userId,
        authMethod: 'pin', // Default method
        hasSetup: false,
        setupComplete: false,
        authEnabled: true,
        channelCustomization: {
          channelName: user.name || '',
          bio: user.bio || 'Welcome to my channel!',
          bannerUrl: user.bannerUrl || null,
          avatarUrl: user.avatarUrl || null
        }
      });
    }

    sendSuccessResponse(res, 200, {
      auth: {
        hasSetup: admin.hasSetup,
        authMethod: admin.authMethod,
        authEnabled: admin.authEnabled,
        lastAuthenticated: admin.lastAuthenticated
      },
      channelCustomization: {
        channelName: admin.channelCustomization.channelName || user.name,
        bio: admin.channelCustomization.bio || user.bio || 'Welcome to my channel!',
        bannerImageUrl: admin.channelCustomization.bannerUrl || user.bannerUrl,
        profileImageUrl: admin.channelCustomization.avatarUrl || user.avatarUrl
      },
      preferences: admin.preferences,
      activity: admin.activity
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    next(error);
  }
};

// Update admin settings
const updateAdminSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { channelCustomization, preferences } = req.body;

    let admin = await Admin.findOne({ userId });
    
    // If admin doesn't exist, create a basic admin record
    if (!admin) {
      const user = await User.findById(userId);
      admin = await Admin.create({
        userId: userId,
        authMethod: 'pin', // Default method
        hasSetup: false,
        setupComplete: false,
        authEnabled: true,
        channelCustomization: {
          channelName: user?.name || '',
          bio: user?.bio || 'Welcome to my channel!',
          bannerUrl: user?.bannerUrl || null,
          avatarUrl: user?.avatarUrl || null
        }
      });
    }

    const updateData = {};

    if (channelCustomization) {
      updateData.channelCustomization = {
        ...admin.channelCustomization,
        ...channelCustomization
      };
    }

    if (preferences) {
      updateData.preferences = {
        ...admin.preferences,
        ...preferences
      };
    }

    updateData['activity.lastActivity'] = new Date();

    await Admin.findByIdAndUpdate(admin._id, updateData);

    sendSuccessResponse(res, 200, {
      message: 'Admin settings updated successfully'
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    next(error);
  }
};

// Toggle admin authentication
const toggleAdminAuth = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    let admin = await Admin.findOne({ userId });
    
    // If admin doesn't exist, create a basic admin record
    if (!admin) {
      admin = await Admin.create({
        userId: userId,
        authMethod: 'pin', // Default method
        hasSetup: false,
        setupComplete: false,
        authEnabled: enabled
      });
    } else {
      admin.authEnabled = enabled;
      await admin.save();
    }

    sendSuccessResponse(res, 200, {
      message: `Admin authentication ${enabled ? 'enabled' : 'disabled'}`,
      authEnabled: admin.authEnabled
    });
  } catch (error) {
    console.error('Toggle admin auth error:', error);
    next(error);
  }
};

// Change admin credentials
const changeAdminCredentials = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { authMethod, credential } = req.body;

    if (!authMethod || !credential) {
      return sendErrorResponse(res, 400, 'Auth method and credential are required');
    }

    if (!['pin', 'password', 'pattern'].includes(authMethod)) {
      return sendErrorResponse(res, 400, 'Invalid auth method');
    }

    // Validate credential based on method
    if (authMethod === 'pin' && !/^\d{4,8}$/.test(credential)) {
      return sendErrorResponse(res, 400, 'PIN must be 4-8 digits');
    }

    if (authMethod === 'password' && credential.length < 6) {
      return sendErrorResponse(res, 400, 'Password must be at least 6 characters');
    }

    if (authMethod === 'pattern' && credential.length < 4) {
      return sendErrorResponse(res, 400, 'Pattern must be at least 4 characters');
    }

    let admin = await Admin.findOne({ userId });
    
    // If admin doesn't exist, create a basic admin record
    if (!admin) {
      admin = await Admin.create({
        userId: userId,
        authMethod: authMethod,
        encryptedCredentials: encryptCredential(credential),
        hasSetup: true,
        setupComplete: true,
        authEnabled: true
      });
    } else {
      const encryptedCredential = encryptCredential(credential);

      admin.authMethod = authMethod;
      admin.encryptedCredentials = encryptedCredential;
      admin.hasSetup = true;
      admin.setupComplete = true;
      await admin.save();
    }

    sendSuccessResponse(res, 200, {
      message: 'Admin credentials updated successfully',
      authMethod: admin.authMethod
    });
  } catch (error) {
    console.error('Change admin credentials error:', error);
    next(error);
  }
};

// Send admin reset OTP
const sendAdminResetOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // First try to find user by email
    let user = await User.findOne({ email });
    
    // If not found by email, try to get current authenticated user
    if (!user && req.user) {
      user = await User.findById(req.user.id);
    }
    
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    let admin = await Admin.findOne({ userId: user._id });
    
    // If admin doesn't exist, create a basic admin record
    if (!admin) {
      admin = await Admin.create({
        userId: user._id,
        authMethod: 'pin', // Default method
        hasSetup: false,
        setupComplete: false,
        authEnabled: true
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in user model for now (can be moved to admin model later)
    user.adminResetOTP = otp;
    user.adminResetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOTPEmail(email || user.email, user.name || user.email, otp, 'Admin Access Reset');

    sendSuccessResponse(res, 200, {
      message: 'Admin reset OTP sent successfully'
    });
  } catch (error) {
    console.error('Send admin reset OTP error:', error);
    next(error);
  }
};

// Verify admin reset OTP
const verifyAdminResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    // First try to find user by email
    let user = await User.findOne({ email });
    
    // If not found by email, try to get current authenticated user
    if (!user && req.user) {
      user = await User.findById(req.user.id);
    }
    
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }

    if (!user.adminResetOTP || !user.adminResetOTPExpiry) {
      return sendErrorResponse(res, 400, 'No reset OTP found');
    }

    if (new Date() > user.adminResetOTPExpiry) {
      return sendErrorResponse(res, 400, 'Reset OTP has expired');
    }

    if (user.adminResetOTP !== otp) {
      return sendErrorResponse(res, 400, 'Invalid OTP');
    }

    // Clear OTP fields
    user.adminResetOTP = undefined;
    user.adminResetOTPExpiry = undefined;
    await user.save();

    // Reset admin authentication
    const admin = await Admin.findOne({ userId: user._id });
    if (admin) {
      admin.hasSetup = false;
      admin.setupComplete = false;
      admin.authEnabled = false;
      await admin.save();
    }

    sendSuccessResponse(res, 200, {
      message: 'Admin reset OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify admin reset OTP error:', error);
    next(error);
  }
};

module.exports = {
  setupAdminAuth,
  authenticateAdmin,
  getAdminSettings,
  updateAdminSettings,
  toggleAdminAuth,
  changeAdminCredentials,
  sendAdminResetOTP,
  verifyAdminResetOTP
};
