const mongoose = require('mongoose');
const Milestone = require('./models/Milestone');

mongoose.connect('mongodb://localhost:27017/freelance_platform')
  .then(async () => {
    console.log('✅ Connected to database\n');
    
    const milestones = await Milestone.find({})
      .populate('workspace', 'status')
      .populate('submittedBy reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${milestones.length} milestone(s) (showing last 10):\n`);
    
    milestones.forEach((m, index) => {
      console.log(`--- Milestone ${index + 1} ---`);
      console.log(`ID: ${m._id}`);
      console.log(`Title: ${m.title}`);
      console.log(`Description: ${m.description}`);
      console.log(`Amount: ₹${m.amount}`);
      console.log(`Status: ${m.status}`);
      console.log(`DeliveryStatus: ${m.deliveryStatus || 'N/A'}`);
      console.log(`SubmittedBy: ${m.submittedBy?.fullName || 'N/A'}`);
      console.log(`ReviewedBy: ${m.reviewedBy?.fullName || 'N/A'}`);
      console.log(`SubmissionDate: ${m.submissionDate || 'N/A'}`);
      console.log(`ReviewDate: ${m.reviewDate || 'N/A'}`);
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
