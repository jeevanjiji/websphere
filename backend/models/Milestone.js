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
  // Timeline and deadlines
  startDate: { type: Date },
  dueDate: { type: Date, required: true }, // When freelancer must deliver
  paymentDueDate: { type: Date, required: true }, // When client must pay after approval
  completedDate: { type: Date },
  paymentDate: { type: Date }, // When payment was actually made
  
  // Deadline enforcement
  isOverdue: {
    type: Boolean,
    default: false
  },
  overdueNotificationSent: {
    type: Boolean,
    default: false
  },
  
  // Notification tracking
  paymentReminderSent: {
    type: Boolean,
    default: false
  },
  paymentOverdueNotificationSent: {
    type: Boolean,
    default: false
  },
  deliverableReminderSent: {
    type: Boolean,
    default: false
  },
  autoExtensionDays: {
    type: Number,
    default: 0, // Auto-extension days granted
    max: 7 // Maximum 7 days auto-extension
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'review', 'approved', 'rejected', 'paid', 'payment-overdue'],
    default: 'pending'
  },
  
  // User tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment constraints
  paymentStatus: {
    type: String,
    enum: ['pending', 'due', 'overdue', 'processing', 'completed', 'failed', 'disputed'],
    default: 'pending'
  },
  paymentRemindersSent: {
    type: Number,
    default: 0
  },
  maxPaymentExtensions: {
    type: Number,
    default: 2 // Maximum payment extensions allowed
  },
  paymentExtensionsUsed: {
    type: Number,
    default: 0
  },
  
  // Delivery constraints
  deliveryStatus: {
    type: String,
    enum: ['on-time', 'at-risk', 'overdue', 'delivered'],
    default: 'on-time'
  },
  extensionRequested: {
    type: Boolean,
    default: false
  },
  extensionReason: {
    type: String,
    maxlength: 500
  },
  extensionApproved: {
    type: Boolean,
    default: false
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
  
  // Payment tracking (consolidated from duplicate definition)
  paymentId: { type: String }, // Payment gateway transaction ID
  paidDate: { type: Date },
  paymentDetails: {
    razorpay_payment_id: { type: String },
    razorpay_order_id: { type: String },
    razorpay_signature: { type: String },
    amount: { type: Number },
    currency: { type: String },
    method: { type: String },
    paidAt: { type: Date }
  },
  paymentFailureReason: { type: String },
  paymentFailureCode: { type: String },
  
  // Escrow fields (for advanced payment protection)
  escrowStatus: {
    type: String,
    enum: ['none', 'active', 'released', 'disputed'],
    default: 'none'
  },
  escrowCreatedAt: { type: Date },
  escrowReleasedAt: { type: Date },
  
  // Progress tracking
  progressNotes: { type: String, maxlength: 1000 },
  approvedDate: { type: Date }
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