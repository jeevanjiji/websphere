const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middlewares/auth');
const { uploadWorkspaceFiles, uploadSingleWorkspaceFile, handleMulterError } = require('../middlewares/upload');
const { uploadToCloudinary, validateCloudinaryConfig } = require('../utils/cloudinaryConfig');
const { createWorkspaceEvent, createDeliverableEvent } = require('../utils/timelineHelper');

// Import models
const Workspace = require('../models/Workspace');
const Milestone = require('../models/Milestone');
const Deliverable = require('../models/Deliverable');
const { Chat, Message } = require('../models/Chat');
const WorkspaceFile = require('../models/WorkspaceFile');
const Project = require('../models/Project');
const Application = require('../models/Application');
const User = require('../models/User');
const TimelineEvent = require('../models/TimelineEvent');
const Escrow = require('../models/Escrow');

// Middleware to check workspace access
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId; // Fixed: use userId instead of id

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is either the client or freelancer of this workspace
    const isClient = workspace.client.toString() === userId;
    const isFreelancer = workspace.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to access this workspace.'
      });
    }

    req.workspace = workspace;
    req.userRole = isClient ? 'client' : 'freelancer';
    next();
  } catch (error) {
    console.error('❌ Error checking workspace access:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// GET /api/workspaces - Get user's workspaces
router.get('/', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const userId = req.user.userId; // Fixed: use userId instead of id
    console.log('🔥 GET USER WORKSPACES - User ID:', userId);

    const workspaces = await Workspace.find({
      $or: [
        { client: userId },
        { freelancer: userId }
      ]
    })
    .populate('project', 'title description budgetAmount budgetType deadline status createdAt')
    .populate('client', 'fullName profilePicture email')
    .populate('freelancer', 'fullName profilePicture email skills')
    .populate('application', 'proposedRate coverLetter')
    .sort({ lastActivity: -1 });

    console.log('✅ Found', workspaces.length, 'workspaces');
    res.json({
      success: true,
      data: workspaces
    });
  } catch (error) {
    console.error('❌ Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspaces',
      error: error.message
    });
  }
});

// POST /api/workspaces - Create workspace (automatically when application is accepted)
router.post('/', auth(['client']), async (req, res) => {
  try {
    const { projectId, applicationId } = req.body;
    const clientId = req.user.userId; // Fixed: use userId instead of id

    console.log('🔥 CREATE WORKSPACE - Project:', projectId, 'Application:', applicationId);

    // Verify the project belongs to the client
    const project = await Project.findOne({ _id: projectId, client: clientId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Verify the application exists and is accepted/awarded
    const application = await Application.findOne({ 
      _id: applicationId, 
      project: projectId,
      status: { $in: ['accepted', 'awarded'] }
    }).populate('freelancer');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Accepted application not found'
      });
    }

    // Check if workspace already exists
    const existingWorkspace = await Workspace.findOne({ project: projectId });
    if (existingWorkspace) {
      return res.status(400).json({
        success: false,
        message: 'Workspace already exists for this project'
      });
    }

    // Create workspace
    const workspace = new Workspace({
      project: projectId,
      client: clientId,
      freelancer: application.freelancer._id,
      application: applicationId,
      expectedEndDate: project.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    });

    await workspace.save();

    // Populate the workspace for response
    await workspace.populate('project', 'title description budgetAmount budgetType deadline status createdAt');
    await workspace.populate('client', 'fullName profilePicture email');
    await workspace.populate('freelancer', 'fullName profilePicture email skills');
    await workspace.populate('application', 'proposedRate coverLetter');

    // Create timeline event for workspace creation
    await createWorkspaceEvent(workspace, 'created', clientId, {
      metadata: {
        freelancerName: application.freelancer.fullName,
        proposedRate: application.proposedRate
      }
    });

    console.log('✅ Workspace created successfully');
    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: workspace
    });
  } catch (error) {
    console.error('❌ Error creating workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workspace',
      error: error.message
    });
  }
});

// GET /api/workspaces/project/:projectId - Get workspace by project ID
router.get('/project/:projectId', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    console.log('🔍 Fetching workspace for project:', projectId, 'user:', userId);

    // Find workspace for this project where user is either client or freelancer
    const query = {
      project: projectId,
      $or: [
        { client: userId },
        { freelancer: userId }
      ]
    };
    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    const workspace = await Workspace.findOne(query)
    .populate('project', 'title description budgetAmount budgetType category categoryName deadline status createdAt')
    .populate('client', 'fullName profilePicture email')
    .populate('freelancer', 'fullName profilePicture email skills')
    .populate('application', 'proposedRate coverLetter');

    console.log('🔍 Workspace found:', workspace ? 'YES' : 'NO');
    if (workspace) {
      console.log('🔍 Workspace details:');
      console.log('   ID:', workspace._id);
      console.log('   Client:', workspace.client);
      console.log('   Freelancer:', workspace.freelancer);
    }

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found for this project'
      });
    }

    // Find the chat for this workspace
    const chat = await Chat.findOne({ 
      project: workspace.project._id,
      application: workspace.application._id 
    });

    console.log('🔍 Chat found:', chat ? 'YES' : 'NO');
    if (chat) {
      console.log('   Chat ID:', chat._id);
    }

    // Determine user role
    const userRole = workspace.client._id.toString() === userId ? 'client' : 'freelancer';

    // Add chat ID to workspace data
    const workspaceData = workspace.toObject();
    workspaceData.chatId = chat?._id;

    console.log('✅ Workspace found for project with chat ID:', chat?._id);
    res.json({
      success: true,
      data: workspaceData,
      userRole: userRole
    });
  } catch (error) {
    console.error('❌ Error fetching workspace by project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace',
      error: error.message
    });
  }
});

// GET /api/workspaces/:workspaceId - Get workspace details
router.get('/:workspaceId', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const workspace = req.workspace;
    
    // Populate all related data
    await workspace.populate('project', 'title description budgetAmount budgetType deadline status createdAt');
    await workspace.populate('client', 'fullName profilePicture email');
    await workspace.populate('freelancer', 'fullName profilePicture email skills');
    await workspace.populate('application', 'proposedRate coverLetter');

    // Find the chat for this workspace
    const chat = await Chat.findOne({ 
      project: workspace.project._id,
      application: workspace.application._id 
    });

    // Add chat ID to workspace data
    const workspaceData = workspace.toObject();
    workspaceData.chatId = chat?._id;

    console.log('✅ Workspace details retrieved with chat ID:', chat?._id);
    res.json({
      success: true,
      data: workspaceData,
      userRole: req.userRole
    });
  } catch (error) {
    console.error('❌ Error fetching workspace details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace details',
      error: error.message
    });
  }
});

// PUT /api/workspaces/:workspaceId/status - Update workspace status
router.put('/:workspaceId/status', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { status } = req.body;
    const workspace = req.workspace;

    // Only allow certain status transitions
    const allowedStatuses = ['active', 'completed', 'on-hold'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Only client or freelancer can mark as completed; only client can change to on-hold
    if (status === 'on-hold' && req.userRole !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only client can change workspace to on-hold'
      });
    }

    // If marking completed, ensure all milestones are paid AND deliverables are submitted + client-approved
    if (status === 'completed') {
      const milestones = await Milestone.find({ workspace: workspace._id })
        .select('_id title status paymentStatus escrowStatus')
        .lean();

      if (milestones.length > 0) {
        const milestoneIds = milestones.map(m => m._id);

        // Escrow records (source of truth for client payment + approval when available)
        const escrows = await Escrow.find({ milestone: { $in: milestoneIds } })
          .select('milestone status deliverableSubmitted clientApprovalStatus')
          .lean();

        const escrowByMilestoneId = new Map(
          escrows.map(e => [e.milestone.toString(), e])
        );

        // Approved deliverables per milestone
        const approvedDeliverables = await Deliverable.find({
          workspace: workspace._id,
          milestone: { $in: milestoneIds },
          status: 'approved'
        })
          .select('milestone')
          .lean();

        const approvedDeliverableMilestoneIds = new Set(
          approvedDeliverables.map(d => d.milestone.toString())
        );

        const unpaidMilestones = [];
        const unapprovedDeliverablesMilestones = [];

        for (const milestone of milestones) {
          const milestoneId = milestone._id.toString();
          const escrow = escrowByMilestoneId.get(milestoneId);

          // 1) Paid check: client must have paid for every milestone.
          // Prefer escrow.status when escrow exists; otherwise fall back to legacy milestone fields.
          const isPaidViaEscrow = !!escrow && ['active', 'released', 'completed'].includes(escrow.status);
          const isPaidLegacy =
            milestone.paymentStatus === 'completed' ||
            milestone.paymentStatus === 'processing' ||
            milestone.status === 'paid' ||
            milestone.status === 'approved' ||
            ['active', 'released', 'completed'].includes(milestone.escrowStatus);

          const isPaid = isPaidViaEscrow || isPaidLegacy;
          if (!isPaid) unpaidMilestones.push(milestone);

          // 2) Deliverable submission + client approval check.
          // Prefer Deliverable.status when available; escrow approval is a secondary signal.
          const isApprovedDeliverable = approvedDeliverableMilestoneIds.has(milestoneId);
          const isApprovedViaEscrow =
            !!escrow &&
            escrow.deliverableSubmitted === true &&
            ['approved', 'auto-approved'].includes(escrow.clientApprovalStatus);

          if (!isApprovedDeliverable && !isApprovedViaEscrow) {
            unapprovedDeliverablesMilestones.push(milestone);
          }
        }

        if (unpaidMilestones.length > 0 || unapprovedDeliverablesMilestones.length > 0) {
          return res.status(400).json({
            success: false,
            message:
              `Cannot complete project until all milestones are paid and all deliverables are submitted and approved by the client. ` +
              `Unpaid milestones: ${unpaidMilestones.length}. ` +
              `Milestones with unapproved deliverables: ${unapprovedDeliverablesMilestones.length}.`
          });
        }
      }

      workspace.actualEndDate = new Date();

      // Keep Project status in sync so it doesn't stay "open" forever
      await Project.findByIdAndUpdate(
        workspace.project,
        { status: 'completed' },
        { new: false }
      );
    }

    workspace.status = status;
    workspace.lastActivity = new Date();

    await workspace.save();

    console.log('✅ Workspace status updated to:', status);
    res.json({
      success: true,
      message: 'Workspace status updated successfully',
      data: workspace
    });
  } catch (error) {
    console.error('❌ Error updating workspace status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workspace status',
      error: error.message
    });
  }
});

// GET /api/workspaces/:workspaceId/activity - Get workspace activity feed
router.get('/:workspaceId/activity', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // This would typically aggregate activities from various collections
    // For now, we'll return recent milestones, deliverables, and files
    
    const activities = [];

    // Get recent milestones
    const milestones = await Milestone.find({ workspace: workspaceId })
      .populate('submittedBy reviewedBy', 'fullName profilePicture')
      .sort({ updatedAt: -1 })
      .limit(5);

    milestones.forEach(milestone => {
      activities.push({
        type: 'milestone',
        action: milestone.status,
        data: milestone,
        timestamp: milestone.updatedAt,
        user: milestone.submittedBy || milestone.reviewedBy
      });
    });

    // Get recent deliverables
    const deliverables = await Deliverable.find({ workspace: workspaceId })
      .populate('submittedBy reviewedBy', 'fullName profilePicture')
      .sort({ updatedAt: -1 })
      .limit(5);

    deliverables.forEach(deliverable => {
      activities.push({
        type: 'deliverable',
        action: deliverable.status,
        data: deliverable,
        timestamp: deliverable.updatedAt,
        user: deliverable.submittedBy || deliverable.reviewedBy
      });
    });

    // Get recent files
    const files = await WorkspaceFile.find({ workspace: workspaceId, status: 'active' })
      .populate('uploadedBy', 'fullName profilePicture')
      .sort({ uploadedAt: -1 })
      .limit(5);

    files.forEach(file => {
      activities.push({
        type: 'file',
        action: 'uploaded',
        data: file,
        timestamp: file.uploadedAt,
        user: file.uploadedBy
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedActivities = activities.slice(startIndex, startIndex + parseInt(limit));

    console.log('✅ Retrieved', paginatedActivities.length, 'activities');
    res.json({
      success: true,
      data: paginatedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activities.length,
        totalPages: Math.ceil(activities.length / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching workspace activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workspace activity',
      error: error.message
    });
  }
});

// Include milestone routes
router.use('/', require('./milestones'));

// GET /api/workspaces/:workspaceId/files - Get workspace files
router.get('/:workspaceId/files', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { category, folder = 'root', search } = req.query;

    console.log('🔥 GET WORKSPACE FILES - Workspace:', workspaceId);

    let query = { workspace: workspaceId, status: 'active' };
    
    if (category) query.category = category;
    if (folder) query.folder = folder;
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const files = await WorkspaceFile.find(query)
      .populate('uploadedBy', 'fullName profilePicture')
      .sort({ uploadedAt: -1 });

    console.log('✅ Found', files.length, 'files');
    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('❌ Error fetching files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
});

// POST /api/workspaces/:workspaceId/files - Upload files
router.post('/:workspaceId/files', 
  auth(['client', 'freelancer']), 
  checkWorkspaceAccess,
  uploadWorkspaceFiles, // Allow up to 10 files
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { folder = 'root', description, tags } = req.body;
      const files = req.files;

      console.log('🔥 UPLOAD WORKSPACE FILES - Workspace:', workspaceId, 'Files:', files.length);

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Validate Cloudinary configuration
      if (!validateCloudinaryConfig()) {
        return res.status(500).json({
          success: false,
          message: 'File upload service not configured. Please contact administrator.'
        });
      }

      const uploadedFiles = [];

      // Helper: should we extract text for RAG?
      const isTextFile = (f) => {
        const name = (f?.originalname || '').toLowerCase();
        const type = (f?.mimetype || '').toLowerCase();
        if (type.startsWith('text/')) return true;
        if (type.includes('json') || type.includes('xml') || type.includes('csv')) return true;
        if (type.includes('javascript') || type.includes('typescript')) return true;
        if (name.match(/\.(md|txt|csv|json|xml|js|ts|jsx|tsx|py|java|c|cpp|html|css|env|yml|yaml)$/)) return true;
        return false;
      };

      const extractText = (buffer) => {
        if (!buffer) return null;
        const text = buffer.toString('utf8');
        return text.length > 50000 ? text.slice(0, 50000) : text;
      };

      for (const file of files) {
        try {
          // Additional file size validation before Cloudinary upload
          if (file.size > 10 * 1024 * 1024) { // 10MB
            console.error(`❌ File too large for Cloudinary: ${file.originalname} (${file.size} bytes)`);
            continue; // Skip this file
          }

          // Upload to Cloudinary
          const cloudinaryResult = await uploadToCloudinary(file.buffer, {
            folder: `websphere/workspaces/${workspaceId}`,
            resourceType: 'auto', // Use resourceType instead of resource_type
            public_id: `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9]/g, '_')}`,
            // Override problematic defaults
            format: null,
            quality: null,
            transformation: {}
          });

          // Extract text for RAG if this is a text-like file
          const extracted = isTextFile(file) ? extractText(file.buffer) : null;

          const workspaceFile = new WorkspaceFile({
            workspace: workspaceId,
            filename: cloudinaryResult.public_id,
            originalName: file.originalname,
            url: cloudinaryResult.secure_url,
            publicId: cloudinaryResult.public_id,
            size: file.size,
            mimeType: file.mimetype,
            folder,
            description,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            extractedText: extracted,
            extractedTextUpdatedAt: extracted ? new Date() : null,
            extractedTextSource: extracted ? 'upload-buffer' : 'none',
            uploadedBy: req.user.userId // Fixed: use userId instead of id
          });

          await workspaceFile.save();
          await workspaceFile.populate('uploadedBy', 'fullName profilePicture');
          uploadedFiles.push(workspaceFile);
        } catch (uploadError) {
          console.error('❌ Error uploading file to Cloudinary:', uploadError);
          
          // Handle specific Cloudinary errors
          if (uploadError.message && uploadError.message.includes('File size too large')) {
            console.error(`❌ Cloudinary file size error for ${file.originalname}: ${uploadError.message}`);
          } else if (uploadError.http_code === 400) {
            console.error(`❌ Cloudinary validation error for ${file.originalname}: ${uploadError.message}`);
          } else {
            console.error(`❌ Unexpected Cloudinary error for ${file.originalname}:`, uploadError);
          }
          
          // Continue with other files, but log the error
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files could be uploaded. Please check file types and try again.'
        });
      }

      // Update workspace stats
      await Workspace.findByIdAndUpdate(workspaceId, {
        $inc: { 'stats.totalFiles': uploadedFiles.length },
        lastActivity: new Date()
      });

      console.log('✅ Files uploaded successfully:', uploadedFiles.length);
      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        data: uploadedFiles
      });
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: error.message
      });
    }
  }
);

// GET /api/workspaces/:workspaceId/deliverables - Get deliverables
router.get('/:workspaceId/deliverables', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { status, type, milestone } = req.query;

    console.log('🔥 GET DELIVERABLES - Workspace:', workspaceId);

    let query = { workspace: workspaceId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (milestone) query.milestone = milestone;

    const deliverables = await Deliverable.find(query)
      .populate('submittedBy reviewedBy', 'fullName profilePicture email')
      .populate('milestone', 'title order')
      .sort({ submissionDate: -1 });

    console.log('✅ Found', deliverables.length, 'deliverables');
    res.json({
      success: true,
      data: deliverables
    });
  } catch (error) {
    console.error('❌ Error fetching deliverables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deliverables',
      error: error.message
    });
  }
});

// POST /api/workspaces/:workspaceId/deliverables - Submit deliverable (freelancer)
router.post('/:workspaceId/deliverables', 
  auth(['freelancer']), 
  checkWorkspaceAccess,
  uploadWorkspaceFiles,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { title, description, type, milestone, submissionNotes, links, textContent } = req.body;
      const files = req.files;

      console.log('🔥 SUBMIT DELIVERABLE - Workspace:', workspaceId);
      console.log('📋 Request body:', { title, description, type, milestone, submissionNotes });
      console.log('📁 Files:', files ? files.length : 0);
      console.log('👤 User:', req.user);

      // If there's an active escrow in this workspace, require a milestone to properly update escrow state
      try {
        const Escrow = require('../models/Escrow');
        const activeEscrow = await Escrow.findOne({ workspace: workspaceId, status: 'active' });
        if (activeEscrow && !milestone) {
          return res.status(400).json({
            success: false,
            message: 'A milestone must be selected when an active escrow exists for this workspace.'
          });
        }
      } catch (e) {
        console.warn('⚠️ Escrow check failed (non-critical):', e.message);
      }

      const deliverable = new Deliverable({
        workspace: workspaceId,
        title,
        description,
        type,
        milestone: milestone || null,
        submittedBy: req.user.userId, // Fixed: use userId instead of id
        submissionNotes
      });

      // Handle different content types
      if (files && files.length > 0) {
        console.log('📤 Processing uploaded files:', files.map(f => ({
          filename: f.filename,
          originalname: f.originalname,
          path: f.path,
          size: f.size,
          mimetype: f.mimetype
        })));
        
        // Upload files to Cloudinary
        const { uploadToCloudinary } = require('../utils/cloudinaryConfig');
        const uploadedFiles = [];
        
        for (const file of files) {
          try {
            const result = await uploadToCloudinary(file.buffer, {
              folder: 'deliverables',
              resource_type: 'auto', // auto-detect file type
              format: 'auto'
            });
            
            uploadedFiles.push({
              filename: file.filename || result.public_id,
              originalName: file.originalname,
              url: result.secure_url,
              size: file.size,
              mimeType: file.mimetype
            });
          } catch (error) {
            console.error('❌ Error uploading file to Cloudinary:', error);
            throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
          }
        }
        
        deliverable.content.files = uploadedFiles;
        
        console.log('💾 Deliverable files to be saved:', deliverable.content.files);
      }

      if (links) {
        try {
          deliverable.content.links = JSON.parse(links);
        } catch (e) {
          console.warn('Invalid links format');
        }
      }

      if (textContent) {
        deliverable.content.textContent = textContent;
      }

      await deliverable.save();

      // Update workspace stats
      await Workspace.findByIdAndUpdate(workspaceId, {
        $inc: { 'stats.totalDeliverables': 1 },
        lastActivity: new Date()
      });

      await deliverable.populate('submittedBy', 'fullName profilePicture email');
      await deliverable.populate('milestone', 'title order');

      // If this deliverable is linked to a milestone, update escrow status and milestone deliveryStatus
      if (deliverable.milestone) {
        try {
          // Update milestone deliveryStatus to 'delivered'
          const Milestone = require('../models/Milestone');
          await Milestone.findByIdAndUpdate(deliverable.milestone._id, {
            deliveryStatus: 'delivered',
            submissionDate: new Date(),
            submittedBy: req.user.userId
          });
          console.log('✅ Milestone deliveryStatus updated to "delivered"');

          // Update escrow deliverableSubmitted flag
          await Escrow.findOneAndUpdate(
            { milestone: deliverable.milestone._id },
            { 
              deliverableSubmitted: true,
              deliverableSubmittedAt: new Date()
            }
          );
          console.log('✅ Escrow deliverableSubmitted flag updated');

          // Update escrow if it exists (using escrow service)
          try {
            const EscrowService = require('../services/escrowService');
            await EscrowService.submitDeliverable(deliverable.milestone._id, req.user.userId, {
              deliverableId: deliverable._id,
              notes: submissionNotes,
              attachments: deliverable.content.files || []
            });
            console.log('✅ Escrow service updated for deliverable submission');
          } catch (serviceError) {
            console.warn('⚠️ Escrow service update failed (non-critical):', serviceError.message);
          }
        } catch (escrowError) {
          console.warn('⚠️ Escrow update failed (non-critical):', escrowError.message);
          // Don't fail the deliverable submission if escrow update fails
        }
      }

      // Create timeline event for deliverable submission
      const workspace = await Workspace.findById(workspaceId).populate('project');
      await createDeliverableEvent(deliverable, 'submitted', req.user.userId, {
        project: workspace.project._id
      });

      // Emit socket event to notify client in real-time
      const io = req.app.get('io');
      if (io) {
        io.to(workspaceId).emit('deliverable-submitted', {
          deliverable,
          workspaceId
        });
        console.log('📡 Socket event emitted: deliverable-submitted');
      }

      console.log('✅ Deliverable submitted successfully');
      res.status(201).json({
        success: true,
        message: 'Deliverable submitted successfully',
        data: deliverable
      });
    } catch (error) {
      console.error('❌ Error submitting deliverable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit deliverable',
        error: error.message
      });
    }
  }
);

// PUT /api/workspaces/:workspaceId/deliverables/:deliverableId - Review deliverable (client)
router.put('/:workspaceId/deliverables/:deliverableId', auth(['client']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { deliverableId } = req.params;
    const { status, reviewNotes, rating } = req.body;

    console.log('🔥 REVIEW DELIVERABLE - ID:', deliverableId, 'Status:', status);

    const deliverable = await Deliverable.findOne({ 
      _id: deliverableId, 
      workspace: req.params.workspaceId 
    });

    if (!deliverable) {
      return res.status(404).json({
        success: false,
        message: 'Deliverable not found'
      });
    }

    const allowedStatuses = ['approved', 'rejected', 'revision-requested'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    deliverable.status = status;
    deliverable.reviewedBy = req.user.userId; // Fixed: use userId instead of id
    deliverable.reviewDate = new Date();
    deliverable.reviewNotes = reviewNotes;

    if (rating) {
      deliverable.rating = rating;
    }

    if (status === 'approved') {
      deliverable.completedDate = new Date();
      
      // Update workspace stats
      await Workspace.findByIdAndUpdate(req.params.workspaceId, {
        $inc: { 'stats.approvedDeliverables': 1 },
        lastActivity: new Date()
      });

      // Update escrow when deliverable is approved by client
      if (deliverable.milestone) {
        try {
          const EscrowService = require('../services/escrowService');
          
          // First, directly sync escrow flags to ensure consistency
          const Escrow = require('../models/Escrow');
          await Escrow.findOneAndUpdate(
            { milestone: deliverable.milestone._id, status: 'active' },
            { 
              deliverableSubmitted: true,
              clientApprovalStatus: 'approved',
              clientApprovedAt: new Date(),
              clientApprovedBy: req.user.userId
            }
          );
          
          // Then call the escrow service (which also triggers auto-release)
          await EscrowService.approveDeliverable(deliverable.milestone._id, req.user.userId, {
            approved: true,
            notes: reviewNotes
          });
          console.log('✅ Escrow updated for deliverable approval');
          
          // Trigger immediate auto-release check for this milestone
          try {
            await EscrowService.releaseFunds(
              deliverable.milestone._id, 
              'system', 
              'Auto-release: deliverable approved by client'
            );
            console.log('✅ Funds auto-released after client approval');
          } catch (releaseErr) {
            // Not necessarily an error - may already be released or conditions not met
            console.log('ℹ️ Auto-release not triggered:', releaseErr.message);
          }
        } catch (escrowError) {
          console.warn('⚠️ Escrow approval update failed (non-critical):', escrowError.message);
          // Don't fail the deliverable approval if escrow update fails
        }
      }
    } else if (status === 'revision-requested') {
      deliverable.revisionCount += 1;
      
      // Update escrow when deliverable is rejected/revision requested
      if (deliverable.milestone) {
        try {
          const EscrowService = require('../services/escrowService');
          await EscrowService.approveDeliverable(deliverable.milestone._id, req.user.userId, {
            approved: false,
            notes: reviewNotes
          });
          console.log('✅ Escrow updated for deliverable rejection');
        } catch (escrowError) {
          console.warn('⚠️ Escrow rejection update failed (non-critical):', escrowError.message);
        }
      }
    }

    await deliverable.save();
    await deliverable.populate('submittedBy reviewedBy', 'fullName profilePicture email');
    await deliverable.populate('milestone', 'title order');

    // Create timeline event for deliverable review
    const workspace = await Workspace.findById(req.params.workspaceId).populate('project');
    const eventType = status === 'approved' ? 'approved' : status === 'revision-requested' ? 'revised' : 'rejected';
    await createDeliverableEvent(deliverable, eventType, req.user.userId, {
      project: workspace.project._id,
      reviewNotes
    });

    console.log('✅ Deliverable reviewed successfully');
    res.json({
      success: true,
      message: 'Deliverable reviewed successfully',
      data: deliverable
    });
  } catch (error) {
    console.error('❌ Error reviewing deliverable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review deliverable',
      error: error.message
    });
  }
});

// GET /api/workspaces/:workspaceId/payments - Get comprehensive payment history for workspace
router.get('/:workspaceId/payments', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    console.log('🔍 Fetching comprehensive payments for workspace:', workspaceId);

    // Get all milestones for this workspace with payment information
    const milestones = await Milestone.find({ 
      workspace: workspaceId
    })
    .populate('workspace', 'project')
    .populate({
      path: 'workspace',
      populate: {
        path: 'project',
        select: 'title'
      }
    })
    .sort({ createdAt: -1 });

    // Get escrow information for all milestones
    const Escrow = require('../models/Escrow');
    const escrows = await Escrow.find({
      milestone: { $in: milestones.map(m => m._id) }
    })
    .populate('releasedBy', 'fullName')
    .populate('clientApprovedBy', 'fullName');

    // Create escrow lookup map
    const escrowMap = {};
    escrows.forEach(escrow => {
      escrowMap[escrow.milestone.toString()] = escrow;
    });

    // Transform milestones into comprehensive payment records
    const payments = milestones.map(milestone => {
      const escrow = escrowMap[milestone._id.toString()];
      
      // Determine overall payment status
      let paymentStatus = 'pending';
      let statusDetails = 'Milestone created, payment pending';
      
      if (escrow) {
        switch (escrow.status) {
          case 'pending':
            paymentStatus = 'payment_pending';
            statusDetails = 'Waiting for client payment';
            break;
          case 'active':
            if (escrow.deliverableSubmitted) {
              if (escrow.clientApprovalStatus === 'approved') {
                paymentStatus = 'approved_pending_release';
                statusDetails = 'Approved by client, awaiting admin release';
              } else if (escrow.clientApprovalStatus === 'rejected') {
                paymentStatus = 'rejected';
                statusDetails = 'Rejected by client, needs revision';
              } else {
                paymentStatus = 'awaiting_approval';
                statusDetails = 'Deliverable submitted, awaiting client approval';
              }
            } else {
              paymentStatus = 'paid_awaiting_delivery';
              statusDetails = 'Client paid, awaiting deliverable submission';
            }
            break;
          case 'released':
            paymentStatus = 'completed';
            statusDetails = 'Funds released to freelancer';
            break;
          case 'disputed':
            paymentStatus = 'disputed';
            statusDetails = 'Payment disputed, under resolution';
            break;
          case 'refunded':
            paymentStatus = 'refunded';
            statusDetails = 'Payment refunded to client';
            break;
        }
      }

      return {
        _id: milestone._id,
        milestone: {
          _id: milestone._id,
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          currency: milestone.currency || 'INR'
        },
        
        // Payment Timeline
        timeline: {
          milestoneCreated: milestone.createdAt,
          clientPaidAt: escrow?.activatedAt || null,
          deliverableSubmittedAt: escrow?.deliverableSubmittedAt || null,
          clientApprovedAt: escrow?.clientApprovedAt || null,
          fundsReleasedAt: escrow?.releasedAt || null
        },

        // Payment Status
        status: paymentStatus,
        statusDetails: statusDetails,

        // Financial Details
        financial: {
          milestoneAmount: escrow?.milestoneAmount || milestone.amount,
          serviceCharge: escrow?.serviceCharge || 0,
          totalPaidByClient: escrow?.totalAmount || 0,
          amountToFreelancer: escrow?.amountToFreelancer || milestone.amount,
          currency: milestone.currency || 'INR'
        },

        // Escrow Details
        escrow: escrow ? {
          _id: escrow._id,
          status: escrow.status,
          deliverableSubmitted: escrow.deliverableSubmitted,
          clientApprovalStatus: escrow.clientApprovalStatus,
          paymentId: escrow.paymentId,
          razorpayOrderId: escrow.razorpayOrderId,
          razorpayPaymentId: escrow.razorpayPaymentId,
          
          // Release Information
          releasedBy: escrow.releasedBy ? {
            _id: escrow.releasedBy._id,
            fullName: escrow.releasedBy.fullName
          } : null,
          releaseReason: escrow.releaseReason,
          releaseNotes: escrow.releaseNotes
        } : null,

        // Legacy fields for backward compatibility
        amount: milestone.amount,
        paymentMethod: milestone.paymentDetails?.method || 'Razorpay',
        razorpay_payment_id: escrow?.razorpayPaymentId || milestone.paymentDetails?.razorpay_payment_id,
        paidAt: escrow?.activatedAt || milestone.paidDate,
        createdAt: milestone.createdAt,
        project: milestone.workspace?.project
      };
    });

    console.log('✅ Found comprehensive payments:', payments.length);

    res.json({
      success: true,
      data: payments,
      summary: {
        total: payments.length,
        pending: payments.filter(p => p.status === 'pending' || p.status === 'payment_pending').length,
        paid: payments.filter(p => p.status.includes('paid') || p.status.includes('awaiting') || p.status.includes('approved')).length,
        completed: payments.filter(p => p.status === 'completed').length,
        disputed: payments.filter(p => p.status === 'disputed').length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching comprehensive payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// ============================================
// TIMELINE ROUTES
// ============================================

// GET /api/workspaces/:workspaceId/timeline - Get timeline events
router.get('/:workspaceId/timeline', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, before, types } = req.query;

    // Build query
    const query = { workspace: workspaceId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    if (types) {
      const typeArray = types.split(',');
      query.type = { $in: typeArray };
    }

    // Fetch stored events
    const storedEvents = await TimelineEvent.find(query)
      .populate('actor', 'fullName profilePicture')
      .populate('relatedMilestone', 'title amount status')
      .populate('relatedDeliverable', 'title status')
      .populate('relatedEscrow', 'totalAmount status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Fetch computed events (from existing data)
    let computedEvents = await generateComputedEvents(workspaceId);
    
    // Apply type filter to computed events
    if (types) {
      const typeArray = types.split(',');
      computedEvents = computedEvents.filter(event => typeArray.includes(event.type));
    }

    // Combine and sort
    const allEvents = [
      ...storedEvents.map(e => ({ ...e.toObject(), source: 'stored' })),
      ...computedEvents
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: allEvents,
      hasMore: allEvents.length >= parseInt(limit)
    });
  } catch (error) {
    console.error('❌ Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline',
      error: error.message
    });
  }
});

// POST /api/workspaces/:workspaceId/timeline - Create custom timeline event
router.post('/:workspaceId/timeline', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { type, title, description, metadata } = req.body;
    const userId = req.user.userId;
    const workspace = req.workspace;

    // Validate required fields
    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Type and title are required'
      });
    }

    // Only allow user-created event types
    const allowedUserTypes = ['note.added', 'file.attached', 'status.updated'];
    if (!allowedUserTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type for manual creation'
      });
    }

    // Create event
    const event = await TimelineEvent.create({
      workspace: workspaceId,
      project: workspace.project,
      type,
      title,
      description,
      actor: userId,
      metadata: metadata || {},
      source: 'user'
    });

    // Populate for response
    await event.populate('actor', 'fullName profilePicture');

    console.log('✅ Timeline event created:', event.type);
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('❌ Error creating timeline event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create timeline event',
      error: error.message
    });
  }
});

// Helper function to generate computed events from existing data
async function generateComputedEvents(workspaceId) {
  try {
    const events = [];
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) return events;

    // Milestone events
    const milestones = await Milestone.find({ workspace: workspaceId })
      .sort({ createdAt: 1 });
    
    for (const milestone of milestones) {
      events.push({
        _id: `milestone-created-${milestone._id}`,
        type: 'milestone.created',
        title: `Milestone "${milestone.title}" created`,
        description: `Amount: ₹${milestone.amount.toLocaleString()}`,
        createdAt: milestone.createdAt,
        source: 'computed',
        metadata: { amount: milestone.amount, currency: milestone.currency },
        relatedMilestone: milestone
      });

      if (milestone.status === 'approved') {
        events.push({
          _id: `milestone-approved-${milestone._id}`,
          type: 'milestone.approved',
          title: `Milestone "${milestone.title}" approved`,
          description: 'Client approved this milestone',
          createdAt: milestone.approvalDate || milestone.updatedAt,
          source: 'computed',
          relatedMilestone: milestone
        });
      }

      if (milestone.status === 'rejected') {
        events.push({
          _id: `milestone-rejected-${milestone._id}`,
          type: 'milestone.rejected',
          title: `Milestone "${milestone.title}" rejected`,
          description: milestone.rejectionReason || 'Client requested changes',
          createdAt: milestone.updatedAt,
          source: 'computed',
          relatedMilestone: milestone
        });
      }
    }

    // Deliverable events
    const deliverables = await Deliverable.find({ workspace: workspaceId })
      .sort({ submissionDate: 1 });
    
    for (const deliverable of deliverables) {
      events.push({
        _id: `deliverable-submitted-${deliverable._id}`,
        type: 'deliverable.submitted',
        title: `Deliverable "${deliverable.title}" submitted`,
        description: deliverable.submissionNotes || 'New deliverable submitted for review',
        createdAt: deliverable.submissionDate,
        source: 'computed',
        relatedDeliverable: deliverable
      });

      if (deliverable.status === 'approved') {
        events.push({
          _id: `deliverable-approved-${deliverable._id}`,
          type: 'deliverable.approved',
          title: `Deliverable "${deliverable.title}" approved`,
          description: deliverable.reviewNotes || 'Client approved this deliverable',
          createdAt: deliverable.reviewDate || deliverable.updatedAt,
          source: 'computed',
          relatedDeliverable: deliverable
        });
      }

      if (deliverable.status === 'revision-requested') {
        events.push({
          _id: `deliverable-revised-${deliverable._id}`,
          type: 'deliverable.revised',
          title: `Deliverable "${deliverable.title}" needs revision`,
          description: deliverable.reviewNotes || 'Client requested changes',
          createdAt: deliverable.reviewDate || deliverable.updatedAt,
          source: 'computed',
          relatedDeliverable: deliverable
        });
      }
    }

    // Escrow/Payment events
    const escrows = await Escrow.find({ workspace: workspaceId })
      .sort({ createdAt: 1 });
    
    for (const escrow of escrows) {
      if (escrow.status === 'funded' || escrow.status === 'held') {
        events.push({
          _id: `escrow-funded-${escrow._id}`,
          type: 'escrow.funded',
          title: 'Payment held in escrow',
          description: `₹${escrow.totalAmount.toLocaleString()} secured for milestone`,
          createdAt: escrow.createdAt,
          source: 'computed',
          metadata: { amount: escrow.totalAmount },
          relatedEscrow: escrow
        });
      }

      if (escrow.status === 'released' || escrow.status === 'completed') {
        events.push({
          _id: `payment-completed-${escrow._id}`,
          type: 'payment.completed',
          title: 'Payment released to freelancer',
          description: `₹${escrow.amountToFreelancer.toLocaleString()} transferred successfully`,
          createdAt: escrow.releaseDate || escrow.updatedAt,
          source: 'computed',
          metadata: { amount: escrow.amountToFreelancer },
          relatedEscrow: escrow
        });
      }
    }

    // Workspace created event
    events.push({
      _id: `workspace-created-${workspace._id}`,
      type: 'workspace.created',
      title: 'Project workspace created',
      description: 'Collaboration workspace initialized',
      createdAt: workspace.createdAt,
      source: 'computed'
    });

    return events;
  } catch (error) {
    console.error('Error generating computed events:', error);
    return [];
  }
}

// Add multer error handling middleware
router.use(handleMulterError);

module.exports = router;