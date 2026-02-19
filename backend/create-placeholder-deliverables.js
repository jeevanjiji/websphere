const mongoose = require('mongoose');
require('dotenv').config();

const Milestone = require('./models/Milestone');
const Deliverable = require('./models/Deliverable');
const Escrow = require('./models/Escrow');

const createPlaceholderDeliverables = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB\n');

    // Find approved milestones without deliverables
    const approvedMilestones = await Milestone.find({ status: 'approved' });

    let created = 0;
    for (const milestone of approvedMilestones) {
      const deliverables = await Deliverable.find({ milestone: milestone._id });
      
      if (deliverables.length === 0) {
        console.log(`📦 Creating placeholder deliverable for: "${milestone.title}"`);
        
        // Create a placeholder deliverable
        const deliverable = await Deliverable.create({
          workspace: milestone.workspace,
          milestone: milestone._id,
          title: `Milestone Completion: ${milestone.title}`,
          description: 'Auto-generated deliverable for approved milestone without explicit deliverable submission',
          type: 'other',
          submittedBy: milestone.reviewedBy || milestone.createdBy,
          submissionDate: milestone.submissionDate || milestone.reviewDate || new Date(),
          submissionNotes: 'Milestone was approved without deliverable attachment',
          status: 'approved',
          reviewedBy: milestone.reviewedBy,
          reviewDate: milestone.reviewDate || new Date(),
          reviewNotes: 'Auto-approved with milestone',
          completedDate: milestone.reviewDate || new Date(),
          content: {
            textContent: 'Milestone work completed and approved by client'
          }
        });

        // Update escrow if exists
        const escrow = await Escrow.findOne({ milestone: milestone._id });
        if (escrow) {
          await Escrow.findByIdAndUpdate(escrow._id, {
            deliverableSubmitted: true,
            deliverableSubmittedAt: deliverable.submissionDate
          });
          console.log(`   ✅ Updated escrow deliverableSubmitted flag`);
        }

        created++;
        console.log(`   ✅ Created deliverable: ${deliverable._id}\n`);
      }
    }

    console.log(`\n🎉 Created ${created} placeholder deliverables`);
    console.log('Now these milestones are ready for payment release!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createPlaceholderDeliverables();
