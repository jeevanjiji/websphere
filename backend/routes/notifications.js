const express = require('express');
const webpush = require('web-push');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const router = express.Router();

// Configure web-push with VAPID keys
try {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ Web-push configured with VAPID keys');
  } else {
    console.log('⚠️  VAPID keys not configured - push notifications disabled');
  }
} catch (error) {
  console.error('❌ Error configuring web-push:', error.message);
}

// Store push subscriptions in memory (in production, use database)
const subscriptions = new Map();

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

  async paymentReceived(userId, amount, projectTitle) {
    return this.sendNotification(userId, {
      title: 'Payment Received',
      body: `You received ₹${amount} for ${projectTitle}`,
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

// Export helpers for use in other routes
router.helpers = notificationHelpers;

module.exports = router;