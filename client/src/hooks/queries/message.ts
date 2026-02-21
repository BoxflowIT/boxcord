// Message Queries
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { CACHE_TIMES, queryKeys } from './constants';

// Channel messages - WebSocket keeps cache fresh, NO polling!
export function useMessages(channelId: string | undefined, cursor?: string) {
  return useQuery({
    queryKey: channelId
      ? queryKeys.messages(channelId, cursor)
      : ['messages-null'],
    queryFn: () =>
      channelId
        ? api.getMessages(channelId, cursor)
        : { items: [], hasMore: false },
    enabled: !!channelId,
    staleTime: CACHE_TIMES.MESSAGES.stale,
    gcTime: CACHE_TIMES.MESSAGES.gc
    // NO refetchInterval - WebSocket events keep cache fresh!
  });
}

// Message reactions
export function useReactions(messageId: string | undefined) {
  return useQuery({
    queryKey: messageId ? queryKeys.reactions(messageId) : ['reactions-null'],
    queryFn: () => (messageId ? api.getReactions(messageId) : []),
    enabled: !!messageId,
    staleTime: 30 * 1000, // 30s - updated frequently via socket
    gcTime: 2 * 60 * 1000
  });
}

// Pinned messages in a channel
export function usePinnedMessages(channelId: string | undefined) {
  return useQuery({
    queryKey: channelId ? ['pinnedMessages', channelId] : ['pinnedMessages-null'],
    queryFn: () => (channelId ? api.getPinnedMessages(channelId) : []),
    enabled: !!channelId,
    staleTime: 0, // Always refetch on mount to get fresh data
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always', // Force fresh data on page load
    refetchOnWindowFocus: false // Don't refetch when switching windows
  });
}
