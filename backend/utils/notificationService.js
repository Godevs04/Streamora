const User = require('../models/User');
const { sendPushNotification } = require('../controllers/notificationsController');

/**
 * Notification Service - Centralized notification management
 */

/**
 * Send notification to a specific user
 * @param {string} userId - Recipient user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data (optional)
 * @returns {Promise<boolean>} Success status
 */
const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.fcmTokens.length) {
      console.log(`User ${userId} not found or has no FCM tokens`);
      return false;
    }
    
    await sendPushNotification(user.fcmTokens, title, body, data);
    console.log(`Notification sent to user ${userId}: ${title}`);
    return true;
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    return false;
  }
};

/**
 * Send notification to multiple users
 * @param {Array<string>} userIds - Array of recipient user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data (optional)
 * @returns {Promise<number>} Number of successful notifications
 */
const sendNotificationToUsers = async (userIds, title, body, data = {}) => {
  try {
    const users = await User.find({ _id: { $in: userIds } });
    let successCount = 0;
    
    for (const user of users) {
      if (user.fcmTokens.length) {
        try {
          await sendPushNotification(user.fcmTokens, title, body, data);
          successCount++;
        } catch (error) {
          console.error(`Error sending notification to user ${user._id}:`, error);
        }
      }
    }
    
    console.log(`Sent ${successCount}/${userIds.length} notifications: ${title}`);
    return successCount;
  } catch (error) {
    console.error('Error sending notifications to users:', error);
    return 0;
  }
};

/**
 * Send notification to user's subscribers
 * @param {string} userId - User whose subscribers should be notified
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data (optional)
 * @returns {Promise<number>} Number of successful notifications
 */
const sendNotificationToSubscribers = async (userId, title, body, data = {}) => {
  try {
    const Subscription = require('../models/Subscription');
    const subscriptions = await Subscription.find({ following: userId }).populate('follower');
    
    const subscriberIds = subscriptions.map(sub => sub.follower._id);
    
    if (subscriberIds.length === 0) {
      console.log(`No subscribers found for user ${userId}`);
      return 0;
    }
    
    return await sendNotificationToUsers(subscriberIds, title, body, data);
  } catch (error) {
    console.error(`Error sending notification to subscribers of user ${userId}:`, error);
    return 0;
  }
};

/**
 * Notification templates for different events
 */
const NOTIFICATION_TEMPLATES = {
  NEW_VIDEO: {
    title: (creatorName) => `${creatorName} uploaded a new video!`,
    body: (videoTitle) => `Check out "${videoTitle}"`
  },
  NEW_COMMENT: {
    title: (commenterName) => `${commenterName} commented on your video`,
    body: (commentText) => `"${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`
  },
  NEW_LIKE: {
    title: (likerName) => `${likerName} liked your video`,
    body: (videoTitle) => `"${videoTitle}"`
  },
  NEW_SUBSCRIBER: {
    title: (subscriberName) => `${subscriberName} subscribed to you!`,
    body: () => `You have a new subscriber`
  }
};

/**
 * Send notification for new video upload
 * @param {string} creatorId - Video creator ID
 * @param {string} videoTitle - Video title
 * @param {string} videoId - Video ID
 * @returns {Promise<number>} Number of notifications sent
 */
const notifyNewVideo = async (creatorId, videoTitle, videoId) => {
  const creator = await User.findById(creatorId);
  if (!creator) return 0;
  
  const title = NOTIFICATION_TEMPLATES.NEW_VIDEO.title(creator.name);
  const body = NOTIFICATION_TEMPLATES.NEW_VIDEO.body(videoTitle);
  const data = {
    type: 'new_video',
    videoId: videoId,
    creatorId: creatorId
  };
  
  return await sendNotificationToSubscribers(creatorId, title, body, data);
};

/**
 * Send notification for new comment
 * @param {string} videoOwnerId - Video owner ID
 * @param {string} commenterId - Commenter ID
 * @param {string} commentText - Comment text
 * @param {string} videoId - Video ID
 * @returns {Promise<boolean>} Success status
 */
const notifyNewComment = async (videoOwnerId, commenterId, commentText, videoId) => {
  // Don't notify if user commented on their own video
  if (videoOwnerId === commenterId) return false;
  
  const commenter = await User.findById(commenterId);
  if (!commenter) return false;
  
  const title = NOTIFICATION_TEMPLATES.NEW_COMMENT.title(commenter.name);
  const body = NOTIFICATION_TEMPLATES.NEW_COMMENT.body(commentText);
  const data = {
    type: 'new_comment',
    videoId: videoId,
    commenterId: commenterId
  };
  
  return await sendNotificationToUser(videoOwnerId, title, body, data);
};

/**
 * Send notification for new like
 * @param {string} videoOwnerId - Video owner ID
 * @param {string} likerId - User who liked the video
 * @param {string} videoTitle - Video title
 * @param {string} videoId - Video ID
 * @returns {Promise<boolean>} Success status
 */
const notifyNewLike = async (videoOwnerId, likerId, videoTitle, videoId) => {
  // Don't notify if user liked their own video
  if (videoOwnerId === likerId) return false;
  
  const liker = await User.findById(likerId);
  if (!liker) return false;
  
  const title = NOTIFICATION_TEMPLATES.NEW_LIKE.title(liker.name);
  const body = NOTIFICATION_TEMPLATES.NEW_LIKE.body(videoTitle);
  const data = {
    type: 'new_like',
    videoId: videoId,
    likerId: likerId
  };
  
  return await sendNotificationToUser(videoOwnerId, title, body, data);
};

/**
 * Send notification for new subscriber
 * @param {string} creatorId - Creator who got a new subscriber
 * @param {string} subscriberId - New subscriber ID
 * @returns {Promise<boolean>} Success status
 */
const notifyNewSubscriber = async (creatorId, subscriberId) => {
  const subscriber = await User.findById(subscriberId);
  if (!subscriber) return false;
  
  const title = NOTIFICATION_TEMPLATES.NEW_SUBSCRIBER.title(subscriber.name);
  const body = NOTIFICATION_TEMPLATES.NEW_SUBSCRIBER.body();
  const data = {
    type: 'new_subscriber',
    subscriberId: subscriberId
  };
  
  return await sendNotificationToUser(creatorId, title, body, data);
};

module.exports = {
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToSubscribers,
  notifyNewVideo,
  notifyNewComment,
  notifyNewLike,
  notifyNewSubscriber,
  NOTIFICATION_TEMPLATES
};
