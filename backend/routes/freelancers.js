const express = require('express');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const Workspace = require('../models/Workspace');
const Escrow = require('../models/Escrow');
const router = express.Router();

// GET /api/freelancers/browse - Get freelancers for clients to browse
router.get('/browse', auth(['client']), async (req, res) => {
  console.log('🔥 GET BROWSE FREELANCERS - User ID:', req.user.userId);
  try {
    const {
      search,
      skills,
      minRating = 0,
      maxRating = 5,
      experienceLevel,
      hourlyRateMin,
      hourlyRateMax,
      page = 1,
      limit = 12
    } = req.query;

    // Build query for active freelancers with complete profiles
    let query = { 
      role: 'freelancer', 
      isActive: true,
      isVerified: true
    };

    // Add search filter (name, bio, skills)
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Add skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArray };
    }

    // Add rating filter
    if (minRating || maxRating) {
      query['rating.average'] = {};
      if (minRating) query['rating.average'].$gte = parseFloat(minRating);
      if (maxRating) query['rating.average'].$lte = parseFloat(maxRating);
    }

    // Add experience level filter
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }

    // Add hourly rate filter
    if (hourlyRateMin || hourlyRateMax) {
      query.hourlyRate = {};
      if (hourlyRateMin) query.hourlyRate.$gte = parseFloat(hourlyRateMin);
      if (hourlyRateMax) query.hourlyRate.$lte = parseFloat(hourlyRateMax);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch freelancers
    const freelancers = await User.find(query)
      .select('fullName profilePicture bio skills hourlyRate experienceLevel rating completedProjects portfolio createdAt')
      .sort({ 'rating.average': -1, completedProjects: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalFreelancers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalFreelancers / parseInt(limit));

    console.log('✅ Query used:', JSON.stringify(query, null, 2));
    console.log('✅ Found', freelancers.length, 'freelancers for browsing');
    
    res.json({
      success: true,
      freelancers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalFreelancers,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      debug: {
        totalActiveFreelancers: await User.countDocuments({ 
          role: 'freelancer', 
          isActive: true,
          isVerified: true 
        }),
        queryUsed: query
      }
    });
  } catch (error) {
    console.error('❌ Error fetching freelancers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/freelancers/stats - Get freelancer statistics
router.get('/stats', auth(['freelancer']), async (req, res) => {
  console.log('🔥 GET FREELANCER STATS - User ID:', req.user.userId);
  try {
    const freelancerId = req.user.userId;

    // Get total earnings from completed/released escrows
    const escrows = await Escrow.find({
      freelancer: freelancerId,
      status: { $in: ['released', 'completed'] }
    });

    const totalEarnings = escrows.reduce((sum, escrow) => {
      return sum + (escrow.amountToFreelancer || 0);
    }, 0);

    // Get completed projects count
    const completedWorkspaces = await Workspace.countDocuments({
      freelancer: freelancerId,
      status: 'completed'
    });

    // Hours worked - you can implement time tracking later
    // For now, using a placeholder
    const hoursWorked = 0;

    console.log('✅ Freelancer stats retrieved:', { totalEarnings, completedProjects: completedWorkspaces, hoursWorked });
    res.json({
      success: true,
      stats: {
        totalEarnings,
        completedProjects: completedWorkspaces,
        hoursWorked
      }
    });
  } catch (error) {
    console.error('❌ Error fetching freelancer stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/freelancers/:id - Get specific freelancer profile (for clients)
router.get('/:id', auth(['client']), async (req, res) => {
  console.log('🔥 GET FREELANCER PROFILE - Freelancer ID:', req.params.id);
  try {
    const freelancer = await User.findOne({
      _id: req.params.id,
      role: 'freelancer',
      isActive: true
    }).select('-password');

    if (!freelancer) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found'
      });
    }

    console.log('✅ Freelancer profile retrieved');
    res.json({
      success: true,
      freelancer
    });
  } catch (error) {
    console.error('❌ Error fetching freelancer profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;