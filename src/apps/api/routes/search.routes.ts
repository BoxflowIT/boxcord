// Search Routes - Global search across messages and DMs
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { MessageService } from '../../../02-application/services/message.service.js';
import { DirectMessageService } from '../../../02-application/services/dm.service.js';

const messageService = new MessageService(prisma);
const dmService = new DirectMessageService(prisma);

export async function searchRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Global search across channel messages
  app.get<{
    Querystring: { q: string; cursor?: string; limit?: string };
  }>('/messages', async (request, reply) => {
    const { q, cursor, limit } = request.query;

    if (!q || q.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Search query must be at least 2 characters' }
      });
    }

    const result = await messageService.searchMessages(request.user.id, q, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined
    });

    // Short cache for search results
    reply.cache({ maxAge: 10 });
    return { success: true, data: result };
  });

  // Search across direct messages
  app.get<{
    Querystring: { q: string; cursor?: string; limit?: string };
  }>('/dms', async (request, reply) => {
    const { q, cursor, limit } = request.query;

    if (!q || q.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Search query must be at least 2 characters' }
      });
    }

    const result = await dmService.searchDirectMessages(request.user.id, q, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined
    });

    reply.cache({ maxAge: 10 });
    return { success: true, data: result };
  });

  // Combined search (messages + DMs)
  app.get<{
    Querystring: { q: string; cursor?: string; limit?: string };
  }>('/', async (request, reply) => {
    const { q, cursor, limit } = request.query;

    if (!q || q.trim().length < 2) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Search query must be at least 2 characters' }
      });
    }

    const limitNum = limit ? parseInt(limit, 10) : 20;

    // Search both messages and DMs in parallel
    const [messagesResult, dmsResult] = await Promise.all([
      messageService.searchMessages(request.user.id, q, {
        cursor,
        limit: limitNum
      }),
      dmService.searchDirectMessages(request.user.id, q, {
        cursor,
        limit: limitNum
      })
    ]);

    // Combine and sort by date
    const combined = [
      ...messagesResult.items.map((m) => ({ ...m, type: 'channel' as const })),
      ...dmsResult.items.map((m) => ({ ...m, type: 'dm' as const }))
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
    });

    reply.cache({ maxAge: 10 });
    return {
      success: true,
      data: {
        items: combined.slice(0, limitNum),
        hasMoreChannels: messagesResult.nextCursor !== null,
        hasMoreDMs: dmsResult.nextCursor !== null
      }
    };
  });
}
