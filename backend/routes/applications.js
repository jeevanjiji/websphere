const express = require('express');
const Application = require('../models/Application');
const Project = require('../models/Project');
const User = require('../models/User');
const { Chat, Message } = require('../models/Chat');
const { auth } = require('../middlewares/auth');
const router = express.Router();

// POST /api/applications - Submit application to a project
router.post('/', auth(['freelancer']), async (req, res) => {
  console.log('🔥 SUBMIT APPLICATION - User ID:', req.user.userId);
  try {
    const {
      projectId,
      coverLetter,
      proposedRate,
      proposedTimeline,
      experience,
      questions,
      attachments = []
    } = req.body;

    // Validate required fields
    if (!projectId || !coverLetter || !proposedRate || !proposedTimeline) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, coverLetter, proposedRate, proposedTimeline'
      });
    }

    // Check if project exists and is open
    const project = await Project.findById(projectId).populate('client');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This project is no longer accepting applications'
      });
    }

    // Check if freelancer already applied
    const existingApplication = await Application.findOne({
      project: projectId,
      freelancer: req.user.userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this project'
      });
    }

    // Create application
    const application = new Application({
      project: projectId,
      freelancer: req.user.userId,
      client: project.client._id,
      coverLetter,
      proposedRate: parseFloat(proposedRate),
      proposedTimeline,
      experience,
      questions,
      attachments
    });

    await application.save();

    // Populate application with user details
    await application.populate([
      { path: 'freelancer', select: 'fullName profilePicture rating.average email' },
      { path: 'project', select: 'title' }
    ]);

    console.log('✅ Application submitted successfully');
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('❌ Error submitting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// GET /api/applications/my - Get freelancer's applications
router.get('/my', auth(['freelancer']), async (req, res) => {
  console.log('🔥 GET MY APPLICATIONS - User ID:', req.user.userId);
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { freelancer: req.user.userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate({
        path: 'project',
        select: 'title description budgetAmount budgetType deadline status category categoryName',
        populate: {
          path: 'client',
          select: 'fullName profilePicture rating.average'
        }
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const totalApplications = await Application.countDocuments(query);
    const totalPages = Math.ceil(totalApplications / parseInt(limit));

    console.log('✅ Found', applications.length, 'applications');
    res.json({
      success: true,
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalApplications,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// GET /api/applications/project/:projectId - Get applications for a project (client only)
router.get('/project/:projectId', auth(['client']), async (req, res) => {
  console.log('🔥 GET PROJECT APPLICATIONS - Project ID:', req.params.projectId);
  try {
    const { projectId } = req.params;

    // Verify project belongs to the client
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.client.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view applications for your own projects.'
      });
    }

    const applications = await Application.find({ project: projectId })
      .populate({
        path: 'freelancer',
        select: 'fullName profilePicture rating.average email profile.skills profile.hourlyRate profile.completedProjects profile.bio'
      })
      .sort('-createdAt');

    // Mark applications as viewed by client
    await Application.updateMany(
      { project: projectId, viewedByClient: false },
      { 
        viewedByClient: true, 
        viewedAt: new Date() 
      }
    );

    console.log('✅ Found', applications.length, 'applications for project');
    res.json({
      success: true,
      applications,
      count: applications.length
    });
  } catch (error) {
    console.error('❌ Error fetching project applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// PUT /api/applications/:applicationId/respond - Accept/reject application (client only)
router.put('/:applicationId/respond', auth(['client']), async (req, res) => {
  console.log('🔥 RESPOND TO APPLICATION - Application ID:', req.params.applicationId);
  try {
    const { applicationId } = req.params;
    const { action, message } = req.body; // action: 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "reject"'
      });
    }

    const application = await Application.findById(applicationId)
      .populate('project')
      .populate('freelancer');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify project belongs to the client
    if (application.project.client.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only respond to applications for your own projects.'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This application has already been responded to'
      });
    }

    // Update application status
    application.status = action === 'accept' ? 'accepted' : 'rejected';
    application.respondedAt = new Date();
    await application.save();

    // If accepted, create a chat for communication
    if (action === 'accept') {
      const chat = new Chat({
        project: application.project._id,
        application: application._id,
        participants: [
          { user: application.client, role: 'client' },
          { user: application.freelancer._id, role: 'freelancer' }
        ]
      });
      await chat.save();

      // Create initial system message
      const systemMessage = new Message({
        chat: chat._id,
        sender: req.user.userId,
        content: `Application accepted! You can now discuss project details and negotiate terms.`,
        messageType: 'system'
      });
      await systemMessage.save();

      chat.lastMessage = systemMessage._id;
      chat.lastActivity = new Date();
      await chat.save();

      // If this is the first acceptance, update project status
      if (application.project.status === 'open') {
        await Project.findByIdAndUpdate(application.project._id, {
          status: 'in_progress'
        });
      }
    }

    console.log('✅ Application', action + 'ed successfully');
    res.json({
      success: true,
      message: `Application ${action}ed successfully`,
      application,
      chatCreated: action === 'accept'
    });
  } catch (error) {
    console.error('❌ Error responding to application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to application',
      error: error.message
    });
  }
});

// GET /api/applications/:applicationId - Get specific application details
router.get('/:applicationId', auth(['client', 'freelancer']), async (req, res) => {
  console.log('🔥 GET APPLICATION DETAILS - Application ID:', req.params.applicationId);
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate({
        path: 'project',
        select: 'title description budgetAmount budgetType deadline status category client',
        populate: {
          path: 'client',
          select: 'fullName profilePicture rating.average'
        }
      })
      .populate({
        path: 'freelancer',
        select: 'fullName profilePicture rating.average email profile.skills profile.hourlyRate profile.completedProjects profile.bio'
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check authorization
    const isClient = req.user.userId === application.project.client._id.toString();
    const isFreelancer = req.user.userId === application.freelancer._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own applications.'
      });
    }

    console.log('✅ Application details retrieved');
    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('❌ Error fetching application details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application details',
      error: error.message
    });
  }
});

// DELETE /api/applications/:applicationId - Withdraw application (freelancer only)
router.delete('/:applicationId', auth(['freelancer']), async (req, res) => {
  console.log('🔥 WITHDRAW APPLICATION - Application ID:', req.params.applicationId);
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if application belongs to the freelancer
    if (application.freelancer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only withdraw your own applications.'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application that has already been responded to'
      });
    }

    // Update status to withdrawn instead of deleting
    application.status = 'withdrawn';
    await application.save();

    console.log('✅ Application withdrawn successfully');
    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('❌ Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application',
      error: error.message
    });
  }
});

// PUT /api/applications/:applicationId/award - Award project to freelancer (client only)
router.put('/:applicationId/award', auth(['client']), async (req, res) => {
  console.log('🔥 AWARD PROJECT TO FREELANCER - Application ID:', req.params.applicationId);
  try {
    const { applicationId } = req.params;

    // Find the application
    const application = await Application.findById(applicationId)
      .populate('project')
      .populate('freelancer', 'fullName email')
      .populate('client', 'fullName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Verify client owns this project
    if (application.client._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the project client can award the project.'
      });
    }

    // Check if application is accepted
    if (application.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Application must be accepted before awarding the project'
      });
    }

    // Check if project is already awarded
    if (application.project.status === 'awarded' || application.project.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Project has already been awarded'
      });
    }

    // Update application status to awarded
    application.status = 'awarded';
    await application.save();

    // Update project status and award it
    const project = await Project.findById(application.project._id);
    project.status = 'awarded';
    project.awardedTo = application.freelancer._id;
    project.awardedApplication = application._id;
    project.finalRate = application.proposedRate;
    project.finalTimeline = application.proposedTimeline;
    project.awardedAt = new Date();
    await project.save();

    // Reject all other applications for this project
    await Application.updateMany(
      { 
        project: application.project._id,
        _id: { $ne: applicationId },
        status: { $in: ['pending', 'accepted'] }
      },
      { status: 'rejected' }
    );

    // Create or find chat for this application
    const { Chat, Message } = require('../models/Chat');
    let chat = await Chat.findOne({ application: applicationId });
    
    if (!chat) {
      chat = new Chat({
        project: application.project._id,
        application: applicationId,
        participants: [
          {
            user: application.client._id,
            role: 'client',
            joinedAt: new Date()
          },
          {
            user: application.freelancer._id,
            role: 'freelancer',
            joinedAt: new Date()
          }
        ],
        status: 'active',
        lastActivity: new Date()
      });
      await chat.save();
    }

    // Send system message about project award
    const awardMessage = new Message({
      chat: chat._id,
      sender: req.user.userId,
      messageType: 'system',
      content: `🎉 Congratulations! Project "${application.project.title}" has been awarded to ${application.freelancer.fullName}. Final rate: Rs.${application.proposedRate}. Timeline: ${application.proposedTimeline}`,
      readBy: [
        {
          user: req.user.userId,
          readAt: new Date()
        }
      ]
    });

    await awardMessage.save();
    chat.lastMessage = awardMessage._id;
    chat.lastActivity = new Date();
    await chat.save();

    console.log('✅ Project awarded successfully to freelancer');
    res.json({
      success: true,
      message: 'Project awarded successfully',
      application: application,
      project: project,
      chatId: chat._id
    });
  } catch (error) {
    console.error('❌ Error awarding project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award project',
      error: error.message
    });
  }
});

module.exports = router;
