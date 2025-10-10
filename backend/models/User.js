const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: [200, 'Bio cannot exceed 200 characters']
  },
  bannerUrl: {
    type: String,
    default: ''
  },
  subscribersCount: {
    type: Number,
    default: 0
  },
  paymentMethods: [{
    _id: String,
    type: {
      type: String,
      enum: ['paypal', 'bank', 'stripe'],
      required: true
    },
    identifier: {
      type: String,
      required: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  roles: {
    type: [String],
    default: ['user'],
    enum: ['user', 'admin']
  },
  fcmTokens: {
    type: [String],
    default: []
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  passwordResetOTP: {
    type: String,
    select: false
  },
  passwordResetOTPExpires: {
    type: Date,
    select: false
  },
  adminResetOTP: {
    type: String,
    select: false
  },
  adminResetOTPExpiry: {
    type: Date,
    select: false
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
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate OTP for email verification
UserSchema.methods.generateEmailVerificationOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP and expiration (10 minutes)
  this.emailVerificationOTP = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return otp;
};

// Method to verify OTP
UserSchema.methods.verifyEmailOTP = function(enteredOTP) {
  return (
    this.emailVerificationOTP === enteredOTP &&
    this.otpExpires > Date.now()
  );
};

// Method to generate OTP for password reset
UserSchema.methods.generatePasswordResetOTP = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set OTP and expiration (10 minutes)
  this.passwordResetOTP = otp;
  this.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return otp;
};

// Method to verify password reset OTP
UserSchema.methods.verifyPasswordResetOTP = function(enteredOTP) {
  return (
    this.passwordResetOTP === enteredOTP &&
    this.passwordResetOTPExpires > Date.now()
  );
};

// Method to get public profile (no sensitive data)
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.fcmTokens;
  delete userObject.emailVerificationOTP;
  delete userObject.otpExpires;
  delete userObject.passwordResetOTP;
  delete userObject.passwordResetOTPExpires;
  
  return userObject;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
