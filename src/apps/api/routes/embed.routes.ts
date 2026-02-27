// Embed Routes - URL metadata endpoints
import type { FastifyInstance } from 'fastify';
import {
  fetchUrlMetadata,
  fetchMessageEmbeds
} from '../../../02-application/services/embed.service.js';

export default async function embedRoutes(app: FastifyInstance) {
  // All embed routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get metadata for a single URL
  app.get(
    '/embeds/preview',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      schema: {
        querystring: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { url } = request.query as { url: string };

      const embed = await fetchUrlMetadata(url);

      if (!embed) {
        return reply.code(404).send({
          success: false,
          error: 'Could not fetch URL metadata'
        });
      }

      return {
        success: true,
        data: embed
      };
    }
  );

  // Get embeds for all URLs in content
  app.post(
    '/embeds/parse',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      schema: {
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string' }
          }
        }
      }
    },
    async (request) => {
      const { content } = request.body as { content: string };

      const embeds = await fetchMessageEmbeds(content);

      return {
        success: true,
        data: embeds
      };
    }
  );
}
