const cron = require('node-cron');
const Video = require('../models/Video');
const { notifyNewVideo } = require('../utils/notificationService');

/**
 * Check and publish scheduled videos
 */
const checkAndPublishScheduledVideos = async () => {
  try {
    const now = new Date();
    
    // Find videos that are scheduled and should be published now
    const scheduledVideos = await Video.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    }).populate('owner', 'name avatarUrl');

    console.log(`Found ${scheduledVideos.length} videos ready to publish`);

    for (const video of scheduledVideos) {
      try {
        // Update video status to published
        await Video.findByIdAndUpdate(video._id, {
          status: 'published',
          updatedAt: new Date()
        });

        console.log(`Published scheduled video: ${video.title} (ID: ${video._id})`);

        // Send notification to subscribers (non-blocking)
        notifyNewVideo(video.owner._id, video.title, video._id).catch(error => {
          console.error(`Error sending notification for video ${video._id}:`, error);
        });

      } catch (error) {
        console.error(`Error publishing video ${video._id}:`, error);
      }
    }

    if (scheduledVideos.length > 0) {
      console.log(`Successfully published ${scheduledVideos.length} scheduled videos`);
    }

  } catch (error) {
    console.error('Error in scheduled video publishing:', error);
  }
};

/**
 * Initialize the scheduler
 */
const initializeScheduler = () => {
  console.log('Initializing video scheduler...');
  
  // Run every minute to check for scheduled videos
  cron.schedule('* * * * *', () => {
    console.log('Checking for scheduled videos...');
    checkAndPublishScheduledVideos();
  });

  console.log('Video scheduler initialized - checking every minute');
};

module.exports = {
  checkAndPublishScheduledVideos,
  initializeScheduler
};
