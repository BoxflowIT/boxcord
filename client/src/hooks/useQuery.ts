// React Query Hooks - API caching and data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// Cache duration constants (in milliseconds)
// Discord-style: Long cache times since WebSocket keeps data fresh
const CACHE_TIMES = {
  WORKSPACES: { stale: 30 * 60 * 1000, gc: 60 * 60 * 1000 }, // 30min stale, 1h gc (rarely change)
  CHANNELS: { stale: 30 * 60 * 1000, gc: 60 * 60 * 1000 }, // 30min stale, 1h gc (rarely change)
  MESSAGES: { stale: Infinity, gc: 10 * 60 * 1000, refetch: 60 * 1000 }, // Never stale (WS updates), 10min gc
  USERS: { stale: 10 * 60 * 1000, gc: 30 * 60 * 1000 }, // 10min stale, 30min gc
  CURRENT_USER: { stale: 30 * 60 * 1000, gc: 60 * 60 * 1000 } // 30min stale, 1h gc
} as const;

// Query Keys for caching
export const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  channels: (workspaceId: string) => ['channels', workspaceId] as const,
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
    staleTime: CACHE_TIMES.CHANNELS.stale,
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

// Channel messages with backup polling
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
    gcTime: CACHE_TIMES.MESSAGES.gc,
    refetchInterval: CACHE_TIMES.MESSAGES.refetch // Backup if socket events fail
  });
}

// DM messages with backup polling
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
    gcTime: CACHE_TIMES.MESSAGES.gc,
    refetchInterval: CACHE_TIMES.MESSAGES.refetch // Backup if socket events fail
  });
}

// Create workspace mutation
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      api.createWorkspace(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    }
  });
}

// Create channel mutation with optimistic updates
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      api.createChannel(workspaceId, name),
    
    // Optimistic update - UI updates instantly
    onMutate: async ({ workspaceId, name }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.channels(workspaceId) });
      
      // Snapshot previous value for rollback
      const previousChannels = queryClient.getQueryData(queryKeys.channels(workspaceId));
      
      // Optimistically update cache with temporary channel
      const tempChannel = {
        id: `temp-${Date.now()}`,
        name,
        workspaceId,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(
        queryKeys.channels(workspaceId),
        (old: unknown) => Array.isArray(old) ? [...old, tempChannel] : [tempChannel]
      );
      
      return { previousChannels, tempChannel };
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
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(
        queryKeys.channels(variables.workspaceId),
        (old: unknown) => {
          if (!Array.isArray(old)) return [data];
          // Replace temp channel with real channel
          return old.map((ch) => 
            ch.id === context?.tempChannel?.id ? data : ch
          );
        }
      );
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
      const previousData: Array<{ key: readonly unknown[]; data: unknown }> = [];
      
      // Remove channel from all workspace caches
      queryClient.getQueryCache().findAll({ queryKey: ['channels'] }).forEach(query => {
        const old = query.state.data;
        if (old) {
          previousData.push({ key: query.queryKey, data: old });
          queryClient.setQueryData(
            query.queryKey,
            (oldData: unknown) => Array.isArray(oldData) 
              ? oldData.filter((ch) => ch.id !== channelId)
              : oldData
          );
        }
      });
      
      return { previousData };
    },
    
    // Rollback on error
    onError: (_err, _channelId, context) => {
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
    mutationFn: (data: { firstName?: string; lastName?: string; bio?: string }) =>
      api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    }
  });
}

// Update user role mutation (admin only)
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' }) =>
      api.updateUserRole(userId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(variables.userId) });
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
          api.getUser(id)
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
