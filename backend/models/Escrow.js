const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true,
    unique: true // One escrow per milestone
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
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
  
  // Financial details
  totalAmount: {
    type: Number,
    required: true,
    min: 0 // Total amount paid by client
  },
  milestoneAmount: {
    type: Number,
    required: true,
    min: 0 // Amount for the milestone work
  },
  serviceCharge: {
    type: Number,
    required: true,
    min: 0 // Platform service charge
  },
  serviceChargePercentage: {
    type: Number,
    default: 5,
    min: 0,
    max: 20
  },
  amountToFreelancer: {
    type: Number,
    required: true,
    min: 0 // Amount that will be released to freelancer
  },
  
  // Escrow status tracking
  status: {
    type: String,
    enum: ['pending', 'active', 'released', 'disputed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  
  // Payment tracking
  paymentId: {
    type: String,
    required: true // Razorpay order/payment ID
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Timeline tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: Date, // When payment was successful
  
  // Release conditions
  releaseConditions: {
    requiresDeliverable: {
      type: Boolean,
      default: true
    },
    requiresClientApproval: {
      type: Boolean,
      default: true
    },
    autoReleaseAfterDays: {
      type: Number,
      default: 7 // Auto-release after 7 days if no disputes
    }
  },
  
  // Release tracking
  deliverableSubmitted: {
    type: Boolean,
    default: false
  },
  deliverableSubmittedAt: Date,
  
  clientApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto-approved'],
    default: 'pending'
  },
  clientApprovedAt: Date,
  clientApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Admin release controls
  releasedAt: Date,
  releasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who released the funds
  },
  releaseReason: String, // Reason for release
  releaseNotes: String,
  
  // Dispute handling
  disputeRaised: {
    type: Boolean,
    default: false
  },
  disputeRaisedAt: Date,
  disputeRaisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disputeReason: String,
  disputeResolution: String,
  disputeResolvedAt: Date,
  disputeResolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who resolved dispute
  },
  
  // Refund tracking
  refundedAt: Date,
  refundedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who processed refund
  },
  refundReason: String,
  refundAmount: Number,
  
  // Notifications
  notificationsSent: {
    paymentReceived: { type: Boolean, default: false },
    deliverableSubmitted: { type: Boolean, default: false },
    approvalPending: { type: Boolean, default: false },
    fundsReleased: { type: Boolean, default: false },
    disputeRaised: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes
escrowSchema.index({ milestone: 1 }, { unique: true });
escrowSchema.index({ workspace: 1 });
escrowSchema.index({ client: 1, status: 1 });
escrowSchema.index({ freelancer: 1, status: 1 });
escrowSchema.index({ status: 1 });
escrowSchema.index({ createdAt: -1 });

// Virtual for calculating days since creation
escrowSchema.virtual('daysSinceCreation').get(function() {
  if (!this.createdAt) return 0;
  const now = new Date();
  const diffTime = now - this.createdAt;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for checking if auto-release is due
escrowSchema.virtual('isAutoReleaseDue').get(function() {
  if (this.status !== 'active' || this.disputeRaised) return false;
  if (!this.deliverableSubmitted) return false;
  
  // If client approved, release is due immediately
  if (this.clientApprovalStatus === 'approved') return true;
  
  // If rejected, don't auto-release
  if (this.clientApprovalStatus === 'rejected') return false;
  
  // For pending approval: auto-release after timeout from deliverable submission
  const referenceDate = this.deliverableSubmittedAt || this.activatedAt;
  if (!referenceDate) return false;
  
  const releaseDate = new Date(referenceDate);
  releaseDate.setDate(releaseDate.getDate() + this.releaseConditions.autoReleaseAfterDays);
  
  return new Date() >= releaseDate;
});

// Ensure virtual fields are serialized
escrowSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Escrow', escrowSchema);