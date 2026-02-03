const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Workspace = require('../models/Workspace');
const Milestone = require('../models/Milestone');
const { Chat } = require('../models/Chat');
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
    // User Statistics
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const clientsCount = await User.countDocuments({ role: 'client', isDeleted: false });
    const freelancersCount = await User.countDocuments({ role: 'freelancer', isDeleted: false });
    const activeUsers = await User.countDocuments({ isActive: true, isDeleted: false });
    const deletedUsers = await User.countDocuments({ isDeleted: true });
    
    // Registration trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo },
      isDeleted: false 
    });

    // Project Statistics
    const totalProjects = await Project.countDocuments();
    const openProjects = await Project.countDocuments({ status: 'open' });
    const awardedProjects = await Project.countDocuments({ status: 'awarded' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    
    // Application Statistics
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const acceptedApplications = await Application.countDocuments({ status: 'awarded' });
    
    // Workspace Statistics
    const activeWorkspaces = await Workspace.countDocuments({ status: 'active' });
    const completedWorkspaces = await Workspace.countDocuments({ status: 'completed' });
    
    // Payment Statistics
    const paidMilestones = await Milestone.countDocuments({ paymentStatus: 'completed' });
    const pendingPayments = await Milestone.countDocuments({ 
      status: 'approved', 
      paymentStatus: { $ne: 'completed' } 
    });
    
    // Total revenue calculation
    const revenueData = await Milestone.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    
    // Recent activity
    const recentProjects = await Project.find()
      .populate('client', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status budgetAmount createdAt client');
      
    const recentApplications = await Application.find()
      .populate('freelancer', 'fullName email')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status createdAt freelancer project');
    
    // Chat activity
    const totalChats = await Chat.countDocuments();
    const activeChats = await Chat.countDocuments({ 
      lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });

    res.json({
      success: true,
      stats: {
        // User metrics
        totalUsers,
        clientsCount,
        freelancersCount,
        activeUsers,
        deletedUsers,
        recentRegistrations,
        
        // Project metrics
        totalProjects,
        openProjects,
        awardedProjects,
        completedProjects,
        
        // Application metrics
        totalApplications,
        pendingApplications,
        acceptedApplications,
        
        // Workspace metrics
        activeWorkspaces,
        completedWorkspaces,
        
        // Payment metrics
        paidMilestones,
        pendingPayments,
        totalRevenue,
        
        // Communication metrics
        totalChats,
        activeChats,
        
        // Recent activity
        recentProjects,
        recentApplications
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
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

// ================================
// ESCROW MANAGEMENT ROUTES
// ================================

const EscrowService = require('../services/escrowService');
const Escrow = require('../models/Escrow');

// GET /api/admin/escrows - Get all escrows with filters
router.get('/escrows', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { 'milestone.title': { $regex: search, $options: 'i' } },
        { 'client.fullName': { $regex: search, $options: 'i' } },
        { 'freelancer.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const escrows = await Escrow.find(query)
      .populate('milestone', 'title description amount')
      .populate('client', 'fullName email')
      .populate('freelancer', 'fullName email')
      .populate('workspace', 'status')
      .populate('releasedBy', 'fullName')
      .populate('disputeResolvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalEscrows = await Escrow.countDocuments(query);
    const totalPages = Math.ceil(totalEscrows / parseInt(limit));

    console.log(`✅ Retrieved ${escrows.length} escrows for admin`);

    res.json({
      success: true,
      data: escrows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalEscrows,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching escrows for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch escrows'
    });
  }
});

// GET /api/admin/escrows/stats - Get escrow statistics
router.get('/escrows/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const stats = await Escrow.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          serviceChargeTotal: { $sum: '$serviceCharge' }
        }
      }
    ]);

    const totalEscrows = await Escrow.countDocuments();
    const pendingReleases = await Escrow.countDocuments({
      status: 'active',
      deliverableSubmitted: true,
      clientApprovalStatus: 'approved'
    });
    
    const disputes = await Escrow.countDocuments({
      status: 'disputed'
    });

    const autoReleaseEligible = await Escrow.find({
      status: 'active',
      deliverableSubmitted: true,
      disputeRaised: false
    });

    let autoReleaseCount = 0;
    for (const escrow of autoReleaseEligible) {
      if (escrow.isAutoReleaseDue) {
        autoReleaseCount++;
      }
    }

    console.log('✅ Escrow statistics calculated');

    res.json({
      success: true,
      data: {
        totalEscrows,
        pendingReleases,
        disputes,
        autoReleaseEligible: autoReleaseCount,
        statusBreakdown: stats,
        summary: {
          totalValue: stats.reduce((sum, item) => sum + item.totalAmount, 0),
          totalServiceCharges: stats.reduce((sum, item) => sum + item.serviceChargeTotal, 0)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error calculating escrow stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate escrow statistics'
    });
  }
});

// POST /api/admin/escrows/:escrowId/release - Admin release funds
router.post('/escrows/:escrowId/release', authenticate, isAdmin, async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { releaseReason, notes } = req.body;

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found'
      });
    }

    const result = await EscrowService.releaseFunds(
      escrow.milestone, 
      req.user.id, 
      releaseReason || 'Admin manual release'
    );

    console.log(`✅ Admin released escrow funds: ${escrowId}`);

    res.json({
      success: true,
      message: 'Funds released successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error releasing escrow funds:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/admin/escrows/:escrowId/resolve-dispute - Admin resolve dispute
router.post('/escrows/:escrowId/resolve-dispute', authenticate, isAdmin, async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { resolution, refundToClient, releaseToFreelancer, notes } = req.body;

    const escrow = await Escrow.findById(escrowId);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found'
      });
    }

    if (escrow.status !== 'disputed') {
      return res.status(400).json({
        success: false,
        message: 'Escrow is not in disputed state'
      });
    }

    const result = await EscrowService.resolveDispute(escrow.milestone, req.user.id, {
      resolution,
      refundToClient,
      releaseToFreelancer,
      notes
    });

    console.log(`✅ Admin resolved dispute for escrow: ${escrowId}`);

    res.json({
      success: true,
      message: 'Dispute resolved successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error resolving dispute:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/admin/escrows/auto-release - Process auto-releases
router.post('/escrows/auto-release', authenticate, isAdmin, async (req, res) => {
  try {
    const releasedCount = await EscrowService.processAutoReleases();

    console.log(`✅ Processed auto-releases: ${releasedCount} escrows`);

    res.json({
      success: true,
      message: `Successfully auto-released ${releasedCount} escrows`,
      data: { releasedCount }
    });
  } catch (error) {
    console.error('❌ Error processing auto-releases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process auto-releases'
    });
  }
});

// GET /api/admin/escrows/:escrowId - Get detailed escrow information
router.get('/escrows/:escrowId', authenticate, isAdmin, async (req, res) => {
  try {
    const { escrowId } = req.params;

    const escrow = await Escrow.findById(escrowId)
      .populate('milestone', 'title description amount status deliveryStatus submittedBy reviewedBy')
      .populate('workspace', 'status')
      .populate('client', 'fullName email')
      .populate('freelancer', 'fullName email')
      .populate('releasedBy', 'fullName email')
      .populate('disputeResolvedBy', 'fullName email')
      .populate({
        path: 'workspace',
        populate: {
          path: 'project',
          select: 'title'
        }
      });

    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found'
      });
    }

    // Check if deliverable is submitted and approved based on milestone status
    const isDeliverableSubmitted = escrow.milestone?.deliveryStatus === 'delivered' || escrow.milestone?.submittedBy;
    const isApproved = escrow.milestone?.status === 'approved';
    const isReadyForRelease = escrow.status === 'active' && isDeliverableSubmitted && isApproved;

    console.log(`✅ Retrieved escrow details: ${escrowId}`);
    console.log(`📊 Escrow status: ${escrow.status}`);
    console.log(`📦 Milestone deliveryStatus: ${escrow.milestone?.deliveryStatus}`);
    console.log(`✅ Milestone status: ${escrow.milestone?.status}`);
    console.log(`🎯 Ready for release: ${isReadyForRelease}`);

    res.json({
      success: true,
      data: {
        ...escrow.toObject(),
        isDeliverableSubmitted,
        isApproved,
        isReadyForRelease
      }
    });
  } catch (error) {
    console.error('❌ Error fetching escrow details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch escrow details'
    });
  }
});

module.exports = router;
