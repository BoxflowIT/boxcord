// Push Service Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PushService } from '../../src/02-application/services/push.service';

describe('PushService', () => {
  let pushService: PushService;
  let mockPrisma: {
    pushSubscription: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    channelMember: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      pushSubscription: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn()
      },
      channelMember: {
        findMany: vi.fn()
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pushService = new PushService(mockPrisma as any);
  });

  describe('subscribe', () => {
    it('should upsert a push subscription', async () => {
      const subscription = {
        endpoint: 'https://push.example.com/123',
        keys: { p256dh: 'key1', auth: 'key2' }
      };

      await pushService.subscribe('user1', subscription);

      expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: subscription.endpoint },
        update: {
          userId: 'user1',
          p256dh: 'key1',
          auth: 'key2'
        },
        create: {
          userId: 'user1',
          endpoint: subscription.endpoint,
          p256dh: 'key1',
          auth: 'key2'
        }
      });
    });
  });

  describe('unsubscribe', () => {
    it('should delete subscription by endpoint', async () => {
      await pushService.unsubscribe('https://push.example.com/123');

      expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: 'https://push.example.com/123' }
      });
    });
  });

  describe('hasSubscription', () => {
    it('should return true when user has subscriptions', async () => {
      mockPrisma.pushSubscription.count.mockResolvedValue(2);

      const result = await pushService.hasSubscription('user1');

      expect(result).toBe(true);
      expect(mockPrisma.pushSubscription.count).toHaveBeenCalledWith({
        where: { userId: 'user1' }
      });
    });

    it('should return false when user has no subscriptions', async () => {
      mockPrisma.pushSubscription.count.mockResolvedValue(0);

      const result = await pushService.hasSubscription('user1');

      expect(result).toBe(false);
    });
  });

  describe('getUserSubscriptions', () => {
    it('should return all subscriptions for a user', async () => {
      const subscriptions = [
        { id: '1', endpoint: 'https://push1.com', p256dh: 'k1', auth: 'a1' },
        { id: '2', endpoint: 'https://push2.com', p256dh: 'k2', auth: 'a2' }
      ];
      mockPrisma.pushSubscription.findMany.mockResolvedValue(subscriptions);

      const result = await pushService.getUserSubscriptions('user1');

      expect(result).toEqual(subscriptions);
      expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' }
      });
    });
  });

  describe('getSubscriptionsForUsers', () => {
    it('should return subscriptions for multiple users', async () => {
      const subscriptions = [
        { id: '1', userId: 'user1', endpoint: 'https://push1.com' },
        { id: '2', userId: 'user2', endpoint: 'https://push2.com' }
      ];
      mockPrisma.pushSubscription.findMany.mockResolvedValue(subscriptions);

      const result = await pushService.getSubscriptionsForUsers([
        'user1',
        'user2'
      ]);

      expect(result).toEqual(subscriptions);
      expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: { in: ['user1', 'user2'] } }
      });
    });
  });

  describe('sendNotification', () => {
    it('should return success count for all subscriptions', async () => {
      const subscriptions = [
        { endpoint: 'https://push1.com', p256dh: 'k1', auth: 'a1' },
        { endpoint: 'https://push2.com', p256dh: 'k2', auth: 'a2' }
      ];

      const result = await pushService.sendNotification(subscriptions, {
        title: 'Test',
        body: 'Test message'
      });

      expect(result).toEqual({ success: 2, failed: 0 });
    });
  });
});
