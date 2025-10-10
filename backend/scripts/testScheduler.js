const mongoose = require('mongoose');
const Video = require('../models/Video');
const { checkAndPublishScheduledVideos } = require('../services/schedulerService');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test function
const testScheduler = async () => {
  try {
    await connectDB();
    
    console.log('Testing scheduler...');
    
    // Check current scheduled videos
    const scheduledVideos = await Video.find({ status: 'scheduled' });
    console.log(`Found ${scheduledVideos.length} scheduled videos`);
    
    scheduledVideos.forEach(video => {
      console.log(`- ${video.title} (scheduled for: ${video.scheduledDate})`);
    });
    
    // Run the scheduler
    await checkAndPublishScheduledVideos();
    
    // Check again after running
    const remainingScheduled = await Video.find({ status: 'scheduled' });
    console.log(`Remaining scheduled videos: ${remainingScheduled.length}`);
    
    const publishedVideos = await Video.find({ status: 'published' }).sort({ updatedAt: -1 }).limit(5);
    console.log(`Recently published videos: ${publishedVideos.length}`);
    
    publishedVideos.forEach(video => {
      console.log(`- ${video.title} (published at: ${video.updatedAt})`);
    });
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run test
testScheduler();
