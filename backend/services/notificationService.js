// backend/services/notificationService.js
const { sendEmail } = require('../utils/brevoEmailService');
const Milestone = require('../models/Milestone');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

class NotificationService {
  
  /**
   * Send milestone deadline reminder to freelancer
   */
  static async sendMilestoneDeadlineReminder(milestone) {
    try {
      const workspace = await Workspace.findById(milestone.workspace)
        .populate('freelancer', 'fullName email')
        .populate('client', 'fullName email')
        .populate('project', 'title');

      if (!workspace) {
        console.error('Workspace not found for milestone:', milestone._id);
        return;
      }

      const freelancer = workspace.freelancer;
      const client = workspace.client;
      const project = workspace.project;

      // Email to freelancer
      const freelancerSubject = `🚨 Milestone Deadline Today: ${milestone.title}`;
      const freelancerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⏰ Milestone Deadline Today</h2>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0; color: #dc2626;">Urgent: Deadline Today!</h3>
            <p style="margin: 8px 0 0 0;">Your milestone delivery is due today.</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Milestone Details</h3>
            <p><strong>Project:</strong> ${project.title}</p>
            <p><strong>Milestone:</strong> ${milestone.title}</p>
            <p><strong>Description:</strong> ${milestone.description}</p>
            <p><strong>Due Date:</strong> ${new Date(milestone.dueDate).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> ₹${milestone.amount}</p>
            <p><strong>Status:</strong> ${milestone.status}</p>
          </div>

          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1d4ed8;">📋 What You Need to Do:</h4>
            <ul style="margin: 8px 0;">
              <li>Complete all milestone requirements</li>
              <li>Upload your deliverables to the workspace</li>
              <li>Submit the milestone for client review</li>
              <li>Communicate any delays immediately</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/workspace/${workspace._id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Submit Deliverables Now
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If you need an extension, please contact ${client.fullName} immediately through the workspace chat.
          </p>
        </div>
      `;

      await sendEmail(
        freelancer.email,
        freelancerSubject,
        freelancerHtml,
        freelancer.fullName
      );

      console.log(`✅ Deadline reminder sent to freelancer: ${freelancer.email}`);
      return true;

    } catch (error) {
      console.error('Error sending milestone deadline reminder:', error);
      return false;
    }
  }

  /**
   * Send milestone deadline alert to client
   */
  static async sendClientMilestoneAlert(milestone) {
    try {
      const workspace = await Workspace.findById(milestone.workspace)
        .populate('freelancer', 'fullName email')
        .populate('client', 'fullName email')
        .populate('project', 'title');

      if (!workspace) {
        console.error('Workspace not found for milestone:', milestone._id);
        return;
      }

      const freelancer = workspace.freelancer;
      const client = workspace.client;
      const project = workspace.project;

      // Email to client
      const clientSubject = `📅 Milestone Due Today: ${milestone.title}`;
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📅 Milestone Deadline Today</h2>
          
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0; color: #2563eb;">Milestone Due Today</h3>
            <p style="margin: 8px 0 0 0;">A milestone in your project is due today.</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Milestone Details</h3>
            <p><strong>Project:</strong> ${project.title}</p>
            <p><strong>Milestone:</strong> ${milestone.title}</p>
            <p><strong>Freelancer:</strong> ${freelancer.fullName}</p>
            <p><strong>Due Date:</strong> ${new Date(milestone.dueDate).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> ₹${milestone.amount}</p>
            <p><strong>Status:</strong> ${milestone.status}</p>
          </div>

          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #16a34a;">✅ Next Steps:</h4>
            <ul style="margin: 8px 0;">
              <li>Check the workspace for deliverable submissions</li>
              <li>Review completed work once submitted</li>
              <li>Approve milestone if requirements are met</li>
              <li>Process payment upon approval</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/workspace/${workspace._id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Workspace
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            We've also notified ${freelancer.fullName} about this deadline.
          </p>
        </div>
      `;

      await sendEmail(
        client.email,
        clientSubject,
        clientHtml,
        client.fullName
      );

      console.log(`✅ Deadline alert sent to client: ${client.email}`);
      return true;

    } catch (error) {
      console.error('Error sending client milestone alert:', error);
      return false;
    }
  }

  /**
   * Send overdue milestone notification
   */
  static async sendOverdueMilestoneNotification(milestone) {
    try {
      const workspace = await Workspace.findById(milestone.workspace)
        .populate('freelancer', 'fullName email')
        .populate('client', 'fullName email')
        .populate('project', 'title');

      if (!workspace) return;

      const daysOverdue = Math.ceil((new Date() - new Date(milestone.dueDate)) / (1000 * 60 * 60 * 24));

      // Notify both client and freelancer
      const freelancerSubject = `🚨 OVERDUE: Milestone ${daysOverdue} Days Late`;
      const freelancerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 Milestone Overdue</h2>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0; color: #dc2626;">Urgent Action Required</h3>
            <p style="margin: 8px 0 0 0;">This milestone is ${daysOverdue} days overdue.</p>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Milestone:</strong> ${milestone.title}</p>
            <p><strong>Original Due Date:</strong> ${new Date(milestone.dueDate).toLocaleDateString()}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/workspace/${workspace._id}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Submit Now
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Please submit your deliverables immediately or contact the client to discuss timeline.
          </p>
        </div>
      `;

      await sendEmail(
        workspace.freelancer.email,
        freelancerSubject,
        freelancerHtml,
        workspace.freelancer.fullName
      );

      // Notify client too
      const clientSubject = `⚠️ Milestone Overdue: ${milestone.title}`;
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">⚠️ Milestone Overdue</h2>
          
          <p>The milestone "${milestone.title}" is ${daysOverdue} days overdue.</p>
          <p>We've notified ${workspace.freelancer.fullName} about this delay.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/workspace/${workspace._id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Check Workspace
            </a>
          </div>
        </div>
      `;

      await sendEmail(
        workspace.client.email,
        clientSubject,
        clientHtml,
        workspace.client.fullName
      );

      console.log(`✅ Overdue notifications sent for milestone: ${milestone._id}`);
      return true;

    } catch (error) {
      console.error('Error sending overdue milestone notification:', error);
      return false;
    }
  }

  /**
   * Check all milestones and send appropriate notifications
   */
  static async checkMilestoneDeadlines() {
    try {
      console.log('🔍 Checking milestone deadlines...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find milestones due today
      const milestonesDueToday = await Milestone.find({
        dueDate: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $in: ['pending', 'in_progress'] }
      });

      console.log(`📅 Found ${milestonesDueToday.length} milestones due today`);

      // Send notifications for milestones due today
      for (const milestone of milestonesDueToday) {
        await this.sendMilestoneDeadlineReminder(milestone);
        await this.sendClientMilestoneAlert(milestone);
      }

      // Find overdue milestones
      const overdueMilestones = await Milestone.find({
        dueDate: { $lt: today },
        status: { $in: ['pending', 'in_progress'] }
      });

      console.log(`⚠️ Found ${overdueMilestones.length} overdue milestones`);

      // Send overdue notifications (limit to avoid spam)
      for (const milestone of overdueMilestones) {
        const daysOverdue = Math.ceil((today - new Date(milestone.dueDate)) / (1000 * 60 * 60 * 24));
        
        // Send notification on 1st, 3rd, 7th day and then weekly
        if (daysOverdue === 1 || daysOverdue === 3 || daysOverdue === 7 || daysOverdue % 7 === 0) {
          await this.sendOverdueMilestoneNotification(milestone);
        }
      }

      console.log('✅ Milestone deadline check completed');
      
    } catch (error) {
      console.error('❌ Error checking milestone deadlines:', error);
    }
  }

}

module.exports = NotificationService;