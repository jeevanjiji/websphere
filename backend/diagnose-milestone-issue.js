const mongoose = require('mongoose');
require('dotenv').config();

const Milestone = require('./models/Milestone');
const Deliverable = require('./models/Deliverable');
const Escrow = require('./models/Escrow');
const Workspace = require('./models/Workspace');

const diagnoseMilestoneIssue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB\n');

    // Find approved milestones without deliverables
    const approvedMilestones = await Milestone.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Found ${approvedMilestones.length} approved milestones\n`);

    for (const milestone of approvedMilestones) {
      const deliverables = await Deliverable.find({ milestone: milestone._id });
      const escrow = await Escrow.findOne({ milestone: milestone._id });
      
      if (deliverables.length === 0) {
        console.log('⚠️  ISSUE FOUND:');
        console.log(`   Milestone: "${milestone.title}" (${milestone._id})`);
        console.log(`   Status: ${milestone.status}`);
        console.log(`   Delivery Status: ${milestone.deliveryStatus}`);
        console.log(`   Deliverables: ${deliverables.length} (NONE!)`);
        
        if (escrow) {
          console.log(`   Escrow Status: ${escrow.status}`);
          console.log(`   Escrow Deliverable Submitted: ${escrow.deliverableSubmitted}`);
        }
        console.log('');
      }
    }

    console.log('\n💡 SOLUTIONS:\n');
    console.log('1. Allow deliverable submission after approval (code change)');
    console.log('2. Auto-create placeholder deliverable when milestone is approved without one');
    console.log('3. Admin can manually mark escrow as ready for release');
    console.log('4. Create a retroactive deliverable submission route\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

diagnoseMilestoneIssue();
