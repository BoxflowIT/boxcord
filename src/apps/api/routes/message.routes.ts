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
  }>('/', async (request) => {
    const result = await messageService.getChannelMessages(
      request.query.channelId,
      {
        cursor: request.query.cursor,
        limit: request.query.limit
          ? parseInt(request.query.limit, 10)
          : undefined
      }
    );
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
}
