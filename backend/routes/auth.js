// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const { OAuth2Client } = require('google-auth-library');
const { uploadProfilePicture, handleMulterError } = require('../middlewares/upload');
const {
  uploadProfilePicture: uploadToCloudinary,
  validateCloudinaryConfig
} = require('../utils/cloudinaryConfig');

const router = express.Router();

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );
};

/* ─────────────────────────────────────────
   UTILITIES
─────────────────────────────────────────── */
const { extractSkillsFromBio, getSkillSuggestions } = require('../utils/skillExtractor');
// Import Brevo email service (replaces SendGrid)
const {
  generateVerificationToken,
  generatePasswordResetToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require('../utils/brevoEmailService');
const { validateRegistrationData, formatName } = require('../utils/validation');

/* ─────────────────────────────────────────
   ROUTES - NOW upload IS AVAILABLE
─────────────────────────────────────────── */
console.log('📝 About to define /freelancer/auto-tag-bio route...');
console.log('📝 Upload middleware available:', typeof upload);

// Freelancer auto-tag bio route with skill extraction
router.post('/freelancer/auto-tag-bio', async (req, res) => {
  try {
    console.log('🔥 Auto-tag bio route hit!');
    console.log('📝 Request body:', req.body);
    console.log('📝 File uploaded:', req.file ? 'Yes' : 'No');

    const { bio } = req.body;

    if (!bio || bio.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Bio must be at least 50 characters long'
      });
    }

    // Check if user is authenticated via session
    if (!req.session.user || req.session.user.role !== 'freelancer') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login as a freelancer.'
      });
    }

    // Find the user
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Extract skills from bio
    const extractedSkills = extractSkillsFromBio(bio);
    console.log('🎯 Extracted skills:', extractedSkills);

    // Update user profile
    user.bio = bio.trim();

    // Add extracted skills to user's existing skills
    if (extractedSkills.length > 0) {
      user.addSkills(extractedSkills);
    }

    // Update profile picture if uploaded
    if (req.file) {
      // Delete old profile picture if it exists
      if (user.profilePicture && user.profilePicture.startsWith('uploads/')) {
        const oldPath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profilePicture = req.file.path.replace(/\\/g, '/');
    }

    // Update profile completion status
    user.updateProfileCompletion();

    await user.save();

    // Get skill suggestions
    const suggestions = getSkillSuggestions(user.skills);

    console.log('✅ Profile updated successfully');
    console.log('📊 Profile complete:', user.profileComplete);

    res.json({
      success: true,
      message: 'Bio updated and skills auto-tagged successfully!',
      skills: user.skills,
      extractedSkills,
      suggestions,
      profileComplete: user.profileComplete,
      profilePicture: user.profilePicture,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Auto-tag bio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bio and extract skills',
      error: error.message
    });
  }
});


// Login Route
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('Account deactivated:', user.email);
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support for assistance.',
        accountDeactivated: true,
        deactivatedAt: user.deactivatedAt,
        reason: user.deactivationReason
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Store user info in session
    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || null
    };

    // Check freelancer profile completion - show popup if profile is incomplete
    let needsProfileSetup = false;
    if (user.role === 'freelancer' && !user.isFreelancerProfileComplete()) {
      needsProfileSetup = true;
    }

    console.log('Login successful for user:', user.email);

    // Generate JWT token for API authentication
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      token,
      user: req.session.user,
      needsProfileSetup
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Register Route
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', {
      fullName: req.body.fullName,
      email: req.body.email,
      role: req.body.role
    });

    const { fullName, email, password, role, bio } = req.body;

    // Extract skills from bio if provided (for freelancers)
    let extractedSkills = [];
    if (bio && bio.trim().length > 0) {
      extractedSkills = extractSkillsFromBio(bio);
      console.log('🎯 Extracted skills from bio:', extractedSkills);
    }

    // Comprehensive validation
    const validation = validateRegistrationData({
      fullName,
      email,
      password,
      role
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        details: validation.errors.map(err => err.message).join(', ')
      });
    }

    // Check if user already exists in main User collection
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    console.log('Existing user check:', existingUser ? 'User exists' : 'User does not exist');

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if user is already pending verification
    const existingPendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
    if (existingPendingUser) {
      return res.status(400).json({
        success: false,
        message: 'A verification email has already been sent to this email address. Please check your inbox or try again later.'
      });
    }

    // Generate verification token for both clients and freelancers
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new pending user (not saved to main User collection yet)
    const pendingUser = new PendingUser({
      fullName: formatName(fullName),
      email: email.toLowerCase().trim(),
      password,
      role,
      bio: bio || '',
      skills: extractedSkills,
      verificationToken,
      verificationTokenExpires
    });

    console.log('Attempting to save pending user to database...');
    const savedPendingUser = await pendingUser.save();
    console.log('Pending user saved successfully:', savedPendingUser._id);

    // Send verification email for both clients and freelancers
    let emailSent = false;
    try {
      await sendVerificationEmail(savedPendingUser, verificationToken);
      console.log('✅ Verification email sent to:', savedPendingUser.email);
      emailSent = true;
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      console.log('📧 Email service unavailable, but registration successful');
      // Don't fail registration if email fails
    }

    // Don't set user session yet - user needs to verify email first

    let responseMessage;
    if (emailSent) {
      responseMessage = 'Registration successful! Please check your email to verify your account.';
    } else {
      responseMessage = 'Registration successful! Email service is temporarily unavailable. Please try again or contact support.';
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
      needsVerification: true,
      emailSent,
      email: savedPendingUser.email, // For display purposes only
      devVerificationUrl: (!emailSent && process.env.NODE_ENV !== 'production')
        ? `${process.env.BACKEND_URL || 'http://localhost:' + (process.env.PORT || 5000)}/api/auth/dev-verify/${savedPendingUser.email}`
        : null
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data provided'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// Google OAuth Route
router.post('/google', async (req, res) => {
  console.log('🔥 GOOGLE ROUTE HIT! Body:', req.body);
  console.log('🔥 Headers:', req.headers);
  console.log('🔥 Request URL:', req.originalUrl);
  
  try {
    const { credential, isRegister } = req.body;

    console.log('Google OAuth attempt:', { isRegister, hasCredential: !!credential });

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    console.log('Google user data:', { email, name, googleId });

    // Check if user already exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user && !isRegister) {
      // LOGIN: User exists, log them in
      console.log('Existing user logging in with Google');
      
      // Update user with Google data if not already present
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        await user.save();
        console.log('Updated existing user with Google data');
      }

      // Set user session
      req.session.user = {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      };

      const token = generateToken(user._id, user.role);

      res.json({
        success: true,
        message: `Welcome back, ${user.fullName}!`,
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture
        }
      });

    } else if (!user && isRegister) {
      // REGISTER: Create new user and save to MongoDB
      console.log('Creating new Google user in MongoDB');
      
      const newUser = new User({
        fullName: name,
        email: email.toLowerCase(),
        password: await bcrypt.hash(googleId, 12), // Hash Google ID as password
        role: 'client', // Default role, can be modified
        googleId: googleId,
        profilePicture: picture
      });

      const savedUser = await newUser.save();
      console.log('✅ New Google user saved to MongoDB:', savedUser._id);

      // Set user session
      req.session.user = {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role,
        profilePicture: savedUser.profilePicture
      };

      const token = generateToken(savedUser._id, savedUser.role);

      res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to WebSphere!',
        token,
        user: {
          id: savedUser._id,
          fullName: savedUser.fullName,
          email: savedUser.email,
          role: savedUser.role,
          profilePicture: savedUser.profilePicture
        }
      });

    } else if (user && isRegister) {
      // User exists but trying to register
      res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please login instead.'
      });

    } else {
      // User doesn't exist but trying to login
      res.status(404).json({
        success: false,
        message: 'No account found with this email. Please register first.'
      });
    }

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
});

// Email verification route
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // First check if user is already verified with this token
    const alreadyVerifiedUser = await User.findOne({
      verificationToken: token,
      isVerified: true
    });

    if (alreadyVerifiedUser) {
      return res.json({
        success: true,
        message: 'Email already verified! Your account is ready to use.',
        user: {
          id: alreadyVerifiedUser._id,
          fullName: alreadyVerifiedUser.fullName,
          email: alreadyVerifiedUser.email,
          role: alreadyVerifiedUser.role,
          isVerified: alreadyVerifiedUser.isVerified
        },
        alreadyVerified: true
      });
    }

    // Find pending user with this verification token
    const pendingUser = await PendingUser.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!pendingUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Convert pending user to actual user
    const user = pendingUser.toActualUser();
    
    // Preserve the verification token for future reference
    user.verificationToken = token;
    
    await user.save();

    // Remove the pending user
    await PendingUser.findByIdAndDelete(pendingUser._id);

    console.log('✅ User verified and moved to main collection:', user.email);

    // Send welcome email
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    console.log('✅ User verified successfully:', user.email);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to WebSphere!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// Resend verification email route
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isVerified: false
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
});

// Development route to simulate email verification (for testing)

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user, resetToken);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      // Clear the reset token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Update password and clear reset token
    user.password = newPassword; // Will be hashed by pre-save middleware
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// Test route to verify auth routes are working
router.get('/test-route', (req, res) => {
  res.json({
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /login',
      'POST /register',
      'POST /google',
      'POST /freelancer/auto-tag-bio',
      'GET /verify-email/:token',
      'POST /resend-verification',
      'POST /forgot-password',
      'POST /reset-password',

      'GET /session',
      'POST /logout'
    ]
  });
});

// Check session status
router.get('/session', (req, res) => {
  try {
    if (req.session?.user) {
      res.json({
        success: true,
        isAuthenticated: true,
        user: req.session.user
      });
    } else {
      res.json({
        success: true,
        isAuthenticated: false,
        user: null
      });
    }
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check session'
    });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to logout'
        });
      }

      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
});

module.exports = router;
