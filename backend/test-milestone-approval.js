require('dotenv').config();
const mongoose = require('mongoose');
const Milestone = require('./models/Milestone');

async function testMilestoneUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find a milestone to test with
    const milestone = await Milestone.findOne({}).sort({ createdAt: -1 });
    if (!milestone) {
      console.log('No milestones found');
      return;
    }
    
    console.log('Original milestone:', {
      id: milestone._id,
      title: milestone.title,
      status: milestone.status
    });
    
    // Try to update the status directly
    milestone.status = 'approved';
    milestone.approvedDate = new Date();
    
    console.log('Before save:', {
      id: milestone._id,
      title: milestone.title,
      status: milestone.status
    });
    
    // Save without validation
    await milestone.save({ validateBeforeSave: false });
    
    console.log('After save:', {
      id: milestone._id,
      title: milestone.title,
      status: milestone.status
    });
    
    // Check if it was actually saved
    const updatedMilestone = await Milestone.findById(milestone._id);
    console.log('From database:', {
      id: updatedMilestone._id,
      title: updatedMilestone.title,
      status: updatedMilestone.status
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testMilestoneUpdate();