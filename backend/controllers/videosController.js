const Video = require('../models/Video');
const { cloudinary } = require('../config/cloudinary');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');
const fs = require('fs');
const path = require('path');

/**
 * Create a new video
 * @route POST /api/videos
 * @access Private
 */
const createVideo = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;
    let videoUrl, thumbnailUrl;

    // Handle video upload if file is provided
    if (req.file) {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'video',
          folder: 'streamora/videos',
          eager: [
            { width: 300, height: 300, crop: 'pad', audio_codec: 'none' },
            { width: 160, height: 100, crop: 'crop', gravity: 'south', audio_codec: 'none' }
          ],
          eager_async: true,
          eager_notification_url: process.env.CLIENT_URL
        });
        
        videoUrl = result.secure_url;
        thumbnailUrl = result.eager[0].secure_url;
        
        // Delete local file after upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        return sendErrorResponse(res, 400, 'Error uploading video', [{ message: uploadError.message }]);
      }
    } else if (req.body.videoUrl) {
      // If videoUrl is provided directly
      videoUrl = req.body.videoUrl;
      thumbnailUrl = req.body.thumbnailUrl || videoUrl.replace(/\.[^/.]+$/, ".jpg");
    } else {
      return sendErrorResponse(res, 400, 'Video file or videoUrl is required');
    }

    // Create video
    const video = await Video.create({
      owner: req.user._id,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      tags: tags ? JSON.parse(tags) : []
    });

    // Populate owner
    await video.populate('owner', 'name avatarUrl');

    sendSuccessResponse(res, 201, { video });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all videos with pagination
 * @route GET /api/videos
 * @access Public
 */
const getVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const sort = req.query.sort || 'recent';
    const skip = (page - 1) * limit;

    // Build sort options
    let sortOptions = {};
    if (sort === 'popular') {
      sortOptions = { views: -1, createdAt: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    // Get videos
    const videos = await Video.find()
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name avatarUrl');

    // Get total count
    const total = await Video.countDocuments();

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

/**
 * Get video by ID
 * @route GET /api/videos/:id
 * @access Public
 */
const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('owner', 'name avatarUrl')
      .populate({
        path: 'comments',
        options: {
          sort: { createdAt: -1 },
          limit: 10
        },
        populate: {
          path: 'author',
          select: 'name avatarUrl'
        }
      });
    
    if (!video) {
      return sendErrorResponse(res, 404, 'Video not found');
    }
    
    sendSuccessResponse(res, 200, { video });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like/unlike video
 * @route PUT /api/videos/:id/like
 * @access Private
 */
const toggleLike = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return sendErrorResponse(res, 404, 'Video not found');
    }
    
    // Toggle like
    const isLiked = await video.toggleLike(req.user._id);
    
    sendSuccessResponse(res, 200, {
      liked: isLiked,
      likesCount: video.likesCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Increment video view count
 * @route PUT /api/videos/:id/view
 * @access Public
 */
const incrementViews = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return sendErrorResponse(res, 404, 'Video not found');
    }
    
    // Increment views
    const views = await video.incrementViews();
    
    sendSuccessResponse(res, 200, { views });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVideo,
  getVideos,
  getVideoById,
  toggleLike,
  incrementViews
};
