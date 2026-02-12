// Webhook Service Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebhookService } from '../../src/02-application/services/webhook.service';

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockPrisma: {
    channel: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    workspace: {
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    message: {
      create: ReturnType<typeof vi.fn>;
    };
  };
  let mockIo: {
    to: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockPrisma = {
      channel: {
        findFirst: vi.fn(),
        create: vi.fn()
      },
      workspace: {
        findFirst: vi.fn(),
        findUnique: vi.fn()
      },
      message: {
        create: vi.fn()
      }
    };

    mockIo = {
      to: vi.fn().mockReturnValue({ emit: vi.fn() })
    };

    webhookService = new WebhookService(mockPrisma as never);
    webhookService.setSocketServer(mockIo as never);
  });

  describe('validateSignature', () => {
    it('should return true when secret is empty (development mode)', () => {
      const result = webhookService.validateSignature(
        '{"event": "test"}',
        'any-signature',
        ''
      );
      expect(result).toBe(true);
    });

    it('should return true when signature matches secret', () => {
      const result = webhookService.validateSignature(
        '{"event": "test"}',
        'my-secret',
        'my-secret'
      );
      expect(result).toBe(true);
    });

    it('should return false when signature does not match', () => {
      const result = webhookService.validateSignature(
        '{"event": "test"}',
        'wrong-signature',
        'my-secret'
      );
      expect(result).toBe(false);
    });
  });

  describe('processEvent', () => {
    const mockChannel = {
      id: 'channel-123',
      name: 'bokningar',
      workspaceId: 'ws-1'
    };
    const mockMessage = {
      id: 'msg-123',
      content: 'Test',
      authorId: 'boxtime-bot',
      channelId: 'channel-123',
      createdAt: new Date()
    };

    beforeEach(() => {
      mockPrisma.channel.findFirst.mockResolvedValue(mockChannel);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
    });

    it('should handle booking.created event', async () => {
      await webhookService.processEvent({
        event: 'booking.created',
        timestamp: new Date().toISOString(),
        data: {
          bookingId: 1,
          customerId: 2,
          customerName: 'Test Kund',
          staffId: 3,
          staffName: 'Test Personal',
          serviceId: 4,
          serviceName: 'Klippning',
          startTime: '2026-02-12T10:00:00Z',
          endTime: '2026-02-12T11:00:00Z'
        }
      });

      expect(mockPrisma.message.create).toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('channel:channel-123');
    });

    it('should handle booking.cancelled event', async () => {
      await webhookService.processEvent({
        event: 'booking.cancelled',
        timestamp: new Date().toISOString(),
        data: {
          bookingId: 1,
          customerName: 'Test Kund',
          serviceName: 'Klippning',
          staffName: 'Test Personal',
          startTime: '2026-02-12T10:00:00Z'
        }
      });

      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should handle staff.joined event', async () => {
      mockPrisma.channel.findFirst.mockResolvedValue({
        ...mockChannel,
        name: 'allmänt'
      });

      await webhookService.processEvent({
        event: 'staff.joined',
        timestamp: new Date().toISOString(),
        data: {
          staffId: 1,
          staffName: 'Ny Personal',
          email: 'ny@example.com'
        }
      });

      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should handle shift.started event', async () => {
      mockPrisma.channel.findFirst.mockResolvedValue({
        ...mockChannel,
        name: 'arbetsstatus'
      });

      await webhookService.processEvent({
        event: 'shift.started',
        timestamp: new Date().toISOString(),
        data: {
          staffId: 1,
          staffName: 'Arbetare'
        }
      });

      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should handle shift.ended event', async () => {
      mockPrisma.channel.findFirst.mockResolvedValue({
        ...mockChannel,
        name: 'arbetsstatus'
      });

      await webhookService.processEvent({
        event: 'shift.ended',
        timestamp: new Date().toISOString(),
        data: {
          staffId: 1,
          staffName: 'Arbetare'
        }
      });

      expect(mockPrisma.message.create).toHaveBeenCalled();
    });

    it('should create channel if it does not exist', async () => {
      const mockWorkspace = { id: 'ws-1', name: 'Default' };
      mockPrisma.channel.findFirst.mockResolvedValue(null);
      mockPrisma.workspace.findFirst.mockResolvedValue(mockWorkspace);
      mockPrisma.channel.create.mockResolvedValue(mockChannel);

      await webhookService.processEvent({
        event: 'booking.created',
        timestamp: new Date().toISOString(),
        data: {
          customerName: 'Test',
          serviceName: 'Test',
          staffName: 'Test',
          startTime: '2026-02-12T10:00:00Z'
        }
      });

      expect(mockPrisma.channel.create).toHaveBeenCalled();
    });
  });
});
