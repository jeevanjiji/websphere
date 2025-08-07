// backend/models/PendingUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pendingUserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: {
      values: ['client', 'freelancer'],
      message: 'Role must be either client or freelancer'
    },
    required: [true, 'Role is required']
  },
  
  // Freelancer-specific fields (stored temporarily)
  bio: {
    type: String,
    default: '',
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  skills: {
    type: [String],
    default: []
  },
  
  // Verification fields
  verificationToken: {
    type: String,
    required: true
  },
  verificationTokenExpires: {
    type: Date,
    required: true
  },
  
  // Auto-expire pending users after 24 hours
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds
  }
});

// Hash password before saving
pendingUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Hashing password for pending user:', this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to convert pending user to actual user
pendingUserSchema.methods.toActualUser = function() {
  const User = require('./User');

  const user = new User({
    fullName: this.fullName,
    email: this.email,
    password: this.password, // Already hashed
    role: this.role,
    bio: this.bio || '',
    skills: this.skills || [],
    isVerified: true,
    verifiedAt: new Date(),
    verificationToken: null,
    verificationTokenExpires: null,
    profileComplete: this.role !== 'freelancer' // Auto-complete for non-freelancers
  });

  // Mark password as not modified to prevent double hashing
  user.markModified('password');
  user.isModified = function(path) {
    if (path === 'password') return false;
    return this.constructor.prototype.isModified.call(this, path);
  };

  return user;
};

module.exports = mongoose.model('PendingUser', pendingUserSchema);
