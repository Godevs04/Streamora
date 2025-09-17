const express = require('express');
const { check } = require('express-validator');
const { getUserById, updateProfile } = require('../controllers/usersController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Public
 */
router.get('/:id', getUserById);

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put(
  '/me',
  protect,
  upload.single('avatar'),
  [
    check('name').optional().notEmpty().withMessage('Name cannot be empty'),
    check('bio').optional().isLength({ max: 200 }).withMessage('Bio cannot exceed 200 characters')
  ],
  validate,
  updateProfile
);

module.exports = router;
