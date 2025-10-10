const Video = require('../models/Video');
const { cloudinary } = require('../config/cloudinary');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');
const { notifyNewVideo, notifyNewLike } = require('../utils/notificationService');
const fs = require('fs');
const path = require('path');

/**
 * Create a new video
 * @route POST /api/videos
 * @access Private
 */
const createVideo = async (req, res, next) => {
  try {
    const { title, description, tags, thumbnailAspectRatio, duration, type, isScheduled, scheduledDate } = req.body;
    let videoUrl, thumbnailUrl;

    // Handle video upload if file is provided
    if (req.files && req.files.video) {
      try {
        // Upload video to Cloudinary
        const videoResult = await cloudinary.uploader.upload(req.files.video[0].path, {
          resource_type: 'video',
          folder: 'streamora/videos',
          eager_async: true,
          eager_notification_url: process.env.CLIENT_URL
        });
        
        videoUrl = videoResult.secure_url;
        
        // Get video duration from Cloudinary response
        const videoDuration = videoResult.duration || 0;
        
        // Delete local video file after upload
        fs.unlinkSync(req.files.video[0].path);
        
        // If no custom thumbnail provided, generate one from the video
        if (!req.files.thumbnail) {
          // Determine thumbnail dimensions based on video type
          const isShorts = type === 'shorts';
          const thumbnailWidth = isShorts ? 720 : 1280;
          const thumbnailHeight = isShorts ? 1280 : 720;
          
          thumbnailUrl = cloudinary.url(videoResult.public_id, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [
              { width: thumbnailWidth, height: thumbnailHeight, crop: 'fill', gravity: 'center' }
            ]
          });
        }
      } catch (uploadError) {
        return sendErrorResponse(res, 400, 'Error uploading video', [{ message: uploadError.message }]);
      }
    } else if (req.body.videoUrl) {
      // If videoUrl is provided directly
      videoUrl = req.body.videoUrl;
    } else {
      return sendErrorResponse(res, 400, 'Video file or videoUrl is required');
    }
    
    // Handle thumbnail upload if file is provided
    if (req.files && req.files.thumbnail) {
      try {
        // Determine thumbnail dimensions based on video type
        const isShorts = type === 'shorts';
        const thumbnailWidth = isShorts ? 720 : 1280;
        const thumbnailHeight = isShorts ? 1280 : 720;
        
        // Upload thumbnail to Cloudinary
        const thumbnailResult = await cloudinary.uploader.upload(req.files.thumbnail[0].path, {
          folder: 'streamora/thumbnails',
          transformation: [
            { width: thumbnailWidth, height: thumbnailHeight, crop: 'fill', gravity: 'center' }
          ]
        });
        
        thumbnailUrl = thumbnailResult.secure_url;
        
        // Delete local thumbnail file after upload
        fs.unlinkSync(req.files.thumbnail[0].path);
      } catch (uploadError) {
        return sendErrorResponse(res, 400, 'Error uploading thumbnail', [{ message: uploadError.message }]);
      }
    } else if (req.body.thumbnailUrl) {
      // If thumbnailUrl is provided directly
      thumbnailUrl = req.body.thumbnailUrl;
    } else if (!thumbnailUrl && type !== 'shorts') {
      // If no thumbnail URL has been set yet and it's not a shorts video, require thumbnail
      return sendErrorResponse(res, 400, 'Thumbnail is required for normal videos');
    }

    // Determine video status and scheduled date
    const isScheduledBool = isScheduled === 'true' || isScheduled === true;
    const videoStatus = isScheduledBool ? 'scheduled' : 'published';
    const scheduledDateObj = isScheduledBool && scheduledDate ? new Date(scheduledDate) : undefined;

    // Create video
    const video = await Video.create({
      owner: req.user._id,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      thumbnailAspectRatio: type === 'shorts' ? '9:16' : (thumbnailAspectRatio || '16:9'),
      duration: duration || 0,
      tags: tags ? JSON.parse(tags) : [],
      type: type || 'normal',
      status: videoStatus,
      scheduledDate: scheduledDateObj
    });

    // Populate owner
    await video.populate('owner', 'name avatarUrl');

    // Send notification to subscribers (non-blocking)
    notifyNewVideo(req.user._id, title, video._id).catch(error => {
      console.error('Error sending new video notification:', error);
    });

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
    const type = req.query.type;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    // Build filter options
    let filterOptions = {
      status: 'published' // Only show published videos, not scheduled ones
    };
    if (type) {
      filterOptions.type = type;
    }
    
    // Add search functionality
    if (search) {
      filterOptions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort options
    let sortOptions = {};
    if (sort === 'popular') {
      sortOptions = { views: -1, createdAt: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    // Get videos
    const videos = await Video.find(filterOptions)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name avatarUrl');

    // Add comment count to each video
    const Comment = require('../models/Comment');
    const videosWithComments = await Promise.all(
      videos.map(async (video) => {
        const commentsCount = await Comment.countDocuments({ video: video._id });
        return {
          ...video.toObject(),
          commentsCount
        };
      })
    );

    // Get total count
    const total = await Video.countDocuments(filterOptions);

    sendSuccessResponse(res, 200, { videos: videosWithComments }, {
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
      .populate('owner', 'name avatarUrl');
    
    if (!video) {
      return sendErrorResponse(res, 404, 'Video not found');
    }
    
    // Add comment count
    const Comment = require('../models/Comment');
    const commentsCount = await Comment.countDocuments({ video: video._id });
    
    const videoWithCommentsCount = {
      ...video.toObject(),
      commentsCount
    };
    
    sendSuccessResponse(res, 200, { video: videoWithCommentsCount });
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
    
    // Send notification if video was liked (not unliked)
    if (isLiked) {
      notifyNewLike(video.owner._id, req.user._id, video.title, video._id).catch(error => {
        console.error('Error sending like notification:', error);
      });
    }
    
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

/**
 * Get scheduled videos for admin panel
 * @route GET /api/videos/scheduled
 * @access Private (Admin)
 */
const getScheduledVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({ 
      status: 'scheduled',
      owner: req.user._id 
    })
      .sort({ scheduledDate: 1 })
      .populate('owner', 'name avatarUrl');

    sendSuccessResponse(res, 200, { videos });
  } catch (error) {
    next(error);
  }
};

/**
 * Publish a scheduled video immediately
 * @route PUT /api/videos/:id/publish
 * @access Private
 */
const publishScheduledVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      owner: req.user._id,
      status: 'scheduled'
    });

    if (!video) {
      return sendErrorResponse(res, 404, 'Scheduled video not found');
    }

    // Update video status to published
    const updatedVideo = await Video.findByIdAndUpdate(
      video._id,
      {
        status: 'published',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('owner', 'name avatarUrl');

    // Send notification to subscribers (non-blocking)
    notifyNewVideo(req.user._id, video.title, video._id).catch(error => {
      console.error('Error sending new video notification:', error);
    });

    sendSuccessResponse(res, 200, { 
      message: 'Video published successfully',
      video: updatedVideo 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVideo,
  getVideos,
  getVideoById,
  toggleLike,
  incrementViews,
  getScheduledVideos,
  publishScheduledVideo
};
