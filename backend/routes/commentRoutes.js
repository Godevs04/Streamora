const express = require('express');
const { check } = require('express-validator');
const { 
  createComment, 
  getComments, 
  deleteComment,
  toggleLikeComment,
} = require('../controllers/commentsController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @route POST /api/videos/:id/comments
 * @desc Create a new comment
 * @access Private
 */
router.post(
  '/videos/:id/comments',
  protect,
  [
    check('text', 'Comment text is required').notEmpty().isLength({ max: 500 })
  ],
  validate,
  createComment
);

/**
 * @route GET /api/videos/:id/comments
 * @desc Get comments for a video
 * @access Public
 */
router.get('/videos/:id/comments', getComments);

/**
 * @route DELETE /api/comments/:commentId
 * @desc Delete a comment
 * @access Private
 */
router.delete('/comments/:commentId', protect, deleteComment);

/**
 * @route PUT /api/comments/:commentId/like
 * @desc Toggle like/unlike a comment
 * @access Private
 */
router.put('/comments/:commentId/like', protect, toggleLikeComment);

module.exports = router;
