/**
 * useGiphy hook
 * Search and retrieve GIFs from Giphy
 */

import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/v1';

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
    downsized?: {
      url: string;
      width: string;
      height: string;
    };
  };
}

interface GiphyResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

/**
 * Search GIFs
 */
export function useGiphySearch(query: string, limit = 25, offset = 0) {
  return useQuery<GiphyResponse>({
    queryKey: ['giphy-search', query, limit, offset],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/giphy/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to search GIFs');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Get trending GIFs
 */
export function useGiphyTrending(limit = 25, offset = 0) {
  return useQuery<GiphyResponse>({
    queryKey: ['giphy-trending', limit, offset],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/giphy/trending?limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to get trending GIFs');
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Search stickers (custom emoji-like)
 */
export function useGiphyStickers(query: string, limit = 25, offset = 0) {
  return useQuery<GiphyResponse>({
    queryKey: ['giphy-stickers', query, limit, offset],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/giphy/stickers/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to search stickers');
      }

      const result = await response.json();
      return result.data;
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Get trending stickers
 */
export function useGiphyTrendingStickers(limit = 25, offset = 0) {
  return useQuery<GiphyResponse>({
    queryKey: ['giphy-trending-stickers', limit, offset],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/giphy/stickers/trending?limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to get trending stickers');
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Get random GIF
 */
export function useGiphyRandom(tag?: string) {
  return useQuery<GiphyGif>({
    queryKey: ['giphy-random', tag],
    queryFn: async () => {
      const url = tag
        ? `${API_BASE}/giphy/random?tag=${encodeURIComponent(tag)}`
        : `${API_BASE}/giphy/random`;

      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        throw new Error('Failed to get random GIF');
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 0 // Always fetch new random GIF
  });
}
