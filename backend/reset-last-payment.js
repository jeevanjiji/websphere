// Reset last payment script
const mongoose = require('mongoose');
require('dotenv').config();

// Import all required models
const Milestone = require('./models/Milestone');
const Workspace = require('./models/Workspace');
const User = require('./models/User');
const Project = require('./models/Project');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function resetLastPayment() {
  try {
    console.log('🔍 Finding the most recent paid milestone...');
    
    // Find the most recently paid milestone
    const lastPaidMilestone = await Milestone.findOne({
      $or: [
        { paymentStatus: 'completed' },
        { status: 'paid' }
      ]
    })
    .sort({ paidDate: -1, updatedAt: -1 })
    .populate('workspace');

    if (!lastPaidMilestone) {
      console.log('❌ No paid milestones found');
      return;
    }

    console.log('📋 Found milestone:', {
      id: lastPaidMilestone._id,
      title: lastPaidMilestone.title,
      amount: lastPaidMilestone.amount,
      currentStatus: lastPaidMilestone.status,
      paymentStatus: lastPaidMilestone.paymentStatus,
      paidDate: lastPaidMilestone.paidDate
    });

    // Reset the milestone to unpaid
    lastPaidMilestone.paymentStatus = 'pending';
    lastPaidMilestone.status = 'approved'; // Keep it approved so it can be paid again
    lastPaidMilestone.paidDate = null;
    lastPaidMilestone.paymentId = null;
    lastPaidMilestone.paymentDetails = null;

    await lastPaidMilestone.save();

    console.log('✅ Milestone reset successfully!');
    console.log('📋 Updated milestone:', {
      id: lastPaidMilestone._id,
      title: lastPaidMilestone.title,
      status: lastPaidMilestone.status,
      paymentStatus: lastPaidMilestone.paymentStatus
    });

    console.log('💡 The milestone is now available for payment again.');

  } catch (error) {
    console.error('❌ Error resetting payment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔐 Database connection closed');
  }
}

resetLastPayment();