// Thread Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { ThreadService } from '../../../02-application/services/thread.service.js';
import { PushService } from '../../../02-application/services/push.service.js';
import { SOCKET_EVENTS } from '../../../00-core/constants.js';

const threadService = new ThreadService(prisma);
const pushService = new PushService(prisma);

// Extract mentions from content (@user@domain.com)
function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}

// Schemas
const createThreadSchema = z.object({
  messageId: z.string().uuid(),
  title: z.string().min(1).max(100)
});

const updateThreadSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  isLocked: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isResolved: z.boolean().optional()
});

const addReplySchema = z.object({
  content: z.string().min(1).max(4000),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileType: z.string(),
        fileSize: z.number().int().positive()
      })
    )
    .optional()
});

const toggleFollowSchema = z.object({
  shouldFollow: z.boolean()
});

const getThreadsQuery = z.object({
  channelId: z.string().min(1),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const getRepliesQuery = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const searchThreadsQuery = z.object({
  q: z.string().min(2).max(200),
  channelId: z.string().min(1).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export async function threadRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get threads in a channel
  app.get<{
    Querystring: z.infer<typeof getThreadsQuery>;
  }>(
    '/',
    {
      preHandler: app.validateQuery(getThreadsQuery)
    },
    async (request, reply) => {
      const result = await threadService.getChannelThreads(
        request.query.channelId,
        request.user.id,
        {
          cursor: request.query.cursor,
          limit: request.query.limit
        }
      );

      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return { success: true, data: result };
    }
  );

  // Search threads by title or message content
  app.get<{
    Querystring: z.infer<typeof searchThreadsQuery>;
  }>(
    '/search',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateQuery(searchThreadsQuery)
    },
    async (request, reply) => {
      const { q, channelId, cursor, limit } = request.query;

      const result = await threadService.searchThreads(request.user.id, q, {
        channelId,
        cursor,
        limit
      });

      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return { success: true, data: result };
    }
  );

  // Get analytics for a specific thread
  app.get<{
    Params: { id: string };
  }>('/:id/analytics', async (request) => {
    const analytics = await threadService.getThreadAnalytics(request.params.id);
    return { success: true, data: analytics };
  });

  // Get channel-level thread analytics
  app.get<{
    Querystring: { channelId: string };
  }>(
    '/analytics',
    {
      preHandler: app.validateQuery(z.object({ channelId: z.string().min(1) }))
    },
    async (request, reply) => {
      const analytics = await threadService.getChannelThreadAnalytics(
        request.query.channelId
      );
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return { success: true, data: analytics };
    }
  );

  // Create a thread
  app.post<{
    Body: z.infer<typeof createThreadSchema>;
  }>(
    '/',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(createThreadSchema)
    },
    async (request, reply) => {
      const thread = await threadService.createThread(
        request.body,
        request.user.id
      );

      // Broadcast to WebSocket if io is available
      const io = app.io;
      if (io) {
        // Get the message to find the channel
        const message = await prisma.message.findUnique({
          where: { id: request.body.messageId },
          select: { channelId: true }
        });

        if (message) {
          // Broadcast to channel room
          io.to(`channel:${message.channelId}`).emit(
            SOCKET_EVENTS.THREAD_CREATED,
            { thread }
          );
        }
      }

      return reply.status(201).send({ success: true, data: thread });
    }
  );

  // Get thread by ID
  app.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    const thread = await threadService.getThread(
      request.params.id,
      request.user.id
    );

    if (!thread) {
      return reply.status(404).send({
        success: false,
        message: 'Thread not found'
      });
    }

    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    return { success: true, data: thread };
  });

  // Get thread by message ID
  app.get<{
    Params: { messageId: string };
  }>('/by-message/:messageId', async (request, reply) => {
    const thread = await threadService.getThreadByMessageId(
      request.params.messageId,
      request.user.id
    );

    if (!thread) {
      return reply.status(404).send({
        success: false,
        message: 'Thread not found'
      });
    }

    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    return { success: true, data: thread };
  });

  // Update thread
  app.patch<{
    Params: { id: string };
    Body: z.infer<typeof updateThreadSchema>;
  }>(
    '/:id',
    {
      preHandler: app.validateBody(updateThreadSchema)
    },
    async (request) => {
      const thread = await threadService.updateThread(
        request.params.id,
        request.body,
        request.user.id
      );

      // Broadcast to WebSocket if io is available
      const io = app.io;
      if (io) {
        // Broadcast to channel room
        io.to(`channel:${thread.channelId}`).emit(
          SOCKET_EVENTS.THREAD_UPDATED,
          { thread }
        );
      }

      return { success: true, data: thread };
    }
  );

  // Delete thread
  app.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    // Get thread info before deletion for broadcasting
    const thread = await prisma.thread.findUnique({
      where: { id: request.params.id },
      select: { channelId: true }
    });

    await threadService.deleteThread(request.params.id, request.user.id);

    // Broadcast to WebSocket if io is available
    const io = app.io;
    if (io && thread) {
      // Broadcast to channel room
      io.to(`channel:${thread.channelId}`).emit(SOCKET_EVENTS.THREAD_DELETED, {
        threadId: request.params.id
      });
    }

    return reply.status(204).send();
  });

  // Get replies for a thread
  app.get<{
    Params: { id: string };
    Querystring: z.infer<typeof getRepliesQuery>;
  }>(
    '/:id/replies',
    {
      preHandler: app.validateQuery(getRepliesQuery)
    },
    async (request, reply) => {
      const result = await threadService.getThreadReplies(request.params.id, {
        cursor: request.query.cursor,
        limit: request.query.limit
      });

      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return { success: true, data: result };
    }
  );

  // Add reply to thread
  app.post<{
    Params: { id: string };
    Body: z.infer<typeof addReplySchema>;
  }>(
    '/:id/replies',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(addReplySchema)
    },
    async (request, reply) => {
      const reply_message = await threadService.addReply(
        request.params.id,
        request.body.content,
        request.user.id,
        request.body.attachments
      );

      // Broadcast to WebSocket if io is available
      const io = app.io;
      if (io) {
        // Get thread and channel info
        const thread = await prisma.thread.findUnique({
          where: { id: request.params.id },
          select: { channelId: true }
        });

        if (thread) {
          // Broadcast to channel room
          io.to(`channel:${thread.channelId}`).emit(
            SOCKET_EVENTS.THREAD_REPLY,
            {
              threadId: request.params.id,
              reply: reply_message
            }
          );
        }
      }

      // Handle mentions in thread reply
      const mentions = extractMentions(request.body.content);
      if (mentions.length > 0) {
        const threadForMention = await prisma.thread.findUnique({
          where: { id: request.params.id },
          select: { title: true, channelId: true }
        });

        const author = await prisma.user.findUnique({
          where: { id: request.user.id },
          select: { firstName: true, lastName: true, email: true }
        });

        if (threadForMention && author) {
          const authorName =
            author.firstName && author.lastName
              ? `${author.firstName} ${author.lastName}`
              : author.email;

          const mentionedUsers = await prisma.user.findMany({
            where: { email: { in: mentions } },
            select: { id: true }
          });

          for (const mentionedUser of mentionedUsers) {
            if (mentionedUser.id !== request.user.id) {
              try {
                await pushService.notifyMention(
                  mentionedUser.id,
                  authorName,
                  threadForMention.title || 'Thread',
                  threadForMention.channelId,
                  request.body.content
                );
              } catch {
                // Push notification failure is non-critical
              }
            }
          }
        }
      }

      return reply.status(201).send({ success: true, data: reply_message });
    }
  );

  // Follow/unfollow thread
  app.post<{
    Params: { id: string };
    Body: z.infer<typeof toggleFollowSchema>;
  }>(
    '/:id/follow',
    {
      preHandler: app.validateBody(toggleFollowSchema)
    },
    async (request, reply) => {
      await threadService.toggleFollow(
        request.params.id,
        request.user.id,
        request.body.shouldFollow
      );

      return reply.status(200).send({ success: true });
    }
  );

  // Mark thread as read
  app.post<{
    Params: { id: string };
  }>('/:id/read', async (request, reply) => {
    await threadService.markAsRead(request.params.id, request.user.id);
    return reply.status(200).send({ success: true });
  });

  // Edit thread reply
  const editReplySchema = z.object({
    content: z.string().min(1).max(4000)
  });

  app.patch<{
    Params: { id: string; replyId: string };
    Body: z.infer<typeof editReplySchema>;
  }>(
    '/:id/replies/:replyId',
    {
      preHandler: app.validateBody(editReplySchema)
    },
    async (request, reply) => {
      // Get the reply to check ownership
      const replyMessage = await prisma.message.findUnique({
        where: { id: request.params.replyId }
      });

      if (!replyMessage) {
        return reply.status(404).send({ error: 'Reply not found' });
      }

      if (replyMessage.authorId !== request.user.id) {
        return reply
          .status(403)
          .send({ error: 'Not authorized to edit this reply' });
      }

      // Update the reply
      const updatedReply = await prisma.message.update({
        where: { id: request.params.replyId },
        data: {
          content: request.body.content,
          edited: true
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Broadcast to WebSocket if io is available
      const io = app.io;
      if (io) {
        // Get thread and channel info
        const thread = await prisma.thread.findUnique({
          where: { id: request.params.id },
          select: { channelId: true }
        });

        if (thread) {
          // Broadcast to channel room
          io.to(`channel:${thread.channelId}`).emit(
            SOCKET_EVENTS.THREAD_REPLY_EDITED,
            {
              threadId: request.params.id,
              replyId: request.params.replyId,
              content: request.body.content,
              userId: request.user.id
            }
          );
        }
      }

      return reply.status(200).send({ success: true, data: updatedReply });
    }
  );

  // Delete thread reply
  app.delete<{
    Params: { id: string; replyId: string };
  }>('/:id/replies/:replyId', async (request, reply) => {
    // Get the reply to check ownership
    const replyMessage = await prisma.message.findUnique({
      where: { id: request.params.replyId }
    });

    if (!replyMessage) {
      return reply.status(404).send({ error: 'Reply not found' });
    }

    if (replyMessage.authorId !== request.user.id) {
      return reply
        .status(403)
        .send({ error: 'Not authorized to delete this reply' });
    }

    // Delete the reply
    await prisma.message.delete({
      where: { id: request.params.replyId }
    });

    // Get thread info before updating
    const thread = await prisma.thread.findUnique({
      where: { id: request.params.id },
      select: { channelId: true, replyCount: true }
    });

    if (thread) {
      // Update thread reply count
      await prisma.thread.update({
        where: { id: request.params.id },
        data: {
          replyCount: Math.max(0, thread.replyCount - 1)
        }
      });

      // Broadcast to WebSocket if io is available
      const io = app.io;
      if (io) {
        // Broadcast to channel room
        io.to(`channel:${thread.channelId}`).emit(
          SOCKET_EVENTS.THREAD_REPLY_DELETED,
          {
            threadId: request.params.id,
            replyId: request.params.replyId
          }
        );
      }
    }

    return reply.status(200).send({ success: true });
  });

  // Add reaction to thread reply
  const addReactionSchema = z.object({
    emoji: z.string().min(1).max(10)
  });

  app.post<{
    Params: { id: string; replyId: string };
    Body: z.infer<typeof addReactionSchema>;
  }>(
    '/:id/replies/:replyId/reactions',
    {
      preHandler: app.validateBody(addReactionSchema)
    },
    async (request, reply) => {
      // Get the thread to know the root message
      const thread = await prisma.thread.findUnique({
        where: { id: request.params.id },
        select: { messageId: true, channelId: true }
      });

      if (!thread) {
        return reply.status(404).send({ error: 'Thread not found' });
      }

      // Check if reply exists AND is actually a reply in this thread (not the root message)
      const replyMessage = await prisma.message.findUnique({
        where: { id: request.params.replyId }
      });

      if (!replyMessage) {
        return reply.status(404).send({ error: 'Reply not found' });
      }

      if (replyMessage.parentId !== thread.messageId) {
        return reply
          .status(400)
          .send({ error: 'Message is not a reply in this thread' });
      }

      // Add/update reaction
      const reaction = await prisma.reaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId: request.params.replyId,
            userId: request.user.id,
            emoji: request.body.emoji
          }
        },
        create: {
          messageId: request.params.replyId,
          userId: request.user.id,
          emoji: request.body.emoji
        },
        update: {}
      });

      // Broadcast to WebSocket if io is available
      const io = app.io;
      if (io) {
        // Broadcast to channel room
        io.to(`channel:${thread.channelId}`).emit(
          SOCKET_EVENTS.THREAD_REPLY_REACTION,
          {
            threadId: request.params.id,
            replyId: request.params.replyId,
            emoji: request.body.emoji,
            action: 'add',
            userId: request.user.id
          }
        );
      }

      return reply.status(200).send({ success: true, data: reaction });
    }
  );

  // Remove reaction from thread reply
  app.delete<{
    Params: { id: string; replyId: string; emoji: string };
  }>('/:id/replies/:replyId/reactions/:emoji', async (request, reply) => {
    // Get thread to validate and for broadcasting
    const thread = await prisma.thread.findUnique({
      where: { id: request.params.id },
      select: { messageId: true, channelId: true }
    });

    if (!thread) {
      return reply.status(404).send({ error: 'Thread not found' });
    }

    // Validate: replyId must be an actual reply in this thread
    const replyMessage = await prisma.message.findUnique({
      where: { id: request.params.replyId },
      select: { parentId: true }
    });

    if (!replyMessage || replyMessage.parentId !== thread.messageId) {
      return reply
        .status(400)
        .send({ error: 'Message is not a reply in this thread' });
    }

    await prisma.reaction.deleteMany({
      where: {
        messageId: request.params.replyId,
        userId: request.user.id,
        emoji: request.params.emoji
      }
    });

    // Broadcast to WebSocket if io is available
    const io = app.io;
    if (io) {
      // Broadcast to channel room
      io.to(`channel:${thread.channelId}`).emit(
        SOCKET_EVENTS.THREAD_REPLY_REACTION,
        {
          threadId: request.params.id,
          replyId: request.params.replyId,
          emoji: request.params.emoji,
          action: 'remove',
          userId: request.user.id
        }
      );
    }

    return reply.status(200).send({ success: true });
  });
}
