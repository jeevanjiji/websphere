// Reset last payment and escrow transactions
const mongoose = require('mongoose');
require('dotenv').config();

// Import all required models
const Milestone = require('./models/Milestone');
const Escrow = require('./models/Escrow');
const Workspace = require('./models/Workspace');
const User = require('./models/User');
const Project = require('./models/Project');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function resetLastPaymentAndEscrow() {
  try {
    console.log('🔍 Finding recent payments and escrow transactions...');
    
    // Find recent escrow transactions
    const recentEscrows = await Escrow.find({
      status: { $in: ['active', 'released', 'completed'] }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('milestone')
    .populate('client')
    .populate('freelancer');

    if (recentEscrows.length > 0) {
      console.log('\n📦 Found escrow transactions:');
      recentEscrows.forEach((escrow, index) => {
        console.log(`${index + 1}. Escrow ID: ${escrow._id}`);
        console.log(`   Milestone: ${escrow.milestone?.title || 'Unknown'}`);
        console.log(`   Amount: ₹${escrow.totalAmount} (Service: ₹${escrow.serviceCharge})`);
        console.log(`   Status: ${escrow.status}`);
        console.log(`   Created: ${escrow.createdAt}`);
        console.log(`   Payment ID: ${escrow.razorpayPaymentId || 'None'}`);
        console.log('');
      });
    }

    // Find the most recently paid milestone
    const lastPaidMilestone = await Milestone.findOne({
      $or: [
        { paymentStatus: 'completed' },
        { status: 'paid' },
        { escrowStatus: 'active' },
        { escrowStatus: 'released' }
      ]
    })
    .sort({ paidDate: -1, updatedAt: -1 })
    .populate('workspace');

    if (lastPaidMilestone) {
      console.log('📋 Found milestone to reset:');
      console.log(`   ID: ${lastPaidMilestone._id}`);
      console.log(`   Title: ${lastPaidMilestone.title}`);
      console.log(`   Amount: ₹${lastPaidMilestone.amount}`);
      console.log(`   Payment Status: ${lastPaidMilestone.paymentStatus}`);
      console.log(`   Escrow Status: ${lastPaidMilestone.escrowStatus}`);
      console.log(`   Status: ${lastPaidMilestone.status}`);
    }

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('\n❓ Do you want to reset the last payment and escrow? (y/N): ', resolve);
    });

    if (answer.toLowerCase() !== 'y') {
      console.log('❌ Reset cancelled');
      rl.close();
      return;
    }

    console.log('\n🔄 Starting reset process...');

    let resetCount = 0;

    // Reset escrow transactions
    if (recentEscrows.length > 0) {
      for (const escrow of recentEscrows.slice(0, 1)) { // Reset only the most recent
        console.log(`🗑️ Deleting escrow ${escrow._id}...`);
        await Escrow.findByIdAndDelete(escrow._id);
        resetCount++;
      }
    }

    // Reset milestone
    if (lastPaidMilestone) {
      console.log(`🔄 Resetting milestone ${lastPaidMilestone._id}...`);
      
      // Reset payment-related fields
      lastPaidMilestone.paymentStatus = 'pending';
      lastPaidMilestone.status = 'approved'; // Keep it approved so it can be paid again
      lastPaidMilestone.paidDate = null;
      lastPaidMilestone.paymentId = null;
      lastPaidMilestone.paymentDetails = null;
      
      // Reset escrow-related fields
      lastPaidMilestone.escrowStatus = null;
      lastPaidMilestone.escrowId = null;
      lastPaidMilestone.serviceCharge = null;
      lastPaidMilestone.totalAmountPaid = null;
      lastPaidMilestone.amountToFreelancer = lastPaidMilestone.amount;

      await lastPaidMilestone.save();
      resetCount++;

      console.log('✅ Milestone reset successfully');
    }

    // Also clean up any orphaned escrows for this milestone
    if (lastPaidMilestone) {
      const orphanedEscrows = await Escrow.find({ milestone: lastPaidMilestone._id });
      for (const escrow of orphanedEscrows) {
        console.log(`🧹 Cleaning up orphaned escrow ${escrow._id}...`);
        await Escrow.findByIdAndDelete(escrow._id);
      }
    }

    console.log(`\n✅ Reset completed! ${resetCount} items reset.`);
    console.log('\n🎯 You can now test the escrow payment system:');
    console.log('   1. Go to your workspace');
    console.log('   2. Find the reset milestone');
    console.log('   3. Click "Pay Milestone" to test escrow');
    console.log('   4. The payment should create a new escrow transaction');

    rl.close();
    
  } catch (error) {
    console.error('❌ Error resetting payment/escrow:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
resetLastPaymentAndEscrow();