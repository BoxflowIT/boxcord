// Permission Service - Application Layer
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { MemberRole } from '../../01-domain/entities/workspace.js';
import { NotFoundError } from '../../00-core/errors.js';

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

const DEFAULT_PERMISSIONS: Record<MemberRole, ChannelPermissions> = {
  OWNER: {
    canViewChannel: true,
    canSendMessages: true,
    canAddReactions: true,
    canAttachFiles: true,
    canEmbed: true,
    canMentionEveryone: true,
    canManageMessages: true,
    canManageChannel: true,
    canManageMembers: true
  },
  ADMIN: {
    canViewChannel: true,
    canSendMessages: true,
    canAddReactions: true,
    canAttachFiles: true,
    canEmbed: true,
    canMentionEveryone: true,
    canManageMessages: true,
    canManageChannel: true,
    canManageMembers: true
  },
  MEMBER: {
    canViewChannel: true,
    canSendMessages: true,
    canAddReactions: true,
    canAttachFiles: true,
    canEmbed: true,
    canMentionEveryone: false,
    canManageMessages: false,
    canManageChannel: false,
    canManageMembers: false
  }
};

export class PermissionService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  /**
   * Check if a user has a specific permission for a channel
   */
  async hasPermission(
    userId: string,
    channelId: string,
    permission: PermissionType
  ): Promise<boolean> {
    // Get user's role in the workspace
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        workspaceId: true,
        isPrivate: true,
        members: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!channel) {
      return false;
    }

    // Check if user is a member (for private channels)
    if (channel.isPrivate && channel.members.length === 0) {
      return false;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId
        }
      },
      select: { role: true }
    });

    if (!membership) {
      return false;
    }

    // Get channel-specific permissions for this role
    const permissions = await this.getPermissions(channelId, membership.role);

    return permissions[permission];
  }

  /**
   * Get all permissions for a channel and role
   */
  async getPermissions(
    channelId: string,
    role: MemberRole
  ): Promise<ChannelPermissions> {
    const channelPermission = await this.prisma.channelPermission.findUnique({
      where: {
        channelId_role: {
          channelId,
          role
        }
      }
    });

    // If no custom permissions set, return defaults
    if (!channelPermission) {
      return DEFAULT_PERMISSIONS[role];
    }

    return {
      canViewChannel: channelPermission.canViewChannel,
      canSendMessages: channelPermission.canSendMessages,
      canAddReactions: channelPermission.canAddReactions,
      canAttachFiles: channelPermission.canAttachFiles,
      canEmbed: channelPermission.canEmbed,
      canMentionEveryone: channelPermission.canMentionEveryone,
      canManageMessages: channelPermission.canManageMessages,
      canManageChannel: channelPermission.canManageChannel,
      canManageMembers: channelPermission.canManageMembers
    };
  }

  /**
   * Get permissions for all roles in a channel
   */
  async getAllChannelPermissions(
    channelId: string
  ): Promise<Record<MemberRole, ChannelPermissions>> {
    const permissions = await this.prisma.channelPermission.findMany({
      where: { channelId }
    });

    const result: Record<MemberRole, ChannelPermissions> = {
      OWNER: DEFAULT_PERMISSIONS.OWNER,
      ADMIN: DEFAULT_PERMISSIONS.ADMIN,
      MEMBER: DEFAULT_PERMISSIONS.MEMBER
    };

    for (const perm of permissions) {
      result[perm.role] = {
        canViewChannel: perm.canViewChannel,
        canSendMessages: perm.canSendMessages,
        canAddReactions: perm.canAddReactions,
        canAttachFiles: perm.canAttachFiles,
        canEmbed: perm.canEmbed,
        canMentionEveryone: perm.canMentionEveryone,
        canManageMessages: perm.canManageMessages,
        canManageChannel: perm.canManageChannel,
        canManageMembers: perm.canManageMembers
      };
    }

    return result;
  }

  /**
   * Set permissions for a specific role in a channel
   */
  async setPermissions(
    channelId: string,
    role: MemberRole,
    permissions: Partial<ChannelPermissions>
  ): Promise<ChannelPermissions> {
    // Verify channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Upsert permissions
    const updated = await this.prisma.channelPermission.upsert({
      where: {
        channelId_role: {
          channelId,
          role
        }
      },
      create: {
        channelId,
        role,
        ...permissions
      },
      update: permissions
    });

    return {
      canViewChannel: updated.canViewChannel,
      canSendMessages: updated.canSendMessages,
      canAddReactions: updated.canAddReactions,
      canAttachFiles: updated.canAttachFiles,
      canEmbed: updated.canEmbed,
      canMentionEveryone: updated.canMentionEveryone,
      canManageMessages: updated.canManageMessages,
      canManageChannel: updated.canManageChannel,
      canManageMembers: updated.canManageMembers
    };
  }

  /**
   * Reset permissions for a role to defaults
   */
  async resetPermissions(
    channelId: string,
    role: MemberRole
  ): Promise<ChannelPermissions> {
    await this.prisma.channelPermission
      .delete({
        where: {
          channelId_role: {
            channelId,
            role
          }
        }
      })
      .catch(() => {
        // Ignore if doesn't exist
      });

    return DEFAULT_PERMISSIONS[role];
  }

  /**
   * Get user's effective permissions (considering their role)
   */
  async getUserPermissions(
    userId: string,
    channelId: string
  ): Promise<ChannelPermissions | null> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        workspaceId: true,
        isPrivate: true,
        members: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    if (!channel) {
      return null;
    }

    // Check if user is a member (for private channels)
    if (channel.isPrivate && channel.members.length === 0) {
      return null;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId
        }
      },
      select: { role: true }
    });

    if (!membership) {
      return null;
    }

    return this.getPermissions(channelId, membership.role);
  }
}
