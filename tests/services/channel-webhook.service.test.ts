// Channel Webhook Service Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { ChannelWebhookService } from '../../src/02-application/services/channel-webhook.service';
import { createMockPrisma } from '../mocks/prisma.mock';
import type { PrismaClient } from '@prisma/client';

describe('ChannelWebhookService', () => {
  let service: ChannelWebhookService;
  let mockPrisma: PrismaClient;

  const userId = 'user-1';
  const channelId = 'channel-1';
  const webhookId = 'webhook-1';

  const mockChannel = {
    id: channelId,
    workspaceId: 'workspace-1',
    name: 'general',
    type: 'TEXT'
  };

  const mockWebhook = {
    id: webhookId,
    channelId,
    name: 'GitHub Bot',
    avatarUrl: null,
    token: 'abc123def456',
    createdBy: userId,
    isActive: true,
    description: 'GitHub notifications',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new ChannelWebhookService(mockPrisma as never);
  });

  describe('getWebhooks', () => {
    it('should return all webhooks for a channel', async () => {
      (
        mockPrisma.channelWebhook.findMany as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue([mockWebhook]);

      const result = await service.getWebhooks(channelId);

      expect(result).toEqual([mockWebhook]);
      expect(mockPrisma.channelWebhook.findMany).toHaveBeenCalledWith({
        where: { channelId },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return empty array for channel with no webhooks', async () => {
      (
        mockPrisma.channelWebhook.findMany as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue([]);

      const result = await service.getWebhooks(channelId);

      expect(result).toEqual([]);
    });
  });

  describe('getWebhook', () => {
    it('should return a webhook by id', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);

      const result = await service.getWebhook(webhookId, userId);

      expect(result).toEqual(mockWebhook);
    });

    it('should throw NotFoundError for non-existent webhook', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(null);

      await expect(service.getWebhook('nonexistent', userId)).rejects.toThrow(
        'not found'
      );
    });
  });

  describe('createWebhook', () => {
    it('should create a new webhook', async () => {
      (
        mockPrisma.channel.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockChannel);
      (
        mockPrisma.channelWebhook.count as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(0);
      (
        mockPrisma.channelWebhook.create as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);

      const result = await service.createWebhook({
        channelId,
        name: 'GitHub Bot',
        description: 'GitHub notifications',
        createdBy: userId
      });

      expect(result).toEqual(mockWebhook);
      expect(mockPrisma.channelWebhook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channelId,
          name: 'GitHub Bot',
          description: 'GitHub notifications',
          createdBy: userId,
          token: expect.any(String)
        })
      });
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(
        service.createWebhook({
          channelId,
          name: '   ',
          createdBy: userId
        })
      ).rejects.toThrow('characters');
    });

    it('should throw NotFoundError for non-existent channel', async () => {
      (
        mockPrisma.channel.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(null);

      await expect(
        service.createWebhook({
          channelId: 'nonexistent',
          name: 'Test Bot',
          createdBy: userId
        })
      ).rejects.toThrow('not found');
    });

    it('should throw ValidationError when exceeding 15 webhooks', async () => {
      (
        mockPrisma.channel.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockChannel);
      (
        mockPrisma.channelWebhook.count as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(15);

      await expect(
        service.createWebhook({
          channelId,
          name: 'New Bot',
          createdBy: userId
        })
      ).rejects.toThrow('15 webhooks');
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook name', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);
      (
        mockPrisma.channelWebhook.update as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue({
        ...mockWebhook,
        name: 'Updated Bot'
      });

      const result = await service.updateWebhook(webhookId, userId, {
        name: 'Updated Bot'
      });

      expect(result.name).toBe('Updated Bot');
    });

    it('should toggle active status', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);
      (
        mockPrisma.channelWebhook.update as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue({
        ...mockWebhook,
        isActive: false
      });

      const result = await service.updateWebhook(webhookId, userId, {
        isActive: false
      });

      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundError for non-existent webhook', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(null);

      await expect(
        service.updateWebhook('nonexistent', userId, { name: 'Test' })
      ).rejects.toThrow('not found');
    });

    it('should throw ForbiddenError when updating other user webhook', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue({
        ...mockWebhook,
        createdBy: 'other-user'
      });

      await expect(
        service.updateWebhook(webhookId, userId, { name: 'Test' })
      ).rejects.toThrow('your own');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);
      (
        mockPrisma.channelWebhook.delete as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);

      await service.deleteWebhook(webhookId, userId);

      expect(mockPrisma.channelWebhook.delete).toHaveBeenCalledWith({
        where: { id: webhookId }
      });
    });

    it('should throw NotFoundError for non-existent webhook', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(null);

      await expect(
        service.deleteWebhook('nonexistent', userId)
      ).rejects.toThrow('not found');
    });

    it('should throw ForbiddenError when deleting other user webhook', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue({
        ...mockWebhook,
        createdBy: 'other-user'
      });

      await expect(service.deleteWebhook(webhookId, userId)).rejects.toThrow(
        'your own'
      );
    });
  });

  describe('regenerateToken', () => {
    it('should regenerate webhook token', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);
      (
        mockPrisma.channelWebhook.update as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue({
        ...mockWebhook,
        token: 'new-token-value'
      });

      const result = await service.regenerateToken(webhookId, userId);

      expect(mockPrisma.channelWebhook.update).toHaveBeenCalledWith({
        where: { id: webhookId },
        data: { token: expect.any(String) }
      });
      expect(result.token).toBe('new-token-value');
    });

    it('should throw ForbiddenError for other user', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue({
        ...mockWebhook,
        createdBy: 'other-user'
      });

      await expect(service.regenerateToken(webhookId, userId)).rejects.toThrow(
        'your own'
      );
    });
  });

  describe('executeWebhook', () => {
    it('should execute webhook and create message', async () => {
      const mockMessage = {
        id: 'msg-1',
        channelId,
        authorId: userId,
        webhookId,
        content: 'Build passed! ✅',
        createdAt: new Date(),
        edited: false
      };

      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);
      (
        mockPrisma.message.create as ReturnType<typeof import('vitest').vi.fn>
      ).mockResolvedValue(mockMessage);

      const result = await service.executeWebhook('abc123def456', {
        content: 'Build passed! ✅'
      });

      expect(result.messageId).toBe('msg-1');
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          channelId,
          authorId: userId,
          webhookId,
          content: 'Build passed! ✅'
        }
      });
    });

    it('should throw NotFoundError for invalid token', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(null);

      await expect(
        service.executeWebhook('invalid-token', { content: 'test' })
      ).rejects.toThrow('not found');
    });

    it('should throw ForbiddenError for disabled webhook', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue({
        ...mockWebhook,
        isActive: false
      });

      await expect(
        service.executeWebhook('abc123def456', { content: 'test' })
      ).rejects.toThrow('disabled');
    });

    it('should throw ValidationError for empty content', async () => {
      (
        mockPrisma.channelWebhook.findUnique as ReturnType<
          typeof import('vitest').vi.fn
        >
      ).mockResolvedValue(mockWebhook);

      await expect(
        service.executeWebhook('abc123def456', { content: '   ' })
      ).rejects.toThrow('characters');
    });
  });
});
