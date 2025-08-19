const express = require('express');
const User = require('../models/User');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Protected Routes (auth + admin)
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const { includeDeleted } = req.query;
    const filter = includeDeleted === 'true' ? {} : { isDeleted: false };

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

router.get('/dashboard-stats', authenticate, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const clientsCount = await User.countDocuments({ role: 'client', isDeleted: false });
    const freelancersCount = await User.countDocuments({ role: 'freelancer', isDeleted: false });
    const activeUsers = await User.countDocuments({ isActive: true, isDeleted: false });
    const deletedUsers = await User.countDocuments({ isDeleted: true });

    res.json({
      success: true,
      stats: { totalUsers, clientsCount, freelancersCount, activeUsers, deletedUsers }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
});

// Soft delete user
router.patch('/users/:userId/soft-delete', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Validate user exists and is not already deleted
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is already deleted'
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete the user
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    user.deletionReason = reason || 'No reason provided';
    user.isActive = false;

    await user.save();

    console.log(`🗑️ User soft deleted by admin: ${user.email} (ID: ${userId})`);
    console.log(`🔍 Deletion reason: ${reason || 'No reason provided'}`);
    console.log(`👤 Deleted by: ${req.user.email} (ID: ${req.user.id})`);

    res.json({
      success: true,
      message: 'User account has been deactivated successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isDeleted: user.isDeleted,
        deletedAt: user.deletedAt,
        deletionReason: user.deletionReason
      }
    });

  } catch (error) {
    console.error('❌ Error soft deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user account'
    });
  }
});

// Restore soft deleted user
router.patch('/users/:userId/restore', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'User is not deleted'
      });
    }

    // Restore the user
    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedBy = null;
    user.deletionReason = null;
    user.isActive = true;

    await user.save();

    console.log(`♻️ User restored by admin: ${user.email} (ID: ${userId})`);
    console.log(`👤 Restored by: ${req.user.email} (ID: ${req.user.id})`);

    res.json({
      success: true,
      message: 'User account has been restored successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isDeleted: user.isDeleted,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('❌ Error restoring user:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring user account'
    });
  }
});

// Hard delete user (permanent deletion)
router.delete('/users/:userId/hard-delete', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmPassword } = req.body;

    // Validate admin password for hard deletion
    const bcrypt = require('bcryptjs');
    const admin = await User.findById(req.user.id);

    if (!confirmPassword || !await bcrypt.compare(confirmPassword, admin.password)) {
      return res.status(401).json({
        success: false,
        message: 'Admin password confirmation required for permanent deletion'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Store user info for logging before deletion
    const userInfo = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };

    // Permanently delete the user
    await User.findByIdAndDelete(userId);

    console.log(`🔥 User permanently deleted by admin: ${userInfo.email} (ID: ${userId})`);
    console.log(`👤 Deleted by: ${req.user.email} (ID: ${req.user.id})`);
    console.log(`⚠️ This action is irreversible!`);

    res.json({
      success: true,
      message: 'User account has been permanently deleted',
      deletedUser: userInfo
    });

  } catch (error) {
    console.error('❌ Error permanently deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting user account'
    });
  }
});

// Get deleted users
router.get('/users/deleted', authenticate, isAdmin, async (req, res) => {
  try {
    const deletedUsers = await User.find({ isDeleted: true })
      .populate('deletedBy', 'fullName email')
      .select('-password')
      .sort({ deletedAt: -1 });

    res.json({
      success: true,
      users: deletedUsers
    });

  } catch (error) {
    console.error('❌ Error fetching deleted users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deleted users'
    });
  }
});

// Deactivate freelancer account
router.patch('/users/:userId/deactivate', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Find the user to deactivate
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow deactivation of freelancers
    if (user.role !== 'freelancer') {
      return res.status(400).json({
        success: false,
        message: 'Only freelancer accounts can be deactivated'
      });
    }

    // Prevent admin from deactivating themselves (if they're a freelancer)
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    // Check if already deactivated
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User account is already deactivated'
      });
    }

    // Prepare rating-based default reason if no reason provided or if it's a generic reason
    let deactivationReason = reason;
    let ratingInfo = null;

    if (!reason || reason.toLowerCase().includes('rating') || reason.toLowerCase().includes('performance')) {
      // Build rating-based reason with user's actual stats
      const currentRating = user.rating.average || 0;
      const ratingCount = user.rating.count || 0;
      const completedProjects = user.completedProjects || 0;

      ratingInfo = {
        currentRating: currentRating,
        ratingCount: ratingCount,
        completedProjects: completedProjects
      };

      // Create a detailed reason if not provided or if it's rating-related
      if (!reason) {
        deactivationReason = `Failed to maintain minimum rating requirement of 2.5 stars. Current rating: ${currentRating.toFixed(1)}/5.0 stars with ${completedProjects} completed projects.`;
      } else if (reason.toLowerCase().includes('rating') || reason.toLowerCase().includes('performance')) {
        deactivationReason = reason + ` (Current stats: ${currentRating.toFixed(1)}/5.0 stars, ${completedProjects} projects completed)`;
      }
    }

    // Deactivate the user
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivationReason = deactivationReason;
    await user.save();

    // Send deactivation email to freelancer
    try {
      const { sendDeactivationEmail } = require('../utils/brevoEmailService');
      await sendDeactivationEmail(user, deactivationReason, ratingInfo);
      console.log(`📧 Deactivation email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Error sending deactivation email:', emailError);
      // Don't fail the deactivation if email fails
    }

    console.log(`🚫 Freelancer account deactivated: ${user.email} (ID: ${userId})`);
    console.log(`👤 Deactivated by: ${req.user.email || 'Admin'} (ID: ${req.user.id})`);
    console.log(`📝 Reason: ${deactivationReason}`);
    if (ratingInfo) {
      console.log(`⭐ Rating: ${ratingInfo.currentRating.toFixed(1)}/5.0 (${ratingInfo.ratingCount} reviews), Projects: ${ratingInfo.completedProjects}`);
    }

    res.json({
      success: true,
      message: 'Freelancer account has been deactivated successfully',
      deactivatedUser: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        deactivatedAt: user.deactivatedAt,
        reason: user.deactivationReason,
        ratingInfo: ratingInfo
      }
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating user account'
    });
  }
});

// Reactivate freelancer account
router.patch('/users/:userId/reactivate', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user to reactivate
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow reactivation of freelancers
    if (user.role !== 'freelancer') {
      return res.status(400).json({
        success: false,
        message: 'Only freelancer accounts can be reactivated'
      });
    }

    // Check if already active
    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User account is already active'
      });
    }

    // Reactivate the user
    user.isActive = true;
    user.reactivatedAt = new Date();
    user.deactivationReason = null;
    user.deactivatedAt = null;
    await user.save();

    console.log(`✅ Freelancer account reactivated: ${user.email} (ID: ${userId})`);
    console.log(`👤 Reactivated by: ${req.user.email || 'Admin'} (ID: ${req.user.id})`);

    res.json({
      success: true,
      message: 'Freelancer account has been reactivated successfully',
      reactivatedUser: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        reactivatedAt: user.reactivatedAt
      }
    });

  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivating user account'
    });
  }
});

// TEMPORARY: Delete all freelancer accounts for testing (REMOVE IN PRODUCTION)
router.delete('/users/freelancers/delete-all-for-testing', authenticate, isAdmin, async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }

    // Delete all freelancer accounts
    const result = await User.deleteMany({ role: 'freelancer' });

    console.log(`🧪 [TESTING] Deleted ${result.deletedCount} freelancer accounts for testing`);
    console.log(`👤 Requested by: ${req.user.email || 'Admin'} (ID: ${req.user.id})`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} freelancer accounts for testing`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting freelancer accounts for testing:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting freelancer accounts'
    });
  }
});

module.exports = router;
