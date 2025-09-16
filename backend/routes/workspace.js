const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middlewares/auth');
const { uploadWorkspaceFiles, uploadSingleWorkspaceFile } = require('../middlewares/upload');

// Import models
const Workspace = require('../models/Workspace');
const Milestone = require('../models/Milestone');
const Deliverable = require('../models/Deliverable');
const { Chat, Message } = require('../models/Chat');
const WorkspaceFile = require('../models/WorkspaceFile');
const Project = require('../models/Project');
const Application = require('../models/Application');
const User = require('../models/User');

// Middleware to check workspace access
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

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
    const userId = req.user.id;
    console.log('🔥 GET USER WORKSPACES - User ID:', userId);

    const workspaces = await Workspace.find({
      $or: [
        { client: userId },
        { freelancer: userId }
      ]
    })
    .populate('project', 'title description budget timeline status')
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
    const clientId = req.user.id;

    console.log('🔥 CREATE WORKSPACE - Project:', projectId, 'Application:', applicationId);

    // Verify the project belongs to the client
    const project = await Project.findOne({ _id: projectId, client: clientId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    // Verify the application exists and is accepted
    const application = await Application.findOne({ 
      _id: applicationId, 
      project: projectId,
      status: 'accepted' 
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
      expectedEndDate: project.timeline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    });

    await workspace.save();

    // Populate the workspace for response
    await workspace.populate('project', 'title description budget timeline');
    await workspace.populate('client', 'fullName profilePicture email');
    await workspace.populate('freelancer', 'fullName profilePicture email skills');
    await workspace.populate('application', 'proposedRate coverLetter');

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
    .populate('project', 'title description budget timeline status')
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
    await workspace.populate('project', 'title description budget timeline status');
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

    // Only client can mark as completed or change to on-hold
    if ((status === 'completed' || status === 'on-hold') && req.userRole !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only client can change workspace to this status'
      });
    }

    workspace.status = status;
    workspace.lastActivity = new Date();
    
    if (status === 'completed') {
      workspace.actualEndDate = new Date();
    }

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

      const uploadedFiles = [];

      for (const file of files) {
        const workspaceFile = new WorkspaceFile({
          workspace: workspaceId,
          filename: file.filename,
          originalName: file.originalname,
          url: file.path,
          publicId: file.public_id, // Cloudinary public ID
          size: file.size,
          mimeType: file.mimetype,
          folder,
          description,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          uploadedBy: req.user.id
        });

        await workspaceFile.save();
        await workspaceFile.populate('uploadedBy', 'fullName profilePicture');
        uploadedFiles.push(workspaceFile);
      }

      // Update workspace stats
      await Workspace.findByIdAndUpdate(workspaceId, {
        $inc: { 'stats.totalFiles': uploadedFiles.length },
        lastActivity: new Date()
      });

      console.log('✅ Files uploaded successfully');
      res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
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

      const deliverable = new Deliverable({
        workspace: workspaceId,
        title,
        description,
        type,
        milestone: milestone || null,
        submittedBy: req.user.id,
        submissionNotes
      });

      // Handle different content types
      if (files && files.length > 0) {
        deliverable.content.files = files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          url: file.path,
          size: file.size,
          mimeType: file.mimetype
        }));
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
    deliverable.reviewedBy = req.user.id;
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
    } else if (status === 'revision-requested') {
      deliverable.revisionCount += 1;
    }

    await deliverable.save();
    await deliverable.populate('submittedBy reviewedBy', 'fullName profilePicture email');
    await deliverable.populate('milestone', 'title order');

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

module.exports = router;