const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // Milestone details
  order: {
    type: Number,
    required: true // For ordering milestones
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  // Timeline
  startDate: { type: Date },
  dueDate: { type: Date, required: true },
  completedDate: { type: Date },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'review', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  
  // Approval workflow
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submissionDate: { type: Date },
  submissionNotes: { type: String, maxlength: 500 },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: { type: Date },
  reviewNotes: { type: String, maxlength: 500 },
  
  // Attachments
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number },
    mimeType: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Requirements and deliverables
  requirements: [{
    description: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    completedDate: { type: Date }
  }],
  
  // Payment tracking
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: { type: String }, // Payment gateway transaction ID
  paidDate: { type: Date }
}, {
  timestamps: true
});

// Indexes
milestoneSchema.index({ workspace: 1, order: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ dueDate: 1 });
milestoneSchema.index({ submittedBy: 1 });

// Virtual for days remaining
milestoneSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const diffTime = this.dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage
milestoneSchema.virtual('completionPercentage').get(function() {
  if (!this.requirements || this.requirements.length === 0) return 0;
  const completed = this.requirements.filter(req => req.isCompleted).length;
  return Math.round((completed / this.requirements.length) * 100);
});

// Ensure virtual fields are serialized
milestoneSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Milestone', milestoneSchema);