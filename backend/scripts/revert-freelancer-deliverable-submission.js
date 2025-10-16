/**
 * Script to revert the last deliverable submission by freelancer
 * This allows testing of deliverable submission functionality
 * 
 * Usage: node scripts/revert-freelancer-deliverable-submission.js [deliverableId]
 * If no deliverableId provided, it will remove the most recently submitted deliverable
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Deliverable = require('../models/Deliverable');
const Milestone = require('../models/Milestone');
const Workspace = require('../models/Workspace');
const fs = require('fs');
const path = require('path');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function revertDeliverableSubmission(deliverableId = null) {
  try {
    let deliverable;
    
    if (deliverableId) {
      // Revert specific deliverable
      deliverable = await Deliverable.findById(deliverableId)
        .populate('workspace')
        .populate('milestone')
        .populate('submittedBy', 'name email');
      
      if (!deliverable) {
        console.log('❌ Deliverable not found with ID:', deliverableId);
        return;
      }
    } else {
      // Find the most recently submitted deliverable
      deliverable = await Deliverable.findOne({
        submissionDate: { $exists: true }
      })
      .sort({ submissionDate: -1 })
      .populate('workspace')
      .populate('milestone')
      .populate('submittedBy', 'name email');
    }

    if (!deliverable) {
      console.log('❌ No deliverable submissions found to revert');
      return;
    }

    console.log('\n📋 Found deliverable submission to revert:');
    console.log(`   ID: ${deliverable._id}`);
    console.log(`   Title: ${deliverable.title}`);
    console.log(`   Description: ${deliverable.description}`);
    console.log(`   Type: ${deliverable.type}`);
    console.log(`   Status: ${deliverable.status}`);
    console.log(`   Submitted By: ${deliverable.submittedBy?.name || 'Unknown'} (${deliverable.submittedBy?.email || 'Unknown'})`);
    console.log(`   Submission Date: ${deliverable.submissionDate}`);
    console.log(`   Workspace: ${deliverable.workspace?.title || 'Unknown'}`);
    console.log(`   Milestone: ${deliverable.milestone?.title || 'None'}`);
    console.log(`   Files: ${deliverable.content?.files?.length || 0}`);
    console.log(`   Links: ${deliverable.content?.links?.length || 0}`);

    // Ask for confirmation before deleting
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmation = await new Promise((resolve) => {
      rl.question('\n❓ Are you sure you want to delete this deliverable? (yes/no): ', (answer) => {
        resolve(answer.toLowerCase());
      });
    });

    rl.close();

    if (confirmation !== 'yes' && confirmation !== 'y') {
      console.log('❌ Operation cancelled by user');
      return;
    }

    // Store file paths for cleanup
    const filesToDelete = [];
    if (deliverable.content?.files) {
      deliverable.content.files.forEach(file => {
        if (file.url) {
          // Convert URL to file path
          const filePath = path.join(process.cwd(), 'uploads', file.filename || path.basename(file.url));
          filesToDelete.push({ path: filePath, name: file.originalName || file.filename });
        }
      });
    }

    // Remove files from filesystem
    let filesDeleted = 0;
    for (const fileInfo of filesToDelete) {
      try {
        if (fs.existsSync(fileInfo.path)) {
          fs.unlinkSync(fileInfo.path);
          console.log(`   🗑️  Deleted file: ${fileInfo.name}`);
          filesDeleted++;
        } else {
          console.log(`   ⚠️  File not found: ${fileInfo.name} (${fileInfo.path})`);
        }
      } catch (fileError) {
        console.log(`   ❌ Could not delete file ${fileInfo.name}: ${fileError.message}`);
      }
    }

    // Update milestone deliverable count if linked
    if (deliverable.milestone) {
      try {
        const milestone = await Milestone.findById(deliverable.milestone._id);
        if (milestone) {
          // Update deliverable count (assuming there's a deliverableCount field)
          const deliverableCount = await Deliverable.countDocuments({ milestone: milestone._id });
          console.log(`   📍 Milestone has ${deliverableCount - 1} deliverable(s) after deletion`);
        }
      } catch (milestoneError) {
        console.log('⚠️  Could not update milestone info:', milestoneError.message);
      }
    }

    // Store info for summary before deletion
    const deletedInfo = {
      id: deliverable._id,
      title: deliverable.title,
      submittedBy: deliverable.submittedBy?.name || 'Unknown',
      submissionDate: deliverable.submissionDate,
      filesDeleted: filesDeleted,
      totalFiles: deliverable.content?.files?.length || 0,
      workspace: deliverable.workspace?.title || 'Unknown',
      milestone: deliverable.milestone?.title || 'None'
    };

    // Delete the deliverable from database
    await Deliverable.findByIdAndDelete(deliverable._id);

    console.log('\n✅ Successfully deleted deliverable submission:');
    console.log(`   Deliverable ID: ${deletedInfo.id}`);
    console.log(`   Title: ${deletedInfo.title}`);
    console.log(`   Submitted by: ${deletedInfo.submittedBy}`);
    console.log(`   Files deleted: ${deletedInfo.filesDeleted}/${deletedInfo.totalFiles}`);
    console.log(`   Workspace: ${deletedInfo.workspace}`);
    console.log(`   Milestone: ${deletedInfo.milestone}`);

    console.log('\n🔄 Revert Summary:');
    console.log('   Deliverable submission completely removed');
    console.log('   Associated files deleted from filesystem');
    console.log('   Freelancer can now submit a new deliverable for testing');

  } catch (error) {
    console.error('❌ Error reverting deliverable submission:', error);
  }
}

async function listRecentDeliverables(limit = 5) {
  try {
    console.log(`\n📋 Last ${limit} deliverable submissions:`);
    console.log('─'.repeat(80));
    
    const deliverables = await Deliverable.find({})
      .sort({ submissionDate: -1 })
      .limit(limit)
      .populate('submittedBy', 'name email')
      .populate('workspace', 'title')
      .populate('milestone', 'title')
      .select('_id title status submissionDate submittedBy workspace milestone');

    if (deliverables.length === 0) {
      console.log('   No deliverables found');
      return;
    }

    deliverables.forEach((deliverable, index) => {
      console.log(`${index + 1}. ${deliverable.title}`);
      console.log(`   ID: ${deliverable._id}`);
      console.log(`   Status: ${deliverable.status}`);
      console.log(`   Submitted: ${deliverable.submissionDate?.toLocaleString() || 'Unknown'}`);
      console.log(`   By: ${deliverable.submittedBy?.name || 'Unknown'} (${deliverable.submittedBy?.email || 'Unknown'})`);
      console.log(`   Workspace: ${deliverable.workspace?.title || 'Unknown'}`);
      console.log(`   Milestone: ${deliverable.milestone?.title || 'None'}`);
      console.log('─'.repeat(80));
    });

  } catch (error) {
    console.error('❌ Error listing deliverables:', error);
  }
}

async function main() {
  await connectDB();
  
  // Get command and deliverable ID from command line arguments
  const command = process.argv[2];
  const deliverableId = process.argv[3];
  
  if (command === 'list' || command === '-l' || command === '--list') {
    const limit = parseInt(deliverableId) || 5;
    await listRecentDeliverables(limit);
  } else {
    const targetId = command; // First argument is the deliverable ID if not 'list'
    
    if (targetId) {
      console.log(`🔄 Reverting specific deliverable: ${targetId}`);
    } else {
      console.log('🔄 Reverting most recently submitted deliverable...');
    }
    
    await revertDeliverableSubmission(targetId);
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

module.exports = { revertDeliverableSubmission, listRecentDeliverables };