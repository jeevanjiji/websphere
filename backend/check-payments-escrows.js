// Check current payments and escrows in database
const mongoose = require('mongoose');
require('dotenv').config();

// Import all required models
const Milestone = require('./models/Milestone');
const Escrow = require('./models/Escrow');
const Workspace = require('./models/Workspace');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkPaymentsAndEscrows() {
  try {
    console.log('🔍 Checking current payments and escrows...\n');
    
    // Check all milestones
    const milestones = await Milestone.find({})
    .populate('workspace')
    .sort({ updatedAt: -1 });

    console.log('📋 ALL MILESTONES:');
    milestones.forEach((milestone, index) => {
      console.log(`${index + 1}. ${milestone.title}`);
      console.log(`   ID: ${milestone._id}`);
      console.log(`   Amount: ₹${milestone.amount}`);
      console.log(`   Status: ${milestone.status}`);
      console.log(`   Payment Status: ${milestone.paymentStatus || 'None'}`);
      console.log(`   Escrow Status: ${milestone.escrowStatus || 'None'}`);
      console.log(`   Paid Date: ${milestone.paidDate || 'None'}`);
      console.log(`   Payment ID: ${milestone.paymentId || 'None'}`);
      console.log(`   Workspace: ${milestone.workspace?.project || 'Unknown'}\n`);
    });

    // Check all escrows
    const escrows = await Escrow.find({})
    .populate('milestone')
    .populate('client')
    .populate('freelancer')
    .sort({ createdAt: -1 });

    console.log('\n📦 ALL ESCROWS:');
    if (escrows.length === 0) {
      console.log('   No escrow transactions found.');
    } else {
      escrows.forEach((escrow, index) => {
        console.log(`${index + 1}. Escrow ID: ${escrow._id}`);
        console.log(`   Milestone: ${escrow.milestone?.title || 'Unknown'}`);
        console.log(`   Amount: ₹${escrow.totalAmount} (Service: ₹${escrow.serviceCharge})`);
        console.log(`   Status: ${escrow.status}`);
        console.log(`   Created: ${escrow.createdAt}`);
        console.log(`   Payment ID: ${escrow.razorpayPaymentId || 'None'}`);
        console.log(`   Client: ${escrow.client?.fullName || 'Unknown'}`);
        console.log(`   Freelancer: ${escrow.freelancer?.fullName || 'Unknown'}\n`);
      });
    }

    // Find milestones that can be paid
    const payableMilestones = await Milestone.find({
      status: 'approved',
      paymentStatus: { $ne: 'completed' },
      escrowStatus: { $ne: 'active' }
    }).populate('workspace');

    console.log('\n💰 PAYABLE MILESTONES (Ready for escrow payment):');
    if (payableMilestones.length === 0) {
      console.log('   No payable milestones found.');
    } else {
      payableMilestones.forEach((milestone, index) => {
        console.log(`${index + 1}. ${milestone.title}`);
        console.log(`   ID: ${milestone._id}`);
        console.log(`   Amount: ₹${milestone.amount}`);
        console.log(`   Status: ${milestone.status}`);
        console.log(`   Workspace ID: ${milestone.workspace?._id || 'Unknown'}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking payments/escrows:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
checkPaymentsAndEscrows();