// Message Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { MessageService } from '../../../02-application/services/message.service.js';
import { SOCKET_EVENTS } from '../../../00-core/constants.js';
import { schemas } from '../plugins/validation.js';

const messageService = new MessageService(prisma);

// Query schemas for this route
const getMessagesQuery = z.object({
  channelId: z.string().min(1),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const pinnedQuery = z.object({
  channelId: z.string().min(1)
});

export async function messageRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get messages for a channel (with cursor pagination)
  app.get<{
    Querystring: z.infer<typeof getMessagesQuery>;
  }>(
    '/',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' }
      },
      preHandler: app.validateQuery(getMessagesQuery)
    },
    async (request, reply) => {
      const result = await messageService.getChannelMessages(
        request.query.channelId,
        {
          cursor: request.query.cursor,
          limit: request.query.limit
        }
      );
      // NO CACHE: Messages update frequently via WebSocket
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return { success: true, data: result };
    }
  );

  // Create message (prefer using WebSocket for real-time)
  app.post<{
    Body: z.infer<typeof schemas.createMessage>;
  }>(
    '/',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(schemas.createMessage)
    },
    async (request, reply) => {
      const message = await messageService.createMessage({
        channelId: request.body.channelId,
        authorId: request.user.id,
        content: request.body.content,
        parentId: request.body.parentId
      });

      // Broadcast via socket so all clients get the message in real-time
      const io = app.io;
      if (io) {
        io.to(`channel:${request.body.channelId}`).emit(
          SOCKET_EVENTS.MESSAGE_NEW,
          message
        );

        // Also broadcast to workspace for unread badge updates
        const channel = await prisma.channel.findUnique({
          where: { id: request.body.channelId },
          select: { workspaceId: true }
        });
        if (channel) {
          io.to(`workspace:${channel.workspaceId}`).emit(
            SOCKET_EVENTS.MESSAGE_NEW,
            message
          );
        }
      }

      return reply.status(201).send({ success: true, data: message });
    }
  );

  // Update message
  app.patch<{
    Params: { id: string };
    Body: z.infer<typeof schemas.updateMessage>;
  }>(
    '/:id',
    {
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' }
      },
      preHandler: app.validateBody(schemas.updateMessage)
    },
    async (request) => {
      const message = await messageService.updateMessage(
        request.params.id,
        request.user.id,
        { content: request.body.content }
      );
      return { success: true, data: message };
    }
  );

  // Delete message
  app.delete<{ Params: { id: string } }>('/:id', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
    await messageService.deleteMessage(request.params.id, request.user.id);
    return reply.status(204).send();
  });

  // Pin message
  app.post<{
    Params: { id: string };
    Body: z.infer<typeof schemas.pinMessage>;
  }>(
    '/:id/pin',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      preHandler: app.validateBody(schemas.pinMessage)
    },
    async (request, _reply) => {
      const message = await messageService.pinMessage(
        request.params.id,
        request.user.id,
        request.body.channelId
      );

      // Emit via socket to channel participants
      if (app.io) {
        const room = `channel:${request.body.channelId}`;
        app.io.to(room).emit('message:pinned', message);
      }

      return { success: true, data: message };
    }
  );

  // Unpin message
  app.delete<{
    Params: { id: string };
    Body: z.infer<typeof schemas.pinMessage>;
  }>(
    '/:id/pin',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      preHandler: app.validateBody(schemas.pinMessage)
    },
    async (request, _reply) => {
      const message = await messageService.unpinMessage(
        request.params.id,
        request.body.channelId
      );

      // Emit via socket to channel participants
      if (app.io) {
        const room = `channel:${request.body.channelId}`;
        app.io.to(room).emit('message:unpinned', message);
      }

      return { success: true, data: message };
    }
  );

  // Get pinned messages for a channel
  app.get<{
    Querystring: z.infer<typeof pinnedQuery>;
  }>(
    '/pinned',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' }
      },
      preHandler: app.validateQuery(pinnedQuery)
    },
    async (request, reply) => {
      const messages = await messageService.getPinnedMessages(
        request.query.channelId
      );
      // NO CACHE: Pinned messages can change
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      return { success: true, data: messages };
    }
  );
}
