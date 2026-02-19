// Message Routes
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { MessageService } from '../../../02-application/services/message.service.js';

const messageService = new MessageService(prisma);

export async function messageRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get messages for a channel (with cursor pagination)
  app.get<{
    Querystring: { channelId: string; cursor?: string; limit?: string };
  }>('/', async (request, reply) => {
    const result = await messageService.getChannelMessages(
      request.query.channelId,
      {
        cursor: request.query.cursor,
        limit: request.query.limit
          ? parseInt(request.query.limit, 10)
          : undefined
      }
    );
    reply.cache({ maxAge: 30, staleWhileRevalidate: 120 }); // 30s cache, 2min stale
    return { success: true, data: result };
  });

  // Create message (prefer using WebSocket for real-time)
  app.post<{
    Body: { channelId: string; content: string; parentId?: string };
  }>('/', async (request, reply) => {
    const message = await messageService.createMessage({
      channelId: request.body.channelId,
      authorId: request.user.id,
      content: request.body.content,
      parentId: request.body.parentId
    });
    return reply.status(201).send({ success: true, data: message });
  });

  // Update message
  app.patch<{
    Params: { id: string };
    Body: { content: string };
  }>('/:id', async (request) => {
    const message = await messageService.updateMessage(
      request.params.id,
      request.user.id,
      { content: request.body.content }
    );
    return { success: true, data: message };
  });

  // Delete message
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await messageService.deleteMessage(request.params.id, request.user.id);
    return reply.status(204).send();
  });

  // Pin message
  app.post<{
    Params: { id: string };
    Body: { channelId: string };
  }>('/:id/pin', async (request, reply) => {
    const message = await messageService.pinMessage(
      request.params.id,
      request.user.id,
      request.body.channelId
    );
    return { success: true, data: message };
  });

  // Unpin message
  app.delete<{
    Params: { id: string };
    Body: { channelId: string };
  }>('/:id/pin', async (request, reply) => {
    const message = await messageService.unpinMessage(
      request.params.id,
      request.body.channelId
    );
    return { success: true, data: message };
  });

  // Get pinned messages for a channel
  app.get<{
    Querystring: { channelId: string };
  }>('/pinned', async (request, reply) => {
    const messages = await messageService.getPinnedMessages(
      request.query.channelId
    );
    reply.cache({ maxAge: 30 });
    return { success: true, data: messages };
  });
}
