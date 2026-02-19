const mongoose = require('mongoose');
require('dotenv').config();

const Milestone = require('./models/Milestone');
const Deliverable = require('./models/Deliverable');
const Escrow = require('./models/Escrow');

const fixEscrowDeliverableFlags = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB\n');

    // Find all milestones with deliveryStatus = 'delivered' but escrow has deliverableSubmitted = false
    const milestones = await Milestone.find({ deliveryStatus: 'delivered' });
    console.log(`Found ${milestones.length} milestones with deliveryStatus='delivered'\n`);

    let fixed = 0;
    for (const milestone of milestones) {
      const escrow = await Escrow.findOne({ milestone: milestone._id });
      
      if (escrow && !escrow.deliverableSubmitted) {
        console.log(`🔧 Fixing escrow for milestone: ${milestone.title} (${milestone._id})`);
        console.log(`   Current: deliverableSubmitted=${escrow.deliverableSubmitted}`);
        
        await Escrow.findByIdAndUpdate(escrow._id, {
          deliverableSubmitted: true,
          deliverableSubmittedAt: milestone.submissionDate || new Date()
        });
        
        console.log(`   Updated: deliverableSubmitted=true\n`);
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} escrows`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixEscrowDeliverableFlags();
