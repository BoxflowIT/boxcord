// Moderation Routes - User moderation (kick, ban)
import type { FastifyInstance } from 'fastify';
import { ModerationService } from '../../../02-application/services/moderation.service.js';
import { prisma } from '../../../03-infrastructure/database/client.js';

export async function moderationRoutes(fastify: FastifyInstance) {
  const moderationService = new ModerationService(prisma);

  // POST /api/v1/workspaces/:workspaceId/kick - Kick user
  fastify.post(
    '/:workspaceId/kick',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
            reason: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { userId: targetUserId, reason } = request.body as {
        userId: string;
        reason?: string;
      };
      const moderatorId = request.user.id;

      await moderationService.kickUser(
        workspaceId,
        targetUserId,
        moderatorId,
        reason
      );

      // Emit socket event
      if (fastify.io) {
        fastify.io.to(`workspace:${workspaceId}`).emit('user:kicked', {
          workspaceId,
          userId: targetUserId,
          moderatorId,
          reason
        });
      }

      return reply.send({
        success: true,
        data: { message: 'User kicked' }
      });
    }
  );

  // POST /api/v1/workspaces/:workspaceId/ban - Ban user
  fastify.post(
    '/:workspaceId/ban',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
            reason: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { userId: targetUserId, reason } = request.body as {
        userId: string;
        reason?: string;
      };
      const moderatorId = request.user.id;

      await moderationService.banUser(
        workspaceId,
        targetUserId,
        moderatorId,
        reason
      );

      // Emit socket event
      if (fastify.io) {
        fastify.io.to(`workspace:${workspaceId}`).emit('user:banned', {
          workspaceId,
          userId: targetUserId,
          moderatorId,
          reason
        });
      }

      return reply.send({
        success: true,
        data: { message: 'User banned' }
      });
    }
  );

  // POST /api/v1/workspaces/:workspaceId/unban - Unban user
  fastify.post(
    '/:workspaceId/unban',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { userId: targetUserId } = request.body as { userId: string };
      const moderatorId = request.user.id;

      await moderationService.unbanUser(workspaceId, targetUserId, moderatorId);

      // Emit socket event
      if (fastify.io) {
        fastify.io.to(`workspace:${workspaceId}`).emit('user:unbanned', {
          workspaceId,
          userId: targetUserId,
          moderatorId
        });
      }

      return reply.send({
        success: true,
        data: { message: 'User unbanned' }
      });
    }
  );

  // GET /api/v1/workspaces/:workspaceId/audit-logs - Get audit logs
  fastify.get(
    '/:workspaceId/audit-logs',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            targetType: { type: 'string' },
            limit: { type: 'number' }
          }
        }
      }
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const filters = request.query as {
        action?: string;
        targetType?: string;
        limit?: number;
      };
      const userId = request.user.id;

      const logs = await moderationService.getAuditLogs(
        workspaceId,
        userId,
        filters
      );

      return reply.send({
        success: true,
        data: logs
      });
    }
  );
}
