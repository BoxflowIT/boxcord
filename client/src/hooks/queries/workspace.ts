// Workspace Queries and Mutations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { CACHE_TIMES, queryKeys } from './constants';

// Workspaces - updated via socket events
export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => api.getWorkspaces(),
    staleTime: CACHE_TIMES.WORKSPACES.stale,
    gcTime: CACHE_TIMES.WORKSPACES.gc
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
