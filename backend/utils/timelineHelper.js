const TimelineEvent = require('../models/TimelineEvent');

/**
 * Create a timeline event
 * @param {Object} params - Event parameters
 * @param {String} params.workspace - Workspace ID
 * @param {String} params.project - Project ID
 * @param {String} params.type - Event type (e.g., 'milestone.created')
 * @param {String} params.title - Event title
 * @param {String} params.description - Event description (optional)
 * @param {String} params.actor - User ID who performed the action (optional)
 * @param {Object} params.metadata - Additional metadata (optional)
 * @param {String} params.relatedMilestone - Related milestone ID (optional)
 * @param {String} params.relatedDeliverable - Related deliverable ID (optional)
 * @param {String} params.relatedEscrow - Related escrow ID (optional)
 */
async function createTimelineEvent({
  workspace,
  project,
  type,
  title,
  description = '',
  actor = null,
  metadata = {},
  relatedMilestone = null,
  relatedDeliverable = null,
  relatedEscrow = null
}) {
  try {
    const event = await TimelineEvent.create({
      workspace,
      project,
      type,
      title,
      description,
      actor,
      metadata,
      relatedMilestone,
      relatedDeliverable,
      relatedEscrow,
      source: actor ? 'user' : 'system'
    });

    console.log(`✅ Timeline event created: ${type} - ${title}`);
    return event;
  } catch (error) {
    console.error('❌ Error creating timeline event:', error);
    // Don't throw - timeline events are not critical for the main flow
    return null;
  }
}

/**
 * Create milestone-related timeline events
 */
async function createMilestoneEvent(milestone, eventType, actor = null, additionalData = {}) {
  const eventMap = {
    'created': {
      type: 'milestone.created',
      title: `Milestone "${milestone.title}" created`,
      description: `Amount: ₹${milestone.amount.toLocaleString()} | Due: ${new Date(milestone.dueDate).toLocaleDateString()}`
    },
    'approved': {
      type: 'milestone.approved',
      title: `Milestone "${milestone.title}" approved`,
      description: additionalData.approvalNotes || 'Client approved this milestone'
    },
    'rejected': {
      type: 'milestone.rejected',
      title: `Milestone "${milestone.title}" rejected`,
      description: additionalData.rejectionReason || 'Client requested changes'
    },
    'completed': {
      type: 'milestone.completed',
      title: `Milestone "${milestone.title}" completed`,
      description: 'Milestone work completed by freelancer'
    },
    'updated': {
      type: 'milestone.updated',
      title: `Milestone "${milestone.title}" updated`,
      description: additionalData.updateSummary || 'Milestone details updated'
    }
  };

  const eventData = eventMap[eventType];
  if (!eventData) {
    console.warn(`Unknown milestone event type: ${eventType}`);
    return null;
  }

  return createTimelineEvent({
    workspace: milestone.workspace,
    project: additionalData.project,
    type: eventData.type,
    title: eventData.title,
    description: eventData.description,
    actor,
    relatedMilestone: milestone._id,
    metadata: {
      milestoneAmount: milestone.amount,
      milestoneCurrency: milestone.currency,
      milestoneStatus: milestone.status,
      ...additionalData.metadata
    }
  });
}

/**
 * Create deliverable-related timeline events
 */
async function createDeliverableEvent(deliverable, eventType, actor = null, additionalData = {}) {
  const eventMap = {
    'submitted': {
      type: 'deliverable.submitted',
      title: `Deliverable "${deliverable.title}" submitted`,
      description: deliverable.submissionNotes || 'New deliverable submitted for review'
    },
    'approved': {
      type: 'deliverable.approved',
      title: `Deliverable "${deliverable.title}" approved`,
      description: additionalData.reviewNotes || 'Client approved this deliverable'
    },
    'revised': {
      type: 'deliverable.revised',
      title: `Deliverable "${deliverable.title}" needs revision`,
      description: additionalData.reviewNotes || 'Client requested changes'
    },
    'rejected': {
      type: 'deliverable.rejected',
      title: `Deliverable "${deliverable.title}" rejected`,
      description: additionalData.reviewNotes || 'Deliverable was rejected'
    }
  };

  const eventData = eventMap[eventType];
  if (!eventData) {
    console.warn(`Unknown deliverable event type: ${eventType}`);
    return null;
  }

  return createTimelineEvent({
    workspace: deliverable.workspace,
    project: additionalData.project,
    type: eventData.type,
    title: eventData.title,
    description: eventData.description,
    actor,
    relatedDeliverable: deliverable._id,
    relatedMilestone: deliverable.milestone,
    metadata: {
      deliverableType: deliverable.type,
      deliverableStatus: deliverable.status,
      ...additionalData.metadata
    }
  });
}

/**
 * Create payment/escrow-related timeline events
 */
async function createPaymentEvent(escrow, eventType, actor = null, additionalData = {}) {
  const eventMap = {
    'funded': {
      type: 'escrow.funded',
      title: 'Payment held in escrow',
      description: `₹${escrow.totalAmount.toLocaleString()} secured for milestone`
    },
    'released': {
      type: 'payment.completed',
      title: 'Payment released to freelancer',
      description: `₹${escrow.amountToFreelancer.toLocaleString()} transferred successfully`
    },
    'failed': {
      type: 'payment.failed',
      title: 'Payment failed',
      description: additionalData.failureReason || 'Payment transaction failed'
    }
  };

  const eventData = eventMap[eventType];
  if (!eventData) {
    console.warn(`Unknown payment event type: ${eventType}`);
    return null;
  }

  return createTimelineEvent({
    workspace: escrow.workspace,
    project: additionalData.project,
    type: eventData.type,
    title: eventData.title,
    description: eventData.description,
    actor,
    relatedEscrow: escrow._id,
    relatedMilestone: escrow.milestone,
    metadata: {
      amount: escrow.totalAmount,
      amountToFreelancer: escrow.amountToFreelancer,
      serviceCharge: escrow.serviceCharge,
      escrowStatus: escrow.status,
      ...additionalData.metadata
    }
  });
}

/**
 * Create workspace-related timeline events
 */
async function createWorkspaceEvent(workspace, eventType, actor = null, additionalData = {}) {
  const eventMap = {
    'created': {
      type: 'workspace.created',
      title: 'Project workspace created',
      description: 'Collaboration workspace initialized successfully'
    },
    'status_changed': {
      type: 'project.status_changed',
      title: `Project status changed to ${additionalData.newStatus}`,
      description: additionalData.reason || 'Project status updated'
    }
  };

  const eventData = eventMap[eventType];
  if (!eventData) {
    console.warn(`Unknown workspace event type: ${eventType}`);
    return null;
  }

  return createTimelineEvent({
    workspace: workspace._id,
    project: workspace.project,
    type: eventData.type,
    title: eventData.title,
    description: eventData.description,
    actor,
    metadata: {
      workspaceStatus: workspace.status,
      ...additionalData.metadata
    }
  });
}

module.exports = {
  createTimelineEvent,
  createMilestoneEvent,
  createDeliverableEvent,
  createPaymentEvent,
  createWorkspaceEvent
};
