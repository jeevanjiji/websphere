// frontend/src/services/pushNotificationService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get permission status
   */
  getPermissionStatus() {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission; // 'default', 'granted', 'denied'
  }

  /**
   * Check if permission is blocked
   */
  isPermissionBlocked() {
    return Notification.permission === 'denied';
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    // Check current permission status
    if (Notification.permission === 'denied') {
      throw new Error('PERMISSION_BLOCKED');
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'denied') {
      throw new Error('PERMISSION_BLOCKED');
    }
    
    return permission === 'granted';
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!this.isSupported()) {
      throw new Error('Service workers are not supported in this browser');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service worker registered:', this.registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');
      
      return this.registration;
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    try {
      // Check if permission is blocked
      if (Notification.permission === 'denied') {
        throw new Error('PERMISSION_BLOCKED');
      }

      // Check permission
      if (Notification.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Notification permission denied');
        }
      }

      // Register service worker if not already registered
      if (!this.registration) {
        await this.registerServiceWorker();
      }

      // Get VAPID public key from server
      const { data } = await axios.get(`${API_BASE_URL}/api/notifications/vapid-public-key`);
      
      if (!data.publicKey) {
        throw new Error('VAPID public key not configured on server');
      }

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(data.publicKey)
      });

      console.log('✅ Push subscription created:', this.subscription);

      // Send subscription to server
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/notifications/subscribe`,
        { subscription: this.subscription },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('✅ Subscription sent to server');
      return this.subscription;

    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      if (!this.subscription) {
        // Try to get existing subscription
        const registration = await navigator.serviceWorker.ready;
        this.subscription = await registration.pushManager.getSubscription();
      }

      if (this.subscription) {
        await this.subscription.unsubscribe();
        console.log('✅ Unsubscribed from push notifications');
      }

      this.subscription = null;
      return true;
    } catch (error) {
      console.error('❌ Failed to unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('❌ Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed() {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences) {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `${API_BASE_URL}/api/notifications/preferences`,
        { preferences },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('✅ Notification preferences updated');
      return data;
    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences() {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(
        `${API_BASE_URL}/api/notifications/preferences`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return data.preferences;
    } catch (error) {
      console.error('❌ Failed to get preferences:', error);
      throw error;
    }
  }

  /**
   * Convert base64 to Uint8Array
   */
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

  /**
   * Test notification
   */
  async testNotification() {
    if (Notification.permission === 'granted') {
      new Notification('WebSphere Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: '/logo192.png',
        badge: '/logo192.png'
      });
    }
  }
}

export default new PushNotificationService();
