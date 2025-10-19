/**
 * Script to revert the last client deliverable review (approve/reject)
 * This allows testing of approve, reject, and comment functionality
 * 
 * Usage: node scripts/revert-client-deliverable-review.js [deliverableId]
 * If no deliverableId provided, it will revert the most recently reviewed deliverable
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Deliverable = require('../models/Deliverable');
const Milestone = require('../models/Milestone');
const Escrow = require('../models/Escrow');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function revertDeliverableReview(deliverableId = null) {
  try {
    let deliverable;
    
    if (deliverableId) {
      // Revert specific deliverable
      deliverable = await Deliverable.findById(deliverableId);
      if (!deliverable) {
        console.log('❌ Deliverable not found with ID:', deliverableId);
        return;
      }
    } else {
      // Find the most recently reviewed deliverable
      deliverable = await Deliverable.findOne({
        status: { $in: ['approved', 'rejected'] },
        reviewedBy: { $exists: true },
        reviewDate: { $exists: true }
      })
      .sort({ reviewDate: -1 })
      .populate('workspace')
      .populate('milestone');
    }

    if (!deliverable) {
      console.log('❌ No reviewed deliverables found to revert');
      return;
    }

    console.log('\n📋 Found deliverable to revert:');
    console.log(`   ID: ${deliverable._id}`);
    console.log(`   Title: ${deliverable.title}`);
    console.log(`   Current Status: ${deliverable.status}`);
    console.log(`   Reviewed By: ${deliverable.reviewedBy}`);
    console.log(`   Review Date: ${deliverable.reviewDate}`);
    console.log(`   Review Notes: ${deliverable.reviewNotes || 'None'}`);

    // Store original review data for logging
    const originalStatus = deliverable.status;
    const originalReviewedBy = deliverable.reviewedBy;
    const originalReviewDate = deliverable.reviewDate;
    const originalReviewNotes = deliverable.reviewNotes;

    // Revert deliverable review status
    deliverable.status = 'submitted';
    deliverable.reviewedBy = undefined;
    deliverable.reviewDate = undefined;
    deliverable.reviewNotes = undefined;
    deliverable.rating = undefined;
    deliverable.qualityNotes = undefined;
    deliverable.completedDate = undefined;

    await deliverable.save();

    console.log('\n✅ Successfully reverted deliverable review:');
    console.log(`   Status: ${originalStatus} → submitted`);
    console.log(`   Cleared review data (reviewedBy, reviewDate, reviewNotes)`);

    // If it was approved, also revert any escrow status changes
    if (originalStatus === 'approved' && deliverable.milestone) {
      try {
        const escrow = await Escrow.findOne({ milestone: deliverable.milestone._id });
        if (escrow && (escrow.status === 'funds_released' || escrow.status === 'completed')) {
          console.log('\n🏦 Found escrow payment to revert:');
          console.log(`   Escrow ID: ${escrow._id}`);
          console.log(`   Current Status: ${escrow.status}`);
          
          // Revert escrow status to active (funds held in escrow)
          const originalEscrowStatus = escrow.status;
          escrow.status = 'active';
          escrow.releasedAt = undefined;
          escrow.releasedBy = undefined;
          escrow.releaseReason = undefined;
          
          await escrow.save();
          
          console.log(`   Escrow Status: ${originalEscrowStatus} → active`);
          console.log('   Cleared release data - funds are now held in escrow');
        }
      } catch (escrowError) {
        console.log('⚠️  Could not revert escrow status:', escrowError.message);
      }
    }

    // Update milestone status if needed
    if (deliverable.milestone) {
      try {
        const milestone = await Milestone.findById(deliverable.milestone._id);
        if (milestone && milestone.status === 'approved') {
          milestone.status = 'submitted';
          milestone.approvedDate = undefined;
          milestone.approvalNotes = undefined;
          await milestone.save();
          
          console.log(`\n📍 Reverted milestone status: approved → submitted`);
        }
      } catch (milestoneError) {
        console.log('⚠️  Could not revert milestone status:', milestoneError.message);
      }
    }

    console.log('\n🔄 Revert Summary:');
    console.log('   Deliverable is now ready for client review testing');
    console.log('   Status: submitted (can be approved/rejected/commented)');
    console.log('   All review data cleared');
    if (originalStatus === 'approved') {
      console.log('   Escrow funds returned to held status');
    }

  } catch (error) {
    console.error('❌ Error reverting deliverable review:', error);
  }
}

async function main() {
  await connectDB();
  
  // Get deliverable ID from command line argument
  const deliverableId = process.argv[2];
  
  if (deliverableId) {
    console.log(`🔄 Reverting specific deliverable: ${deliverableId}`);
  } else {
    console.log('🔄 Reverting most recently reviewed deliverable...');
  }
  
  await revertDeliverableReview(deliverableId);
  
  console.log('\n✨ Script completed!');
  process.exit(0);
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { revertDeliverableReview };