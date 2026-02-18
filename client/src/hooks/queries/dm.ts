// DM Queries
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { CACHE_TIMES, queryKeys } from './constants';

// DM channels - updated via socket events
export function useDMChannels() {
  return useQuery({
    queryKey: queryKeys.dmChannels,
    queryFn: () => api.getDMChannels(),
    staleTime: CACHE_TIMES.CHANNELS.stale,
    gcTime: CACHE_TIMES.CHANNELS.gc
  });
}

// DM messages - WebSocket keeps cache fresh, NO polling!
export function useDMMessages(channelId: string | undefined, cursor?: string) {
  return useQuery({
    queryKey: channelId
      ? queryKeys.dmMessages(channelId, cursor)
      : ['dmMessages-null'],
    queryFn: () =>
      channelId
        ? api.getDMMessages(channelId, cursor)
        : { items: [], hasMore: false },
    enabled: !!channelId,
    staleTime: CACHE_TIMES.MESSAGES.stale,
    gcTime: CACHE_TIMES.MESSAGES.gc
    // NO refetchInterval - WebSocket events keep cache fresh!
  });
}
