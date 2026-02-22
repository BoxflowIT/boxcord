// Moderation Service - User moderation (kick, ban)
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { AuditLog } from '@prisma/client';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError
} from '../../00-core/errors.js';

export class ModerationService {
  constructor(private readonly prisma: ExtendedPrismaClient) {}

  async kickUser(
    workspaceId: string,
    targetUserId: string,
    moderatorId: string,
    reason?: string
  ): Promise<void> {
    // Verify moderator has permission
    await this.verifyModeratorPermission(workspaceId, moderatorId);

    // Check target exists
    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId }
      }
    });

    if (!targetMember) {
      throw new NotFoundError('User not found in workspace');
    }

    // Cannot kick admins
    if (targetMember.role === 'ADMIN') {
      throw new ForbiddenError('Cannot kick workspace administrators');
    }

    // Remove user from workspace
    await this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId }
      }
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        userId: moderatorId,
        action: 'USER_KICKED',
        targetId: targetUserId,
        targetType: 'USER',
        metadata: { reason }
      }
    });
  }

  async banUser(
    workspaceId: string,
    targetUserId: string,
    moderatorId: string,
    reason?: string
  ): Promise<void> {
    // Verify moderator has permission
    await this.verifyModeratorPermission(workspaceId, moderatorId);

    // Check target exists
    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId }
      }
    });

    if (!targetMember) {
      throw new NotFoundError('User not found in workspace');
    }

    // Cannot ban admins
    if (targetMember.role === 'ADMIN') {
      throw new ForbiddenError('Cannot ban workspace administrators');
    }

    // Mark as banned
    await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId }
      },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedBy: moderatorId,
        banReason: reason
      }
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        userId: moderatorId,
        action: 'USER_BANNED',
        targetId: targetUserId,
        targetType: 'USER',
        metadata: { reason }
      }
    });
  }

  async unbanUser(
    workspaceId: string,
    targetUserId: string,
    moderatorId: string
  ): Promise<void> {
    // Verify moderator has permission
    await this.verifyModeratorPermission(workspaceId, moderatorId);

    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId }
      }
    });

    if (!targetMember) {
      throw new NotFoundError('User not found in workspace');
    }

    if (!targetMember.isBanned) {
      throw new ValidationError('User is not banned');
    }

    // Unban user
    await this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId }
      },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedBy: null,
        banReason: null
      }
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        userId: moderatorId,
        action: 'USER_UNBANNED',
        targetId: targetUserId,
        targetType: 'USER',
        metadata: {}
      }
    });
  }

  async getAuditLogs(
    workspaceId: string,
    userId: string,
    filters?: {
      action?: string;
      targetType?: string;
      limit?: number;
    }
  ): Promise<AuditLog[]> {
    // Verify user is admin
    await this.verifyModeratorPermission(workspaceId, userId);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        workspaceId,
        ...(filters?.action && { action: filters.action }),
        ...(filters?.targetType && { targetType: filters.targetType })
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 100
    });

    // Fetch user details separately since AuditLog has no user relation
    const userIds = [...new Set(logs.map((log) => log.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Combine logs with user data
    return logs.map((log) => ({
      ...log,
      user: userMap.get(log.userId) || null
    }));
  }

  private async verifyModeratorPermission(
    workspaceId: string,
    userId: string
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });

    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required');
    }
  }
}
