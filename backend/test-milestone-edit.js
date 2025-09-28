require('dotenv').config();
const mongoose = require('mongoose');
const Milestone = require('./models/Milestone');

async function testMilestoneEdit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find a milestone that should be editable (not approved)
    const milestone = await Milestone.findOne({
      status: { $in: ['pending', 'in-progress', 'review', 'rejected'] }
    }).sort({ createdAt: -1 });
    
    if (!milestone) {
      console.log('No editable milestones found');
      return;
    }
    
    console.log('Original milestone:', {
      id: milestone._id,
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount,
      status: milestone.status
    });
    
    // Try to update milestone details
    const originalTitle = milestone.title;
    milestone.title = `Updated: ${milestone.title}`;
    milestone.description = `Updated description: ${milestone.description}`;
    milestone.amount = milestone.amount + 100;
    
    console.log('Before save:', {
      id: milestone._id,
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount,
      status: milestone.status
    });
    
    await milestone.save();
    
    console.log('After save:', {
      id: milestone._id,
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount,
      status: milestone.status
    });
    
    // Check if it was actually saved
    const updatedMilestone = await Milestone.findById(milestone._id);
    console.log('From database:', {
      id: updatedMilestone._id,
      title: updatedMilestone.title,
      description: updatedMilestone.description,
      amount: updatedMilestone.amount,
      status: updatedMilestone.status
    });
    
    // Revert the changes
    updatedMilestone.title = originalTitle;
    updatedMilestone.description = milestone.description.replace('Updated description: ', '');
    updatedMilestone.amount = milestone.amount - 100;
    await updatedMilestone.save();
    console.log('Reverted changes successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testMilestoneEdit();