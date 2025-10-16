/**
 * Quick script to check deliverable and escrow status
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

async function checkStatus() {
  try {
    // Check deliverable status
    const deliverable = await Deliverable.findById('68f0671f4ab0ad33e589ff2c')
      .populate('milestone', 'title _id')
      .populate('submittedBy', 'fullName')
      .populate('reviewedBy', 'fullName');

    if (deliverable) {
      console.log('\n📦 Deliverable Status:');
      console.log(`   ID: ${deliverable._id}`);
      console.log(`   Title: ${deliverable.title}`);
      console.log(`   Status: ${deliverable.status}`);
      console.log(`   Submitted: ${deliverable.submissionDate}`);
      console.log(`   Reviewed: ${deliverable.reviewDate}`);
      console.log(`   Milestone: ${deliverable.milestone?.title} (${deliverable.milestone?._id})`);
    }

    // Check escrow status
    const escrow = await Escrow.findById('68ef7138d086b756c2e926ec')
      .populate('milestone', 'title');

    if (escrow) {
      console.log('\n💰 Escrow Status:');
      console.log(`   ID: ${escrow._id}`);
      console.log(`   Status: ${escrow.status}`);
      console.log(`   Deliverable Submitted: ${escrow.deliverableSubmitted}`);
      console.log(`   Deliverable Submitted At: ${escrow.deliverableSubmittedAt}`);
      console.log(`   Client Approval Status: ${escrow.clientApprovalStatus}`);
      console.log(`   Client Approved At: ${escrow.clientApprovedAt}`);
      console.log(`   Milestone: ${escrow.milestone?.title}`);
    }

    // Check if milestone matches
    if (deliverable?.milestone?._id && escrow?.milestone) {
      const milestonesMatch = deliverable.milestone._id.toString() === escrow.milestone._id.toString();
      console.log(`\n🔗 Milestone Match: ${milestonesMatch}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  await connectDB();
  await checkStatus();
  process.exit(0);
}

main();