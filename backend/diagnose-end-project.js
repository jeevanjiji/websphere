/**
 * Diagnose why "End Project" is greyed out for a specific project.
 * Usage: node diagnose-end-project.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function diagnose() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const Project = require('./models/Project');
  const Workspace = require('./models/Workspace');
  const Milestone = require('./models/Milestone');
  const Deliverable = require('./models/Deliverable');
  const Escrow = require('./models/Escrow');

  // Find the project
  const project = await Project.findOne({ title: /Build a Mobile App for a clothing store/i });
  if (!project) {
    console.log('❌ Project not found');
    process.exit(1);
  }
  console.log('=== PROJECT ===');
  console.log('  ID:', project._id.toString());
  console.log('  Title:', project.title);
  console.log('  Status:', project.status);

  // Find workspace
  const workspace = await Workspace.findOne({ project: project._id });
  if (!workspace) {
    console.log('❌ No workspace for this project');
    process.exit(1);
  }
  console.log('\n=== WORKSPACE ===');
  console.log('  ID:', workspace._id.toString());
  console.log('  Status:', workspace.status);

  // Find milestones
  const milestones = await Milestone.find({ workspace: workspace._id }).sort({ order: 1 }).lean();
  console.log('\n=== MILESTONES (' + milestones.length + ') ===');
  if (milestones.length === 0) {
    console.log('  ⚠️  BLOCKER: No milestones exist — button will be greyed out');
  }

  const milestoneIds = milestones.map(m => m._id);

  // Find deliverables
  const deliverables = await Deliverable.find({ workspace: workspace._id }).lean();
  console.log('\n=== DELIVERABLES (' + deliverables.length + ') ===');

  // Find escrows
  const escrows = await Escrow.find({ milestone: { $in: milestoneIds } }).lean();
  const escrowByMilestone = new Map(escrows.map(e => [e.milestone.toString(), e]));

  // Approved deliverable set
  const approvedDeliverableMilestoneIds = new Set(
    deliverables
      .filter(d => d.status === 'approved' && d.milestone)
      .map(d => d.milestone.toString())
  );

  console.log('  Approved-deliverable milestone IDs:', [...approvedDeliverableMilestoneIds]);

  // Check each milestone
  console.log('\n=== PER-MILESTONE CHECK ===');
  const blockers = [];
  for (const m of milestones) {
    const mid = m._id.toString();
    const escrow = escrowByMilestone.get(mid);

    const isPaid =
      m.status === 'paid' ||
      m.status === 'approved' ||
      m.paymentStatus === 'completed' ||
      m.paymentStatus === 'processing' ||
      ['active', 'released', 'completed'].includes(m.escrowStatus);

    const hasApprovedDeliverable = approvedDeliverableMilestoneIds.has(mid);

    const isApprovedViaEscrow =
      !!escrow &&
      escrow.deliverableSubmitted === true &&
      ['approved', 'auto-approved'].includes(escrow.clientApprovalStatus);

    console.log(`\n  Milestone: "${m.title}" (${mid})`);
    console.log(`    status: ${m.status}`);
    console.log(`    paymentStatus: ${m.paymentStatus}`);
    console.log(`    escrowStatus: ${m.escrowStatus}`);
    console.log(`    isPaid: ${isPaid}`);
    console.log(`    hasApprovedDeliverable (Deliverable collection): ${hasApprovedDeliverable}`);
    console.log(`    isApprovedViaEscrow: ${isApprovedViaEscrow}`);
    if (escrow) {
      console.log(`    Escrow => status: ${escrow.status}, deliverableSubmitted: ${escrow.deliverableSubmitted}, clientApprovalStatus: ${escrow.clientApprovalStatus}`);
    } else {
      console.log(`    Escrow => NONE`);
    }

    if (!isPaid) blockers.push(`"${m.title}" is NOT paid`);
    if (!hasApprovedDeliverable) blockers.push(`"${m.title}" has NO approved deliverable in Deliverable collection`);
  }

  console.log('\n=== RESULT ===');
  if (workspace.status !== 'active') {
    console.log(`⚠️  Workspace status is "${workspace.status}" — must be "active"`);
  }
  if (blockers.length === 0) {
    console.log('✅ All conditions met — button should be GREEN');
  } else {
    console.log('❌ BLOCKERS preventing End Project:');
    blockers.forEach(b => console.log('  - ' + b));
  }

  await mongoose.disconnect();
}

diagnose().catch(err => {
  console.error(err);
  process.exit(1);
});
