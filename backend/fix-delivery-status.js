const mongoose = require('mongoose');
const Milestone = require('./models/Milestone');
const Escrow = require('./models/Escrow');
require('dotenv').config();

// Use the production MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_platform';

console.log('🔌 Connecting to MongoDB...\n');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to database\n');
    
    // Find all approved milestones that still have deliveryStatus as "on-time"
    const milestones = await Milestone.find({
      status: 'approved',
      deliveryStatus: { $ne: 'delivered' }
    });
    
    console.log(`Found ${milestones.length} milestone(s) needing fix\n`);
    
    for (const milestone of milestones) {
      console.log(`Fixing milestone: ${milestone.title} (${milestone._id})`);
      
      // Update milestone deliveryStatus
      milestone.deliveryStatus = 'delivered';
      if (!milestone.submissionDate) {
        milestone.submissionDate = milestone.approvedDate || new Date();
      }
      await milestone.save({ validateBeforeSave: false });
      console.log(`  ✓ Milestone deliveryStatus updated to "delivered"`);
      
      // Update corresponding escrow
      const escrow = await Escrow.findOne({ milestone: milestone._id });
      if (escrow && escrow.status === 'active') {
        escrow.deliverableSubmitted = true;
        if (!escrow.deliverableSubmittedAt) {
          escrow.deliverableSubmittedAt = milestone.submissionDate || new Date();
        }
        if (escrow.clientApprovalStatus !== 'approved') {
          escrow.clientApprovalStatus = 'approved';
          escrow.clientApprovedAt = milestone.approvedDate || new Date();
          escrow.clientApprovedBy = milestone.reviewedBy;
        }
        await escrow.save();
        console.log(`  ✓ Escrow deliverableSubmitted set to true`);
      } else {
        console.log(`  ⚠ No active escrow found for this milestone`);
      }
      console.log('');
    }
    
    console.log(`\n✅ Fixed ${milestones.length} milestone(s)`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
