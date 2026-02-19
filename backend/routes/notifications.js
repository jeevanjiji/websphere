const express = require('express');
const webpush = require('web-push');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middlewares/auth');
const JobScheduler = require('../jobs/scheduler');
const router = express.Router();

// Hold the active VAPID public key (env or dev fallback)
let ACTIVE_VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || null;

// Configure web-push with VAPID keys
try {
  const hasEnvKeys = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
  if (hasEnvKeys) {
    webpush.setVapidDetails(
      'mailto:support@websphere.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    ACTIVE_VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
    console.log('✅ Web-push configured with VAPID keys (env)');
  } else if (process.env.NODE_ENV !== 'production') {
    // Dev fallback: generate ephemeral keys on startup to avoid blocking local testing
    const { publicKey, privateKey } = webpush.generateVAPIDKeys();
    webpush.setVapidDetails('mailto:support@websphere.com', publicKey, privateKey);
    ACTIVE_VAPID_PUBLIC_KEY = publicKey;
    console.log('🔧 Web-push configured with DEV fallback VAPID keys');
    console.log('ℹ️  For production, set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
  } else {
    console.log('⚠️  VAPID keys not configured - push notifications disabled');
    console.log('💡 Generate keys with: npx web-push generate-vapid-keys and set .env vars');
  }
} catch (error) {
  console.error('❌ Error configuring web-push:', error.message);
}

// Store push subscriptions in memory (in production, use database)
const subscriptions = new Map();

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: ACTIVE_VAPID_PUBLIC_KEY || null
  });
});

// Frontend compatibility: should we prompt this user to enable push? (one-time per user)
router.get('/should-prompt', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('hasSeenPushPrompt pushSubscription');
    const hasSubscription = !!(user?.pushSubscription && user.pushSubscription.endpoint);
    const shouldPrompt = !hasSubscription && !user?.hasSeenPushPrompt;
    res.json({ success: true, shouldPrompt });
  } catch (error) {
    console.error('Error computing should-prompt:', error);
    res.status(500).json({ success: false, message: 'Failed to compute prompt status' });
  }
});

// Frontend compatibility: mark the push prompt as seen
router.post('/prompt-seen', auth(['client', 'freelancer']), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { $set: { hasSeenPushPrompt: true } });
    res.json({ success: true, message: 'Push prompt marked as seen' });
  } catch (error) {
    console.error('Error marking prompt as seen:', error);
    res.status(500).json({ success: false, message: 'Failed to mark prompt as seen' });
  }
});

// One-time push prompt status
router.get('/push-prompt-status', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('hasSeenPushPrompt pushSubscription role');
    const hasSubscription = !!(user?.pushSubscription && user.pushSubscription.endpoint);
    res.json({
      success: true,
      hasSeenPushPrompt: !!user?.hasSeenPushPrompt,
      hasSubscription,
      role: user?.role || null
    });
  } catch (error) {
    console.error('Error fetching push prompt status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch push prompt status' });
  }
});

// Mark push prompt as seen (server-tracked one-time)
router.put('/push-prompt-seen', auth(['client', 'freelancer']), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { $set: { hasSeenPushPrompt: true } });
    res.json({ success: true, message: 'Push prompt marked as seen' });
  } catch (error) {
    console.error('Error marking push prompt as seen:', error);
    res.status(500).json({ success: false, message: 'Failed to mark push prompt as seen' });
  }
});

// Should we show the push enable prompt? (one-time per user)
router.get('/should-prompt', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('hasSeenPushPrompt pushSubscription notificationPreferences.role role');
    const shouldPrompt = !user.hasSeenPushPrompt && !user.pushSubscription && (user?.notificationPreferences?.push !== false);
    res.json({ success: true, shouldPrompt });
  } catch (err) {
    console.error('Error checking push prompt state:', err);
    res.status(500).json({ success: false, message: 'Failed to check push prompt state' });
  }
});

// Mark that we showed the push enable prompt (to not show again)
router.post('/prompt-seen', auth(['client', 'freelancer']), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { hasSeenPushPrompt: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking push prompt seen:', err);
    res.status(500).json({ success: false, message: 'Failed to update push prompt state' });
  }
});

// Get user notifications from database
router.get('/list', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('data.workspaceId', 'title')
      .populate('data.projectId', 'title')
      .lean();

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Delete a notification
router.delete('/:notificationId', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    await Notification.findOneAndDelete({ _id: notificationId, userId });

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// Clear all read notifications
router.delete('/clear-read', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.deleteMany({ userId, read: true });

    res.json({
      success: true,
      message: 'Read notifications cleared'
    });

  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear read notifications'
    });
  }
});

// Subscribe to push notifications
router.post('/subscribe', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.userId;

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'No subscription provided'
      });
    }

    // Store subscription for the user
    subscriptions.set(userId, subscription);

    // Optionally save to database
    await User.findByIdAndUpdate(userId, {
      pushSubscription: subscription
    });

    console.log('Push subscription saved for user:', userId);
    
    res.json({
      success: true,
      message: 'Subscription saved successfully'
    });

  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save subscription'
    });
  }
});

// Send push notification to specific user
router.post('/send', auth(['client', 'freelancer', 'admin']), async (req, res) => {
  try {
    const { userId, title, body, data = {}, icon, actions = [] } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, title, body'
      });
    }

    // Get user's subscription
    let subscription = subscriptions.get(userId);
    
    if (!subscription) {
      // Try to get from database
      const user = await User.findById(userId);
      if (user && user.pushSubscription) {
        subscription = user.pushSubscription;
        subscriptions.set(userId, subscription);
      }
    }

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No push subscription found for user'
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/logo192.png',
      data,
      actions
    });

    // Send push notification
    await webpush.sendNotification(subscription, payload);

    console.log('Push notification sent to user:', userId);
    
    res.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    
    // If subscription is invalid, remove it
    if (error.statusCode === 410) {
      const { userId } = req.body;
      subscriptions.delete(userId);
      await User.findByIdAndUpdate(userId, {
        $unset: { pushSubscription: 1 }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Send notification to multiple users
router.post('/send-bulk', auth(['admin']), async (req, res) => {
  try {
    const { userIds, title, body, data = {}, icon, actions = [] } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userIds (array), title, body'
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/logo192.png',
      data,
      actions
    });

    const results = [];

    for (const userId of userIds) {
      try {
        let subscription = subscriptions.get(userId);
        
        if (!subscription) {
          const user = await User.findById(userId);
          if (user && user.pushSubscription) {
            subscription = user.pushSubscription;
            subscriptions.set(userId, subscription);
          }
        }

        if (subscription) {
          await webpush.sendNotification(subscription, payload);
          results.push({ userId, success: true });
        } else {
          results.push({ userId, success: false, error: 'No subscription' });
        }
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          subscriptions.delete(userId);
          await User.findByIdAndUpdate(userId, {
            $unset: { pushSubscription: 1 }
          });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Sent ${successCount}/${userIds.length} notifications`,
      results
    });

  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications'
    });
  }
});

// Get notification preferences
router.get('/preferences', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('notificationSettings');
    
    res.json({
      success: true,
      preferences: user.notificationSettings
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences'
    });
  }
});

// Update notification preferences
router.put('/preferences', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { email, push, sms } = req.body;

    const updateData = {};
    if (email) updateData['notificationSettings.email'] = email;
    if (push) updateData['notificationSettings.push'] = push;
    if (sms) updateData['notificationSettings.sms'] = sms;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true }
    ).select('notificationSettings');

    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: user.notificationSettings
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
});

// Helper functions for sending specific notification types
const notificationHelpers = {
  async newMessage(senderId, receiverId, workspaceId, message) {
    const sender = await User.findById(senderId).select('fullName');
    
    return this.sendNotification(receiverId, {
      title: `New message from ${sender.fullName}`,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      data: {
        action: 'view_workspace',
        workspaceId,
        senderId
      }
    });
  },

  async milestoneUpdate(userId, milestoneTitle, status, workspaceId) {
    return this.sendNotification(userId, {
      title: 'Milestone Update',
      body: `${milestoneTitle} has been ${status}`,
      data: {
        action: 'view_workspace',
        workspaceId
      }
    });
  },

  async paymentReceived(userId, amount, projectTitle, clientName = null) {
    const clientInfo = clientName ? ` from ${clientName}` : '';
    return this.sendNotification(userId, {
      title: 'Payment Received',
      body: `You received ₹${amount}${clientInfo} for ${projectTitle}`,
      data: {
        action: 'view_payments'
      }
    });
  },

  async projectApplication(clientId, freelancerName, projectId) {
    return this.sendNotification(clientId, {
      title: 'New Project Application',
      body: `${freelancerName} applied to your project`,
      data: {
        action: 'view_project',
        projectId
      }
    });
  },

  async deliverableSubmitted(clientId, title, workspaceId) {
    return this.sendNotification(clientId, {
      title: 'New Deliverable Submitted',
      body: `${title} has been submitted for review`,
      data: {
        action: 'view_workspace',
        workspaceId
      }
    });
  },

  async sendNotification(userId, { title, body, data, icon, actions }) {
    try {
      let subscription = subscriptions.get(userId);
      
      if (!subscription) {
        const user = await User.findById(userId);
        if (user && user.pushSubscription) {
          subscription = user.pushSubscription;
          subscriptions.set(userId, subscription);
        }
      }

      if (subscription) {
        const payload = JSON.stringify({
          title,
          body,
          icon: icon || '/logo192.png',
          data,
          actions
        });

        await webpush.sendNotification(subscription, payload);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
};

// Update notification preferences
router.put('/preferences', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.userId;

    await User.findByIdAndUpdate(userId, {
      notificationPreferences: preferences
    });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
});

// Get notification preferences
router.get('/preferences', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('notificationPreferences');

    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        email: true,
        push: true,
        paymentReminders: true,
        deliverableReminders: true,
        dueDateAlerts: true,
        overdueAlerts: true
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences'
    });
  }
});

// Manual trigger for due date notifications (for testing - no auth required in dev)
router.post('/trigger-due-date-check', process.env.NODE_ENV === 'production' ? auth(['admin']) : [], async (req, res) => {
  try {
    const result = await JobScheduler.runDueDateCheck();
    res.json({
      success: true,
      message: 'Due date notification check completed',
      result
    });
  } catch (error) {
    console.error('Error triggering due date check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger due date check'
    });
  }
});

// Export helpers for use in other routes
router.helpers = notificationHelpers;

module.exports = router;