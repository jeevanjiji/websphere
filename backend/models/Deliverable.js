const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone' // Optional - deliverable can be linked to a milestone
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
  type: {
    type: String,
    enum: ['file', 'link', 'text', 'code', 'design', 'document', 'other'],
    required: true
  },
  
  // Submission details
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionDate: { type: Date, default: Date.now },
  submissionNotes: { type: String, maxlength: 1000 },
  
  // Content based on type
  content: {
    // For file type
    files: [{
      filename: { type: String },
      originalName: { type: String },
      url: { type: String },
      size: { type: Number },
      mimeType: { type: String },
      downloadCount: { type: Number, default: 0 }
    }],
    
    // For link type
    links: [{
      url: { type: String },
      title: { type: String },
      description: { type: String }
    }],
    
    // For text/code type
    textContent: { type: String },
    
    // For any additional metadata
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Review and approval
  status: {
    type: String,
    enum: ['submitted', 'under-review', 'revision-requested', 'approved', 'rejected'],
    default: 'submitted'
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: { type: Date },
  reviewNotes: { type: String, maxlength: 1000 },
  
  // Revision tracking
  revisionCount: { type: Number, default: 0 },
  revisionHistory: [{
    version: { type: Number, required: true },
    submissionDate: { type: Date, default: Date.now },
    changes: { type: String },
    files: [{
      filename: String,
      url: String,
      size: Number
    }]
  }],
  
  // Quality assessment
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  qualityNotes: { type: String, maxlength: 500 },
  
  // Timeline
  dueDate: { type: Date },
  completedDate: { type: Date },
  
  // Tags for organization
  tags: [{ type: String, trim: true }],
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Visibility
  isPublic: { type: Boolean, default: false }, // Can be shown in portfolio
  
  // Download tracking
  downloads: [{
    downloadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    downloadDate: { type: Date, default: Date.now },
    filename: { type: String },
    ipAddress: { type: String }
  }]
}, {
  timestamps: true
});

// Indexes
deliverableSchema.index({ workspace: 1, submissionDate: -1 });
deliverableSchema.index({ submittedBy: 1 });
deliverableSchema.index({ status: 1 });
deliverableSchema.index({ milestone: 1 });
deliverableSchema.index({ type: 1 });
deliverableSchema.index({ tags: 1 });

// Virtual for latest version
deliverableSchema.virtual('latestVersion').get(function() {
  if (!this.revisionHistory || this.revisionHistory.length === 0) return 1;
  return Math.max(...this.revisionHistory.map(rev => rev.version)) + 1;
});

// Virtual for total file size
deliverableSchema.virtual('totalSize').get(function() {
  if (!this.content.files) return 0;
  return this.content.files.reduce((total, file) => total + (file.size || 0), 0);
});

// Virtual for download count
deliverableSchema.virtual('totalDownloads').get(function() {
  return this.downloads ? this.downloads.length : 0;
});

// Ensure virtual fields are serialized
deliverableSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Deliverable', deliverableSchema);