const mongoose = require('mongoose');

const workspaceFileSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String // Cloudinary public ID for deletion
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['document', 'image', 'video', 'audio', 'archive', 'code', 'other'],
    default: 'other'
  },
  
  // Upload details
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // Organization
  folder: {
    type: String,
    default: 'root'
  },
  tags: [{ type: String, trim: true }],
  description: {
    type: String,
    maxlength: 500
  },
  
  // Access control
  permissions: {
    client: {
      canView: { type: Boolean, default: true },
      canDownload: { type: Boolean, default: true },
      canDelete: { type: Boolean, default: false }
    },
    freelancer: {
      canView: { type: Boolean, default: true },
      canDownload: { type: Boolean, default: true },
      canDelete: { type: Boolean, default: false }
    }
  },
  
  // File metadata
  metadata: {
    width: Number, // For images
    height: Number, // For images
    duration: Number, // For videos/audio
    pages: Number, // For documents
    version: { type: String, default: '1.0' },
    lastModified: Date
  },
  
  // Version control
  isLatestVersion: { type: Boolean, default: true },
  parentFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceFile'
  },
  versionHistory: [{
    version: String,
    uploadDate: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    url: String,
    size: Number
  }],
  
  // Activity tracking
  downloads: [{
    downloadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    downloadDate: { type: Date, default: Date.now },
    ipAddress: String
  }],
  views: [{
    viewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewDate: { type: Date, default: Date.now }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  
  // Sharing
  isShared: { type: Boolean, default: false },
  shareUrl: String,
  shareExpiry: Date,
  
  // Comments
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
workspaceFileSchema.index({ workspace: 1, uploadedAt: -1 });
workspaceFileSchema.index({ uploadedBy: 1 });
workspaceFileSchema.index({ category: 1 });
workspaceFileSchema.index({ folder: 1 });
workspaceFileSchema.index({ status: 1 });
workspaceFileSchema.index({ tags: 1 });

// Virtual for download count
workspaceFileSchema.virtual('downloadCount').get(function() {
  return this.downloads ? this.downloads.length : 0;
});

// Virtual for view count
workspaceFileSchema.virtual('viewCount').get(function() {
  return this.views ? this.views.length : 0;
});

// Virtual for formatted file size
workspaceFileSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Ensure virtual fields are serialized
workspaceFileSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to categorize files
workspaceFileSchema.pre('save', function(next) {
  if (this.mimeType) {
    if (this.mimeType.startsWith('image/')) {
      this.category = 'image';
    } else if (this.mimeType.startsWith('video/')) {
      this.category = 'video';
    } else if (this.mimeType.startsWith('audio/')) {
      this.category = 'audio';
    } else if (this.mimeType.includes('pdf') || this.mimeType.includes('document') || this.mimeType.includes('text')) {
      this.category = 'document';
    } else if (this.mimeType.includes('zip') || this.mimeType.includes('rar') || this.mimeType.includes('tar')) {
      this.category = 'archive';
    } else if (this.mimeType.includes('javascript') || this.mimeType.includes('json') || this.originalName.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css)$/i)) {
      this.category = 'code';
    }
  }
  next();
});

module.exports = mongoose.model('WorkspaceFile', workspaceFileSchema);