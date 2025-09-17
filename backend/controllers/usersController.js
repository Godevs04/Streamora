const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Public
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }
    
    sendSuccessResponse(res, 200, {
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @route PUT /api/users/me
 * @access Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }
    
    // Update fields if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.bio) user.bio = req.body.bio;
    
    // Handle avatar upload if file is provided
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'streamora/avatars',
          width: 500,
          height: 500,
          crop: 'fill',
          gravity: 'face'
        });
        
        user.avatarUrl = result.secure_url;
      } catch (uploadError) {
        return sendErrorResponse(res, 400, 'Error uploading avatar', [{ message: uploadError.message }]);
      }
    } else if (req.body.avatarUrl) {
      // If avatarUrl is provided directly (e.g., from frontend upload)
      user.avatarUrl = req.body.avatarUrl;
    }
    
    // Save updated user
    await user.save();
    
    sendSuccessResponse(res, 200, {
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserById,
  updateProfile
};
