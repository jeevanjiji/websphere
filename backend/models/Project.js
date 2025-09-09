const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: 5_000
    },
    skills: [{ type: String, trim: true }],
    
    // Budget
    budgetType: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed'
    },
    budgetAmount: {
      type: Number,
      min: 0
    },
    // Optional: Budget range for more flexibility
    budgetMin: { type: Number, min: 0 },
    budgetMax: { type: Number, min: 0 },
    
    deadline: Date,
    attachments: [String],
    
    // Project category and visual
    category: {
      type: String,
      enum: [
        'ui-ux-design',
        'frontend-development', 
        'backend-development',
        'mobile-app-development',
        'full-stack-development',
        'data-science',
        'digital-marketing',
        'graphic-design',
        'content-writing',
        'other'
      ]
    },
    categoryName: {
      type: String,
      trim: true
    },
    image: {
      type: String,
      trim: true
    },
    
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled', 'awarded'],
      default: 'open'
    },
    
    // Award tracking fields
    awardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    awardedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    },
    finalRate: {
      type: Number,
      min: 0
    },
    finalTimeline: {
      type: String,
      trim: true
    },
    awardedAt: {
      type: Date
    },
    
    // Optional future fields:
    // priority: {
    //   type: String,
    //   enum: ['low', 'medium', 'high'],
    //   default: 'medium'
    // },
    // proposalsCount: {
    //   type: Number,
    //   default: 0
    // },
    // viewsCount: {
    //   type: Number,
    //   default: 0
    // }
  },
  { timestamps: true }
);

// Add index for better query performance
projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ skills: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
