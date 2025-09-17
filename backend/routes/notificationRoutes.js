const express = require('express');
const { check } = require('express-validator');
const { 
  registerDevice, 
  sendNotification 
} = require('../controllers/notificationsController');
const { protect, admin } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @route POST /api/notifications/register
 * @desc Register FCM token for push notifications
 * @access Private
 */
router.post(
  '/register',
  protect,
  [
    check('fcmToken', 'FCM token is required').notEmpty()
  ],
  validate,
  registerDevice
);

/**
 * @route POST /api/notifications/send
 * @desc Send push notification
 * @access Private (Admin only)
 */
router.post(
  '/send',
  protect,
  admin,
  [
    check('title', 'Title is required').notEmpty(),
    check('body', 'Body is required').notEmpty(),
    check('recipientUserId', 'Recipient user ID is required').notEmpty().isMongoId()
  ],
  validate,
  sendNotification
);

module.exports = router;
