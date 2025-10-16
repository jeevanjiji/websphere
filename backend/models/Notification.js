const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['client', 'freelancer', 'admin'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['payment-reminder', 'deliverable-reminder', 'payment-overdue', 'deliverable-overdue', 'payment', 'message', 'project', 'milestone', 'system'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '/logo192.png'
  },
  data: {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace'
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone'
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    // Generic data field for additional info
    extraData: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userRole: 1, createdAt: -1 });

// Auto-delete old read notifications after 30 days
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static method to create notification
notificationSchema.statics.createNotification = async function({
  userId,
  userRole,
  type,
  title,
  body,
  icon,
  data
}) {
  return this.create({
    userId,
    userRole,
    type,
    title,
    body,
    icon,
    data
  });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
