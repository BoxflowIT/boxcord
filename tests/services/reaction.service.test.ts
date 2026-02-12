// Reaction Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ReactionService,
  QUICK_REACTIONS,
} from '../../src/02-application/services/reaction.service.js';
import { createMockPrisma } from '../mocks/prisma.mock.js';
import { NotFoundError, ConflictError } from '../../src/00-core/errors.js';

describe('ReactionService', () => {
  let reactionService: ReactionService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    // Need to add reaction to mock
    (mockPrisma as any).reaction = {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    };
    reactionService = new ReactionService(mockPrisma);
  });

  describe('QUICK_REACTIONS', () => {
    it('should export common emojis', () => {
      expect(QUICK_REACTIONS).toContain('👍');
      expect(QUICK_REACTIONS).toContain('❤️');
      expect(QUICK_REACTIONS).toHaveLength(8);
    });
  });

  describe('addReaction', () => {
    it('should add reaction to message', async () => {
      vi.mocked(mockPrisma.message.findUnique).mockResolvedValue({
        id: 'msg-1',
        content: 'Test',
      } as any);

      vi.mocked((mockPrisma as any).reaction.create).mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
      });

      await reactionService.addReaction('msg-1', 'user-1', '👍');

      expect((mockPrisma as any).reaction.create).toHaveBeenCalledWith({
        data: { messageId: 'msg-1', userId: 'user-1', emoji: '👍' },
      });
    });

    it('should throw NotFoundError for non-existent message', async () => {
      vi.mocked(mockPrisma.message.findUnique).mockResolvedValue(null);

      await expect(
        reactionService.addReaction('non-existent', 'user-1', '👍')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError for duplicate reaction', async () => {
      vi.mocked(mockPrisma.message.findUnique).mockResolvedValue({
        id: 'msg-1',
        content: 'Test',
      } as any);

      const prismaError = new Error('Unique constraint') as any;
      prismaError.code = 'P2002';
      vi.mocked((mockPrisma as any).reaction.create).mockRejectedValue(prismaError);

      await expect(
        reactionService.addReaction('msg-1', 'user-1', '👍')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction from message', async () => {
      vi.mocked((mockPrisma as any).reaction.deleteMany).mockResolvedValue({ count: 1 });

      await reactionService.removeReaction('msg-1', 'user-1', '👍');

      expect((mockPrisma as any).reaction.deleteMany).toHaveBeenCalledWith({
        where: { messageId: 'msg-1', userId: 'user-1', emoji: '👍' },
      });
    });
  });

  describe('toggleReaction', () => {
    it('should add reaction if not exists', async () => {
      vi.mocked((mockPrisma as any).reaction.findUnique).mockResolvedValue(null);
      vi.mocked((mockPrisma as any).reaction.create).mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
      });

      const result = await reactionService.toggleReaction('msg-1', 'user-1', '👍');

      expect(result).toBe(true); // Added
      expect((mockPrisma as any).reaction.create).toHaveBeenCalled();
    });

    it('should remove reaction if exists', async () => {
      vi.mocked((mockPrisma as any).reaction.findUnique).mockResolvedValue({
        id: 'reaction-1',
        messageId: 'msg-1',
        userId: 'user-1',
        emoji: '👍',
      });
      vi.mocked((mockPrisma as any).reaction.delete).mockResolvedValue({});

      const result = await reactionService.toggleReaction('msg-1', 'user-1', '👍');

      expect(result).toBe(false); // Removed
      expect((mockPrisma as any).reaction.delete).toHaveBeenCalledWith({
        where: { id: 'reaction-1' },
      });
    });
  });

  describe('getReactionCounts', () => {
    it('should return grouped reaction counts', async () => {
      vi.mocked((mockPrisma as any).reaction.findMany).mockResolvedValue([
        { id: 'r1', emoji: '👍', userId: 'user-1' },
        { id: 'r2', emoji: '👍', userId: 'user-2' },
        { id: 'r3', emoji: '❤️', userId: 'user-2' },
      ]);

      const result = await reactionService.getReactionCounts('msg-1', 'user-1');

      expect(result).toEqual([
        { emoji: '👍', count: 2, hasReacted: true },
        { emoji: '❤️', count: 1, hasReacted: false },
      ]);
    });

    it('should return empty array for message without reactions', async () => {
      vi.mocked((mockPrisma as any).reaction.findMany).mockResolvedValue([]);

      const result = await reactionService.getReactionCounts('msg-1', 'user-1');

      expect(result).toEqual([]);
    });
  });
});
