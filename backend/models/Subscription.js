const mongoose = require('mongoose');

// Represents a subscription (follower -> following)
const SubscriptionSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can follow another user only once
SubscriptionSchema.index({ follower: 1, following: 1 }, { unique: true });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;


