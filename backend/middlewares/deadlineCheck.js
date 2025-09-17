const Milestone = require('../models/Milestone');
const User = require('../models/User');
const { sendEmail } = require('../utils/brevoEmailService');

/**
 * Middleware to check for overdue milestones and send notifications
 */
const checkMilestoneDeadlines = async () => {
  try {
    const now = new Date();
    
    // Check for overdue delivery deadlines
    const overdueDeliveries = await Milestone.find({
      dueDate: { $lt: now },
      status: { $in: ['pending', 'in-progress'] },
      isOverdue: false
    }).populate('workspace');

    for (const milestone of overdueDeliveries) {
      // Mark as overdue
      milestone.isOverdue = true;
      milestone.deliveryStatus = 'overdue';
      
      if (!milestone.overdueNotificationSent) {
        // Send notification to freelancer
        const workspace = milestone.workspace;
        const freelancer = await User.findById(workspace.freelancer);
        
        if (freelancer) {
          await sendEmail({
            to: freelancer.email,
            subject: 'Milestone Delivery Overdue',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Milestone Delivery Overdue</h2>
                <p>Dear ${freelancer.name},</p>
                <p>The following milestone is now overdue:</p>
                <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="color: #dc2626; margin: 0 0 10px 0;">${milestone.title}</h3>
                  <p><strong>Due Date:</strong> ${milestone.dueDate.toDateString()}</p>
                  <p><strong>Amount:</strong> ₹${milestone.amount}</p>
                </div>
                <p><strong>Next Steps:</strong></p>
                <ul>
                  <li>Complete and submit the milestone immediately</li>
                  <li>If you need an extension, contact the client as soon as possible</li>
                  <li>Note: Extended delays may affect your freelancer rating</li>
                </ul>
                <p>Please log in to your dashboard to update the milestone status.</p>
              </div>
            `
          });
        }
        
        milestone.overdueNotificationSent = true;
      }
      
      await milestone.save();
    }

    // Check for overdue payment deadlines
    const overduePayments = await Milestone.find({
      paymentDueDate: { $lt: now },
      status: 'approved',
      paymentStatus: { $in: ['not-due', 'due'] }
    }).populate('workspace');

    for (const milestone of overduePayments) {
      // Mark payment as overdue
      milestone.paymentStatus = 'overdue';
      milestone.status = 'payment-overdue';
      
      // Send reminder to client (limit to 3 reminders)
      if (milestone.paymentRemindersSent < 3) {
        const workspace = milestone.workspace;
        const client = await User.findById(workspace.client);
        
        if (client) {
          await sendEmail({
            to: client.email,
            subject: 'Payment Due: Milestone Payment Overdue',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Payment Overdue Notice</h2>
                <p>Dear ${client.name},</p>
                <p>Payment for the following milestone is now overdue:</p>
                <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="color: #dc2626; margin: 0 0 10px 0;">${milestone.title}</h3>
                  <p><strong>Payment Due Date:</strong> ${milestone.paymentDueDate.toDateString()}</p>
                  <p><strong>Amount Due:</strong> ₹${milestone.amount}</p>
                </div>
                <p><strong>Important:</strong> Please make the payment immediately to maintain project timeline and avoid delays.</p>
                <p>Log in to your dashboard to complete the payment.</p>
                <div style="margin: 20px 0;">
                  <a href="${process.env.FRONTEND_URL}/dashboard" 
                     style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Make Payment Now
                  </a>
                </div>
              </div>
            `
          });
        }
        
        milestone.paymentRemindersSent += 1;
      }
      
      await milestone.save();
    }

    // Check for at-risk milestones (due within 2 days)
    const twodays = new Date();
    twodays.setDate(twodays.getDate() + 2);
    
    const atRiskMilestones = await Milestone.find({
      dueDate: { $gte: now, $lte: twodays },
      status: { $in: ['pending', 'in-progress'] },
      deliveryStatus: 'on-time'
    }).populate('workspace');

    for (const milestone of atRiskMilestones) {
      milestone.deliveryStatus = 'at-risk';
      await milestone.save();
    }

    console.log(`✅ Deadline check completed: ${overdueDeliveries.length} overdue deliveries, ${overduePayments.length} overdue payments`);
    
  } catch (error) {
    console.error('❌ Error in deadline check:', error);
  }
};

/**
 * Schedule deadline checks to run every hour
 */
const startDeadlineChecker = () => {
  // Run immediately
  checkMilestoneDeadlines();
  
  // Run every hour
  setInterval(checkMilestoneDeadlines, 60 * 60 * 1000);
  
  console.log('🕒 Milestone deadline checker started (runs every hour)');
};

module.exports = {
  checkMilestoneDeadlines,
  startDeadlineChecker
};