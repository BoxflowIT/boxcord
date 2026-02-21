// Direct Message Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { DirectMessageService } from '../../../02-application/services/dm.service.js';
import { schemas } from '../plugins/validation.js';

const dmService = new DirectMessageService(prisma);

// Local schemas
const createDMChannelBody = z.object({
  userId: z.string().min(1)
});

const getMessagesQuery = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const channelIdBody = z.object({
  channelId: z.string().min(1)
});

export async function dmRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get user's DM channels
  app.get('/channels', async (request, reply) => {
    const channels = await dmService.getUserChannels(request.user.id);
    // NO CACHE: DM list changes frequently (new messages, unread counts)
    // Socket events keep React Query cache fresh instead
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    return { success: true, data: channels };
  });

  // Get or create DM channel with another user
  app.post<{ Body: z.infer<typeof createDMChannelBody> }>(
    '/channels',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(createDMChannelBody)
    },
    async (request, reply) => {
      const channel = await dmService.getOrCreateChannel(
        request.user.id,
        request.body.userId
      );
      return reply.status(201).send({ success: true, data: channel });
    }
  );

  // Get messages in a DM channel
  app.get<{
    Params: { channelId: string };
    Querystring: z.infer<typeof getMessagesQuery>;
  }>(
    '/channels/:channelId/messages',
    {
      preHandler: app.validateQuery(getMessagesQuery)
    },
    async (request) => {
      const result = await dmService.getMessages(
        request.params.channelId,
        request.user.id,
        {
          cursor: request.query.cursor,
          limit: request.query.limit
        }
      );
      return { success: true, data: result };
    }
  );

  // Send DM
  app.post<{
    Params: { channelId: string };
    Body: z.infer<typeof schemas.sendDM>;
  }>(
    '/channels/:channelId/messages',
    {
      preHandler: app.validateBody(schemas.sendDM)
    },
    async (request, reply) => {
      const message = await dmService.sendMessage({
        channelId: request.params.channelId,
        authorId: request.user.id,
        content: request.body.content
      });

      // Emit via socket to recipient
      if (app.io) {
        app.io.to(`dm:${request.params.channelId}`).emit('dm:new', message);
      }

      return reply.status(201).send({ success: true, data: message });
    }
  );

  // Edit DM
  app.patch<{
    Params: { messageId: string };
    Body: z.infer<typeof schemas.sendDM>;
  }>(
    '/messages/:messageId',
    {
      preHandler: app.validateBody(schemas.sendDM)
    },
    async (request) => {
      const message = await dmService.editMessage(
        request.params.messageId,
        request.user.id,
        request.body.content
      );

      // Emit via socket
      if (app.io) {
        app.io.to(`dm:${message.channelId}`).emit('dm:edit', message);
      }

      return { success: true, data: message };
    }
  );

  // Delete DM
  app.delete<{ Params: { messageId: string } }>(
    '/messages/:messageId',
    async (request, reply) => {
      await dmService.deleteMessage(request.params.messageId, request.user.id);
      return reply.status(204).send();
    }
  );

  // Delete DM channel (remove user's participation)
  app.delete<{ Params: { channelId: string } }>(
    '/channels/:channelId',
    async (request, reply) => {
      await dmService.deleteChannel(request.params.channelId, request.user.id);
      return reply.status(204).send();
    }
  );

  // Mark DM channel as read
  app.post<{ Params: { channelId: string } }>(
    '/channels/:channelId/read',
    async (request, reply) => {
      // Use upsert to create participant if it doesn't exist
      await prisma.directMessageParticipant.upsert({
        where: {
          channelId_userId: {
            channelId: request.params.channelId,
            userId: request.user.id
          }
        },
        update: {
          lastReadAt: new Date()
        },
        create: {
          channelId: request.params.channelId,
          userId: request.user.id,
          lastReadAt: new Date()
        }
      });

      return reply.status(204).send();
    }
  );

  // Pin DM
  app.post<{
    Params: { messageId: string };
    Body: z.infer<typeof channelIdBody>;
  }>(
    '/messages/:messageId/pin',
    {
      preHandler: app.validateBody(channelIdBody)
    },
    async (request, _reply) => {
      const message = await dmService.pinMessage(
        request.params.messageId,
        request.user.id,
        request.body.channelId
      );

      // Emit via socket to participants
      if (app.io) {
        const room = `dm:${request.body.channelId}`;
        app.io.to(room).emit('dm:pinned', message);
      }

      return { success: true, data: message };
    }
  );

  // Unpin DM
  app.delete<{
    Params: { messageId: string };
    Body: z.infer<typeof channelIdBody>;
  }>(
    '/messages/:messageId/pin',
    {
      preHandler: app.validateBody(channelIdBody)
    },
    async (request, _reply) => {
      const message = await dmService.unpinMessage(
        request.params.messageId,
        request.user.id,
        request.body.channelId
      );

      // Emit via socket to participants
      if (app.io) {
        const room = `dm:${request.body.channelId}`;
        app.io.to(room).emit('dm:unpinned', message);
      }

      return { success: true, data: message };
    }
  );

  // Get pinned messages in DM channel
  app.get<{
    Params: { channelId: string };
  }>('/channels/:channelId/pinned', async (request, _reply) => {
    const messages = await dmService.getPinnedMessages(
      request.params.channelId,
      request.user.id
    );
    return { success: true, data: messages };
  });
}
