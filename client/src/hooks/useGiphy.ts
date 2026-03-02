/**
 * useGiphy hook
 * Search and retrieve GIFs from Giphy
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

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
    queryFn: () =>
      api.searchGiphy(query, limit, offset) as Promise<GiphyResponse>,
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
    queryFn: () =>
      api.getTrendingGiphy(limit, offset) as Promise<GiphyResponse>,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

/**
 * Search stickers (custom emoji-like)
 */
export function useGiphyStickers(query: string, limit = 25, offset = 0) {
  return useQuery<GiphyResponse>({
    queryKey: ['giphy-stickers', query, limit, offset],
    queryFn: () =>
      api.searchGiphyStickers(query, limit, offset) as Promise<GiphyResponse>,
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
    queryFn: () =>
      api.getTrendingGiphyStickers(limit, offset) as Promise<GiphyResponse>,
    staleTime: 5 * 60 * 1000
  });
}

/**
 * Get random GIF
 */
export function useGiphyRandom(tag?: string) {
  return useQuery<GiphyGif>({
    queryKey: ['giphy-random', tag],
    queryFn: () => api.getRandomGiphy(tag) as Promise<GiphyGif>,
    staleTime: 0 // Always fetch new random GIF
  });
}
