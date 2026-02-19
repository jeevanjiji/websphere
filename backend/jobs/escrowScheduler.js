const cron = require('node-cron');
const EscrowService = require('../services/escrowService');

class EscrowScheduler {
  static start() {
    console.log('🤖 Starting escrow scheduler...');

    // Run every 5 minutes to check for auto-releases (catches approved deliverables quickly)
    cron.schedule('*/5 * * * *', async () => {
      try {
        const releasedCount = await EscrowService.processAutoReleases();
        
        if (releasedCount > 0) {
          console.log(`✅ Auto-released ${releasedCount} escrows`);
        }
      } catch (error) {
        console.error('❌ Error in escrow auto-release scheduler:', error);
      }
    });

    // Run daily at midnight to send notifications
    cron.schedule('0 0 * * *', async () => {
      try {
        console.log('🔄 Running daily escrow notifications check...');
        await this.sendDailyNotifications();
      } catch (error) {
        console.error('❌ Error in daily notifications scheduler:', error);
      }
    });

    console.log('✅ Escrow scheduler started');
  }

  static async sendDailyNotifications() {
    const Escrow = require('../models/Escrow');
    
    try {
      // Find escrows that need attention
      const escrowsNeedingAttention = await Escrow.find({
        $or: [
          // Active escrows with deliverables submitted but not approved for 3+ days
          {
            status: 'active',
            deliverableSubmitted: true,
            clientApprovalStatus: 'pending',
            deliverableSubmittedAt: { 
              $lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) 
            }
          },
          // Active escrows approaching auto-release
          {
            status: 'active',
            deliverableSubmitted: true,
            clientApprovalStatus: 'approved',
            activatedAt: { 
              $lte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) 
            }
          },
          // Disputed escrows older than 7 days
          {
            status: 'disputed',
            disputeRaisedAt: { 
              $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
            }
          }
        ]
      }).populate('client freelancer milestone');

      // Group notifications by type
      const notifications = {
        clientApprovalReminder: [],
        autoReleaseReminder: [],
        disputeReminder: []
      };

      for (const escrow of escrowsNeedingAttention) {
        if (escrow.status === 'active' && escrow.deliverableSubmitted && escrow.clientApprovalStatus === 'pending') {
          notifications.clientApprovalReminder.push(escrow);
        } else if (escrow.status === 'active' && escrow.clientApprovalStatus === 'approved') {
          notifications.autoReleaseReminder.push(escrow);
        } else if (escrow.status === 'disputed') {
          notifications.disputeReminder.push(escrow);
        }
      }

      // Send notifications (integrate with your notification service)
      console.log('📧 Daily notification summary:');
      console.log(`   Client approval reminders: ${notifications.clientApprovalReminder.length}`);
      console.log(`   Auto-release reminders: ${notifications.autoReleaseReminder.length}`);
      console.log(`   Dispute reminders: ${notifications.disputeReminder.length}`);

      return notifications;
    } catch (error) {
      console.error('❌ Error sending daily notifications:', error);
      throw error;
    }
  }

  static stop() {
    console.log('🛑 Stopping escrow scheduler...');
    cron.getTasks().forEach(task => task.stop());
    console.log('✅ Escrow scheduler stopped');
  }
}

module.exports = EscrowScheduler;