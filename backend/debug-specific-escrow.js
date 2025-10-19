const mongoose = require('mongoose');
const Escrow = require('./models/Escrow');
const Milestone = require('./models/Milestone');
const Workspace = require('./models/Workspace');
const User = require('./models/User');
require('dotenv').config();

async function debugSpecificEscrow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check all escrows in the database
    const allEscrows = await Escrow.find({}).populate('milestone');
    console.log(`📊 Total escrows in database: ${allEscrows.length}`);
    
    if (allEscrows.length === 0) {
      console.log('❌ No escrows found in database');
      
      // Check if there are any milestones
      const milestones = await Milestone.find({});
      console.log(`� Total milestones in database: ${milestones.length}`);
      
      return;
    }
    
    // List all escrows
    console.log('\n📋 All escrows in database:');
    allEscrows.forEach((escrow, index) => {
      console.log(`${index + 1}. ID: ${escrow._id}`);
      console.log(`   Status: ${escrow.status}`);
      console.log(`   Milestone: ${escrow.milestone?._id || 'No milestone'}`);
      console.log('');
    });
    
    // Check the specific escrow ID
    const escrowId = '68f3269295943d98a8aaea88';
    console.log(`🔍 Looking for specific escrow: ${escrowId}`);
    const specificEscrow = allEscrows.find(e => e._id.toString() === escrowId);
    
    if (!specificEscrow) {
      console.log('❌ The escrow ID from your error does NOT exist in this database');
      console.log('💡 This suggests frontend is connected to a different database or using cached data');
      return;
    }
    
    console.log('\n📋 Escrow found by ID:');
    console.log(`   Escrow ID: ${escrow._id}`);
    console.log(`   Status: ${escrow.status}`);
    console.log(`   Milestone ID: ${escrow.milestone}`);
    console.log(`   Deliverable Submitted: ${escrow.deliverableSubmitted}`);
    console.log(`   Client Approval Status: ${escrow.clientApprovalStatus}`);
    
    // Now try to find by milestone (same as EscrowService.releaseFunds)
    const escrowByMilestone = await Escrow.findOne({ milestone: escrow.milestone })
      .populate('milestone workspace client freelancer');
    
    if (!escrowByMilestone) {
      console.log('❌ Escrow NOT found by milestone - this is the problem!');
      return;
    }
    
    console.log('\n🎯 Escrow found by milestone:');
    console.log(`   Escrow ID: ${escrowByMilestone._id}`);
    console.log(`   Status: ${escrowByMilestone.status}`);
    console.log(`   Deliverable Submitted: ${escrowByMilestone.deliverableSubmitted}`);
    console.log(`   Client Approval Status: ${escrowByMilestone.clientApprovalStatus}`);
    
    // Test all validation conditions
    console.log('\n✅ Validation Tests:');
    
    if (escrowByMilestone.status !== 'active') {
      console.log(`❌ Status check failed: ${escrowByMilestone.status} !== 'active'`);
    } else {
      console.log(`✅ Status is active`);
    }
    
    if (!escrowByMilestone.deliverableSubmitted) {
      console.log('❌ Deliverable not submitted');
    } else {
      console.log('✅ Deliverable submitted');
    }
    
    if (escrowByMilestone.clientApprovalStatus === 'rejected') {
      console.log('❌ Deliverable rejected by client');
    } else {
      console.log(`✅ Deliverable not rejected (status: ${escrowByMilestone.clientApprovalStatus})`);
    }
    
    if (escrowByMilestone.clientApprovalStatus !== 'approved') {
      console.log(`❌ Deliverable not approved (status: ${escrowByMilestone.clientApprovalStatus})`);
    } else {
      console.log('✅ Deliverable approved by client');
    }
    
    // Check if milestone exists and is populated
    if (escrowByMilestone.milestone) {
      console.log(`\n📌 Milestone Details:`);
      console.log(`   Milestone ID: ${escrowByMilestone.milestone._id}`);
      console.log(`   Title: ${escrowByMilestone.milestone.title}`);
    } else {
      console.log('\n❌ Milestone not populated');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

debugSpecificEscrow();