const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middlewares/auth');
const User = require('../models/User');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Creator Stats
router.get('/creator/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's videos
    const videos = await Video.find({ owner: userId });
    
    // Calculate stats
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    const totalWatchTime = videos.reduce((sum, video) => sum + ((video.duration || 0) * (video.views || 0)), 0);
    const watchTimeHours = Math.round(totalWatchTime / 3600);
    
    // Get subscriber count (you may need to implement a subscription model)
    const user = await User.findById(userId);
    const subscribers = user.subscribersCount || 0;
    
    res.json({
      success: true,
      data: {
        subscribers,
        totalViews,
        watchTimeHours
      }
    });
  } catch (error) {
    console.error('Creator stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Latest Videos
router.get('/creator/latest-videos', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const videos = await Video.find({ owner: userId })
      .populate('owner', 'name username avatarUrl')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Add comments count to each video
    const videosWithComments = await Promise.all(
      videos.map(async (video) => {
        const commentsCount = await Comment.countDocuments({ video: video._id });
        return {
          ...video.toObject(),
          commentsCount
        };
      })
    );
    
    res.json({
      success: true,
      data: videosWithComments
    });
  } catch (error) {
    console.error('Latest videos error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Analytics
router.get('/creator/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const videos = await Video.find({ owner: userId });
    
    // Generate engagement data for last 14 days
    const days = 14;
    const today = new Date();
    const engagement = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      // Calculate views for this day (simplified - you may want to track daily views)
      const dayViews = videos.reduce((sum, video) => {
        const videoDate = new Date(video.createdAt).toISOString().slice(0, 10);
        return videoDate === dateStr ? sum + (video.views || 0) : sum;
      }, 0);
      
      engagement.push({ date: dateStr, views: dayViews });
    }
    
    // Per-video analytics
    const perVideo = await Promise.all(
      videos.slice(0, 10).map(async (video) => {
        const commentsCount = await Comment.countDocuments({ video: video._id });
        return {
          videoId: video._id,
          title: video.title,
          views: video.views || 0,
          likes: video.likesCount || 0,
          comments: commentsCount,
          shares: 0, // Implement if you have shares
          retentionPercent: Math.min(100, Math.max(30, 70)) // Mock data
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        engagement,
        traffic: {
          direct: Math.floor(Math.random() * 1000) + 500,
          external: Math.floor(Math.random() * 500) + 200,
          search: Math.floor(Math.random() * 800) + 300,
          suggested: Math.floor(Math.random() * 600) + 400
        },
        demographics: {
          male: 62,
          female: 36,
          other: 2
        },
        perVideo: perVideo.sort((a, b) => b.views - a.views)
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Monetization
router.get('/creator/monetization', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const videos = await Video.find({ owner: userId });
    
    const subscribers = user.subscribersCount || 0;
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    const watchTimeHours = Math.round(videos.reduce((sum, video) => sum + ((video.duration || 0) * (video.views || 0)), 0) / 3600);
    
    const estimatedRevenue = totalViews > 0 ? (totalViews * 0.002) : 0;
    
    // Generate earnings history for last 7 days
    const earningsHistory = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().slice(0, 10),
        revenue: Math.random() * 200 + 100
      };
    });
    
    res.json({
      success: true,
      data: {
        eligibility: {
          subscribers,
          watchHours: watchTimeHours,
          policyCompliance: subscribers >= 1000 && watchTimeHours >= 4000,
          approved: subscribers >= 1000 && watchTimeHours >= 4000
        },
        earnings: {
          estimatedRevenue,
          cpm: 7.13,
          rpm: 4.97
        },
        balance: estimatedRevenue * 0.7,
        payouts: [
          { amount: 241.90, date: '2025-04-10', method: 'PayPal', status: 'paid' },
          { amount: 239.10, date: '2025-03-25', method: 'PayPal', status: 'paid' }
        ],
        revenueBreakdown: {
          ads: estimatedRevenue * 0.6,
          shorts: estimatedRevenue * 0.3,
          memberships: estimatedRevenue * 0.05,
          superChat: estimatedRevenue * 0.05
        },
        earningsHistory
      }
    });
  } catch (error) {
    console.error('Monetization error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Content Management
router.get('/creator/content', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });
    
    const uploads = videos.map(video => ({
      _id: video._id,
      title: video.title,
      status: video.status || 'published',
      thumbnailUrl: video.thumbnailUrl,
      createdAt: video.createdAt
    }));
    
    const thumbnails = Array.from({ length: 6 }, (_, i) => ({
      _id: `thumb${i + 1}`,
      videoId: videos[i]?._id,
      thumbnailUrl: videos[i]?.thumbnailUrl,
      status: videos[i] ? 'uploaded' : 'empty'
    }));
    
    res.json({
      success: true,
      data: {
        uploads,
        thumbnails,
        scheduledPosts: [] // Implement if you have scheduled posts
      }
    });
  } catch (error) {
    console.error('Content error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Community Management
router.get('/creator/community', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get comments on user's videos that need moderation
    const userVideos = await Video.find({ owner: userId }).select('_id title');
    const videoIds = userVideos.map(v => v._id);
    
    const moderationComments = await Comment.find({
      video: { $in: videoIds },
      status: 'pending'
    })
    .populate('author', 'name username')
    .populate('video', 'title')
    .limit(10);
    
    // Get reported comments (you may need to implement a reports model)
    const reportedComments = [];
    
    res.json({
      success: true,
      data: {
        moderationComments: moderationComments.map(comment => ({
          _id: comment._id,
          author: comment.author,
          text: comment.text,
          video: { _id: comment.video._id, title: comment.video.title },
          createdAt: comment.createdAt,
          status: comment.status || 'pending'
        })),
        reportedComments,
        communityPosts: []
      }
    });
  } catch (error) {
    console.error('Community error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Settings
router.get('/creator/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      data: {
        channelCustomization: {
          channelName: user.name,
          bio: user.bio || 'Welcome to my channel!',
          profileImageUrl: user.avatarUrl,
          bannerImageUrl: user.bannerUrl
        },
        paymentMethods: user.paymentMethods || [],
        policyGuidelines: {
          communityGuidelines: 'Please ensure your channel adheres to NovaTube policies.',
          monetizationPolicies: 'Repeated violations may lead to monetization removal.',
          copyrightPolicies: 'Respect copyright laws and fair use guidelines.',
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Channel Management
router.put('/channel/update', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { channelName, bio } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { name: channelName, bio },
      { new: true }
    );
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Channel update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Profile Image Upload
router.post('/channel/upload-profile', auth, upload.single('profile'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    await User.findByIdAndUpdate(userId, { avatarUrl });
    
    res.json({
      success: true,
      data: { url: avatarUrl }
    });
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Banner Image Upload
router.post('/channel/upload-banner', auth, upload.single('banner'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const bannerUrl = `/uploads/${req.file.filename}`;
    
    await User.findByIdAndUpdate(userId, { bannerUrl });
    
    res.json({
      success: true,
      data: { url: bannerUrl }
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Payment Methods
router.get('/payments/methods', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      data: user.paymentMethods || []
    });
  } catch (error) {
    console.error('Payment methods error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/payments/methods', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, identifier } = req.body;
    
    const newMethod = {
      _id: new Date().getTime().toString(),
      type,
      identifier,
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    
    await User.findByIdAndUpdate(userId, {
      $push: { paymentMethods: newMethod }
    });
    
    res.json({
      success: true,
      data: newMethod
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/payments/methods/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const methodId = req.params.id;
    
    await User.findByIdAndUpdate(userId, {
      $pull: { paymentMethods: { _id: methodId } }
    });
    
    res.json({
      success: true,
      message: 'Payment method deleted'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
