// User Queries and Mutations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { CACHE_TIMES, queryKeys } from './constants';

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

// Batch fetch multiple users (single API call instead of N+1)
export function useUsers(userIds: string[]) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['users-batch', ...userIds.sort()],
    queryFn: async () => {
      if (userIds.length === 0) return [];

      // Check which users are already cached
      const uncachedIds: string[] = [];
      const cachedUsers: Array<{ id: string; [key: string]: unknown }> = [];

      for (const id of userIds) {
        const cached = queryClient.getQueryData(queryKeys.user(id));
        if (cached) {
          cachedUsers.push(cached as { id: string });
        } else {
          uncachedIds.push(id);
        }
      }

      // Batch fetch only uncached users in a single request
      if (uncachedIds.length > 0) {
        const fetchedUsers = await api.getUsersBatch(uncachedIds);
        for (const user of fetchedUsers) {
          queryClient.setQueryData(queryKeys.user(user.id), user);
          cachedUsers.push(user as { id: string });
        }
      }

      return cachedUsers;
    },
    enabled: userIds.length > 0,
    staleTime: CACHE_TIMES.USERS.stale,
    gcTime: CACHE_TIMES.USERS.gc
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
      role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';
    }) => api.updateUserRole(userId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.user(variables.userId)
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.onlineUsers });
    }
  });
}
