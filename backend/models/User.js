// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
      values: ['admin', 'client', 'freelancer'],
      message: 'Role must be either admin, client, or freelancer'
    },
    required: [true, 'Role is required']
  },
  
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true // Allows multiple null values but requires unique non-null values
  },
  profilePicture: {
    type: String,
    default: null
  },

  // Freelancer-specific profile fields
  bio: {
    type: String,
    default: '',
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  skills: {
    type: [String],
    default: [],
    validate: {
      validator: function(skills) {
        return skills.length <= 50; // Max 50 skills
      },
      message: 'Cannot have more than 50 skills'
    }
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative'],
    default: null
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: null
  },
  portfolio: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    url: String,
    image: String,
    technologies: [String]
  }],
  
  // Profile completion tracking
  profileComplete: {
    type: Boolean,
    default: function() {
      // Auto-complete for non-freelancers
      return this.role !== 'freelancer';
    }
  },

  // Track if user has been shown profile setup popup
  hasSeenProfileSetup: {
    type: Boolean,
    default: false
  },
  
  // Additional profile fields
  location: {
    type: String,
    default: ''
  },
  languages: [{
    language: { type: String, required: true },
    proficiency: { 
      type: String, 
      enum: ['basic', 'conversational', 'fluent', 'native'],
      required: true 
    }
  }],
  
  // Account status and verification
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },

  // Soft deletion fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deletionReason: {
    type: String,
    default: null
  },

  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  
  // Freelancer ratings and stats
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  completedProjects: {
    type: Number,
    default: 0
  },
  
  // Social links
  socialLinks: {
    linkedin: String,
    github: String,
    website: String,
    twitter: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    
    console.log('Hashing password for user:', this.email);
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Password comparison failed');
  }
};

// Method to check if freelancer profile is complete
userSchema.methods.isFreelancerProfileComplete = function() {
  if (this.role !== 'freelancer') return true;

  return !!(
    this.bio &&
    this.bio.trim().length >= 50 && // At least 50 characters in bio
    this.skills &&
    this.skills.length >= 3 // At least 3 skills
  );
};

// Method to update profile completion status
userSchema.methods.updateProfileCompletion = function() {
  this.profileComplete = this.isFreelancerProfileComplete();
  return this.profileComplete;
};

// Pre-save hook to auto-update profile completion
userSchema.pre('save', function(next) {
  if (this.role === 'freelancer') {
    this.profileComplete = this.isFreelancerProfileComplete();
  }
  next();
});

// Method to add skills (with auto-deduplication)
userSchema.methods.addSkills = function(newSkills) {
  const currentSkills = this.skills || [];
  const skillsToAdd = Array.isArray(newSkills) ? newSkills : [newSkills];
  
  // Normalize and deduplicate
  const normalizedNew = skillsToAdd
    .map(skill => skill.toLowerCase().trim())
    .filter(skill => skill.length > 0);
    
  const normalizedCurrent = currentSkills.map(skill => skill.toLowerCase());
  
  const uniqueNewSkills = normalizedNew.filter(skill => 
    !normalizedCurrent.includes(skill)
  );
  
  // Add original case versions
  const skillsWithOriginalCase = uniqueNewSkills.map(skill => {
    const originalIndex = skillsToAdd.findIndex(s => 
      s.toLowerCase().trim() === skill
    );
    return skillsToAdd[originalIndex] || skill;
  });
  
  this.skills = [...currentSkills, ...skillsWithOriginalCase];
  return this.skills;
};

// Method to get public profile (safe for API responses)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email, // Consider removing in production for privacy
    role: this.role,
    profilePicture: this.profilePicture,
    bio: this.bio,
    skills: this.skills,
    hourlyRate: this.hourlyRate,
    experienceLevel: this.experienceLevel,
    location: this.location,
    languages: this.languages,
    rating: this.rating,
    completedProjects: this.completedProjects,
    socialLinks: this.socialLinks,
    profileComplete: this.profileComplete,
    isVerified: this.isVerified,
    createdAt: this.createdAt
  };
};

// Add indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ completedProjects: -1 });
userSchema.index({ location: 1 });

// Text index for search functionality
userSchema.index({
  fullName: 'text',
  bio: 'text',
  skills: 'text'
});

module.exports = mongoose.model('User', userSchema);
