// React Query Hooks för API caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// Query Keys för caching
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

/**
 * Hämta alla workspaces med caching
 * Uppdateras via socket events (workspace.created, workspace.updated)
 */
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => api.getWorkspaces(),
    staleTime: 10 * 60 * 1000, // 10 min - uppdateras via socket
    gcTime: 30 * 60 * 1000
    // Ingen refetchInterval - socket events hanterar uppdateringar
  });
}

/**
 * Hämta channels för en workspace med caching
 * Uppdateras via socket events (channel.created, channel.updated)
 */
export function useChannels(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId ? queryKeys.channels(workspaceId) : ['channels-null'],
    queryFn: () => (workspaceId ? api.getChannels(workspaceId) : []),
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 min - uppdateras via socket
    gcTime: 30 * 60 * 1000
    // Ingen refetchInterval - socket events hanterar uppdateringar
  });
}

/**
 * Hämta DM channels med caching
 * Uppdateras via socket events (dm.created, message.new för DMs)
 */
export function useDMChannels() {
  return useQuery({
    queryKey: queryKeys.dmChannels,
    queryFn: () => api.getDMChannels(),
    staleTime: 10 * 60 * 1000, // 10 min - uppdateras via socket
    gcTime: 30 * 60 * 1000
    // Ingen refetchInterval - socket events hanterar uppdateringar
  });
}

/**
 * Hämta online users med caching
 * Uppdateras via socket events, ingen polling behövs
 */
export function useOnlineUsers() {
  return useQuery({
    queryKey: queryKeys.onlineUsers,
    queryFn: () => api.getOnlineUsers(),
    staleTime: 5 * 60 * 1000, // 5 min - uppdateras via socket
    gcTime: 10 * 60 * 1000
    // Ingen refetchInterval - socket events hanterar uppdateringar
  });
}

/**
 * Hämta current user med caching
 * Cachas i 10 minuter (ändras sällan)
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => api.getCurrentUser(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });
}

/**
 * Hämta user profile med caching
 */
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.user(userId) : ['user-null'],
    queryFn: () => (userId ? api.getUser(userId) : null),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

/**
 * Hämta messages för en channel med caching
 * Uppdateras via socket när möjligt, men har backup polling var 60:e sekund
 */
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
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000 // Backup polling var 60:e sekund
  });
}

/**
 * Hämta DM messages med caching
 * Uppdateras via socket när möjligt, men har backup polling var 60:e sekund
 */
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
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000 // Backup polling var 60:e sekund
  });
}

/**
 * Create workspace mutation med cache invalidation
 */
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
      // Invalidera workspaces cache så den refetchas
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    }
  });
}

/**
 * Create channel mutation med cache invalidation
 */
export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      name
    }: {
      workspaceId: string;
      name: string;
    }) => api.createChannel(workspaceId, name),
    onSuccess: (_data, variables) => {
      // Invalidera channels cache för denna workspace
      queryClient.invalidateQueries({
        queryKey: queryKeys.channels(variables.workspaceId)
      });
    }
  });
}

/**
 * Delete workspace mutation
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => api.deleteWorkspace(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    }
  });
}

/**
 * Delete channel mutation
 */
export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => api.deleteChannel(channelId),
    onSuccess: () => {
      // Invalidera alla channels queries
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    }
  });
}

/**
 * Update profile mutation med cache invalidation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
    }) => api.updateProfile(data),
    onSuccess: () => {
      // Invalidera current user cache
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
    }
  });
}

/**
 * Update user role mutation
 */
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
      // Invalidera user cache för denna user
      queryClient.invalidateQueries({
        queryKey: queryKeys.user(variables.userId)
      });
      // Invalidera online users också
      queryClient.invalidateQueries({ queryKey: queryKeys.onlineUsers });
    }
  });
}

/**
 * Hämta flera users samtidigt med caching
 * Varje user cachas individuellt OCH som batch
 */
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
              // Cacha varje user individuellt också!
              queryClient.setQueryData(queryKeys.user(id), user);
              return user;
            })
            .catch(() => null)
        )
      );
      return users.filter((u) => u !== null);
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
}

/**
 * Hämta reactions för ett meddelande med caching
 * Uppdateras via WebSocket men detta ger snabb initial load
 */
export function useReactions(messageId: string | undefined) {
  return useQuery({
    queryKey: messageId ? ['reactions', messageId] : ['reactions-null'],
    queryFn: () => (messageId ? api.getReactions(messageId) : []),
    enabled: !!messageId,
    staleTime: 30 * 1000, // 30 sek (reactions uppdateras ofta via WebSocket)
    gcTime: 2 * 60 * 1000
  });
}
