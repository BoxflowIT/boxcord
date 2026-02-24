// Audit Logging Service
// Logs security-sensitive operations for compliance and forensics
import type { PrismaClient } from '@prisma/client';
import { logger } from '../../00-core/logger.js';

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_ROLE_CHANGED'
  | 'USER_KICKED'
  | 'USER_BANNED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_JOINED'
  | 'WORKSPACE_CREATED'
  | 'WORKSPACE_DELETED'
  | 'CHANNEL_CREATED'
  | 'CHANNEL_DELETED'
  | 'INVITE_CREATED'
  | 'INVITE_USED'
  | 'MESSAGE_DELETED_BY_MODERATOR'
  | 'PERMISSION_CHANGED'
  | 'SETTINGS_CHANGED';

export interface AuditLogEntry {
  action: AuditAction;
  userId: string; // Who performed the action
  targetId?: string;
  targetType?: 'USER' | 'WORKSPACE' | 'CHANNEL' | 'MESSAGE' | 'INVITE';
  workspaceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log an audit event to the database
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId,
          targetId: entry.targetId,
          targetType: entry.targetType,
          workspaceId: entry.workspaceId,
          metadata: entry.metadata as object | undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent
        }
      });
    } catch (error) {
      // Don't fail the main operation if logging fails
      // But log to console for debugging
      logger.error({ error, entry }, '[AUDIT] Failed to log audit event');
    }
  }

  /**
   * Get audit logs for a workspace
   */
  async getWorkspaceLogs(
    workspaceId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: AuditAction;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: Record<string, unknown> = { workspaceId };

    if (options?.action) {
      where.action = options.action;
    }
    if (options?.userId) {
      where.userId = options.userId;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) {
        (where.createdAt as Record<string, Date>).gte = options.startDate;
      }
      if (options?.endDate) {
        (where.createdAt as Record<string, Date>).lte = options.endDate;
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0
    });

    return logs;
  }

  /**
   * Get audit logs for a specific user's actions
   */
  async getUserActionLogs(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const logs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0
    });

    return logs;
  }

  /**
   * Get audit logs targeting a specific user
   */
  async getUserTargetLogs(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        targetId: userId,
        targetType: 'USER'
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0
    });

    return logs;
  }
}
