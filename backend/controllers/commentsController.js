const Comment = require('../models/Comment');
const Video = require('../models/Video');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');

/**
 * Create a new comment
 * @route POST /api/videos/:id/comments
 * @access Private
 */
const createComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const videoId = req.params.id;
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return sendErrorResponse(res, 404, 'Video not found');
    }
    
    // Create comment
    const comment = await Comment.create({
      video: videoId,
      author: req.user._id,
      text
    });
    
    // Populate author
    await comment.populate('author', 'name avatarUrl');
    
    sendSuccessResponse(res, 201, { comment });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for a video
 * @route GET /api/videos/:id/comments
 * @access Public
 */
const getComments = async (req, res, next) => {
  try {
    const videoId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const sort = req.query.sort || 'newest';
    const skip = (page - 1) * limit;
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return sendErrorResponse(res, 404, 'Video not found');
    }
    
    // Build sort options
    let sortOptions = {};
    if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else {
      sortOptions = { createdAt: -1 };
    }
    
    // Get comments
    const comments = await Comment.find({ video: videoId })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatarUrl');
    
    // Get total count
    const total = await Comment.countDocuments({ video: videoId });
    
    sendSuccessResponse(res, 200, { comments }, {
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
 * Delete a comment
 * @route DELETE /api/comments/:commentId
 * @access Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return sendErrorResponse(res, 404, 'Comment not found');
    }
    
    // Check if user is author or admin
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');
    
    if (!isAuthor && !isAdmin) {
      return sendErrorResponse(res, 403, 'Not authorized to delete this comment');
    }
    
    await comment.remove();
    
    sendSuccessResponse(res, 200, { message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getComments,
  deleteComment
};
