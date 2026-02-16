// Push Notification Service - Application Layer
import type { PrismaClient } from '@prisma/client';
import webPush from 'web-push';

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:support@boxflow.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export class PushService {
  constructor(private readonly prisma: PrismaClient) {}

  // Subscribe to push notifications
  async subscribe(
    userId: string,
    subscription: PushSubscriptionData
  ): Promise<void> {
    // Upsert - update if exists, create if not
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
  }

  // Unsubscribe from push notifications
  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint }
    });
  }

  // Get all subscriptions for a user
  async getUserSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId }
    });
  }

  // Get subscriptions for multiple users (for sending notifications)
  async getSubscriptionsForUsers(userIds: string[]) {
    return this.prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } }
    });
  }

  // Check if user has any subscriptions
  async hasSubscription(userId: string): Promise<boolean> {
    const count = await this.prisma.pushSubscription.count({
      where: { userId }
    });
    return count > 0;
  }

  // Send push notifications using web-push
  async sendNotification(
    subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
    payload: NotificationPayload
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      // eslint-disable-next-line no-console
      console.warn(
        '[PUSH] VAPID keys not configured. Skipping push notifications.'
      );
      return { success: 0, failed: subscriptions.length };
    }

    // Send notifications in parallel
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        try {
          await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            {
              TTL: 3600, // 1 hour
              urgency: 'high'
            }
          );
          return { success: true };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`[PUSH] Failed to send to ${sub.endpoint}:`, error);
          
          // If subscription is invalid (410 Gone), we should remove it
          if (
            error &&
            typeof error === 'object' &&
            'statusCode' in error &&
            error.statusCode === 410
          ) {
            await this.unsubscribe(sub.endpoint);
          }
          
          return { success: false };
        }
      })
    );

    // Count successes and failures
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        success++;
      } else {
        failed++;
      }
    });

    return { success, failed };
  }

  // Notify users about a new message
  async notifyNewMessage(
    channelId: string,
    authorId: string,
    authorName: string,
    channelName: string,
    messagePreview: string
  ): Promise<void> {
    // Get all channel members except the author
    const members = await this.prisma.channelMember.findMany({
      where: { channelId, NOT: { userId: authorId } },
      select: { userId: true }
    });

    const userIds = members.map((m) => m.userId);
    if (userIds.length === 0) return;

    const subscriptions = await this.getSubscriptionsForUsers(userIds);
    if (subscriptions.length === 0) return;

    await this.sendNotification(subscriptions, {
      title: `#${channelName}`,
      body: `${authorName}: ${messagePreview.slice(0, 100)}`,
      tag: `channel-${channelId}`,
      url: `/channel/${channelId}`
    });
  }

  // Notify user about a new DM
  async notifyNewDM(
    dmChannelId: string,
    authorId: string,
    authorName: string,
    recipientId: string,
    messagePreview: string
  ): Promise<void> {
    const subscriptions = await this.getSubscriptionsForUsers([recipientId]);
    if (subscriptions.length === 0) return;

    await this.sendNotification(subscriptions, {
      title: `DM från ${authorName}`,
      body: messagePreview.slice(0, 100),
      tag: `dm-${dmChannelId}`,
      url: `/dm/${dmChannelId}`
    });
  }

  // Notify user about a mention
  async notifyMention(
    mentionedUserId: string,
    authorName: string,
    channelName: string,
    channelId: string,
    messagePreview: string
  ): Promise<void> {
    const subscriptions = await this.getSubscriptionsForUsers([
      mentionedUserId
    ]);
    if (subscriptions.length === 0) return;

    await this.sendNotification(subscriptions, {
      title: `${authorName} nämnde dig i #${channelName}`,
      body: messagePreview.slice(0, 100),
      tag: `mention-${channelId}`,
      url: `/channel/${channelId}`
    });
  }
}
