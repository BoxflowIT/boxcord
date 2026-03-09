// Search Routes - Global search across messages and DMs with advanced filters
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { MessageService } from '../../../02-application/services/message.service.js';
import { DirectMessageService } from '../../../02-application/services/dm.service.js';
import type { SearchFilters } from '../../../00-core/types.js';

const messageService = new MessageService(prisma);
const dmService = new DirectMessageService(prisma);

// Preprocess: coerce empty strings to undefined so optional() works for query params
const optionalString = (schema: z.ZodType) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    schema.optional()
  );

// Search query schema with advanced filters
const searchQuery = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters').max(200),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  // Advanced filters — empty strings from query params are stripped to undefined
  channelId: optionalString(z.string().uuid()),
  workspaceId: optionalString(z.string().uuid()),
  authorId: optionalString(z.string().min(1)),
  before: optionalString(z.string().datetime({ offset: true })),
  after: optionalString(z.string().datetime({ offset: true })),
  hasAttachment: z.preprocess(
    (v) => (v === 'true' ? true : v === 'false' ? false : undefined),
    z.boolean().optional()
  ),
  type: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['channel', 'dm', 'all']).optional()
  )
});

/** Extract SearchFilters from parsed query params */
function extractFilters(query: z.infer<typeof searchQuery>): SearchFilters {
  return {
    channelId: query.channelId,
    workspaceId: query.workspaceId,
    authorId: query.authorId,
    before: query.before,
    after: query.after,
    hasAttachment: query.hasAttachment,
    type: query.type ?? 'all'
  };
}

export async function searchRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Global search across channel messages
  app.get<{
    Querystring: z.infer<typeof searchQuery>;
  }>(
    '/messages',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateQuery(searchQuery)
    },
    async (request, reply) => {
      const { q, cursor, limit } = request.query;
      const filters = extractFilters(request.query);

      const result = await messageService.searchMessages(
        request.user.id,
        q,
        { cursor, limit },
        filters
      );

      reply.cache({ maxAge: 10 });
      return { success: true, data: result };
    }
  );

  // Search across direct messages
  app.get<{
    Querystring: z.infer<typeof searchQuery>;
  }>(
    '/dms',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateQuery(searchQuery)
    },
    async (request, reply) => {
      const { q, cursor, limit } = request.query;
      const filters = extractFilters(request.query);

      const result = await dmService.searchDirectMessages(
        request.user.id,
        q,
        { cursor, limit },
        filters
      );

      reply.cache({ maxAge: 10 });
      return { success: true, data: result };
    }
  );

  // Combined search (messages + DMs) with advanced filters
  app.get<{
    Querystring: z.infer<typeof searchQuery>;
  }>(
    '/',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateQuery(searchQuery)
    },
    async (request, reply) => {
      const { q, cursor, limit } = request.query;
      const filters = extractFilters(request.query);
      const limitNum = limit ?? 20;
      const effectiveType = filters.type ?? 'all';

      const searchChannels =
        effectiveType === 'all' || effectiveType === 'channel';
      const searchDMs = effectiveType === 'all' || effectiveType === 'dm';

      // Search in parallel based on type filter
      const [messagesResult, dmsResult] = await Promise.all([
        searchChannels
          ? messageService.searchMessages(
              request.user.id,
              q,
              { cursor, limit: limitNum },
              filters
            )
          : Promise.resolve({
              items: [],
              nextCursor: undefined,
              hasMore: false
            }),
        searchDMs
          ? dmService.searchDirectMessages(
              request.user.id,
              q,
              { cursor, limit: limitNum },
              filters
            )
          : Promise.resolve({
              items: [],
              nextCursor: undefined,
              hasMore: false
            })
      ]);

      // Combine and sort by date
      const combined = [
        ...messagesResult.items.map((m) => ({
          ...m,
          type: 'channel' as const
        })),
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
          totalChannelResults: messagesResult.items.length,
          totalDMResults: dmsResult.items.length,
          hasMoreChannels: messagesResult.hasMore,
          hasMoreDMs: dmsResult.hasMore
        }
      };
    }
  );
}
