const mongoose = require('mongoose');
require('dotenv').config();

const Milestone = require('./models/Milestone');
const Deliverable = require('./models/Deliverable');
const Escrow = require('./models/Escrow');
const Workspace = require('./models/Workspace');

const checkMilestoneDeliveryStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/websphere', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all milestones with title "new"
    const milestones = await Milestone.find({ title: 'new' })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`Found ${milestones.length} milestones with title "new"\n`);

    for (const milestone of milestones) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📋 Milestone ID: ${milestone._id}`);
      console.log(`   Title: ${milestone.title}`);
      console.log(`   Status: ${milestone.status}`);
      console.log(`   Delivery Status: ${milestone.deliveryStatus}`);
      console.log(`   Submitted By: ${milestone.submittedBy || 'None'}`);
      console.log(`   Reviewed By: ${milestone.reviewedBy || 'None'}`);
      console.log(`   Submission Date: ${milestone.submissionDate || 'None'}`);

      // Find deliverables for this milestone
      const deliverables = await Deliverable.find({ milestone: milestone._id });
      console.log(`\n   📦 Deliverables: ${deliverables.length}`);
      
      deliverables.forEach((del, idx) => {
        console.log(`     ${idx + 1}. "${del.title}" - Status: ${del.status}`);
        console.log(`        Submitted: ${del.submissionDate ? new Date(del.submissionDate).toLocaleDateString() : 'No'}`);
        console.log(`        Reviewed: ${del.reviewDate ? new Date(del.reviewDate).toLocaleDateString() : 'No'}`);
      });

      // Find escrow for this milestone
      const escrow = await Escrow.findOne({ milestone: milestone._id });
      if (escrow) {
        console.log(`\n   💰 Escrow:`);
        console.log(`      Status: ${escrow.status}`);
        console.log(`      Deliverable Submitted (escrow): ${escrow.deliverableSubmitted}`);
        console.log(`      Client Approval Status (escrow): ${escrow.clientApprovalStatus}`);
      }
      
      console.log('');
    }

    console.log('\n🔍 Checking what conditions should be met:');
    console.log('For "Ready for Release: Yes":');
    console.log('  ✓ Escrow status = "active"');
    console.log('  ✓ Milestone deliveryStatus = "delivered" OR submittedBy exists');
    console.log('  ✓ Milestone status = "approved"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkMilestoneDeliveryStatus();
