const User = require('../models/User');
const Video = require('../models/Video');
const { validationResult } = require('express-validator');
const Subscription = require('../models/Subscription');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -fcmTokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user by ID (for viewing other users' profiles)
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password -fcmTokens -email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, username, bio, email, avatarUrl } = req.body;
    const userId = req.user.id;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username: username, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(username && { username }),
        ...(bio !== undefined && { bio }),
        ...(email && { email }),
        ...(avatarUrl && { avatarUrl }),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -fcmTokens');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user avatar
const updateUserAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    const userId = req.user.id;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -fcmTokens');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user statistics (real counts)
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [followers, following, totalVideos] = await Promise.all([
      Subscription.countDocuments({ following: userId }),
      Subscription.countDocuments({ follower: userId }),
      Video.countDocuments({ owner: userId })
    ]);

  // Aggregate likes and views across user's videos
  const mongoose = require('mongoose');
  const agg = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: { $ifNull: ['$likesCount', 0] } },
          totalViews: { $sum: { $ifNull: ['$views', 0] } }
        }
      }
    ]);

    const totals = agg[0] || { totalLikes: 0, totalViews: 0 };

    res.json({
      success: true,
      data: {
        followers,
        following,
        totalVideos,
        totalLikes: totals.totalLikes,
        totalViews: totals.totalViews,
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Subscribe to a user
const subscribeToUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params; // user to follow

    if (followerId === userId) {
      return res.status(400).json({ success: false, message: 'Cannot subscribe to yourself' });
    }

    await Subscription.create({ follower: followerId, following: userId });
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(200).json({ success: true, message: 'Already subscribed' });
    }
    console.error('Error subscribing to user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Unsubscribe from a user
const unsubscribeFromUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params; // user to unfollow

    await Subscription.deleteOne({ follower: followerId, following: userId });
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing from user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get public stats for any user by id
const getPublicUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const [followers, following, totalVideos] = await Promise.all([
      Subscription.countDocuments({ following: userId }),
      Subscription.countDocuments({ follower: userId }),
      Video.countDocuments({ owner: userId })
    ]);

    res.json({
      success: true,
      data: { followers, following, totalVideos }
    });
  } catch (error) {
    console.error('Error fetching public user stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Check if current user is subscribed to another user
const checkSubscriptionStatus = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { userId } = req.params; // user to check subscription status for

    const subscription = await Subscription.findOne({ 
      follower: followerId, 
      following: userId 
    });

    res.json({
      success: true,
      data: { 
        isSubscribed: !!subscription,
        subscriptionId: subscription?._id 
      }
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get videos by user ID
 * @route GET /api/users/:id/videos
 * @access Public
 */
const getUserVideos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Get videos by user ID
    const videos = await Video.find({ owner: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name avatarUrl username');

    // Get total count
    const total = await Video.countDocuments({ owner: id });

    sendSuccessResponse(res, 200, { videos }, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserAvatar,
  getUserStats,
  getUserVideos,
  subscribeToUser,
  unsubscribeFromUser,
  getPublicUserStats,
  checkSubscriptionStatus
};
