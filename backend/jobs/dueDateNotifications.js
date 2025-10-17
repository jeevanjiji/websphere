// backend/jobs/dueDateNotifications.js
const Milestone = require('../models/Milestone');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/brevoEmailService');
const webpush = require('web-push');

class DueDateNotificationJob {
  /**
   * Check and send notifications for upcoming and overdue deadlines
   * Should be run daily via cron job
   */
  static async checkAndNotify() {
    console.log('🔔 Starting due date notification check...');
    
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      
      // Find milestones that need notifications
      const milestones = await Milestone.find({
        status: { $in: ['pending', 'in-progress', 'approved'] }
      }).populate({
        path: 'workspace',
        populate: [
          { path: 'client', model: 'User' },
          { path: 'freelancer', model: 'User' },
          { path: 'project', model: 'Project' }
        ]
      });

      let notificationsSent = 0;

      for (const milestone of milestones) {
        if (!milestone.workspace) continue;

        // Check deliverable due date (for freelancer)
        await this.checkDeliverableDueDate(milestone, now, oneDayFromNow, threeDaysFromNow);
        
        // Check payment due date (for client)
        await this.checkPaymentDueDate(milestone, now, oneDayFromNow, threeDaysFromNow);
        
        notificationsSent++;
      }

      console.log(`✅ Due date notification check complete. Processed ${notificationsSent} milestones.`);
      return { success: true, processed: notificationsSent };

    } catch (error) {
      console.error('❌ Error in due date notification job:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check deliverable due dates and notify freelancers
   */
  static async checkDeliverableDueDate(milestone, now, oneDayFromNow, threeDaysFromNow) {
    const dueDate = new Date(milestone.dueDate);
    const freelancer = milestone.workspace.freelancer;
    const client = milestone.workspace.client;
    const project = milestone.workspace.project;

    if (!freelancer || !project) return;

    // Check if milestone is overdue (including approved milestones with no deliverable)
    if (dueDate < now && (milestone.status === 'in-progress' || milestone.status === 'approved')) {
      const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
      
      // Send daily overdue notifications for critical stages
      if (daysOverdue >= 1 && (!milestone.lastOverdueNotificationSent || 
          this.shouldSendDailyOverdueNotification(milestone.lastOverdueNotificationSent, daysOverdue))) {
        await this.sendDeliverableOverdueNotification(milestone, freelancer, client, project, daysOverdue);
        milestone.overdueNotificationSent = true;
        milestone.isOverdue = true;
        milestone.lastOverdueNotificationSent = new Date();
        await milestone.save();
      }
    }
    // Check if due tomorrow
    else if (dueDate < oneDayFromNow && dueDate > now && !milestone.deliverableReminderSent) {
      await this.sendDeliverable1DayReminder(milestone, freelancer, client, project);
      milestone.deliverableReminderSent = true;
      await milestone.save();
    }
    // Check if due in 3 days
    else if (dueDate < threeDaysFromNow && dueDate > oneDayFromNow && !milestone.deliverableReminderSent) {
      await this.sendDeliverable3DayReminder(milestone, freelancer, client, project);
      milestone.deliverableReminderSent = true;
      await milestone.save();
    }
  }

  /**
   * Determine if we should send a daily overdue notification
   */
  static shouldSendDailyOverdueNotification(lastSent, daysOverdue) {
    if (!lastSent) return true;
    
    const hoursSinceLastNotification = (new Date() - lastSent) / (1000 * 60 * 60);
    
    // Send notifications based on urgency:
    // Days 1-3: Once per day (24 hours)
    // Days 4-7: Twice per day (12 hours)  
    // Days 8-14: Every 8 hours
    // Days 15+: Every 6 hours (critical)
    
    if (daysOverdue <= 3) return hoursSinceLastNotification >= 24;
    if (daysOverdue <= 7) return hoursSinceLastNotification >= 12;
    if (daysOverdue <= 14) return hoursSinceLastNotification >= 8;
    return hoursSinceLastNotification >= 6; // Critical overdue
  }

  /**
   * Check payment due dates and notify clients
   */
  static async checkPaymentDueDate(milestone, now, oneDayFromNow, threeDaysFromNow) {
    const paymentDueDate = new Date(milestone.paymentDueDate);
    const client = milestone.workspace.client;
    const freelancer = milestone.workspace.freelancer;
    const project = milestone.workspace.project;

    if (!client || !project) return;

    // Only check for approved milestones that haven't been paid
    if (milestone.status !== 'approved' || milestone.paymentStatus === 'completed') return;

    // Check if payment is overdue
    if (paymentDueDate < now && !milestone.paymentOverdueNotificationSent) {
      await this.sendPaymentOverdueNotification(milestone, client, freelancer, project);
      milestone.paymentOverdueNotificationSent = true;
      await milestone.save();
    }
    // Check if payment due tomorrow
    else if (paymentDueDate < oneDayFromNow && paymentDueDate > now && !milestone.paymentReminderSent) {
      await this.sendPayment1DayReminder(milestone, client, freelancer, project);
      milestone.paymentReminderSent = true;
      await milestone.save();
    }
    // Check if payment due in 3 days
    else if (paymentDueDate < threeDaysFromNow && paymentDueDate > oneDayFromNow && !milestone.paymentReminderSent) {
      await this.sendPayment3DayReminder(milestone, client, freelancer, project);
      milestone.paymentReminderSent = true;
      await milestone.save();
    }
  }

  /**
   * Send 3-day deliverable reminder to freelancer
   */
  static async sendDeliverable3DayReminder(milestone, freelancer, client, project) {
    const title = `📅 Reminder: Deliverable Due in 3 Days`;
    const message = `Your deliverable for "${milestone.title}" is due in 3 days (${new Date(milestone.dueDate).toLocaleDateString()}).`;
    
    console.log(`📧 Sending 3-day deliverable reminder to ${freelancer.email}`);
    
    // Save to database for notification center
    await this.saveNotificationToDatabase(
      freelancer,
      'deliverable-reminder',
      title,
      message,
      {
        workspaceId: milestone.workspace._id,
        milestoneId: milestone._id,
        projectId: project._id,
        extraData: { daysRemaining: 3 }
      }
    );
    
    // Send email
    if (freelancer.notificationPreferences?.email !== false) {
      await this.sendEmailNotification(
        freelancer,
        title,
        message,
        milestone,
        project,
        'deliverable',
        '3-day'
      );
    }

    // Send push notification
    if (freelancer.notificationPreferences?.push !== false && freelancer.pushSubscription) {
      await this.sendPushNotification(
        freelancer,
        title,
        message,
        {
          type: 'deliverable_reminder',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString(),
          daysRemaining: 3
        }
      );
    }
  }

  /**
   * Send 1-day deliverable reminder to freelancer
   */
  static async sendDeliverable1DayReminder(milestone, freelancer, client, project) {
    const title = `⚠️ Urgent: Deliverable Due Tomorrow`;
    const message = `Your deliverable for "${milestone.title}" is due tomorrow! Please submit your work soon.`;
    
    console.log(`📧 Sending 1-day deliverable reminder to ${freelancer.email}`);
    
    // Save to database for notification center
    await this.saveNotificationToDatabase(
      freelancer,
      'deliverable-reminder',
      title,
      message,
      {
        workspaceId: milestone.workspace._id,
        milestoneId: milestone._id,
        projectId: project._id,
        extraData: { daysRemaining: 1 }
      }
    );
    
    // Send email
    if (freelancer.notificationPreferences?.email !== false) {
      await this.sendEmailNotification(
        freelancer,
        title,
        message,
        milestone,
        project,
        'deliverable',
        '1-day'
      );
    }

    // Send push notification
    if (freelancer.notificationPreferences?.push !== false && freelancer.pushSubscription) {
      await this.sendPushNotification(
        freelancer,
        title,
        message,
        {
          type: 'deliverable_reminder',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString(),
          daysRemaining: 1,
          urgent: true
        }
      );
    }
  }

  /**
   * Send overdue deliverable notification to freelancer with escalating urgency
   */
  static async sendDeliverableOverdueNotification(milestone, freelancer, client, project, daysOverdue = 1) {
    let title, urgencyLevel, emoji;
    
    // Escalate notification urgency based on days overdue
    if (daysOverdue === 1) {
      title = '🚨 Deliverable Overdue';
      urgencyLevel = 'First Day Overdue';
      emoji = '🚨';
    } else if (daysOverdue <= 3) {
      title = `⚠️ Deliverable Still Overdue (${daysOverdue} days)`;
      urgencyLevel = 'Early Overdue';
      emoji = '⚠️';
    } else if (daysOverdue <= 7) {
      title = `� Critical: Deliverable Overdue (${daysOverdue} days)`;
      urgencyLevel = 'Critical Overdue';
      emoji = '🔥';
    } else if (daysOverdue <= 14) {
      title = `🚨 Final Notice: Deliverable Overdue (${daysOverdue} days)`;
      urgencyLevel = 'Final Notice';
      emoji = '🚨';
    } else {
      title = `⏰ Daily Reminder: Deliverable Overdue (${daysOverdue} days)`;
      urgencyLevel = 'Extended Overdue';
      emoji = '⏰';
    }

    const message = `${emoji} Your deliverable for "${milestone.title}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue! Please submit immediately or contact the client.`;
    
    console.log(`📧 Sending ${urgencyLevel} notification to ${freelancer.email} (${daysOverdue} days overdue)`);
    
    // Save to database for notification center
    await this.saveNotificationToDatabase(
      freelancer,
      'deliverable-overdue',
      title,
      message,
      {
        workspaceId: milestone.workspace._id,
        milestoneId: milestone._id,
        projectId: project._id,
        daysOverdue: daysOverdue,
        urgencyLevel: urgencyLevel
      }
    );
    
    // Send email
    if (freelancer.notificationPreferences?.email !== false) {
      await this.sendEmailNotification(
        freelancer,
        title,
        message,
        milestone,
        project,
        'deliverable',
        'overdue'
      );
    }

    // Send push notification
    if (freelancer.notificationPreferences?.push !== false && freelancer.pushSubscription) {
      await this.sendPushNotification(
        freelancer,
        title,
        message,
        {
          type: 'deliverable_overdue',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString(),
          urgent: true,
          requireInteraction: true
        }
      );
    }

    // Also notify client about overdue deliverable
    if (client) {
      const clientTitle = `📊 Project Update: Deliverable Overdue`;
      const clientMessage = `The deliverable for "${milestone.title}" from ${freelancer.fullName} is now overdue.`;
      
      await this.saveNotificationToDatabase(
        client,
        'deliverable-overdue',
        clientTitle,
        clientMessage,
        {
          workspaceId: milestone.workspace._id,
          milestoneId: milestone._id,
          projectId: project._id
        }
      );
      
      await this.sendPushNotification(
        client,
        clientTitle,
        clientMessage,
        {
          type: 'deliverable_overdue_client',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString()
        }
      );
    }
  }

  /**
   * Send 3-day payment reminder to client
   */
  static async sendPayment3DayReminder(milestone, client, freelancer, project) {
    const title = `💳 Reminder: Payment Due in 3 Days`;
    const message = `Payment for milestone "${milestone.title}" is due in 3 days (${new Date(milestone.paymentDueDate).toLocaleDateString()}). Amount: ₹${milestone.amount}`;
    
    console.log(`📧 Sending 3-day payment reminder to ${client.email}`);
    
    // Save to database for notification center
    await this.saveNotificationToDatabase(
      client,
      'payment-reminder',
      title,
      message,
      {
        workspaceId: milestone.workspace._id,
        milestoneId: milestone._id,
        projectId: project._id,
        extraData: { amount: milestone.amount, daysRemaining: 3 }
      }
    );
    
    // Send email
    if (client.notificationPreferences?.email !== false) {
      await this.sendEmailNotification(
        client,
        title,
        message,
        milestone,
        project,
        'payment',
        '3-day'
      );
    }

    // Send push notification
    if (client.notificationPreferences?.push !== false && client.pushSubscription) {
      await this.sendPushNotification(
        client,
        title,
        message,
        {
          type: 'payment_reminder',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString(),
          amount: milestone.amount,
          daysRemaining: 3
        }
      );
    }
  }

  /**
   * Send 1-day payment reminder to client
   */
  static async sendPayment1DayReminder(milestone, client, freelancer, project) {
    const title = `⚠️ Urgent: Payment Due Tomorrow`;
    const message = `Payment for milestone "${milestone.title}" is due tomorrow! Amount: ₹${milestone.amount}. Please process the payment soon.`;
    
    console.log(`📧 Sending 1-day payment reminder to ${client.email}`);
    
    // Save to database for notification center
    await this.saveNotificationToDatabase(
      client,
      'payment-reminder',
      title,
      message,
      {
        workspaceId: milestone.workspace._id,
        milestoneId: milestone._id,
        projectId: project._id,
        extraData: { amount: milestone.amount, daysRemaining: 1 }
      }
    );
    
    // Send email
    if (client.notificationPreferences?.email !== false) {
      await this.sendEmailNotification(
        client,
        title,
        message,
        milestone,
        project,
        'payment',
        '1-day'
      );
    }

    // Send push notification
    if (client.notificationPreferences?.push !== false && client.pushSubscription) {
      await this.sendPushNotification(
        client,
        title,
        message,
        {
          type: 'payment_reminder',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString(),
          amount: milestone.amount,
          daysRemaining: 1,
          urgent: true
        }
      );
    }
  }

  /**
   * Send overdue payment notification to client
   */
  static async sendPaymentOverdueNotification(milestone, client, freelancer, project) {
    const title = `🚨 Overdue: Payment Past Due Date`;
    const message = `Payment for milestone "${milestone.title}" is now overdue! Amount: ₹${milestone.amount}. Please process payment immediately.`;
    
    console.log(`📧 Sending overdue payment notification to ${client.email}`);
    
    // Save to database for notification center
    await this.saveNotificationToDatabase(
      client,
      'payment-overdue',
      title,
      message,
      {
        workspaceId: milestone.workspace._id,
        milestoneId: milestone._id,
        projectId: project._id,
        extraData: { amount: milestone.amount }
      }
    );
    
    // Send email
    if (client.notificationPreferences?.email !== false) {
      await this.sendEmailNotification(
        client,
        title,
        message,
        milestone,
        project,
        'payment',
        'overdue'
      );
    }

    // Send push notification
    if (client.notificationPreferences?.push !== false && client.pushSubscription) {
      await this.sendPushNotification(
        client,
        title,
        message,
        {
          type: 'payment_overdue',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString(),
          amount: milestone.amount,
          urgent: true,
          requireInteraction: true
        }
      );
    }

    // Also notify freelancer about overdue payment
    if (freelancer) {
      const freelancerTitle = `📊 Project Update: Payment Overdue`;
      const freelancerMessage = `The payment for "${milestone.title}" from ${client.fullName} is now overdue.`;
      
      await this.saveNotificationToDatabase(
        freelancer,
        'payment-overdue',
        freelancerTitle,
        freelancerMessage,
        {
          workspaceId: milestone.workspace._id,
          milestoneId: milestone._id,
          projectId: project._id,
          extraData: { amount: milestone.amount }
        }
      );
      
      await this.sendPushNotification(
        freelancer,
        freelancerTitle,
        freelancerMessage,
        {
          type: 'payment_overdue_freelancer',
          milestoneId: milestone._id.toString(),
          workspaceId: milestone.workspace._id.toString(),
          amount: milestone.amount
        }
      );
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(user, title, message, milestone, project, type, urgency) {
    const urgencyColors = {
      '3-day': { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
      '1-day': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      'overdue': { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' }
    };

    const colors = urgencyColors[urgency] || urgencyColors['3-day'];
    const isDeliverable = type === 'deliverable';
    const workspaceUrl = `${process.env.FRONTEND_URL}/workspace/${milestone.workspace._id}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">WebSphere</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Project Management Platform</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
            <h2 style="margin: 0 0 10px 0; color: ${colors.text}; font-size: 20px;">${title}</h2>
            <p style="margin: 0; color: ${colors.text}; font-size: 16px;">${message}</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 18px;">
              ${isDeliverable ? '📦 Deliverable' : '💳 Payment'} Details
            </h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Project:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${project.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Milestone:</td>
                <td style="padding: 8px 0; color: #111827;">${milestone.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">
                  ${isDeliverable ? 'Due Date:' : 'Payment Due:'}
                </td>
                <td style="padding: 8px 0; color: #111827;">
                  ${new Date(isDeliverable ? milestone.dueDate : milestone.paymentDueDate).toLocaleDateString('en-IN', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Amount:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">₹${milestone.amount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
                <td style="padding: 8px 0;">
                  <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                    ${milestone.status}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          ${isDeliverable ? `
            <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
              <h4 style="margin: 0 0 10px 0; color: #065f46;">💡 Quick Tips</h4>
              <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                <li style="margin: 5px 0;">Ensure all deliverables are complete and tested</li>
                <li style="margin: 5px 0;">Upload files to the workspace before the deadline</li>
                <li style="margin: 5px 0;">Add detailed notes about your submission</li>
                <li style="margin: 5px 0;">Notify the client once submitted</li>
              </ul>
            </div>
          ` : `
            <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #10b981;">
              <h4 style="margin: 0 0 10px 0; color: #065f46;">💡 Payment Options</h4>
              <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                <li style="margin: 5px 0;">UPI (Instant payment)</li>
                <li style="margin: 5px 0;">Credit/Debit Card</li>
                <li style="margin: 5px 0;">Net Banking</li>
                <li style="margin: 5px 0;">Digital Wallets</li>
              </ul>
            </div>
          `}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${workspaceUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              ${isDeliverable ? '📦 Submit Deliverable' : '💳 Process Payment'}
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
              Need help? Contact support at <a href="mailto:support@websphere.com" style="color: #667eea;">support@websphere.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
              You're receiving this email because you're working on "${project.title}" on WebSphere.
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await sendEmail(user.email, title, html, user.fullName);
      console.log(`✅ Email sent to ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${user.email}:`, error.message);
    }
  }

  /**
   * Send push notification
   */
  static async sendPushNotification(user, title, body, data = {}) {
    if (!user.pushSubscription || !user.pushSubscription.endpoint) {
      console.log(`⏭️  No push subscription for user ${user.email}`);
      return;
    }

    try {
      const payload = JSON.stringify({
        title,
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: {
          ...data,
          url: data.workspaceId ? `/workspace/${data.workspaceId}` : '/dashboard',
          timestamp: Date.now()
        },
        requireInteraction: data.requireInteraction || false
      });

      await webpush.sendNotification(user.pushSubscription, payload);
      console.log(`✅ Push notification sent to ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to send push notification to ${user.email}:`, error.message);
      
      // If subscription is no longer valid, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`🗑️  Removing invalid push subscription for user ${user.email}`);
        await User.findByIdAndUpdate(user._id, {
          $unset: { pushSubscription: 1 }
        });
      }
    }
  }

  /**
   * Save notification to database for the notification center
   */
  static async saveNotificationToDatabase(user, type, title, body, data = {}) {
    try {
      await Notification.createNotification({
        userId: user._id,
        userRole: user.role,
        type,
        title,
        body,
        icon: '/logo192.png',
        data
      });
      console.log(`✅ Notification saved to database for ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to save notification to database:`, error.message);
    }
  }
}

module.exports = DueDateNotificationJob;
