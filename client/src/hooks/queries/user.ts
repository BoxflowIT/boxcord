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
