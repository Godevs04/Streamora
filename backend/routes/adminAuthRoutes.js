const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { check } = require('express-validator');
const validate = require('../middlewares/validate');

const {
  setupAdminAuth,
  authenticateAdmin,
  getAdminSettings,
  updateAdminSettings,
  toggleAdminAuth,
  changeAdminCredentials,
  sendAdminResetOTP,
  verifyAdminResetOTP
} = require('../controllers/adminController');

// Setup admin authentication
router.post('/setup', protect, [
  check('authMethod', 'Auth method is required').isIn(['pin', 'password', 'pattern']),
  check('credential', 'Credential is required').notEmpty()
], validate, setupAdminAuth);

// Authenticate admin
router.post('/authenticate', protect, [
  check('credential', 'Credential is required').notEmpty()
], validate, authenticateAdmin);

// Get admin settings
router.get('/settings', protect, getAdminSettings);

// Update admin settings
router.put('/settings', protect, updateAdminSettings);

// Toggle admin authentication
router.put('/toggle-auth', protect, [
  check('enabled', 'Enabled status is required').isBoolean()
], validate, toggleAdminAuth);

// Change admin credentials
router.put('/credentials', protect, [
  check('authMethod', 'Auth method is required').isIn(['pin', 'password', 'pattern']),
  check('credential', 'Credential is required').notEmpty()
], validate, changeAdminCredentials);

// Send admin reset OTP
router.post('/reset-otp', [
  check('email', 'Please include a valid email').isEmail()
], validate, sendAdminResetOTP);

// Verify admin reset OTP
router.post('/verify-reset-otp', [
  check('email', 'Please include a valid email').isEmail(),
  check('otp', 'OTP is required').notEmpty().isLength({ min: 6, max: 6 })
], validate, verifyAdminResetOTP);

module.exports = router;
