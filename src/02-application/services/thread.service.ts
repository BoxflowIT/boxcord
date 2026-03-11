// Thread Service - Application Layer
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { PaginationParams, PaginatedResult } from '../../00-core/types.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '../../00-core/errors.js';
import { PAGINATION } from '../../00-core/constants.js';

export interface Thread {
  id: string;
  messageId: string;
  channelId: string;
  workspaceId?: string;
  title: string | null;
  replyCount: number;
  participantCount: number;
  lastReplyAt: Date | null;
  lastReplyBy: string | null;
  isLocked: boolean;
  isArchived: boolean;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadWithDetails extends Thread {
  message?: {
    id: string;
    content: string;
    authorId: string;
    createdAt: Date;
    author?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email: string;
      avatarUrl?: string | null;
    };
  };
  lastReply?: {
    id: string;
    content: string;
    authorId: string;
    createdAt: Date;
    author?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      avatarUrl?: string | null;
    };
  };
  participants?: Array<{
    userId: string;
    lastReadAt: Date | null;
    notifyOnReply: boolean;
  }>;
  isFollowing?: boolean;
  unreadCount?: number;
}

export interface CreateThreadInput {
  messageId: string;
  title: string;
}

export interface UpdateThreadInput {
  title?: string;
  isLocked?: boolean;
  isArchived?: boolean;
  isResolved?: boolean;
}

export interface ThreadReply {
  id: string;
  content: string;
  authorId: string;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
}

export class ThreadService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  /**
   * Create a new thread from a message
   */
  async createThread(
    input: CreateThreadInput,
    userId: string
  ): Promise<ThreadWithDetails> {
    // Verify message exists and user has access
    const message = await this.prisma.message.findUnique({
      where: { id: input.messageId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check if message already has a thread
    const existingThread = await this.prisma.thread.findUnique({
      where: { messageId: input.messageId }
    });

    if (existingThread) {
      throw new ValidationError('Message already has a thread');
    }

    // Check if this message is already a reply
    if (message.parentId) {
      throw new ValidationError('Cannot create thread on a reply message');
    }

    // Create thread
    const thread = await this.prisma.thread.create({
      data: {
        messageId: input.messageId,
        channelId: message.channelId, // Get channelId from the message
        title: input.title,
        participants: {
          create: [
            {
              userId: message.authorId, // Original message author automatically follows
              notifyOnReply: true
            },
            ...(userId !== message.authorId
              ? [
                  {
                    userId, // Thread creator follows if different from author
                    notifyOnReply: true
                  }
                ]
              : [])
          ]
        }
      },
      include: {
        message: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            notifyOnReply: true
          }
        }
      }
    });

    // Resolve workspaceId from channel
    const channel = await this.prisma.channel.findUnique({
      where: { id: thread.channelId },
      select: { workspaceId: true }
    });

    return {
      ...thread,
      workspaceId: channel?.workspaceId,
      isFollowing: thread.participants.some((p) => p.userId === userId),
      unreadCount: 0
    };
  }

  /**
   * Get thread by ID with details
   */
  async getThread(
    threadId: string,
    userId: string
  ): Promise<ThreadWithDetails | null> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        message: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            notifyOnReply: true
          }
        }
      }
    });

    if (!thread) {
      return null;
    }

    // Resolve workspaceId from channel
    const channel = await this.prisma.channel.findUnique({
      where: { id: thread.channelId },
      select: { workspaceId: true }
    });

    // Get last reply if exists
    const lastReply = thread.lastReplyBy
      ? await this.prisma.message.findFirst({
          where: {
            parentId: thread.messageId,
            authorId: thread.lastReplyBy
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            authorId: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        })
      : null;

    const participant = thread.participants.find((p) => p.userId === userId);
    const unreadCount = participant?.lastReadAt
      ? await this.prisma.message.count({
          where: {
            parentId: thread.messageId,
            createdAt: { gt: participant.lastReadAt }
          }
        })
      : thread.replyCount;

    return {
      ...thread,
      workspaceId: channel?.workspaceId,
      lastReply: lastReply ?? undefined,
      isFollowing: !!participant,
      unreadCount
    };
  }

  /**
   * Get thread by message ID
   */
  async getThreadByMessageId(
    messageId: string,
    userId: string
  ): Promise<ThreadWithDetails | null> {
    const thread = await this.prisma.thread.findUnique({
      where: { messageId },
      include: {
        message: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            notifyOnReply: true
          }
        }
      }
    });

    if (!thread) {
      return null;
    }

    // Resolve workspaceId from channel
    const channelForWs = await this.prisma.channel.findUnique({
      where: { id: thread.channelId },
      select: { workspaceId: true }
    });

    const participant = thread.participants.find((p) => p.userId === userId);
    const unreadCount = participant?.lastReadAt
      ? await this.prisma.message.count({
          where: {
            parentId: thread.messageId,
            createdAt: { gt: participant.lastReadAt }
          }
        })
      : thread.replyCount;

    return {
      ...thread,
      workspaceId: channelForWs?.workspaceId,
      isFollowing: !!participant,
      unreadCount
    };
  }

  /**
   * Get replies for a thread
   */
  async getThreadReplies(
    threadId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<ThreadReply>> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { messageId: true }
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const limit = Math.min(
      params.limit ?? PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    const replies = await this.prisma.message.findMany({
      where: { parentId: thread.messageId },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(params.cursor && {
        cursor: { id: params.cursor },
        skip: 1
      }),
      select: {
        id: true,
        content: true,
        authorId: true,
        parentId: true,
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
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true
          }
        },
        reactions: {
          select: { id: true, emoji: true, userId: true }
        }
      }
    });

    const hasMore = replies.length > limit;
    const items = hasMore ? replies.slice(0, -1) : replies;

    // Aggregate reactions by emoji
    const itemsWithAggregatedReactions = items.map((item) => {
      const reactionMap = new Map<
        string,
        { emoji: string; count: number; users: string[] }
      >();

      if (item.reactions) {
        for (const reaction of item.reactions) {
          const existing = reactionMap.get(reaction.emoji);
          if (existing) {
            existing.count++;
            existing.users.push(reaction.userId);
          } else {
            reactionMap.set(reaction.emoji, {
              emoji: reaction.emoji,
              count: 1,
              users: [reaction.userId]
            });
          }
        }
      }

      return {
        ...item,
        reactions: Array.from(reactionMap.values())
      };
    });

    return {
      items: itemsWithAggregatedReactions as unknown as ThreadReply[],
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      hasMore
    };
  }

  /**
   * Add a reply to a thread
   */
  async addReply(
    threadId: string,
    content: string,
    userId: string,
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>
  ): Promise<ThreadReply> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { messageId: true, isLocked: true, channelId: true }
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    if (thread.isLocked) {
      throw new ForbiddenError('Thread is locked');
    }

    // Create reply message
    const reply = await this.prisma.message.create({
      data: {
        channelId: thread.channelId,
        authorId: userId,
        content,
        parentId: thread.messageId,
        attachments: attachments
          ? {
              create: attachments
            }
          : undefined
      },
      include: {
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
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true
          }
        },
        reactions: {
          select: { id: true, emoji: true, userId: true }
        }
      }
    });

    // Update thread metadata
    await this.prisma.thread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
        lastReplyBy: userId
      }
    });

    // Add user as participant if not already
    await this.prisma.threadParticipant.upsert({
      where: {
        threadId_userId: {
          threadId,
          userId
        }
      },
      create: {
        threadId,
        userId,
        notifyOnReply: true
      },
      update: {
        lastReadAt: new Date() // Mark as read when replying
      }
    });

    // Update participant count
    const participantCount = await this.prisma.threadParticipant.count({
      where: { threadId }
    });

    await this.prisma.thread.update({
      where: { id: threadId },
      data: { participantCount }
    });

    return reply as unknown as ThreadReply;
  }

  /**
   * Follow/unfollow a thread
   */
  async toggleFollow(
    threadId: string,
    userId: string,
    shouldFollow: boolean
  ): Promise<void> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    if (shouldFollow) {
      await this.prisma.threadParticipant.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId
          }
        },
        create: {
          threadId,
          userId,
          notifyOnReply: true
        },
        update: {
          notifyOnReply: true
        }
      });
    } else {
      await this.prisma.threadParticipant.delete({
        where: {
          threadId_userId: {
            threadId,
            userId
          }
        }
      });
    }

    // Update participant count
    const participantCount = await this.prisma.threadParticipant.count({
      where: { threadId }
    });

    await this.prisma.thread.update({
      where: { id: threadId },
      data: { participantCount }
    });
  }

  /**
   * Mark thread as read
   */
  async markAsRead(threadId: string, userId: string): Promise<void> {
    await this.prisma.threadParticipant.updateMany({
      where: {
        threadId,
        userId
      },
      data: {
        lastReadAt: new Date()
      }
    });
  }

  /**
   * Update thread settings
   */
  async updateThread(
    threadId: string,
    input: UpdateThreadInput,
    userId: string
  ): Promise<ThreadWithDetails> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        message: {
          select: { authorId: true }
        }
      }
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    // Allow update if user is the message author OR a participant of the thread
    const isParticipant = await this.prisma.threadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId
        }
      }
    });

    if (thread.message.authorId !== userId && !isParticipant) {
      throw new ForbiddenError(
        'Only thread creator or participants can update thread'
      );
    }

    const updated = await this.prisma.thread.update({
      where: { id: threadId },
      data: input,
      include: {
        message: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            notifyOnReply: true
          }
        }
      }
    });

    return {
      ...updated,
      isFollowing: updated.participants.some((p) => p.userId === userId),
      unreadCount: 0
    };
  }

  /**
   * Search threads by title or parent message content
   */
  async searchThreads(
    userId: string,
    query: string,
    params: PaginationParams & { channelId?: string } = {}
  ): Promise<PaginatedResult<ThreadWithDetails>> {
    const limit = Math.min(
      params.limit ?? PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    // Build where clause: search title OR parent message content
    const searchFilter = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        {
          message: {
            content: { contains: query, mode: 'insensitive' as const }
          }
        }
      ],
      ...(params.channelId && { channelId: params.channelId })
    };

    const threads = await this.prisma.thread.findMany({
      where: searchFilter,
      orderBy: { lastReplyAt: 'desc' },
      take: limit + 1,
      ...(params.cursor && {
        cursor: { id: params.cursor },
        skip: 1
      }),
      include: {
        message: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            notifyOnReply: true
          }
        }
      }
    });

    const hasMore = threads.length > limit;
    const items = hasMore ? threads.slice(0, -1) : threads;

    const itemsWithMeta = items.map((thread) => {
      const participant = thread.participants.find((p) => p.userId === userId);
      return {
        ...thread,
        isFollowing: !!participant,
        unreadCount: 0 // Search results don't need unread count
      };
    });

    return {
      items: itemsWithMeta,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      hasMore
    };
  }

  /**
   * Get all threads in a channel
   */
  async getChannelThreads(
    channelId: string,
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<ThreadWithDetails>> {
    const limit = Math.min(
      params.limit ?? PAGINATION.DEFAULT_PAGE_SIZE,
      PAGINATION.MAX_PAGE_SIZE
    );

    // Resolve workspaceId from channel (same for all threads)
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { workspaceId: true }
    });

    const threads = await this.prisma.thread.findMany({
      where: { channelId },
      orderBy: { lastReplyAt: 'desc' },
      take: limit + 1,
      ...(params.cursor && {
        cursor: { id: params.cursor },
        skip: 1
      }),
      include: {
        message: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        },
        participants: {
          select: {
            userId: true,
            lastReadAt: true,
            notifyOnReply: true
          }
        }
      }
    });

    const hasMore = threads.length > limit;
    const items = hasMore ? threads.slice(0, -1) : threads;

    // Calculate unread counts for each thread
    const itemsWithUnread = await Promise.all(
      items.map(async (thread) => {
        const participant = thread.participants.find(
          (p) => p.userId === userId
        );
        const unreadCount = participant?.lastReadAt
          ? await this.prisma.message.count({
              where: {
                parentId: thread.messageId,
                createdAt: { gt: participant.lastReadAt }
              }
            })
          : thread.replyCount;

        return {
          ...thread,
          workspaceId: channel?.workspaceId,
          isFollowing: !!participant,
          unreadCount
        };
      })
    );

    return {
      items: itemsWithUnread,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      hasMore
    };
  }

  /**
   * Delete a thread (admin only)
   */
  async deleteThread(threadId: string, userId: string): Promise<void> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        message: {
          select: { authorId: true }
        }
      }
    });

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    // Allow delete if user is the message author OR a participant of the thread
    const isParticipant = await this.prisma.threadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId
        }
      }
    });

    if (thread.message.authorId !== userId && !isParticipant) {
      throw new ForbiddenError(
        'Only thread creator or participants can delete thread'
      );
    }

    // Delete all reply messages (reactions/attachments cascade via DB foreign keys)
    await this.prisma.message.deleteMany({
      where: { parentId: thread.messageId }
    });

    await this.prisma.thread.delete({
      where: { id: threadId }
    });
  }

  /**
   * Get analytics for a single thread
   */
  async getThreadAnalytics(threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        participants: { select: { userId: true } }
      }
    });

    if (!thread) throw new NotFoundError('Thread not found');

    // Get reply messages for detailed analytics
    const replies = await this.prisma.message.findMany({
      where: { parentId: thread.messageId },
      select: { authorId: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const now = new Date();
    const createdAt = new Date(thread.createdAt);
    const ageMs = now.getTime() - createdAt.getTime();
    const ageDays = Math.max(1, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

    // Time to first reply
    const firstReplyAt = replies.length > 0 ? replies[0].createdAt : null;
    const timeToFirstReplyMs = firstReplyAt
      ? firstReplyAt.getTime() - createdAt.getTime()
      : null;

    // Time since last activity
    const lastActivity = thread.lastReplyAt || createdAt;
    const timeSinceLastActivityMs = now.getTime() - lastActivity.getTime();

    // Most active participants
    const participantReplyCounts: Record<string, number> = {};
    for (const reply of replies) {
      participantReplyCounts[reply.authorId] =
        (participantReplyCounts[reply.authorId] || 0) + 1;
    }
    const topParticipants = Object.entries(participantReplyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({ userId, replyCount: count }));

    return {
      threadId: thread.id,
      replyCount: thread.replyCount,
      participantCount: thread.participantCount,
      ageDays,
      repliesPerDay: Number((thread.replyCount / ageDays).toFixed(1)),
      timeToFirstReplyMs,
      timeSinceLastActivityMs,
      isStale:
        timeSinceLastActivityMs > 7 * 24 * 60 * 60 * 1000 &&
        !thread.isResolved &&
        !thread.isArchived,
      topParticipants
    };
  }

  /**
   * Get channel-level thread analytics
   */
  async getChannelThreadAnalytics(channelId: string) {
    const threads = await this.prisma.thread.findMany({
      where: { channelId },
      select: {
        id: true,
        replyCount: true,
        participantCount: true,
        lastReplyAt: true,
        isLocked: true,
        isArchived: true,
        isResolved: true,
        createdAt: true,
        title: true
      }
    });

    const totalThreads = threads.length;
    if (totalThreads === 0) {
      return {
        totalThreads: 0,
        activeThreads: 0,
        resolvedThreads: 0,
        archivedThreads: 0,
        lockedThreads: 0,
        totalReplies: 0,
        averageRepliesPerThread: 0,
        averageParticipantsPerThread: 0,
        mostActiveThreads: [],
        staleThreads: []
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const resolvedThreads = threads.filter((t) => t.isResolved).length;
    const archivedThreads = threads.filter((t) => t.isArchived).length;
    const lockedThreads = threads.filter((t) => t.isLocked).length;
    const activeThreads = threads.filter(
      (t) =>
        !t.isArchived &&
        !t.isResolved &&
        t.lastReplyAt &&
        new Date(t.lastReplyAt) > sevenDaysAgo
    ).length;

    const totalReplies = threads.reduce((sum, t) => sum + t.replyCount, 0);
    const totalParticipants = threads.reduce(
      (sum, t) => sum + t.participantCount,
      0
    );

    const mostActiveThreads = [...threads]
      .sort((a, b) => b.replyCount - a.replyCount)
      .slice(0, 5)
      .map((t) => ({ id: t.id, title: t.title, replyCount: t.replyCount }));

    const staleThreads = threads.filter(
      (t) =>
        !t.isArchived &&
        !t.isResolved &&
        (!t.lastReplyAt || new Date(t.lastReplyAt) < sevenDaysAgo)
    ).length;

    return {
      totalThreads,
      activeThreads,
      resolvedThreads,
      archivedThreads,
      lockedThreads,
      totalReplies,
      averageRepliesPerThread: Number((totalReplies / totalThreads).toFixed(1)),
      averageParticipantsPerThread: Number(
        (totalParticipants / totalThreads).toFixed(1)
      ),
      mostActiveThreads,
      staleThreads
    };
  }
}
