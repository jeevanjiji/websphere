// Create overdue deliverable notifications for testing
const mongoose = require('mongoose');
require('dotenv').config();

const Milestone = require('./models/Milestone');
const Notification = require('./models/Notification');
const Workspace = require('./models/Workspace');
const User = require('./models/User');
const Project = require('./models/Project');

async function createOverdueNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔄 Creating overdue deliverable notifications...');

    const milestone = await Milestone.findById('68d4c57c8b0087370b5e3328')
      .populate({
        path: 'workspace',
        populate: [
          { path: 'freelancer', model: 'User' },
          { path: 'client', model: 'User' },
          { path: 'project', model: 'Project' }
        ]
      });

    if (!milestone) {
      console.log('❌ Milestone not found');
      return;
    }

    const freelancer = milestone.workspace.freelancer;
    const project = milestone.workspace.project;
    const daysOverdue = Math.floor((new Date() - new Date(milestone.dueDate)) / (1000 * 60 * 60 * 24));

    console.log(`📋 Milestone: ${milestone.title}`);
    console.log(`⏰ Days overdue: ${daysOverdue}`);
    console.log(`👤 Freelancer: ${freelancer.fullName}`);

    // Create multiple notifications for different days overdue
    const notifications = [
      {
        userId: freelancer._id,
        userRole: 'freelancer',
        type: 'deliverable-overdue',
        title: '🚨 Deliverable Overdue',
        body: `Your deliverable for "${milestone.title}" is now overdue. Please submit as soon as possible.`,
        data: {
          workspaceId: milestone.workspace._id,
          milestoneId: milestone._id,
          projectId: project._id,
          extraData: { daysOverdue: 1 }
        },
        createdAt: new Date(Date.now() - (20 * 24 * 60 * 60 * 1000)) // 20 days ago
      },
      {
        userId: freelancer._id,
        userRole: 'freelancer',
        type: 'deliverable-overdue',
        title: '⚠️ Deliverable Still Overdue (5 days)',
        body: `Your deliverable for "${milestone.title}" has been overdue for 5 days. Immediate action required.`,
        data: {
          workspaceId: milestone.workspace._id,
          milestoneId: milestone._id,
          projectId: project._id,
          extraData: { daysOverdue: 5 }
        },
        createdAt: new Date(Date.now() - (16 * 24 * 60 * 60 * 1000)) // 16 days ago
      },
      {
        userId: freelancer._id,
        userRole: 'freelancer',
        type: 'deliverable-overdue',
        title: '🔥 Critical: Deliverable Overdue (10 days)',
        body: `URGENT: Your deliverable for "${milestone.title}" has been overdue for 10 days. Please contact the client immediately.`,
        data: {
          workspaceId: milestone.workspace._id,
          milestoneId: milestone._id,
          projectId: project._id,
          extraData: { daysOverdue: 10 }
        },
        createdAt: new Date(Date.now() - (11 * 24 * 60 * 60 * 1000)) // 11 days ago
      },
      {
        userId: freelancer._id,
        userRole: 'freelancer',
        type: 'deliverable-overdue',
        title: '🚨 Final Notice: Deliverable Overdue (15 days)',
        body: `FINAL NOTICE: Your deliverable for "${milestone.title}" has been overdue for 15 days. This may affect your rating.`,
        data: {
          workspaceId: milestone.workspace._id,
          milestoneId: milestone._id,
          projectId: project._id,
          extraData: { daysOverdue: 15 }
        },
        createdAt: new Date(Date.now() - (6 * 24 * 60 * 60 * 1000)) // 6 days ago
      },
      {
        userId: freelancer._id,
        userRole: 'freelancer',
        type: 'deliverable-overdue',
        title: '⏰ Daily Reminder: Deliverable Overdue (21 days)',
        body: `Daily reminder: Your deliverable for "${milestone.title}" is now 21 days overdue. Please submit immediately.`,
        data: {
          workspaceId: milestone.workspace._id,
          milestoneId: milestone._id,
          projectId: project._id,
          extraData: { daysOverdue: 21 }
        },
        createdAt: new Date() // Today
      }
    ];

    // Clear existing notifications for this milestone
    await Notification.deleteMany({
      userId: freelancer._id,
      'data.milestoneId': milestone._id
    });

    // Insert new notifications
    await Notification.insertMany(notifications);
    
    console.log(`✅ Created ${notifications.length} overdue notifications`);
    console.log('📧 Notifications created:');
    notifications.forEach(n => {
      console.log(`  - ${n.title} (${n.data.extraData.daysOverdue} days overdue)`);
    });

    await mongoose.disconnect();
    console.log('✨ Overdue notifications created successfully!');

  } catch (error) {
    console.error('❌ Error creating notifications:', error);
    process.exit(1);
  }
}

createOverdueNotifications();