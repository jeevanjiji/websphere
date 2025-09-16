const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { uploadWorkspaceFiles } = require('../middlewares/upload');

const Milestone = require('../models/Milestone');
const Workspace = require('../models/Workspace');

// Middleware to check workspace access (reuse from workspace routes)
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has access to this workspace
    const isClient = workspace.client.toString() === req.user.id;
    const isFreelancer = workspace.freelancer.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('❌ Workspace access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during access check'
    });
  }
};

// GET /api/workspaces/:workspaceId/milestones - Get milestones
router.get('/:workspaceId/milestones', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { status } = req.query;

    console.log('🔥 GET MILESTONES - Workspace:', workspaceId);

    let query = { workspace: workspaceId };
    if (status) query.status = status;

    const milestones = await Milestone.find(query)
      .populate('createdBy reviewedBy', 'fullName profilePicture email')
      .sort({ order: 1, createdAt: 1 });

    console.log('✅ Found', milestones.length, 'milestones');
    res.json({
      success: true,
      data: milestones
    });
  } catch (error) {
    console.error('❌ Error fetching milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch milestones',
      error: error.message
    });
  }
});

// POST /api/workspaces/:workspaceId/milestones - Create milestone (client only)
router.post('/:workspaceId/milestones', auth(['client']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, dueDate, amount, currency = 'USD', requirements } = req.body;

    console.log('🔥 CREATE MILESTONE - Workspace:', workspaceId);

    // Get the next order number
    const lastMilestone = await Milestone.findOne({ workspace: workspaceId })
      .sort({ order: -1 });
    const order = lastMilestone ? lastMilestone.order + 1 : 1;

    const milestone = new Milestone({
      workspace: workspaceId,
      title,
      description,
      dueDate,
      amount,
      currency,
      requirements: requirements || [],
      order,
      createdBy: req.user.id
    });

    await milestone.save();
    await milestone.populate('createdBy', 'fullName profilePicture email');

    console.log('✅ Milestone created successfully');
    res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      data: milestone
    });
  } catch (error) {
    console.error('❌ Error creating milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create milestone',
      error: error.message
    });
  }
});

// PUT /api/workspaces/:workspaceId/milestones/:milestoneId - Update milestone
router.put('/:workspaceId/milestones/:milestoneId', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { status, reviewNotes } = req.body;

    console.log('🔥 UPDATE MILESTONE - ID:', milestoneId, 'Status:', status);

    const milestone = await Milestone.findOne({ 
      _id: milestoneId, 
      workspace: req.params.workspaceId 
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    // Define what each role can update
    const isClient = req.user.userType === 'client';
    const isFreelancer = req.user.userType === 'freelancer';

    if (isClient) {
      // Client can approve/reject milestones and update details
      const allowedUpdates = ['title', 'description', 'dueDate', 'amount', 'requirements', 'status', 'reviewNotes'];
      
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          milestone[key] = req.body[key];
        }
      });

      if (status === 'approved') {
        milestone.approvedDate = new Date();
        milestone.reviewedBy = req.user.id;
      } else if (status === 'rejected') {
        milestone.reviewedBy = req.user.id;
      }
    } else if (isFreelancer) {
      // Freelancer can mark as in-progress or completed, add notes
      const allowedUpdates = ['status', 'progressNotes'];
      
      if (status === 'in-progress' || status === 'review') {
        milestone.status = status;
        if (status === 'review') {
          milestone.completedDate = new Date();
        }
      }

      if (req.body.progressNotes) {
        milestone.progressNotes = req.body.progressNotes;
      }
    }

    await milestone.save();
    await milestone.populate('createdBy reviewedBy', 'fullName profilePicture email');

    console.log('✅ Milestone updated successfully');
    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: milestone
    });
  } catch (error) {
    console.error('❌ Error updating milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestone',
      error: error.message
    });
  }
});

// PUT /api/workspaces/:workspaceId/milestones/:milestoneId/attachments - Add attachments
router.put('/:workspaceId/milestones/:milestoneId/attachments',
  auth(['client', 'freelancer']),
  checkWorkspaceAccess,
  uploadWorkspaceFiles, // Allow up to 10 files
  async (req, res) => {
    try {
      const { milestoneId } = req.params;
      const files = req.files;

      console.log('🔥 ADD MILESTONE ATTACHMENTS - ID:', milestoneId, 'Files:', files?.length);

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const milestone = await Milestone.findOne({ 
        _id: milestoneId, 
        workspace: req.params.workspaceId 
      });

      if (!milestone) {
        return res.status(404).json({
          success: false,
          message: 'Milestone not found'
        });
      }

      // Add new attachments
      const newAttachments = files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        url: file.path,
        size: file.size,
        mimeType: file.mimetype,
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      }));

      milestone.attachments.push(...newAttachments);
      await milestone.save();

      await milestone.populate('createdBy reviewedBy', 'fullName profilePicture email');

      console.log('✅ Milestone attachments added successfully');
      res.json({
        success: true,
        message: 'Attachments added successfully',
        data: milestone
      });
    } catch (error) {
      console.error('❌ Error adding milestone attachments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add attachments',
        error: error.message
      });
    }
  }
);

module.exports = router;