const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true // One workspace per project
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true // The accepted application that created this workspace
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'on-hold'],
    default: 'active'
  },
  // Workspace settings
  settings: {
    allowFileSharing: { type: Boolean, default: true },
    allowMilestones: { type: Boolean, default: true },
    allowDeliverables: { type: Boolean, default: true },
    autoCreateMilestones: { type: Boolean, default: false }
  },
  // Statistics
  stats: {
    totalFiles: { type: Number, default: 0 },
    totalMilestones: { type: Number, default: 0 },
    completedMilestones: { type: Number, default: 0 },
    totalDeliverables: { type: Number, default: 0 },
    approvedDeliverables: { type: Number, default: 0 }
  },
  // Important dates
  startDate: { type: Date, default: Date.now },
  expectedEndDate: { type: Date },
  actualEndDate: { type: Date },
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better performance
workspaceSchema.index({ project: 1 });
workspaceSchema.index({ client: 1, freelancer: 1 });
workspaceSchema.index({ status: 1 });
workspaceSchema.index({ lastActivity: -1 });

// Virtual for progress calculation
workspaceSchema.virtual('progress').get(function() {
  if (this.stats.totalMilestones === 0) return 0;
  return Math.round((this.stats.completedMilestones / this.stats.totalMilestones) * 100);
});

// Ensure virtual fields are serialized
workspaceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Workspace', workspaceSchema);