// Reaction Service - Application Layer
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import { NotFoundError, ConflictError } from '../../00-core/errors.js';

// Common emojis for quick access
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export interface ReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean; // Whether current user has reacted with this emoji
}

export class ReactionService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  // Add reaction to channel message
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    try {
      await this.prisma.reaction.create({
        data: { messageId, userId, emoji }
      });
    } catch (err: unknown) {
      // Ignore duplicate reaction errors
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictError('You have already reacted with this emoji');
      }
      throw err;
    }
  }

  // Remove reaction from channel message
  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    await this.prisma.reaction.deleteMany({
      where: { messageId, userId, emoji }
    });
  }

  // Toggle reaction (add if not exists, remove if exists)
  async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    const existing = await this.prisma.reaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } }
    });

    if (existing) {
      await this.prisma.reaction.delete({
        where: { id: existing.id }
      });
      return false; // Removed
    } else {
      await this.prisma.reaction.create({
        data: { messageId, userId, emoji }
      });
      return true; // Added
    }
  }

  // Get reaction counts for a message
  async getReactionCounts(
    messageId: string,
    currentUserId: string
  ): Promise<ReactionCount[]> {
    const reactions = await this.prisma.reaction.findMany({
      where: { messageId }
    });

    // Group by emoji
    const emojiMap = new Map<string, { count: number; hasReacted: boolean }>();

    for (const reaction of reactions) {
      const existing = emojiMap.get(reaction.emoji) ?? {
        count: 0,
        hasReacted: false
      };
      existing.count++;
      if (reaction.userId === currentUserId) {
        existing.hasReacted = true;
      }
      emojiMap.set(reaction.emoji, existing);
    }

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      ...data
    }));
  }

  // Get users who reacted with a specific emoji
  async getReactedUsers(messageId: string, emoji: string): Promise<string[]> {
    const reactions = await this.prisma.reaction.findMany({
      where: { messageId, emoji },
      select: { userId: true }
    });
    return reactions.map((r) => r.userId);
  }

  // DM Reactions
  async addDMReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Direct message', messageId);
    }

    try {
      await this.prisma.dMReaction.create({
        data: { messageId, userId, emoji }
      });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictError('You have already reacted with this emoji');
      }
      throw err;
    }
  }

  async removeDMReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    await this.prisma.dMReaction.deleteMany({
      where: { messageId, userId, emoji }
    });
  }

  async toggleDMReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<boolean> {
    const existing = await this.prisma.dMReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } }
    });

    if (existing) {
      await this.prisma.dMReaction.delete({
        where: { id: existing.id }
      });
      return false;
    } else {
      await this.prisma.dMReaction.create({
        data: { messageId, userId, emoji }
      });
      return true;
    }
  }
}
