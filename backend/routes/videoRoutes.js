const express = require('express');
const { check } = require('express-validator');
const { 
  createVideo, 
  getVideos, 
  getVideoById, 
  toggleLike, 
  incrementViews 
} = require('../controllers/videosController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @route POST /api/videos
 * @desc Create a new video
 * @access Private
 */
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  [
    check('title', 'Title is required').notEmpty().isLength({ max: 100 }),
    check('description').optional().isLength({ max: 1000 }),
    check('tags').optional().isString(),
    check('videoUrl').optional().isURL(),
    check('thumbnailUrl').optional().isURL(),
    check('thumbnailAspectRatio').optional().isIn(['16:9', '4:3', '1:1']),
    check('duration').optional().isNumeric()
  ],
  validate,
  createVideo
);

/**
 * @route GET /api/videos
 * @desc Get all videos with pagination
 * @access Public
 */
router.get('/', getVideos);

/**
 * @route GET /api/videos/:id
 * @desc Get video by ID
 * @access Public
 */
router.get('/:id', getVideoById);

/**
 * @route PUT /api/videos/:id/like
 * @desc Toggle like/unlike video
 * @access Private
 */
router.put('/:id/like', protect, toggleLike);

/**
 * @route PUT /api/videos/:id/view
 * @desc Increment video view count
 * @access Public
 */
router.put('/:id/view', incrementViews);

module.exports = router;
