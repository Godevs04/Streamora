const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  authMethod: {
    type: String,
    enum: ['pin', 'password', 'pattern'],
    required: true
  },
  encryptedCredentials: {
    type: String,
    required: function() {
      return this.hasSetup; // Only required if setup is complete
    },
    select: false // Don't include in queries by default
  },
  hasSetup: {
    type: Boolean,
    default: false
  },
  setupComplete: {
    type: Boolean,
    default: false
  },
  authEnabled: {
    type: Boolean,
    default: true
  },
  lastAuthenticated: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date,
    default: null
  },
  // Admin-specific settings
  channelCustomization: {
    channelName: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    bannerUrl: {
      type: String,
      default: null
    },
    avatarUrl: {
      type: String,
      default: null
    }
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false
      },
      showPhone: {
        type: Boolean,
        default: false
      }
    },
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      sessionTimeout: {
        type: Number,
        default: 30 // minutes
      }
    }
  },
  // Admin activity tracking
  activity: {
    lastLogin: {
      type: Date,
      default: Date.now
    },
    totalLogins: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
adminSchema.index({ userId: 1 });
adminSchema.index({ lastAuthenticated: 1 });

// Virtual for checking if admin is locked out
adminSchema.virtual('isLockedOut').get(function() {
  return this.lockoutUntil && this.lockoutUntil > Date.now();
});

// Method to increment login attempts
adminSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lockout and it's expired, restart at 1
  if (this.lockoutUntil && this.lockoutUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockoutUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLockedOut) {
    updates.$set = { lockoutUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockoutUntil: 1 }
  });
};

// Method to update last authenticated
adminSchema.methods.updateLastAuthenticated = function() {
  return this.updateOne({
    $set: { 
      lastAuthenticated: new Date(),
      'activity.lastLogin': new Date(),
      'activity.lastActivity': new Date()
    },
    $inc: { 'activity.totalLogins': 1 }
  });
};

module.exports = mongoose.model('Admin', adminSchema);
