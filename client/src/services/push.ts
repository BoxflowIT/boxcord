// Push Notification Service - Frontend
import { api } from './api';
import { logger } from '../utils/logger';

// Extend types for push notification support
type PushManagerRegistration = ServiceWorkerRegistration & {
  pushManager: PushManager;
};

interface VapidKeyResponse {
  publicKey: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  // Check if push is supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize service worker
  async init(): Promise<boolean> {
    if (!this.isSupported()) {
      logger.log('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      logger.log('Service Worker registered');

      // Check for existing subscription
      const reg = this.registration as PushManagerRegistration;
      this.subscription = await reg.pushManager.getSubscription();

      return true;
    } catch (err) {
      logger.error('Service Worker registration failed:', err);
      return false;
    }
  }

  // Get current subscription status
  async getStatus(): Promise<{
    subscribed: boolean;
    permission: NotificationPermission;
  }> {
    return {
      subscribed: this.subscription !== null,
      permission: Notification.permission
    };
  }

  // Request permission and subscribe
  async subscribe(): Promise<boolean> {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      logger.error('No service worker registration');
      return false;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.log('Notification permission denied');
      return false;
    }

    try {
      // Get VAPID public key from server
      const { data } = await api.get<VapidKeyResponse>(
        '/push/vapid-public-key'
      );
      const vapidKey = data.publicKey;

      // Check if VAPID keys are configured
      if (!vapidKey || vapidKey === '') {
        logger.error('VAPID keys not configured on server');
        return false;
      }

      // Subscribe to push manager with VAPID key
      const reg = this.registration as PushManagerRegistration;
      this.subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(vapidKey)
      });

      // Send subscription to server
      const subscriptionJson = this.subscription!.toJSON();
      await api.post('/push/subscribe', {
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth
        }
      });

      logger.log('Push subscription created');
      return true;
    } catch (err) {
      logger.error('Failed to subscribe:', err);
      return false;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const endpoint = this.subscription.endpoint;

      // Unsubscribe from push manager
      await this.subscription.unsubscribe();
      this.subscription = null;

      // Remove subscription from server
      await api.post('/push/unsubscribe', { endpoint });

      logger.log('Push subscription removed');
      return true;
    } catch (err) {
      logger.error('Failed to unsubscribe:', err);
      return false;
    }
  }

  // Send test notification (development)
  async sendTest(): Promise<boolean> {
    try {
      await api.post('/push/test');
      return true;
    } catch (err) {
      logger.error('Failed to send test notification:', err);
      return false;
    }
  }

  // Helper: Convert VAPID key to ArrayBuffer
  private urlB64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  }
}

export const pushService = new PushNotificationService();
