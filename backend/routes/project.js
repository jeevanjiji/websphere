const express = require('express');
const Project = require('../models/Project');
const Application = require('../models/Application');
const { auth } = require('../middlewares/auth');
const { uploadProjectAttachments, handleMulterError } = require('../middlewares/upload');
const {
  uploadProjectAttachment,
  validateCloudinaryConfig
} = require('../utils/cloudinaryConfig');
const router = express.Router();

// GET /api/projects/browse - Get all open projects for freelancers to browse
router.get('/browse', auth(['freelancer']), async (req, res) => {
  console.log('🔥 GET BROWSE PROJECTS - User ID:', req.user.userId);
  try {
    const {
      search,
      skills,
      budgetMin,
      budgetMax,
      budgetType,
      page = 1,
      limit = 10
    } = req.query;

    // Build query for open projects
    let query = { status: 'open' };

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArray };
    }

    // Add budget filters
    if (budgetType) {
      query.budgetType = budgetType;
    }
    if (budgetMin || budgetMax) {
      query.budgetAmount = {};
      if (budgetMin) query.budgetAmount.$gte = parseFloat(budgetMin);
      if (budgetMax) query.budgetAmount.$lte = parseFloat(budgetMax);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch projects with client info
    const projects = await Project.find(query)
      .populate('client', 'fullName profilePicture rating.average rating.count')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalProjects = await Project.countDocuments(query);
    const totalPages = Math.ceil(totalProjects / parseInt(limit));

    console.log('✅ Found', projects.length, 'open projects for browsing');
    res.json({
      success: true,
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProjects,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching browse projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/projects/my - Get user's own projects (client's created projects or freelancer's applied projects)
router.get('/my', auth(['client', 'freelancer']), async (req, res) => {
  console.log('🔥 GET MY PROJECTS - User ID:', req.user.userId, 'Role:', req.user.role);
  try {
    let projects = [];

    if (req.user.role === 'client') {
      // For clients: get projects they created with accepted application info
      projects = await Project.find({ client: req.user.userId }).sort('-createdAt');
      
      // Add accepted application info for each project
      for (let project of projects) {
        const acceptedApplication = await Application.findOne({ 
          project: project._id, 
          status: { $in: ['accepted', 'awarded'] }
        });
        
        project._doc.hasAcceptedFreelancer = !!acceptedApplication;
        project._doc.acceptedApplicationId = acceptedApplication?._id;
      }
    } else if (req.user.role === 'freelancer') {
      // For freelancers: get all projects for now (later we can filter by applied/awarded projects)
      // For now, just return empty array or sample projects
      projects = await Project.find({}).sort('-createdAt').limit(10);
    }

    console.log('✅ Found', projects.length, 'projects for', req.user.role);
    res.json({ success: true, projects });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/projects - Create new project
router.post('/', auth(['client']), uploadProjectAttachments, async (req, res) => {
  console.log('🔥 CREATE PROJECT ROUTE HIT');
  console.log('📋 Request body:', req.body);
  try {
    const { 
      title, 
      description, 
      category,
      categoryName,
      image,
      skills, 
      budgetType, 
      budgetAmount, 
      deadline 
    } = req.body;

    let attachmentUrls = [];

    // Upload attachments to Cloudinary if any
    if (req.files && req.files.length > 0) {
      if (!validateCloudinaryConfig()) {
        return res.status(500).json({
          success: false,
          message: 'File upload service not configured'
        });
      }

      try {
        const uploadPromises = req.files.map(async (file, index) => {
          const result = await uploadProjectAttachment(
            file.buffer,
            'temp_project_' + Date.now(), // Temporary project ID
            file.originalname
          );
          return result.secure_url;
        });

        attachmentUrls = await Promise.all(uploadPromises);
        console.log('✅ Uploaded', attachmentUrls.length, 'attachments to Cloudinary');
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload attachments. Please try again.'
        });
      }
    }

    const project = await Project.create({
      client: req.user.userId,
      title,
      description,
      category,
      categoryName,
      image,
      skills: JSON.parse(skills || '[]'),
      budgetType,
      budgetAmount,
      deadline,
      attachments: attachmentUrls
    });

    console.log('✅ Project created:', project._id);
    console.log('📂 Project category:', category, categoryName);
    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('❌ Create project error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Add error handling middleware for multer errors
router.use(handleMulterError);

module.exports = router;
