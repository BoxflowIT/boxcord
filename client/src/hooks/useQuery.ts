// React Query Hooks - API caching and data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Channel } from '../types';

// Cache duration constants (in milliseconds)
// Discord-style: Long cache times since WebSocket keeps data fresh
const CACHE_TIMES = {
  WORKSPACES: { stale: Infinity, gc: 60 * 60 * 1000 }, // Never stale (socket updates), 1h gc
  CHANNELS: { stale: Infinity, gc: 60 * 60 * 1000 }, // Never stale (socket updates), 1h gc
  MESSAGES: { stale: Infinity, gc: 10 * 60 * 1000 }, // Never stale (WebSocket keeps fresh!), 10min gc
  USERS: { stale: Infinity, gc: 30 * 60 * 1000 }, // Never stale (socket updates), 30min gc
  CURRENT_USER: { stale: Infinity, gc: 60 * 60 * 1000 } // Never stale, 1h gc
} as const;

// Query Keys for caching
export const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  workspaceMembers: (id: string) => ['workspaceMembers', id] as const,
  channels: (workspaceId: string) => ['channels', workspaceId] as const,
  voiceChannelUsers: (channelId: string) =>
    ['voiceChannelUsers', channelId] as const,
  messages: (channelId: string, cursor?: string) =>
    ['messages', channelId, cursor] as const,
  dmChannels: ['dmChannels'] as const,
  dmMessages: (channelId: string, cursor?: string) =>
    ['dmMessages', channelId, cursor] as const,
  onlineUsers: ['onlineUsers'] as const,
  currentUser: ['currentUser'] as const,
  user: (id: string) => ['user', id] as const
};

// Workspaces - updated via socket events
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => api.getWorkspaces(),
    staleTime: CACHE_TIMES.WORKSPACES.stale,
    gcTime: CACHE_TIMES.WORKSPACES.gc
  });
}

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

// DM channels - updated via socket events
export function useDMChannels() {
  return useQuery({
    queryKey: queryKeys.dmChannels,
    queryFn: () => api.getDMChannels(),
    staleTime: CACHE_TIMES.CHANNELS.stale,
    gcTime: CACHE_TIMES.CHANNELS.gc
  });
}

// Online users - updated frequently via socket
export function useOnlineUsers() {
  return useQuery({
    queryKey: queryKeys.onlineUsers,
    queryFn: () => api.getOnlineUsers(),
    staleTime: CACHE_TIMES.USERS.stale,
    gcTime: CACHE_TIMES.USERS.gc
  });
}

// Voice channel users - check who's in a voice channel
// Updated via socket events, no polling needed
export function useVoiceChannelUsers(channelId: string | undefined) {
  return useQuery({
    queryKey: channelId
      ? queryKeys.voiceChannelUsers(channelId)
      : ['voiceChannelUsers-null'],
    queryFn: () => (channelId ? api.getVoiceChannelUsers(channelId) : []),
    enabled: !!channelId,
    staleTime: 0, // Always refetch when needed
    gcTime: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
    // No refetchInterval - socket events trigger refetch via refetchQueries
  });
}

// Workspace members - filtered by workspace
export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? queryKeys.workspaceMembers(workspaceId)
      : ['workspaceMembers-null'],
    queryFn: () => (workspaceId ? api.getWorkspaceMembers(workspaceId) : []),
    enabled: !!workspaceId,
    staleTime: CACHE_TIMES.USERS.stale,
    gcTime: CACHE_TIMES.USERS.gc
  });
}

// Current user profile
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getCurrentUser(),
    staleTime: CACHE_TIMES.CURRENT_USER.stale,
    gcTime: CACHE_TIMES.CURRENT_USER.gc
  });
}

// User profile by ID
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.user(userId) : ['user-null'],
    queryFn: () => (userId ? api.getUser(userId) : null),
    enabled: !!userId,
    staleTime: CACHE_TIMES.USERS.stale,
    gcTime: CACHE_TIMES.USERS.gc
  });
}

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

// Create workspace mutation
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      description
    }: {
      name: string;
      description?: string;
    }) => api.createWorkspace(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    }
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

// Delete workspace mutation
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => api.deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
    onError: () => {
      // On error (e.g., workspace doesn't exist or no permission), refetch to sync with server
      queryClient.refetchQueries({ queryKey: queryKeys.workspaces });
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

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatarUrl?: string;
    }) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    }
  });
}

// Update user role mutation (admin only)
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role
    }: {
      userId: string;
      role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
    }) => api.updateUserRole(userId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user(variables.userId)
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.onlineUsers });
    }
  });
}

// Batch fetch multiple users
export function useUsers(userIds: string[]) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['users-batch', ...userIds.sort()],
    queryFn: async () => {
      const users = await Promise.all(
        userIds.map((id) =>
          api
            .getUser(id)
            .then((user) => {
              // Cache each user individually
              queryClient.setQueryData(queryKeys.user(id), user);
              return user;
            })
            .catch(() => null)
        )
      );
      return users.filter((u) => u !== null);
    },
    enabled: userIds.length > 0,
    staleTime: CACHE_TIMES.USERS.stale,
    gcTime: CACHE_TIMES.USERS.gc
  });
}

// Message reactions
export function useReactions(messageId: string | undefined) {
  return useQuery({
    queryKey: messageId ? ['reactions', messageId] : ['reactions-null'],
    queryFn: () => (messageId ? api.getReactions(messageId) : []),
    enabled: !!messageId,
    staleTime: 30 * 1000, // 30s - updated frequently via socket
    gcTime: 2 * 60 * 1000
  });
}
