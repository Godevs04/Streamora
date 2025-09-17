const User = require('../models/User');
const axios = require('axios');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/sendResponse');

/**
 * Register FCM token for push notifications
 * @route POST /api/notifications/register
 * @access Private
 */
const registerDevice = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return sendErrorResponse(res, 400, 'FCM token is required');
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return sendErrorResponse(res, 404, 'User not found');
    }
    
    // Add token if not already present
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }
    
    sendSuccessResponse(res, 200, { message: 'Device registered successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Send push notification
 * @route POST /api/notifications/send
 * @access Private (Admin only)
 */
const sendNotification = async (req, res, next) => {
  try {
    const { title, body, recipientUserId } = req.body;
    
    if (!title || !body || !recipientUserId) {
      return sendErrorResponse(res, 400, 'Title, body, and recipientUserId are required');
    }
    
    // Find recipient user
    const recipient = await User.findById(recipientUserId);
    
    if (!recipient) {
      return sendErrorResponse(res, 404, 'Recipient user not found');
    }
    
    // Check if user has FCM tokens
    if (!recipient.fcmTokens.length) {
      return sendErrorResponse(res, 400, 'Recipient has no registered devices');
    }
    
    // Send notification
    const result = await sendPushNotification(recipient.fcmTokens, title, body);
    
    sendSuccessResponse(res, 200, { 
      message: 'Notification sent successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to send FCM push notifications
 * @param {Array} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data (optional)
 * @returns {Promise<object>} FCM response
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  try {
    // Using FCM HTTP v1 API
    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens
    };
    
    // FCM endpoint with project ID from FCM_SENDER_ID
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${process.env.FCM_SENDER_ID}/messages:send`;
    
    const response = await axios.post(
      fcmEndpoint,
      { message },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FCM_KEY_PAIR}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw new Error('Failed to send push notification');
  }
};

module.exports = {
  registerDevice,
  sendNotification,
  sendPushNotification // Export for use in other controllers
};
