/**
 * Combined Deliverable Testing Script
 * Provides easy interface to revert both client reviews and freelancer submissions
 * 
 * Usage:
 *   node scripts/deliverable-test-helper.js list                    # List recent deliverables
 *   node scripts/deliverable-test-helper.js revert-review [id]      # Revert client review
 *   node scripts/deliverable-test-helper.js revert-submission [id]  # Revert freelancer submission
 *   node scripts/deliverable-test-helper.js status [id]             # Check deliverable status
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { revertDeliverableReview } = require('./revert-client-deliverable-review');
const { revertDeliverableSubmission, listRecentDeliverables } = require('./revert-freelancer-deliverable-submission');
const Deliverable = require('../models/Deliverable');
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

async function checkDeliverableStatus(deliverableId) {
  try {
    const deliverable = await Deliverable.findById(deliverableId)
      .populate('workspace', 'title status')
      .populate('milestone', 'title amount status')
      .populate('submittedBy', 'name email userType')
      .populate('reviewedBy', 'name email');

    if (!deliverable) {
      console.log('❌ Deliverable not found');
      return;
    }

    console.log('\n📋 Deliverable Status Report:');
    console.log('═'.repeat(60));
    console.log(`🎯 Title: ${deliverable.title}`);
    console.log(`📝 Description: ${deliverable.description}`);
    console.log(`📊 Status: ${deliverable.status}`);
    console.log(`📅 Submitted: ${deliverable.submissionDate?.toLocaleString() || 'Not set'}`);
    console.log(`👤 Submitted By: ${deliverable.submittedBy?.name} (${deliverable.submittedBy?.userType})`);
    
    if (deliverable.reviewedBy) {
      console.log(`👨‍💼 Reviewed By: ${deliverable.reviewedBy.name}`);
      console.log(`📅 Review Date: ${deliverable.reviewDate?.toLocaleString() || 'Not set'}`);
      console.log(`💬 Review Notes: ${deliverable.reviewNotes || 'None'}`);
    } else {
      console.log(`👨‍💼 Review Status: Not yet reviewed`);
    }

    console.log(`🏢 Workspace: ${deliverable.workspace?.title} (${deliverable.workspace?.status})`);
    
    if (deliverable.milestone) {
      console.log(`🎯 Milestone: ${deliverable.milestone.title} (₹${deliverable.milestone.amount})`);
      
      // Check escrow status
      try {
        const escrow = await Escrow.findOne({ milestone: deliverable.milestone._id });
        if (escrow) {
          console.log(`💰 Escrow Status: ${escrow.status}`);
          console.log(`💳 Amount: ₹${escrow.totalAmount} (₹${escrow.milestoneAmount} + ₹${escrow.serviceCharge} fee)`);
        }
      } catch (escrowError) {
        console.log(`💰 Escrow: Not found or error`);
      }
    } else {
      console.log(`🎯 Milestone: Not linked`);
    }

    console.log(`📁 Files: ${deliverable.content?.files?.length || 0}`);
    console.log(`🔗 Links: ${deliverable.content?.links?.length || 0}`);
    console.log(`⭐ Rating: ${deliverable.rating || 'Not rated'}`);
    console.log(`🏷️  Tags: ${deliverable.tags?.join(', ') || 'None'}`);
    
    console.log('\n🔄 Available Actions:');
    if (deliverable.status === 'submitted') {
      console.log('   ✅ Can approve/reject/comment (client actions)');
    } else if (['approved', 'rejected'].includes(deliverable.status)) {
      console.log('   🔄 Can revert review (use revert-review command)');
    }
    console.log('   🗑️  Can delete submission (use revert-submission command)');

  } catch (error) {
    console.error('❌ Error checking deliverable status:', error);
  }
}

async function showHelp() {
  console.log('\n🛠️  Deliverable Testing Helper');
  console.log('═'.repeat(50));
  console.log('\nAvailable Commands:');
  console.log('  list [limit]              - List recent deliverables (default: 5)');
  console.log('  revert-review [id]        - Revert client review (approve/reject → submitted)');
  console.log('  revert-submission [id]    - Delete deliverable submission completely');
  console.log('  status <id>               - Show detailed deliverable status');
  console.log('  help                      - Show this help message');
  
  console.log('\nExamples:');
  console.log('  node scripts/deliverable-test-helper.js list');
  console.log('  node scripts/deliverable-test-helper.js list 10');
  console.log('  node scripts/deliverable-test-helper.js status 671012a3b4c5d6e7f8901234');
  console.log('  node scripts/deliverable-test-helper.js revert-review 671012a3b4c5d6e7f8901234');
  console.log('  node scripts/deliverable-test-helper.js revert-submission 671012a3b4c5d6e7f8901234');
  
  console.log('\nTesting Workflow:');
  console.log('  1. Submit deliverable as freelancer (via UI)');
  console.log('  2. Use "list" to see recent submissions');
  console.log('  3. Test approve/reject/comment as client (via UI)');
  console.log('  4. Use "revert-review" to reset for more testing');
  console.log('  5. Use "revert-submission" to start fresh');
  
  console.log('\n⚠️  Notes:');
  console.log('  - revert-review: Keeps deliverable but resets review status');
  console.log('  - revert-submission: Completely deletes deliverable and files');
  console.log('  - Always confirm before deleting submissions');
}

async function main() {
  const command = process.argv[2];
  const param = process.argv[3];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    await showHelp();
    return;
  }

  await connectDB();

  switch (command.toLowerCase()) {
    case 'list':
    case 'ls':
      const limit = parseInt(param) || 5;
      await listRecentDeliverables(limit);
      break;

    case 'revert-review':
    case 'rr':
      console.log('🔄 Reverting client review...');
      await revertDeliverableReview(param);
      break;

    case 'revert-submission':
    case 'rs':
      console.log('🗑️  Reverting deliverable submission...');
      await revertDeliverableSubmission(param);
      break;

    case 'status':
    case 'info':
      if (!param) {
        console.log('❌ Please provide deliverable ID');
        console.log('Usage: node scripts/deliverable-test-helper.js status <deliverable_id>');
        break;
      }
      await checkDeliverableStatus(param);
      break;

    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('Run with "help" to see available commands');
      break;
  }

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