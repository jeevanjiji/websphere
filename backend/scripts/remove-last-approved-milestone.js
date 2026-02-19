// Usage: node backend/scripts/remove-last-approved-milestone.js
// Optionally set MONGODB_URI env var. Defaults to mongodb://127.0.0.1:27017/websphere

const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/websphere';
  console.log('🔌 Connecting to MongoDB:', uri);
  await mongoose.connect(uri, { autoIndex: false });

  const Milestone = require('../models/Milestone');
  const Workspace = require('../models/Workspace');
  const Project = require('../models/Project');

  try {
    console.log('🔎 Finding last approved milestone...');
    const milestone = await Milestone.findOne({ status: 'approved' })
      .sort({ approvedDate: -1, updatedAt: -1, createdAt: -1 })
      .populate({ path: 'workspace', select: 'project client freelancer' })
      .lean();

    if (!milestone) {
      console.log('ℹ️ No approved milestone found. Nothing to delete.');
      return;
    }

    console.log('🧱 Milestone to remove:');
    console.log({
      _id: milestone._id,
      title: milestone.title,
      amount: milestone.amount,
      status: milestone.status,
      approvedDate: milestone.approvedDate,
      workspace: milestone.workspace?._id,
    });

    // Optional: show project info for context
    if (milestone.workspace?.project) {
      const project = await Project.findById(milestone.workspace.project).select('title budgetAmount');
      if (project) {
        console.log('📁 Project:', { _id: project._id, title: project.title, budgetAmount: project.budgetAmount });
      }
    }

    // Confirm via env var ONLY (non-interactive script in CI)
    if (process.env.CONFIRM !== 'yes') {
      console.log('⚠️ Dry run. Set CONFIRM=yes to delete. Nothing was removed.');
      return;
    }

    const result = await Milestone.deleteOne({ _id: milestone._id });
    console.log('🗑️ Delete result:', result);
  } catch (err) {
    console.error('❌ Error removing milestone:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

main();



