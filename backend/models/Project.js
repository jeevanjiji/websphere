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
      trim: true,
      default: function() {
        // Set default images based on category
        const categoryImages = {
          'ui-ux-design': 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=400&h=250&fit=crop&crop=center',
          'frontend-development': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop&crop=center',
          'backend-development': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop&crop=center',
          'mobile-app-development': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop&crop=center',
          'full-stack-development': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&crop=center',
          'data-science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&crop=center',
          'digital-marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop&crop=center',
          'graphic-design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop&crop=center',
          'content-writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop&crop=center'
        };
        return categoryImages[this.category] || 'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=400&h=250&fit=crop&crop=center';
      }
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
    
    // Negotiation & agreed price
    agreedPrice: {
      type: Number,
      min: 0
    },
    priceLockedAt: {
      type: Date
    },
    priceLockedBy: {
      type: String,
      enum: ['offer_accepted', 'award', 'manual'],
    },
    negotiationHistory: [{
      offeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      offeredByRole: {
        type: String,
        enum: ['client', 'freelancer']
      },
      amount: Number,
      timeline: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined']
      },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: { type: Date, default: Date.now },
      respondedAt: Date
    }],
    
    // Service charges and platform fees
    serviceCharge: {
      type: Number,
      default: 500, // Default service charge in INR
      min: 0
    },
    serviceChargePercentage: {
      type: Number,
      default: 5, // 5% platform fee
      min: 0,
      max: 20
    },
    totalProjectValue: { // Total value including service charges
      type: Number,
      min: 0
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
