// Push Notification Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { PushService } from '../../../02-application/services/push.service.js';

const pushService = new PushService(prisma);

// VAPID public key for client subscription
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';

if (!VAPID_PUBLIC_KEY) {
   
  console.warn(
    '[PUSH] VAPID_PUBLIC_KEY not set. Push notifications will not work. Generate keys with: npx web-push generate-vapid-keys'
  );
}

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

export async function pushRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get VAPID public key for client subscription
  app.get('/vapid-public-key', async () => {
    return {
      success: true,
      data: { publicKey: VAPID_PUBLIC_KEY }
    };
  });

  // Subscribe to push notifications
  app.post<{
    Body: z.infer<typeof subscriptionSchema>;
  }>('/subscribe', async (request) => {
    const subscription = subscriptionSchema.parse(request.body);

    await pushService.subscribe(request.user.id, subscription);

    return {
      success: true,
      message: 'Successfully subscribed to push notifications'
    };
  });

  // Unsubscribe from push notifications
  app.post<{
    Body: { endpoint: string };
  }>('/unsubscribe', async (request) => {
    await pushService.unsubscribe(request.body.endpoint);

    return {
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    };
  });

  // Check subscription status
  app.get('/status', async (request) => {
    const hasSubscription = await pushService.hasSubscription(request.user.id);

    return {
      success: true,
      data: { subscribed: hasSubscription }
    };
  });

  // Test notification (development only)
  if (process.env.NODE_ENV !== 'production') {
    app.post('/test', async (request) => {
      const subscriptions = await pushService.getUserSubscriptions(
        request.user.id
      );

      if (subscriptions.length === 0) {
        return {
          success: false,
          message: 'No subscriptions found. Enable notifications first.'
        };
      }

      await pushService.sendNotification(subscriptions, {
        title: 'Test Notification',
        body: 'Push notifications are working! 🎉',
        icon: '/icon-192.png'
      });

      return {
        success: true,
        message: 'Test notification sent'
      };
    });
  }
}
