const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
      maxlength: 2000
    },
    proposedRate: {
      type: Number,
      required: true,
      min: 0
    },
    proposedTimeline: {
      type: String,
      required: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'awarded'],
      default: 'pending'
    },
    // Additional proposal details
    attachments: [String], // Cloudinary URLs for portfolios, etc.
    experience: {
      type: String,
      maxlength: 1000
    },
    questions: {
      type: String,
      maxlength: 1000
    },
    // Tracking fields
    viewedByClient: {
      type: Boolean,
      default: false
    },
    viewedAt: Date,
    respondedAt: Date
  },
  { 
    timestamps: true 
  }
);

// Compound index to ensure one application per freelancer per project
applicationSchema.index({ project: 1, freelancer: 1 }, { unique: true });

// Index for querying applications
applicationSchema.index({ client: 1, status: 1 });
applicationSchema.index({ freelancer: 1, status: 1 });
applicationSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
