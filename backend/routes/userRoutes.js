const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middlewares/auth');
const {
  getUserProfile,
  getUserById,
  updateUserProfile,
  updateUserAvatar,
  getUserStats,
  getUserVideos,
  subscribeToUser,
  unsubscribeFromUser,
  getPublicUserStats,
  checkSubscriptionStatus,
} = require('../controllers/userController');

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid avatar URL')
];

const updateAvatarValidation = [
  body('avatarUrl')
    .notEmpty()
    .withMessage('Avatar URL is required')
    .isURL()
    .withMessage('Please provide a valid URL')
];

// All routes require authentication
router.use(protect);

// GET /api/user/profile - Get user profile
router.get('/profile', getUserProfile);

// GET /api/user/stats - Get user statistics
router.get('/stats', getUserStats);

// PUT /api/user/profile - Update user profile
router.put('/profile', updateProfileValidation, updateUserProfile);

// PUT /api/user/avatar - Update user avatar
router.put('/avatar', updateAvatarValidation, updateUserAvatar);

// GET /api/user/:userId/videos - Get user videos
router.get('/:userId/videos', getUserVideos);

// POST /api/user/:userId/subscribe - Subscribe to a user
router.post('/:userId/subscribe', subscribeToUser);

// DELETE /api/user/:userId/subscribe - Unsubscribe from a user
router.delete('/:userId/subscribe', unsubscribeFromUser);

// GET /api/user/:userId/stats - Public stats for a user
router.get('/:userId/stats', getPublicUserStats);

// GET /api/user/:userId/subscription-status - Check if current user is subscribed to another user
router.get('/:userId/subscription-status', checkSubscriptionStatus);

// GET /api/user/:userId - Get user by ID (must be last to avoid conflicts)
router.get('/:userId', getUserById);

module.exports = router;