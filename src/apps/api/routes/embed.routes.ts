// Embed Routes - URL metadata endpoints
import type { FastifyInstance } from 'fastify';
import {
  fetchUrlMetadata,
  fetchMessageEmbeds
} from '../../../02-application/services/embed.service.js';

export default async function embedRoutes(app: FastifyInstance) {
  // Get metadata for a single URL
  app.get<{
    QueryString: { url: string };
  }>(
    '/embeds/preview',
    {
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
      const { url } = request.query;

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
  app.post<{
    Body: { content: string };
  }>(
    '/embeds/parse',
    {
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
      const { content } = request.body;

      const embeds = await fetchMessageEmbeds(content);

      return {
        success: true,
        data: embeds
      };
    }
  );
}
