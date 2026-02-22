// Message Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { MessageService } from '../../../02-application/services/message.service.js';
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
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
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
      preHandler: app.validateBody(schemas.pinMessage)
    },
    async (request, _reply) => {
      const message = await messageService.pinMessage(
        request.params.id,
        request.user.id,
        request.body.channelId
      );
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
      preHandler: app.validateBody(schemas.pinMessage)
    },
    async (request, _reply) => {
      const message = await messageService.unpinMessage(
        request.params.id,
        request.body.channelId
      );
      return { success: true, data: message };
    }
  );

  // Get pinned messages for a channel
  app.get<{
    Querystring: z.infer<typeof pinnedQuery>;
  }>(
    '/pinned',
    {
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
