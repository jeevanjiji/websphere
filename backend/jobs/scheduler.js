// backend/jobs/scheduler.js
const cron = require('node-cron');
const DueDateNotificationJob = require('./dueDateNotifications');

class JobScheduler {
  static init() {
    console.log('📅 Initializing job scheduler...');

    // Run due date notifications check every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Running scheduled due date notification check at 9:00 AM');
      await DueDateNotificationJob.checkAndNotify();
    }, {
      timezone: "Asia/Kolkata"
    });

    // Run additional check at 6:00 PM for urgent reminders
    cron.schedule('0 18 * * *', async () => {
      console.log('⏰ Running scheduled due date notification check at 6:00 PM');
      await DueDateNotificationJob.checkAndNotify();
    }, {
      timezone: "Asia/Kolkata"
    });

    // For testing: Run every hour during development
    if (process.env.NODE_ENV !== 'production') {
      cron.schedule('0 * * * *', async () => {
        console.log('⏰ [DEV] Running hourly due date notification check');
        await DueDateNotificationJob.checkAndNotify();
      }, {
        timezone: "Asia/Kolkata"
      });
    }

    console.log('✅ Job scheduler initialized successfully');
    console.log('📅 Scheduled jobs:');
    console.log('   - Due date notifications: Daily at 9:00 AM and 6:00 PM IST');
    if (process.env.NODE_ENV !== 'production') {
      console.log('   - [DEV] Hourly checks enabled');
    }
  }

  // Manual trigger for testing
  static async runDueDateCheck() {
    console.log('🔧 Manually triggering due date notification check...');
    return await DueDateNotificationJob.checkAndNotify();
  }
}

module.exports = JobScheduler;
