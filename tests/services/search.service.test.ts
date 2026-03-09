// Advanced Search Tests - MessageService.searchMessages & DM search with filters
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageService } from '../../src/02-application/services/message.service.js';
import { DirectMessageService } from '../../src/02-application/services/dm.service.js';
import { createMockPrisma } from '../mocks/prisma.mock.js';

describe('Advanced Search', () => {
  let messageService: MessageService;
  let dmService: DirectMessageService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const userId = 'user-1';
  const workspaceId = 'ws-1';
  const channelId = 'ch-1';

  const mockWorkspaces = [
    {
      id: workspaceId,
      channels: [{ id: channelId }, { id: 'ch-2' }]
    }
  ];

  const mockMessage = {
    id: 'msg-1',
    channelId,
    authorId: userId,
    content: 'Hello world test message',
    edited: false,
    isPinned: false,
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-01'),
    author: {
      id: userId,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      avatarUrl: null
    },
    channel: {
      id: channelId,
      name: 'general',
      workspaceId,
      workspace: { id: workspaceId, name: 'Test Workspace' }
    },
    attachments: [],
    reactions: [],
    _count: { replies: 0 }
  };

  const mockMessageWithAttachment = {
    ...mockMessage,
    id: 'msg-2',
    content: 'Check this file',
    attachments: [
      {
        id: 'att-1',
        fileName: 'document.pdf',
        fileUrl: '/uploads/document.pdf',
        fileType: 'application/pdf',
        fileSize: 1024
      }
    ]
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    messageService = new MessageService(mockPrisma as any);
    dmService = new DirectMessageService(mockPrisma as any);
  });

  describe('MessageService.searchMessages', () => {
    it('should search messages with basic query', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([
        mockMessage
      ] as any);

      const result = await messageService.searchMessages(userId, 'Hello');

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { members: { some: { userId } } }
        })
      );
      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            channelId: { in: [channelId, 'ch-2'] },
            content: { contains: 'Hello', mode: 'insensitive' }
          })
        })
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].content).toBe('Hello world test message');
    });

    it('should filter by channelId', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([
        mockMessage
      ] as any);

      await messageService.searchMessages(userId, 'Hello', {}, { channelId });

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            channelId: { in: [channelId] }
          })
        })
      );
    });

    it('should filter by authorId', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([
        mockMessage
      ] as any);

      await messageService.searchMessages(
        userId,
        'Hello',
        {},
        { authorId: 'author-2' }
      );

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 'author-2'
          })
        })
      );
    });

    it('should filter by date range', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([] as any);

      const after = '2026-02-01T00:00:00.000Z';
      const before = '2026-03-01T00:00:00.000Z';

      await messageService.searchMessages(
        userId,
        'Hello',
        {},
        { after, before }
      );

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date(after),
              lte: new Date(before)
            }
          })
        })
      );
    });

    it('should filter by hasAttachment', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([
        mockMessageWithAttachment
      ] as any);

      await messageService.searchMessages(
        userId,
        'Check',
        {},
        { hasAttachment: true }
      );

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            attachments: { some: {} }
          })
        })
      );
    });

    it('should filter by workspaceId', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([] as any);

      await messageService.searchMessages(userId, 'Hello', {}, { workspaceId });

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            members: { some: { userId } },
            id: workspaceId
          }
        })
      );
    });

    it('should return empty when channelId not accessible', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );

      const result = await messageService.searchMessages(
        userId,
        'Hello',
        {},
        { channelId: 'inaccessible-channel' }
      );

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      // Should NOT call message.findMany since no accessible channels match
      expect(mockPrisma.message.findMany).not.toHaveBeenCalled();
    });

    it('should combine multiple filters', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([] as any);

      await messageService.searchMessages(
        userId,
        'report',
        { limit: 10 },
        {
          channelId,
          authorId: 'user-2',
          after: '2026-01-01T00:00:00.000Z',
          hasAttachment: true
        }
      );

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            channelId: { in: [channelId] },
            content: { contains: 'report', mode: 'insensitive' },
            authorId: 'user-2',
            createdAt: { gte: new Date('2026-01-01T00:00:00.000Z') },
            attachments: { some: {} }
          }),
          take: 11 // limit + 1 for hasMore
        })
      );
    });

    it('should handle pagination with cursor', async () => {
      vi.mocked(mockPrisma.workspace.findMany).mockResolvedValue(
        mockWorkspaces as any
      );
      vi.mocked(mockPrisma.message.findMany).mockResolvedValue([
        mockMessage
      ] as any);

      await messageService.searchMessages(userId, 'Hello', {
        cursor: 'cursor-id',
        limit: 5
      });

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'cursor-id' },
          skip: 1,
          take: 6
        })
      );
    });
  });

  describe('DirectMessageService.searchDirectMessages', () => {
    const dmChannelIds = [{ channelId: 'dm-ch-1' }, { channelId: 'dm-ch-2' }];

    const mockDM = {
      id: 'dm-1',
      channelId: 'dm-ch-1',
      authorId: userId,
      content: 'Hey how are you?',
      edited: false,
      createdAt: new Date('2026-03-01'),
      updatedAt: new Date('2026-03-01'),
      author: {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null
      },
      channel: {
        id: 'dm-ch-1',
        participants: []
      },
      attachments: [],
      reactions: []
    };

    it('should search DMs with basic query', async () => {
      vi.mocked(mockPrisma.directMessageParticipant.findMany).mockResolvedValue(
        dmChannelIds as any
      );
      vi.mocked(mockPrisma.directMessage.findMany).mockResolvedValue([
        mockDM
      ] as any);

      const result = await dmService.searchDirectMessages(userId, 'Hey');

      expect(mockPrisma.directMessageParticipant.findMany).toHaveBeenCalledWith(
        {
          where: { userId },
          select: { channelId: true }
        }
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].content).toBe('Hey how are you?');
    });

    it('should filter DMs by date range', async () => {
      vi.mocked(mockPrisma.directMessageParticipant.findMany).mockResolvedValue(
        dmChannelIds as any
      );
      vi.mocked(mockPrisma.directMessage.findMany).mockResolvedValue([] as any);

      await dmService.searchDirectMessages(
        userId,
        'Hey',
        {},
        { after: '2026-02-01T00:00:00.000Z' }
      );

      expect(mockPrisma.directMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: new Date('2026-02-01T00:00:00.000Z') }
          })
        })
      );
    });

    it('should filter DMs by hasAttachment', async () => {
      vi.mocked(mockPrisma.directMessageParticipant.findMany).mockResolvedValue(
        dmChannelIds as any
      );
      vi.mocked(mockPrisma.directMessage.findMany).mockResolvedValue([] as any);

      await dmService.searchDirectMessages(
        userId,
        'file',
        {},
        { hasAttachment: true }
      );

      expect(mockPrisma.directMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            attachments: { some: {} }
          })
        })
      );
    });

    it('should filter DMs by authorId', async () => {
      vi.mocked(mockPrisma.directMessageParticipant.findMany).mockResolvedValue(
        dmChannelIds as any
      );
      vi.mocked(mockPrisma.directMessage.findMany).mockResolvedValue([] as any);

      await dmService.searchDirectMessages(
        userId,
        'Hello',
        {},
        { authorId: 'other-user' }
      );

      expect(mockPrisma.directMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 'other-user'
          })
        })
      );
    });
  });
});
