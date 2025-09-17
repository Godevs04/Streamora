const express = require('express');
const { check } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('username').optional().isString()
  ],
  validate,
  register
);

/**
 * @route POST /api/auth/login
 * @desc Login user and get token
 * @access Public
 */
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  validate,
  login
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', protect, getMe);

module.exports = router;
