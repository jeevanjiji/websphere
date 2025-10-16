/**
 * Script to fix the current escrow state for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Deliverable = require('../models/Deliverable');
const Escrow = require('../models/Escrow');
const Milestone = require('../models/Milestone');
const User = require('../models/User');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function fixEscrowState() {
  try {
    const deliverableId = '68f0671f4ab0ad33e589ff2c';
    const escrowId = '68ef7138d086b756c2e926ec';

    // Get the deliverable and escrow
    const deliverable = await Deliverable.findById(deliverableId).populate('milestone');
    const escrow = await Escrow.findById(escrowId);

    if (!deliverable || !escrow) {
      console.log('❌ Deliverable or escrow not found');
      return;
    }

    console.log('\n🔄 Current State:');
    console.log(`Deliverable Status: ${deliverable.status}`);
    console.log(`Escrow deliverableSubmitted: ${escrow.deliverableSubmitted}`);
    console.log(`Escrow clientApprovalStatus: ${escrow.clientApprovalStatus}`);

    // Update escrow to reflect deliverable submission
    escrow.deliverableSubmitted = true;
    escrow.deliverableSubmittedAt = deliverable.submissionDate;

    // If deliverable is approved, also update client approval
    if (deliverable.status === 'approved') {
      escrow.clientApprovalStatus = 'approved';
      escrow.clientApprovedAt = deliverable.reviewDate;
      escrow.clientApprovedBy = deliverable.reviewedBy;
    }

    await escrow.save();

    console.log('\n✅ Fixed State:');
    console.log(`Deliverable Status: ${deliverable.status}`);
    console.log(`Escrow deliverableSubmitted: ${escrow.deliverableSubmitted}`);
    console.log(`Escrow clientApprovalStatus: ${escrow.clientApprovalStatus}`);
    console.log(`Escrow clientApprovedAt: ${escrow.clientApprovedAt}`);

    console.log('\n🎯 Admin dashboard should now show:');
    console.log('- Deliverable Submitted: Yes');
    console.log('- Client Approval: Approved');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  await connectDB();
  await fixEscrowState();
  process.exit(0);
}

main();