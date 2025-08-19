// backend/routes/profile.js
const express = require('express');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const { uploadProfilePicture, handleMulterError } = require('../middlewares/upload');
const {
  uploadProfilePicture: uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
  validateCloudinaryConfig
} = require('../utils/cloudinaryConfig');

const router = express.Router();

// Get user profile
router.get('/', auth(['freelancer', 'client']), async (req, res) => {
  console.log('🔥 GET /api/profile route hit');
  console.log('   User ID:', req.user?.userId);
  console.log('   User Role:', req.user?.role);

  try {
    const user = await User.findById(req.user.userId).select('-password');
    console.log('   User found:', !!user);

    if (!user) {
      console.log('   ❌ User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const publicProfile = user.getPublicProfile();
    console.log('   ✅ Returning user profile');

    res.json({
      success: true,
      user: publicProfile
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
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
router.patch('/picture', auth(['freelancer', 'client']), uploadProfilePicture, async (req, res) => {
  console.log('🔥 PROFILE PICTURE UPDATE ROUTE HIT');
  console.log('   User ID:', req.user?.userId);
  console.log('   File received:', !!req.file);
  console.log('   File details:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'No file');

  try {
    if (!req.file) {
      console.log('   ❌ No file provided');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if Cloudinary is configured
    console.log('   🔍 Checking Cloudinary configuration...');
    if (!validateCloudinaryConfig()) {
      console.log('   ❌ Cloudinary not configured');
      return res.status(500).json({
        success: false,
        message: 'Image upload service not configured'
      });
    }
    console.log('   ✅ Cloudinary configuration valid');

    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('   ❌ User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('   ✅ User found:', user.email);
    console.log('   Current profile picture:', user.profilePicture);
    console.log('   Has Google ID:', !!user.googleId);
    console.log('   User signup method:', user.googleId ? 'Google OAuth' : 'Email/Password');

    try {
      // Delete old profile picture from Cloudinary if it exists (but not Google profile pictures)
      if (user.profilePicture && !user.profilePicture.includes('googleusercontent.com')) {
        console.log('   🗑️ Deleting old profile picture:', user.profilePicture);
        const oldPublicId = extractPublicId(user.profilePicture);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
          console.log('   ✅ Old picture deleted');
        }
      } else if (user.profilePicture && user.profilePicture.includes('googleusercontent.com')) {
        console.log('   📝 Overriding Google profile picture with custom upload');
      }

      // Upload new profile picture to Cloudinary
      console.log('   📤 Uploading new profile picture to Cloudinary...');
      const result = await uploadToCloudinary(req.file.buffer, req.user.userId);
      console.log('   ✅ Upload successful:', result.secure_url);

      // Update user with new profile picture URL
      user.profilePicture = result.secure_url;
      await user.save();
      console.log('   ✅ User profile updated in database');

      res.json({
        success: true,
        message: 'Profile picture updated successfully',
        profilePicture: user.profilePicture,
        cloudinaryData: {
          publicId: result.public_id,
          url: result.secure_url
        }
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image. Please try again.'
      });
    }
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture'
    });
  }
});

// ============================================================================
// ACCOUNT SETTINGS ENDPOINTS
// ============================================================================

// Get account settings
router.get('/settings', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -resetPasswordToken -twoFactorSecret');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      settings: user.getAccountSettings(),
      profile: {
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Get account settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account settings'
    });
  }
});

// Update basic profile information
router.patch('/basic-info', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const { fullName, phoneNumber, location } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate and update fields
    if (fullName !== undefined) {
      if (!fullName || fullName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Full name must be at least 2 characters long'
        });
      }
      user.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber.trim();
    }

    if (location !== undefined) {
      user.location = location.trim();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Basic information updated successfully',
      profile: {
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Update basic info error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update basic information'
    });
  }
});

// Update email address
router.patch('/email', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'New email and current password are required'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new email is already in use
    const existingUser = await User.findOne({
      email: newEmail.toLowerCase().trim(),
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already in use'
      });
    }

    // Update email and mark as unverified
    user.email = newEmail.toLowerCase().trim();
    user.isVerified = false;
    user.verifiedAt = null;

    await user.save();

    res.json({
      success: true,
      message: 'Email address updated successfully. Please verify your new email address.',
      email: user.email,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error('Update email error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update email address'
    });
  }
});

// Change password
router.patch('/password', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirmation are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.lastPasswordChange = new Date();

    // Reset login attempts and unlock account if locked
    user.loginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
      lastPasswordChange: user.lastPasswordChange
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
});

// Update notification settings
router.patch('/notifications', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const { email, push, sms } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update notification settings using the model method
    const updatedSettings = user.updateNotificationSettings({ email, push, sms });
    await user.save();

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      notificationSettings: updatedSettings
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

// Update privacy settings
router.patch('/privacy', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const {
      profileVisibility,
      showEmail,
      showPhone,
      showLocation,
      showOnlineStatus,
      allowDirectMessages,
      showInSearchResults
    } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate profileVisibility if provided
    if (profileVisibility && !['public', 'private', 'freelancers-only', 'clients-only'].includes(profileVisibility)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid profile visibility setting'
      });
    }

    // Update privacy settings using the model method
    const updatedSettings = user.updatePrivacySettings({
      profileVisibility,
      showEmail,
      showPhone,
      showLocation,
      showOnlineStatus,
      allowDirectMessages,
      showInSearchResults
    });

    await user.save();

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      privacySettings: updatedSettings
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
});

// Update account preferences
router.patch('/preferences', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const { language, timezone, currency, dateFormat, theme } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate dateFormat if provided
    if (dateFormat && !['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(dateFormat)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Validate theme if provided
    if (theme && !['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid theme setting'
      });
    }

    // Update preferences using the model method
    const updatedPreferences = user.updatePreferences({
      language,
      timezone,
      currency,
      dateFormat,
      theme
    });

    await user.save();

    res.json({
      success: true,
      message: 'Account preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account preferences'
    });
  }
});

// Get login history
router.get('/login-history', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('loginHistory lastLoginAt lastLoginIP');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      loginHistory: user.loginHistory || [],
      lastLoginAt: user.lastLoginAt,
      lastLoginIP: user.lastLoginIP
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history'
    });
  }
});

// Enable/disable two-factor authentication
router.patch('/two-factor', auth(['freelancer', 'client']), async (req, res) => {
  try {
    const { enabled, password } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled status must be a boolean value'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to change two-factor authentication settings'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Update two-factor authentication setting
    user.twoFactorEnabled = enabled;

    // Clear two-factor secret if disabling
    if (!enabled) {
      user.twoFactorSecret = null;
    }

    await user.save();

    res.json({
      success: true,
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    console.error('Update two-factor authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update two-factor authentication settings'
    });
  }
});

// Add error handling middleware for multer errors
router.use(handleMulterError);

module.exports = router;
