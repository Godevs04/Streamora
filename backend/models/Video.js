const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Video must have an owner']
  },
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail URL is required']
  },
  tags: {
    type: [String],
    default: []
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments
VideoSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'video'
});

// Method to toggle like/unlike
VideoSchema.methods.toggleLike = async function(userId) {
  const userIdObj = mongoose.Types.ObjectId(userId);
  const isLiked = this.likes.includes(userIdObj);
  
  if (isLiked) {
    // Unlike
    this.likes = this.likes.filter(id => !id.equals(userIdObj));
    this.likesCount = Math.max(0, this.likesCount - 1);
  } else {
    // Like
    this.likes.push(userIdObj);
    this.likesCount = this.likes.length;
  }
  
  await this.save();
  return !isLiked; // Return true if liked, false if unliked
};

// Method to increment view count
VideoSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this.views;
};

const Video = mongoose.model('Video', VideoSchema);

module.exports = Video;
