// backend/routes/profile.js
const express = require('express');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed!'));
  }
});

// Get user profile
router.get('/', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update freelancer bio and skills
router.patch('/bio', auth(['freelancer']), async (req, res) => {
  try {
    const { bio, skills } = req.body;

    if (!bio || bio.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Bio must be at least 50 characters long'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update bio
    user.bio = bio.trim();

    // Add skills if provided
    if (skills && Array.isArray(skills)) {
      user.addSkills(skills);
    }

    // Update profile completion status
    user.updateProfileCompletion();

    // Mark that they've completed the initial profile setup
    user.hasSeenProfileSetup = true;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile(),
      profileComplete: user.profileComplete
    });
  } catch (error) {
    console.error('Update bio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Update freelancer profile details
router.patch('/details', auth(['freelancer']), async (req, res) => {
  try {
    const { hourlyRate, experienceLevel, location, languages, socialLinks } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (hourlyRate !== undefined) {
      if (hourlyRate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Hourly rate cannot be negative'
        });
      }
      user.hourlyRate = hourlyRate;
    }

    if (experienceLevel && ['beginner', 'intermediate', 'expert'].includes(experienceLevel)) {
      user.experienceLevel = experienceLevel;
    }

    if (location !== undefined) {
      user.location = location.trim();
    }

    if (languages && Array.isArray(languages)) {
      user.languages = languages;
    }

    if (socialLinks && typeof socialLinks === 'object') {
      user.socialLinks = { ...user.socialLinks, ...socialLinks };
    }

    // Update profile completion status
    user.updateProfileCompletion();

    await user.save();

    res.json({
      success: true,
      message: 'Profile details updated successfully',
      user: user.getPublicProfile(),
      profileComplete: user.profileComplete
    });
  } catch (error) {
    console.error('Update profile details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile details'
    });
  }
});

// Update profile picture
router.patch('/picture', auth(['freelancer', 'client']), upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture if it exists
    if (user.profilePicture && user.profilePicture.startsWith('uploads/')) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update with new profile picture path
    user.profilePicture = req.file.path.replace(/\\/g, '/'); // Normalize path separators
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture'
    });
  }
});

module.exports = router;
