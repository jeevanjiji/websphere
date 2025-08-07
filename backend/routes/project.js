const express = require('express');
const multer = require('multer');
const Project = require('../models/Project');
const { auth } = require('../middlewares/auth'); // Fixed path: middlewares with 's'
const router = express.Router();

// Create uploads directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, '../uploads/projects');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: 'uploads/projects',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET /api/projects/my - Get client's own projects
router.get('/my', auth(['client']), async (req, res) => {
  console.log('🔥 GET MY PROJECTS - User ID:', req.user.userId);
  try {
    const projects = await Project.find({ client: req.user.userId }).sort('-createdAt');
    console.log('✅ Found', projects.length, 'projects');
    res.json({ success: true, projects });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/projects - Create new project
router.post('/', auth(['client']), upload.array('attachments', 5), async (req, res) => {
  console.log('🔥 CREATE PROJECT ROUTE HIT');
  try {
    const { title, description, skills, budgetType, budgetAmount, deadline } = req.body;

    const project = await Project.create({
      client: req.user.userId,
      title,
      description,
      skills: JSON.parse(skills || '[]'),
      budgetType,
      budgetAmount,
      deadline,
      attachments: req.files ? req.files.map(f => '/' + f.path.replace(/\\/g, '/')) : []
    });

    console.log('✅ Project created:', project._id);
    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('❌ Create project error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
