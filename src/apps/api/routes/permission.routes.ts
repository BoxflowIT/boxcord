// Permission Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { PermissionService } from '../../../02-application/services/permission.service.js';

const permissionService = new PermissionService(prisma);

const getPermissionsQuery = z.object({
  channelId: z.string().min(1)
});

const setPermissionsBody = z.object({
  channelId: z.string().min(1),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  permissions: z.object({
    canViewChannel: z.boolean().optional(),
    canSendMessages: z.boolean().optional(),
    canAddReactions: z.boolean().optional(),
    canAttachFiles: z.boolean().optional(),
    canEmbed: z.boolean().optional(),
    canMentionEveryone: z.boolean().optional(),
    canManageMessages: z.boolean().optional(),
    canManageChannel: z.boolean().optional(),
    canManageMembers: z.boolean().optional()
  })
});

const checkPermissionQuery = z.object({
  channelId: z.string().min(1),
  permission: z.enum([
    'canViewChannel',
    'canSendMessages',
    'canAddReactions',
    'canAttachFiles',
    'canEmbed',
    'canMentionEveryone',
    'canManageMessages',
    'canManageChannel',
    'canManageMembers'
  ])
});

export async function permissionRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get all permissions for a channel (all roles)
  app.get<{ Querystring: z.infer<typeof getPermissionsQuery> }>(
    '/',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' }
      },
      preHandler: app.validateQuery(getPermissionsQuery)
    },
    async (request, reply) => {
      const { channelId } = request.query;

      app.log.info(`Getting permissions for channel ${channelId}`);

      const permissions =
        await permissionService.getAllChannelPermissions(channelId);

      reply.header('Cache-Control', 'no-cache');
      return { success: true, data: permissions };
    }
  );

  // Get current user's permissions for a channel
  app.get<{ Querystring: z.infer<typeof getPermissionsQuery> }>(
    '/me',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' }
      },
      preHandler: app.validateQuery(getPermissionsQuery)
    },
    async (request, reply) => {
      const { channelId } = request.query;
      const userId = request.user.id;

      app.log.info(
        `Getting user permissions for channel ${channelId}, user ${userId}`
      );

      const permissions = await permissionService.getUserPermissions(
        userId,
        channelId
      );

      reply.header('Cache-Control', 'no-cache');
      return { success: true, data: permissions };
    }
  );

  // Check if user has specific permission
  app.get<{ Querystring: z.infer<typeof checkPermissionQuery> }>(
    '/check',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' }
      },
      preHandler: app.validateQuery(checkPermissionQuery)
    },
    async (request, reply) => {
      const { channelId, permission } = request.query;
      const userId = request.user.id;

      const hasPermission = await permissionService.hasPermission(
        userId,
        channelId,
        permission
      );

      reply.header('Cache-Control', 'no-cache');
      return { success: true, data: { hasPermission } };
    }
  );

  // Set permissions for a role (requires admin/owner)
  app.post<{
    Body: z.infer<typeof setPermissionsBody>;
  }>(
    '/',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(setPermissionsBody)
    },
    async (request, reply) => {
      const { channelId, role, permissions } = request.body;
      const userId = request.user.id;

      // Check if user can manage channel
      const canManage = await permissionService.hasPermission(
        userId,
        channelId,
        'canManageChannel'
      );

      if (!canManage) {
        return reply.code(403).send({
          success: false,
          error: {
            message: 'You do not have permission to manage this channel'
          }
        });
      }

      app.log.info(
        `Setting permissions for channel ${channelId}, role ${role}`
      );

      const updated = await permissionService.setPermissions(
        channelId,
        role,
        permissions
      );

      return { success: true, data: updated };
    }
  );

  // Reset permissions to defaults
  app.delete<{
    Querystring: { channelId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' };
  }>(
    '/',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      preHandler: app.validateQuery(
        z.object({
          channelId: z.string().min(1),
          role: z.enum(['OWNER', 'ADMIN', 'MEMBER'])
        })
      )
    },
    async (request, reply) => {
      const { channelId, role } = request.query;
      const userId = request.user.id;

      // Check if user can manage channel
      const canManage = await permissionService.hasPermission(
        userId,
        channelId,
        'canManageChannel'
      );

      if (!canManage) {
        return reply.code(403).send({
          success: false,
          error: {
            message: 'You do not have permission to manage this channel'
          }
        });
      }

      app.log.info(
        `Resetting permissions for channel ${channelId}, role ${role}`
      );

      const permissions = await permissionService.resetPermissions(
        channelId,
        role
      );

      return { success: true, data: permissions };
    }
  );
}
