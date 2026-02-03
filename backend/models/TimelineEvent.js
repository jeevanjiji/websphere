const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Event details
  type: {
    type: String,
    required: true,
    enum: [
      // System events
      'project.created',
      'project.status_changed',
      'workspace.created',
      'milestone.created',
      'milestone.updated',
      'milestone.approved',
      'milestone.rejected',
      'milestone.completed',
      'deliverable.submitted',
      'deliverable.revised',
      'deliverable.approved',
      'deliverable.rejected',
      'escrow.funded',
      'escrow.released',
      'payment.completed',
      'payment.failed',
      // User events
      'note.added',
      'file.attached',
      'status.updated'
    ]
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Actor (null for pure system events)
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Optional metadata (flexible for different event types)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Reference to related entities
  relatedMilestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  relatedDeliverable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deliverable'
  },
  relatedEscrow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escrow'
  },
  
  // Source tracking
  source: {
    type: String,
    enum: ['system', 'user'],
    default: 'system'
  },
  
  // Visibility (for future use if needed)
  visibility: {
    type: String,
    enum: ['all', 'client-only', 'freelancer-only'],
    default: 'all'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for efficient querying
timelineEventSchema.index({ workspace: 1, createdAt: -1 });
timelineEventSchema.index({ project: 1, createdAt: -1 });
timelineEventSchema.index({ type: 1 });

// Static method to create event
timelineEventSchema.statics.createEvent = async function(eventData) {
  try {
    const event = await this.create(eventData);
    return event;
  } catch (error) {
    console.error('Error creating timeline event:', error);
    throw error;
  }
};

// Method to get formatted event for display
timelineEventSchema.methods.getFormatted = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    description: this.description,
    actor: this.actor,
    metadata: this.metadata,
    source: this.source,
    createdAt: this.createdAt,
    relatedMilestone: this.relatedMilestone,
    relatedDeliverable: this.relatedDeliverable,
    relatedEscrow: this.relatedEscrow
  };
};

module.exports = mongoose.model('TimelineEvent', timelineEventSchema);
