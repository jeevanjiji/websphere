// Push notification service for WebSphere app
class NotificationService {
  constructor() {
    this.registration = null;
    this.permission = 'default';
    this.init();
  }

  async init() {
    // Check if service workers and push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Register service worker
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', this.registration);

        // Check current permission status
        this.permission = Notification.permission;
        console.log('Notification permission:', this.permission);

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.warn('Push notifications not supported in this browser');
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // If permission is already granted, return true
    if (this.permission === 'granted') {
      return true;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    this.permission = permission;

    if (permission === 'granted') {
      console.log('Notification permission granted');
      await this.subscribeToPush();
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  }

  async subscribeToPush() {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || 'BM8Z8R2V2Q3...')
        });
      }

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);
      return subscription;

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async sendSubscriptionToBackend(subscription) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (response.ok) {
        console.log('Push subscription sent to backend');
      } else {
        console.error('Failed to send subscription to backend');
      }
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
    }
  }

  async showLocalNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [100, 50, 100],
      data: {
        timestamp: Date.now()
      }
    };

    const notificationOptions = { ...defaultOptions, ...options };

    if (this.registration) {
      // Show notification via service worker
      await this.registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to browser notification
      new Notification(title, notificationOptions);
    }
  }

  async sendNotification(userId, title, body, data = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          data
        })
      });

      if (response.ok) {
        console.log('Notification sent successfully');
      } else {
        console.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Handle notification clicks
  setupNotificationHandlers() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          // Handle notification click
          const { data } = event.data;
          
          if (data.url) {
            window.open(data.url, '_blank');
          }
          
          if (data.action) {
            this.handleNotificationAction(data.action, data);
          }
        }
      });
    }
  }

  handleNotificationAction(action, data) {
    switch (action) {
      case 'view_workspace':
        // Navigate to workspace
        window.location.href = `/workspace/${data.workspaceId}`;
        break;
      case 'view_message':
        // Navigate to chat
        window.location.href = `/chat/${data.chatId}`;
        break;
      case 'view_project':
        // Navigate to project
        window.location.href = `/project/${data.projectId}`;
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  // Subscribe to real-time notifications via WebSocket
  setupWebSocketNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:5000/notifications?token=${token}`);

    ws.onopen = () => {
      console.log('Connected to notification WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        this.showLocalNotification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          data: notification.data,
          actions: notification.actions
        });
      } catch (error) {
        console.error('Error parsing notification message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Notification WebSocket closed, attempting to reconnect...');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.setupWebSocketNotifications(), 5000);
    };

    ws.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
    };

    return ws;
  }

  // Predefined notification types
  async notifyNewMessage(senderName, workspaceId, chatId) {
    await this.showLocalNotification(
      `New message from ${senderName}`,
      {
        body: 'Click to view the conversation',
        icon: '/icons/message.png',
        data: {
          action: 'view_message',
          workspaceId,
          chatId
        }
      }
    );
  }

  async notifyMilestoneUpdate(milestoneTitle, status, workspaceId) {
    await this.showLocalNotification(
      'Milestone Update',
      {
        body: `${milestoneTitle} has been ${status}`,
        icon: '/icons/milestone.png',
        data: {
          action: 'view_workspace',
          workspaceId
        }
      }
    );
  }

  async notifyPaymentReceived(amount, projectTitle) {
    await this.showLocalNotification(
      'Payment Received',
      {
        body: `You received ₹${amount} for ${projectTitle}`,
        icon: '/icons/payment.png',
        data: {
          action: 'view_payments'
        }
      }
    );
  }

  async notifyProjectApplication(freelancerName, projectId) {
    await this.showLocalNotification(
      'New Project Application',
      {
        body: `${freelancerName} applied to your project`,
        icon: '/icons/application.png',
        data: {
          action: 'view_project',
          projectId
        }
      }
    );
  }

  async notifyDeliverableSubmitted(title, workspaceId) {
    await this.showLocalNotification(
      'New Deliverable Submitted',
      {
        body: `${title} has been submitted for review`,
        icon: '/icons/deliverable.png',
        data: {
          action: 'view_workspace',
          workspaceId
        }
      }
    );
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;