/**
 * Giphy API Routes
 * Proxy endpoints for Giphy API (to hide API key from client)
 */

import type { FastifyInstance } from 'fastify';
import {
  searchGifs,
  getTrendingGifs,
  getGifById,
  searchStickers,
  getTrendingStickers,
  getRandomGif,
  autocompleteSearch
} from '../../../02-application/services/giphy.service.js';

export default async function giphyRoutes(fastify: FastifyInstance) {
  // All giphy routes require authentication
  fastify.addHook('onRequest', async (request) => {
    await fastify.authenticate(request);
  });

  /**
   * Search GIFs
   * GET /api/v1/giphy/search?q=...&limit=25&offset=0
   */
  fastify.get('/giphy/search', async (request) => {
    const {
      q,
      limit = 25,
      offset = 0
    } = request.query as {
      q: string;
      limit?: number;
      offset?: number;
    };

    if (!q) {
      throw new Error('Query parameter "q" is required');
    }

    const result = await searchGifs(q, Number(limit), Number(offset));
    return { success: true, data: result };
  });

  /**
   * Get trending GIFs
   * GET /api/v1/giphy/trending?limit=25&offset=0
   */
  fastify.get('/giphy/trending', async (request) => {
    const { limit = 25, offset = 0 } = request.query as {
      limit?: number;
      offset?: number;
    };

    const result = await getTrendingGifs(Number(limit), Number(offset));
    return { success: true, data: result };
  });

  /**
   * Get GIF by ID
   * GET /api/v1/giphy/:id
   */
  fastify.get('/giphy/:id', async (request) => {
    const { id } = request.params as { id: string };

    const result = await getGifById(id);
    return { success: true, data: result };
  });

  /**
   * Search stickers (custom emoji-like)
   * GET /api/v1/giphy/stickers/search?q=...&limit=25&offset=0
   */
  fastify.get('/giphy/stickers/search', async (request) => {
    const {
      q,
      limit = 25,
      offset = 0
    } = request.query as {
      q: string;
      limit?: number;
      offset?: number;
    };

    if (!q) {
      throw new Error('Query parameter "q" is required');
    }

    const result = await searchStickers(q, Number(limit), Number(offset));
    return { success: true, data: result };
  });

  /**
   * Get trending stickers
   * GET /api/v1/giphy/stickers/trending?limit=25&offset=0
   */
  fastify.get('/giphy/stickers/trending', async (request) => {
    const { limit = 25, offset = 0 } = request.query as {
      limit?: number;
      offset?: number;
    };

    const result = await getTrendingStickers(Number(limit), Number(offset));
    return { success: true, data: result };
  });

  /**
   * Get random GIF
   * GET /api/v1/giphy/random?tag=...
   */
  fastify.get('/giphy/random', async (request) => {
    const { tag } = request.query as { tag?: string };

    const result = await getRandomGif(tag);
    return { success: true, data: result };
  });

  /**
   * Autocomplete search
   * GET /api/v1/giphy/autocomplete?q=...
   */
  fastify.get('/giphy/autocomplete', async (request) => {
    const { q } = request.query as { q: string };

    if (!q) {
      throw new Error('Query parameter "q" is required');
    }

    const result = await autocompleteSearch(q);
    return { success: true, data: result };
  });
}
