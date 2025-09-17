const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { uploadWorkspaceFiles } = require('../middlewares/upload');

const Milestone = require('../models/Milestone');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { sendEmail } = require('../utils/brevoEmailService');
const milestoneTemplates = require('../utils/milestoneTemplates');

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
    const userId = req.user.userId || req.user.id; // Handle both possible field names
    const isClient = workspace.client.toString() === userId;
    const isFreelancer = workspace.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      console.error('❌ Access denied - User:', userId, 'Client:', workspace.client.toString(), 'Freelancer:', workspace.freelancer.toString());
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
    const { title, description, dueDate, paymentDueDate, amount, currency = 'INR', requirements } = req.body;

    console.log('🔥 CREATE MILESTONE - Workspace:', workspaceId);

    // Get the next order number
    const lastMilestone = await Milestone.findOne({ workspace: workspaceId })
      .sort({ order: -1 });
    const order = lastMilestone ? lastMilestone.order + 1 : 1;

    // Calculate payment due date if not provided (3 days after delivery due date)
    let calculatedPaymentDueDate = paymentDueDate;
    if (!calculatedPaymentDueDate && dueDate) {
      const deliveryDate = new Date(dueDate);
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      calculatedPaymentDueDate = deliveryDate;
    }

    const milestone = new Milestone({
      workspace: workspaceId,
      title,
      description,
      dueDate,
      paymentDueDate: calculatedPaymentDueDate,
      amount,
      currency,
      requirements: requirements ? requirements.map(req => 
        typeof req === 'string' ? { description: req, isCompleted: false } : req
      ) : [],
      order,
      createdBy: req.user.userId || req.user.id,
      paymentStatus: 'pending',
      deliveryStatus: 'on-time'
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
    const { status, reviewNotes, progressNotes, submissionNotes, requirements } = req.body;

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
      } else if (status === 'paid') {
        milestone.paidDate = new Date();
        milestone.paymentStatus = 'completed';
      }
    } else if (isFreelancer) {
      // Freelancer can mark as in-progress or completed, add notes, update requirements
      const allowedUpdates = ['status', 'progressNotes', 'submissionNotes'];
      
      if (status === 'in-progress' || status === 'review') {
        milestone.status = status;
        if (status === 'review') {
          milestone.completedDate = new Date();
          milestone.submittedBy = req.user.id;
          milestone.submissionDate = new Date();
        }
      }

      if (progressNotes) {
        milestone.progressNotes = progressNotes;
      }

      if (submissionNotes) {
        milestone.submissionNotes = submissionNotes;
      }

      // Allow freelancer to mark requirements as completed
      if (requirements && Array.isArray(requirements)) {
        milestone.requirements = milestone.requirements.map((req, index) => {
          if (requirements[index] && typeof requirements[index] === 'object') {
            return {
              ...req,
              isCompleted: requirements[index].isCompleted || req.isCompleted,
              completedDate: requirements[index].isCompleted && !req.isCompleted ? new Date() : req.completedDate
            };
          }
          return req;
        });
      }
    }

    await milestone.save();
    await milestone.populate('createdBy reviewedBy submittedBy', 'fullName profilePicture email');

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

// PUT /api/workspaces/:workspaceId/milestones/:milestoneId/requirements/:requirementIndex - Update specific requirement
router.put('/:workspaceId/milestones/:milestoneId/requirements/:requirementIndex', 
  auth(['freelancer']), 
  checkWorkspaceAccess, 
  async (req, res) => {
    try {
      const { milestoneId, requirementIndex } = req.params;
      const { isCompleted } = req.body;

      console.log('🔥 UPDATE REQUIREMENT - Milestone:', milestoneId, 'Index:', requirementIndex);

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

      const reqIndex = parseInt(requirementIndex);
      if (reqIndex < 0 || reqIndex >= milestone.requirements.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid requirement index'
        });
      }

      // Update the specific requirement
      milestone.requirements[reqIndex].isCompleted = isCompleted;
      if (isCompleted) {
        milestone.requirements[reqIndex].completedDate = new Date();
      } else {
        milestone.requirements[reqIndex].completedDate = null;
      }

      await milestone.save();
      await milestone.populate('createdBy reviewedBy submittedBy', 'fullName profilePicture email');

      console.log('✅ Requirement updated successfully');
      res.json({
        success: true,
        message: 'Requirement updated successfully',
        data: milestone
      });
    } catch (error) {
      console.error('❌ Error updating requirement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update requirement',
        error: error.message
      });
    }
  }
);

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

// GET /api/milestones/templates - Get available milestone templates
router.get('/templates', auth(['client']), async (req, res) => {
  try {
    console.log('🔥 GET MILESTONE TEMPLATES');

    const templates = Object.keys(milestoneTemplates).map(key => ({
      id: key,
      name: milestoneTemplates[key].name,
      description: milestoneTemplates[key].description,
      milestoneCount: milestoneTemplates[key].milestones.length
    }));

    console.log('✅ Found', templates.length, 'templates');
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

// GET /api/milestones/templates/:templateId - Get specific template details
router.get('/templates/:templateId', auth(['client']), async (req, res) => {
  try {
    const { templateId } = req.params;
    console.log('🔥 GET TEMPLATE DETAILS - Template:', templateId);

    const template = milestoneTemplates[templateId];
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    console.log('✅ Template details retrieved');
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('❌ Error fetching template details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template details'
    });
  }
});

// POST /api/workspaces/:workspaceId/milestones/bulk - Create multiple milestones from template
router.post('/:workspaceId/milestones/bulk', auth(['client']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { milestones } = req.body;

    console.log('🔥 CREATE BULK MILESTONES - Workspace:', workspaceId, 'Count:', milestones?.length);

    if (!milestones || !Array.isArray(milestones)) {
      return res.status(400).json({
        success: false,
        message: 'Milestones array is required'
      });
    }

    // Get the next order number
    const lastMilestone = await Milestone.findOne({ workspace: workspaceId })
      .sort({ order: -1 });
    let nextOrder = lastMilestone ? lastMilestone.order + 1 : 1;

    const createdMilestones = [];

    for (const milestoneData of milestones) {
      const milestone = new Milestone({
        workspace: workspaceId,
        title: milestoneData.title,
        description: milestoneData.description,
        dueDate: milestoneData.dueDate,
        paymentDueDate: milestoneData.paymentDueDate || (() => {
          const deliveryDate = new Date(milestoneData.dueDate);
          deliveryDate.setDate(deliveryDate.getDate() + 3);
          return deliveryDate;
        })(),
        amount: milestoneData.amount,
        currency: milestoneData.currency || 'INR',
        requirements: milestoneData.requirements.map(req => 
          typeof req === 'string' ? { description: req, isCompleted: false } : req
        ) || [],
        order: nextOrder++,
        createdBy: req.user.userId || req.user.id,
        paymentStatus: 'pending',
        deliveryStatus: 'on-time'
      });

      await milestone.save();
      await milestone.populate('createdBy', 'fullName profilePicture email');
      createdMilestones.push(milestone);
    }

    console.log('✅ Created', createdMilestones.length, 'milestones successfully');
    res.status(201).json({
      success: true,
      message: `Created ${createdMilestones.length} milestones successfully`,
      data: createdMilestones
    });
  } catch (error) {
    console.error('❌ Error creating bulk milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create milestones',
      error: error.message
    });
  }
});

// POST /api/workspaces/:workspaceId/milestones/:milestoneId/request-extension - Request deadline extension (freelancer only)
router.post('/:workspaceId/milestones/:milestoneId/request-extension', auth(['freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { extensionDays, reason } = req.body;

    const milestone = await Milestone.findOne({ 
      _id: milestoneId, 
      workspace: req.params.workspaceId 
    }).populate('workspace');

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    if (milestone.extensionRequested) {
      return res.status(400).json({
        success: false,
        message: 'Extension already requested for this milestone'
      });
    }

    if (extensionDays > 7) {
      return res.status(400).json({
        success: false,
        message: 'Extension cannot be more than 7 days'
      });
    }

    milestone.extensionRequested = true;
    milestone.extensionReason = reason;
    milestone.autoExtensionDays = extensionDays;
    await milestone.save();

    // Notify client about extension request
    const client = await User.findById(milestone.workspace.client);
    if (client) {
      await sendEmail({
        to: client.email,
        subject: 'Extension Request for Milestone',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Extension Request</h2>
            <p>Dear ${client.name},</p>
            <p>Your freelancer has requested an extension for the following milestone:</p>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="color: #2563eb; margin: 0 0 10px 0;">${milestone.title}</h3>
              <p><strong>Original Due Date:</strong> ${milestone.dueDate.toDateString()}</p>
              <p><strong>Extension Requested:</strong> ${extensionDays} days</p>
              <p><strong>Reason:</strong> ${reason}</p>
            </div>
            <p>Please review and approve/reject this extension request in your dashboard.</p>
          </div>
        `
      });
    }

    res.json({
      success: true,
      message: 'Extension request submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error requesting extension:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request extension',
      error: error.message
    });
  }
});

// PUT /api/workspaces/:workspaceId/milestones/:milestoneId/extension-response - Approve/reject extension (client only)
router.put('/:workspaceId/milestones/:milestoneId/extension-response', auth(['client']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { approved, responseNotes } = req.body;

    const milestone = await Milestone.findOne({ 
      _id: milestoneId, 
      workspace: req.params.workspaceId 
    }).populate('workspace');

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    if (!milestone.extensionRequested) {
      return res.status(400).json({
        success: false,
        message: 'No extension request found'
      });
    }

    milestone.extensionApproved = approved;
    
    if (approved) {
      // Extend the due date
      const newDueDate = new Date(milestone.dueDate);
      newDueDate.setDate(newDueDate.getDate() + milestone.autoExtensionDays);
      milestone.dueDate = newDueDate;
      
      // Update payment due date accordingly
      const newPaymentDueDate = new Date(newDueDate);
      newPaymentDueDate.setDate(newPaymentDueDate.getDate() + 3);
      milestone.paymentDueDate = newPaymentDueDate;
      
      milestone.deliveryStatus = 'on-time'; // Reset status
      milestone.isOverdue = false;
    }

    await milestone.save();

    // Notify freelancer about decision
    const freelancer = await User.findById(milestone.workspace.freelancer);
    if (freelancer) {
      await sendEmail({
        to: freelancer.email,
        subject: `Extension ${approved ? 'Approved' : 'Rejected'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${approved ? '#059669' : '#dc2626'};">Extension ${approved ? 'Approved' : 'Rejected'}</h2>
            <p>Dear ${freelancer.name},</p>
            <p>Your extension request for the milestone "${milestone.title}" has been ${approved ? 'approved' : 'rejected'}.</p>
            ${approved ? `<p><strong>New Due Date:</strong> ${milestone.dueDate.toDateString()}</p>` : ''}
            ${responseNotes ? `<p><strong>Notes:</strong> ${responseNotes}</p>` : ''}
          </div>
        `
      });
    }

    res.json({
      success: true,
      message: `Extension ${approved ? 'approved' : 'rejected'} successfully`,
      data: milestone
    });
  } catch (error) {
    console.error('❌ Error responding to extension:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process extension response',
      error: error.message
    });
  }
});

module.exports = router;