/**
 * usePermissions hook
 * Manage channel permissions for users and roles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { logger } from '../utils/logger';

const API_BASE = '/api/v1';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
}

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
    queryFn: async () => {
      if (!channelId) {
        throw new Error('Channel ID is required');
      }

      const response = await fetch(
        `${API_BASE}/permissions?channelId=${channelId}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!channelId
  });
}

/**
 * Get current user's permissions for a channel
 */
export function useUserPermissions(channelId?: string) {
  return useQuery<ChannelPermissions | null>({
    queryKey: ['permissions', 'user', channelId],
    queryFn: async () => {
      if (!channelId) {
        return null;
      }

      const response = await fetch(
        `${API_BASE}/permissions/me?channelId=${channelId}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        logger.warn('Failed to fetch user permissions');
        return null;
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!channelId,
    staleTime: 30000 // Cache for 30 seconds
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
      if (!channelId || !permission) {
        return false;
      }

      const response = await fetch(
        `${API_BASE}/permissions/check?channelId=${channelId}&permission=${permission}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.data.hasPermission;
    },
    enabled: !!channelId && !!permission,
    staleTime: 30000 // Cache for 30 seconds
  });
}

/**
 * Set permissions for a role
 */
export function useSetPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      role,
      permissions
    }: {
      channelId: string;
      role: MemberRole;
      permissions: Partial<ChannelPermissions>;
    }) => {
      const response = await fetch(`${API_BASE}/permissions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          channelId,
          role,
          permissions
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to set permissions');
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all permission queries for this channel
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
    mutationFn: async ({
      channelId,
      role
    }: {
      channelId: string;
      role: MemberRole;
    }) => {
      const response = await fetch(
        `${API_BASE}/permissions?channelId=${channelId}&role=${role}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reset permissions');
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all permission queries for this channel
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
 * Use this when you need immediate permission checks in UI components
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
