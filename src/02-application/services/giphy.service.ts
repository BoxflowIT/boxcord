/**
 * Giphy Service
 * Search and retrieve GIFs from Giphy API
 */

import { GiphyFetch } from '@giphy/js-fetch-api';
import { logger } from '../../00-core/logger.js';

const GIPHY_API_KEY =
  process.env.GIPHY_API_KEY || 'E2USScP1hkaRhjQzx6MRjbGYuoO4p38N';

const giphy = new GiphyFetch(GIPHY_API_KEY);

export interface GiphyGif {
  id: string;
  title: string;
  url: string;
  images: {
    original: {
      url: string;
      width: string;
      height: string;
      size: string;
    };
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    preview_gif: {
      url: string;
      width: string;
      height: string;
    };
  };
}

/**
 * Search GIFs by query
 */
export async function searchGifs(query: string, limit = 25, offset = 0) {
  try {
    const result = await giphy.search(query, { limit, offset });
    return {
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    logger.error({ error, query }, 'Giphy search error');
    throw new Error('Failed to search GIFs');
  }
}

/**
 * Get trending GIFs
 */
export async function getTrendingGifs(limit = 25, offset = 0) {
  try {
    const result = await giphy.trending({ limit, offset });
    return {
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    logger.error({ error, limit, offset }, 'Giphy trending error');
    throw new Error('Failed to get trending GIFs');
  }
}

/**
 * Get GIF by ID
 */
export async function getGifById(id: string) {
  try {
    const result = await giphy.gif(id);
    return result.data;
  } catch (error) {
    logger.error({ error, id }, 'Giphy get by ID error');
    throw new Error('Failed to get GIF');
  }
}

/**
 * Search stickers (like custom emojis)
 */
export async function searchStickers(query: string, limit = 25, offset = 0) {
  try {
    const result = await giphy.search(query, {
      limit,
      offset,
      type: 'stickers'
    });
    return {
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    logger.error({ error, query }, 'Giphy sticker search error');
    throw new Error('Failed to search stickers');
  }
}

/**
 * Get trending stickers
 */
export async function getTrendingStickers(limit = 25, offset = 0) {
  try {
    const result = await giphy.trending({ limit, offset, type: 'stickers' });
    return {
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    logger.error({ error, limit, offset }, 'Giphy trending stickers error');
    throw new Error('Failed to get trending stickers');
  }
}

/**
 * Get random GIF
 */
export async function getRandomGif(tag?: string) {
  try {
    const result = await giphy.random({ tag });
    return result.data;
  } catch (error) {
    logger.error({ error, tag }, 'Giphy random error');
    throw new Error('Failed to get random GIF');
  }
}

/**
 * Search with autocomplete suggestions
 */
export async function autocompleteSearch(query: string) {
  try {
    const result = await giphy.search(query, { limit: 10 });
    return result.data;
  } catch (error) {
    logger.error({ error, query }, 'Giphy autocomplete error');
    throw new Error('Failed to autocomplete search');
  }
}
