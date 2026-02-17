// Direct Message Routes
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { DirectMessageService } from '../../../02-application/services/dm.service.js';

const dmService = new DirectMessageService(prisma);

export async function dmRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get user's DM channels
  app.get('/channels', async (request, reply) => {
    const channels = await dmService.getUserChannels(request.user.id);
    reply.cache({ maxAge: 60, staleWhileRevalidate: 300 }); // 1min cache, 5min stale
    return { success: true, data: channels };
  });

  // Get or create DM channel with another user
  app.post<{ Body: { userId: string } }>(
    '/channels',
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
    Querystring: { cursor?: string; limit?: string };
  }>('/channels/:channelId/messages', async (request) => {
    const result = await dmService.getMessages(
      request.params.channelId,
      request.user.id,
      {
        cursor: request.query.cursor,
        limit: request.query.limit
          ? parseInt(request.query.limit, 10)
          : undefined
      }
    );
    return { success: true, data: result };
  });

  // Send DM
  app.post<{
    Params: { channelId: string };
    Body: { content: string };
  }>('/channels/:channelId/messages', async (request, reply) => {
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
  });

  // Edit DM
  app.patch<{
    Params: { messageId: string };
    Body: { content: string };
  }>('/messages/:messageId', async (request) => {
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
  });

  // Delete DM
  app.delete<{ Params: { messageId: string } }>(
    '/messages/:messageId',
    async (request, reply) => {
      await dmService.deleteMessage(request.params.messageId, request.user.id);
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
}
