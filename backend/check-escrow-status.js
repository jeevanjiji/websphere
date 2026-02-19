const mongoose = require('mongoose');
const Escrow = require('./models/Escrow');

mongoose.connect('mongodb://localhost:27017/freelance_platform')
  .then(async () => {
    console.log('✅ Connected to database\n');
    
    // Get all escrows, not just active ones
    const escrows = await Escrow.find({})
      .populate('milestone', 'title status deliveryStatus')
      .populate('client', 'fullName')
      .populate('freelancer', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${escrows.length} escrow(s) (showing last 10):\n`);
    
    escrows.forEach((e, index) => {
      console.log(`--- Escrow ${index + 1} ---`);
      console.log(`ID: ${e._id}`);
      console.log(`Milestone: ${e.milestone?.title || 'N/A'}`);
      console.log(`Milestone Status: ${e.milestone?.status || 'N/A'}`);
      console.log(`Milestone DeliveryStatus: ${e.milestone?.deliveryStatus || 'N/A'}`);
      console.log(`Client: ${e.client?.fullName || 'N/A'}`);
      console.log(`Freelancer: ${e.freelancer?.fullName || 'N/A'}`);
      console.log(`\nEscrow Fields:`);
      console.log(`  - status: ${e.status}`);
      console.log(`  - deliverableSubmitted: ${e.deliverableSubmitted}`);
      console.log(`  - deliverableSubmittedAt: ${e.deliverableSubmittedAt || 'N/A'}`);
      console.log(`  - clientApprovalStatus: ${e.clientApprovalStatus}`);
      console.log(`  - clientApprovedAt: ${e.clientApprovedAt || 'N/A'}`);
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
