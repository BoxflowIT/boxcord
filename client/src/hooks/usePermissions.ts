/**
 * usePermissions hook
 * Manage channel permissions for users and roles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type PermissionType =
  | 'canViewChannel'
  | 'canSendMessages'
  | 'canAddReactions'
  | 'canAttachFiles'
  | 'canEmbed'
  | 'canMentionEveryone'
  | 'canManageMessages'
  | 'canManageChannel'
  | 'canManageMembers';

export interface ChannelPermissions {
  canViewChannel: boolean;
  canSendMessages: boolean;
  canAddReactions: boolean;
  canAttachFiles: boolean;
  canEmbed: boolean;
  canMentionEveryone: boolean;
  canManageMessages: boolean;
  canManageChannel: boolean;
  canManageMembers: boolean;
}

export interface AllChannelPermissions {
  OWNER: ChannelPermissions;
  ADMIN: ChannelPermissions;
  MEMBER: ChannelPermissions;
}

/**
 * Get all permissions for a channel (all roles)
 */
export function useChannelPermissions(channelId?: string) {
  return useQuery<AllChannelPermissions>({
    queryKey: ['permissions', 'channel', channelId],
    queryFn: () =>
      api.getChannelPermissions(channelId!) as Promise<AllChannelPermissions>,
    enabled: !!channelId,
    staleTime: 30 * 1000 // 30s - mutations invalidate on change
  });
}

/**
 * Get current user's permissions for a channel
 */
export function useUserPermissions(channelId?: string) {
  return useQuery<ChannelPermissions | null>({
    queryKey: ['permissions', 'user', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      try {
        return (await api.getUserPermissions(channelId)) as ChannelPermissions;
      } catch {
        logger.warn('Failed to fetch user permissions');
        return null;
      }
    },
    enabled: !!channelId,
    staleTime: 30 * 1000 // 30s
  });
}

/**
 * Check if user has a specific permission
 */
export function useHasPermission(
  channelId?: string,
  permission?: PermissionType
) {
  return useQuery<boolean>({
    queryKey: ['permissions', 'check', channelId, permission],
    queryFn: async () => {
      if (!channelId || !permission) return false;
      try {
        const result = await api.checkPermission(channelId, permission);
        return result.hasPermission;
      } catch {
        return false;
      }
    },
    enabled: !!channelId && !!permission,
    staleTime: 30 * 1000 // 30s
  });
}

/**
 * Set permissions for a role
 */
export function useSetPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      role,
      permissions
    }: {
      channelId: string;
      role: MemberRole;
      permissions: Partial<ChannelPermissions>;
    }) =>
      api.setPermissions(
        channelId,
        role,
        permissions as Record<string, boolean>
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions', 'channel', variables.channelId]
      });
      queryClient.invalidateQueries({
        queryKey: ['permissions', 'user', variables.channelId]
      });
      logger.info(
        `Updated permissions for role ${variables.role} in channel ${variables.channelId}`
      );
    }
  });
}

/**
 * Reset permissions to defaults for a role
 */
export function useResetPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      channelId,
      role
    }: {
      channelId: string;
      role: MemberRole;
    }) => api.resetPermissions(channelId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['permissions', 'channel', variables.channelId]
      });
      queryClient.invalidateQueries({
        queryKey: ['permissions', 'user', variables.channelId]
      });
      logger.info(
        `Reset permissions for role ${variables.role} in channel ${variables.channelId}`
      );
    }
  });
}

/**
 * Quick permission check helper (synchronous, using cached data)
 */
export function usePermissionCheck(
  channelId: string | undefined,
  permission: PermissionType
): boolean {
  const { data: permissions } = useUserPermissions(channelId);

  if (!permissions) {
    return false;
  }

  return permissions[permission];
}
