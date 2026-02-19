// Direct Message Service - Application Layer
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { PaginationParams, PaginatedResult } from '../../00-core/types.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError
} from '../../00-core/errors.js';
import { PAGINATION } from '../../00-core/constants.js';

export interface DirectMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
  attachments?: DMAttachment[];
  reactions?: DMReaction[];
}

export interface DMAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface DMReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

export interface DMChannel {
  id: string;
  createdAt: Date;
  participants: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
  lastMessage?: DirectMessage | null;
  unreadCount?: number;
}

export class DirectMessageService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  // Get or create DM channel between two users
  async getOrCreateChannel(
    userId1: string,
    userId2: string
  ): Promise<DMChannel> {
    // Find existing channel
    const existing = await this.prisma.directMessageChannel.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (existing) {
      return {
        id: existing.id,
        createdAt: existing.createdAt,
        participants: existing.participants.map((p) => ({
          userId: p.userId,
          user: {
            id: p.user.id,
            email: p.user.email,
            firstName: p.user.firstName ?? undefined,
            lastName: p.user.lastName ?? undefined
          }
        })),
        lastMessage: existing.messages[0] ?? null
      };
    }

    // Create new channel
    const channel = await this.prisma.directMessageChannel.create({
      data: {
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return {
      id: channel.id,
      createdAt: channel.createdAt,
      participants: channel.participants.map((p) => ({
        userId: p.userId,
        user: {
          id: p.user.id,
          email: p.user.email,
          firstName: p.user.firstName ?? undefined,
          lastName: p.user.lastName ?? undefined
        }
      })),
      lastMessage: null
    };
  }

  // Get all DM channels for a user
  async getUserChannels(userId: string): Promise<DMChannel[]> {
    const channels = await this.prisma.directMessageChannel.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate unread count for each channel
    const channelsWithUnread = await Promise.all(
      channels.map(async (ch) => {
        const participant = ch.participants.find((p) => p.userId === userId);
        const lastReadAt = participant?.lastReadAt;

        let unreadCount = 0;
        if (lastReadAt) {
          unreadCount = await this.prisma.directMessage.count({
            where: {
              channelId: ch.id,
              createdAt: { gt: lastReadAt },
              authorId: { not: userId }
            }
          });
        } else {
          // If never read, count all messages (excluding own messages)
          unreadCount = await this.prisma.directMessage.count({
            where: {
              channelId: ch.id,
              authorId: { not: userId }
            }
          });
        }

        return {
          id: ch.id,
          createdAt: ch.createdAt,
          participants: ch.participants.map((p) => ({
            userId: p.userId,
            user: {
              id: p.user.id,
              email: p.user.email,
              firstName: p.user.firstName ?? undefined,
              lastName: p.user.lastName ?? undefined
            }
          })),
          lastMessage: ch.messages[0] ?? null,
          unreadCount
        };
      })
    );

    // Sort by last message time (most recent first), channels without messages last
    return channelsWithUnread.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });
  }

  // Get messages in a DM channel
  async getMessages(
    channelId: string,
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<DirectMessage>> {
    // Verify user is participant
    const participant = await this.prisma.directMessageParticipant.findUnique({
      where: { channelId_userId: { channelId, userId } }
    });

    if (!participant) {
      throw new ForbiddenError(
        'You are not a participant in this conversation'
      );
    }

    const limit = Math.min(
      params.limit ?? PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    const messages = await this.prisma.directMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(params.cursor && {
        cursor: { id: params.cursor },
        skip: 1
      }),
      select: {
        id: true,
        channelId: true,
        authorId: true,
        content: true,
        edited: true,
        isPinned: true,
        pinnedAt: true,
        pinnedBy: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        attachments: {
          select: {
            id: true,
            messageId: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true
          }
        },
        reactions: {
          select: {
            id: true,
            messageId: true,
            emoji: true,
            userId: true
          }
        }
      }
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;

    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined
    };
  }

  // Send a DM
  async sendMessage(input: {
    channelId: string;
    authorId: string;
    content: string;
  }): Promise<DirectMessage> {
    if (!input.content.trim()) {
      throw new ValidationError('Message content cannot be empty');
    }

    // Verify author is participant
    const participant = await this.prisma.directMessageParticipant.findUnique({
      where: {
        channelId_userId: { channelId: input.channelId, userId: input.authorId }
      }
    });

    if (!participant) {
      throw new ForbiddenError(
        'You are not a participant in this conversation'
      );
    }

    return this.prisma.directMessage.create({
      data: {
        channelId: input.channelId,
        authorId: input.authorId,
        content: input.content.trim()
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        attachments: true,
        reactions: true
      }
    });
  }

  // Edit a DM
  async editMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<DirectMessage> {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    if (message.authorId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    return this.prisma.directMessage.update({
      where: { id: messageId },
      data: { content: content.trim(), edited: true },
      include: { attachments: true, reactions: true }
    });
  }

  // Delete a DM
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    if (message.authorId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    await this.prisma.directMessage.delete({
      where: { id: messageId }
    });
  }

  // Delete a DM channel (remove user's participation)
  async deleteChannel(channelId: string, userId: string): Promise<void> {
    // Verify user is a participant
    const participant = await this.prisma.directMessageParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId
        }
      }
    });

    if (!participant) {
      throw new NotFoundError('DM Channel', channelId);
    }

    // Delete user's participation (doesn't delete the channel for other user)
    await this.prisma.directMessageParticipant.delete({
      where: {
        channelId_userId: {
          channelId,
          userId
        }
      }
    });
  }

  async pinMessage(
    messageId: string,
    userId: string,
    channelId: string
  ): Promise<DirectMessage> {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    if (message.channelId !== channelId) {
      throw new ValidationError('Message does not belong to this channel');
    }

    // Verify user is participant
    const participant = await this.prisma.directMessageParticipant.findFirst({
      where: { channelId, userId }
    });

    if (!participant) {
      throw new ForbiddenError(
        'You are not a participant in this conversation'
      );
    }

    return this.prisma.directMessage.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: userId
      }
    });
  }

  async unpinMessage(
    messageId: string,
    userId: string,
    channelId: string
  ): Promise<DirectMessage> {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    if (message.channelId !== channelId) {
      throw new ValidationError('Message does not belong to this channel');
    }

    // Verify user is participant
    const participant = await this.prisma.directMessageParticipant.findFirst({
      where: { channelId, userId }
    });

    if (!participant) {
      throw new ForbiddenError(
        'You are not a participant in this conversation'
      );
    }

    return this.prisma.directMessage.update({
      where: { id: messageId },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null
      }
    });
  }

  async getPinnedMessages(
    channelId: string,
    userId: string
  ): Promise<DirectMessage[]> {
    // Verify user is participant
    const participant = await this.prisma.directMessageParticipant.findFirst({
      where: { channelId, userId }
    });

    if (!participant) {
      throw new ForbiddenError(
        'You are not a participant in this conversation'
      );
    }

    return this.prisma.directMessage.findMany({
      where: {
        channelId,
        isPinned: true
      },
      include: {
        attachments: true,
        reactions: true
      },
      orderBy: {
        pinnedAt: 'desc'
      }
    });
  }

  async searchDirectMessages(
    userId: string,
    query: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<DirectMessage>> {
    const limit = Math.min(
      params.limit ?? PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    // Get user's DM channels
    const channelIds = await this.prisma.directMessageParticipant
      .findMany({
        where: { userId },
        select: { channelId: true }
      })
      .then((participants) => participants.map((p) => p.channelId));

    // Search in accessible DM channels
    const messages = await this.prisma.directMessage.findMany({
      where: {
        channelId: { in: channelIds },
        content: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(params.cursor && {
        cursor: { id: params.cursor },
        skip: 1
      }),
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        channel: {
          include: {
            participants: {
              where: { userId: { not: userId } }, // Get other participant(s)
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        attachments: true,
        reactions: true
      }
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
      hasMore
    };
  }
}
