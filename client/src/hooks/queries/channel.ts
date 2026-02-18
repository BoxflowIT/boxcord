// Channel Queries and Mutations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Channel } from '../../types';
import { CACHE_TIMES, queryKeys } from './constants';

// Channels for workspace - updated via socket events
export function useChannels(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId ? queryKeys.channels(workspaceId) : ['channels-null'],
    queryFn: () => (workspaceId ? api.getChannels(workspaceId) : []),
    enabled: !!workspaceId,
    staleTime: Infinity, // Never stale (socket updates), rely on invalidation
    gcTime: CACHE_TIMES.CHANNELS.gc
  });
}

// Create channel mutation with optimistic updates
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      name,
      type
    }: {
      workspaceId: string;
      name: string;
      type?: 'TEXT' | 'ANNOUNCEMENT' | 'VOICE';
    }) => api.createChannel(workspaceId, name, type),

    // Optimistic update - UI updates instantly
    onMutate: async ({ workspaceId }) => {
      // Cancel any outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({
        queryKey: queryKeys.channels(workspaceId)
      });

      // Snapshot previous value for rollback
      const previousChannels = queryClient.getQueryData(
        queryKeys.channels(workspaceId)
      );

      // DON'T do optimistic update - let socket.IO handle it
      // This avoids complex race conditions

      return { previousChannels, tempChannel: null };
    },

    // Rollback on error
    onError: (_err, variables, context) => {
      if (context?.previousChannels) {
        queryClient.setQueryData(
          queryKeys.channels(variables.workspaceId),
          context.previousChannels
        );
      }
    },

    // Update with real data from server
    onSuccess: (data, variables) => {
      // Add channel immediately to cache
      queryClient.setQueryData<Channel[]>(
        queryKeys.channels(variables.workspaceId),
        (old) => {
          if (!old) return [data];

          // If channel already exists (from socket), update it
          const existingIndex = old.findIndex((ch) => ch.id === data.id);
          if (existingIndex !== -1) {
            const updated = [...old];
            updated[existingIndex] = data;
            return updated;
          }

          // Otherwise add it
          return [...old, data];
        }
      );

      // Don't invalidate - we just updated the cache directly
      // Socket.IO will handle updates from other clients
    }
  });
}

// Delete channel mutation with optimistic updates
export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => api.deleteChannel(channelId),

    // Optimistic update - remove from UI instantly
    onMutate: async (channelId) => {
      // Cancel any outgoing refetches for all channels
      await queryClient.cancelQueries({ queryKey: ['channels'] });

      // Snapshot previous values for rollback
      const previousData: Array<{ key: readonly unknown[]; data: unknown }> =
        [];

      // Remove channel from all workspace caches
      queryClient
        .getQueryCache()
        .findAll({ queryKey: ['channels'] })
        .forEach((query) => {
          const old = query.state.data;
          if (old) {
            previousData.push({ key: query.queryKey, data: old });
            queryClient.setQueryData(query.queryKey, (oldData: unknown) =>
              Array.isArray(oldData)
                ? oldData.filter((ch) => ch.id !== channelId)
                : oldData
            );
          }
        });

      return { previousData };
    },

    // Rollback on error
    onError: (err, _channelId, context) => {
      // If channel is already deleted (404), don't rollback - just remove it
      if (err instanceof Error && err.message.includes('not found')) {
        // Channel was already deleted, don't restore it
        return;
      }

      // For other errors, rollback
      if (context?.previousData) {
        context.previousData.forEach(({ key, data }) => {
          queryClient.setQueryData(key, data);
        });
      }
    }
  });
}
