// Workspace Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { WorkspaceService } from '../../../02-application/services/workspace.service.js';
import { schemas } from '../plugins/validation.js';

const workspaceService = new WorkspaceService(prisma);

// Local schemas
const addMemberBody = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER']).optional()
});

const createInviteBody = z.object({
  maxUses: z.number().int().min(1).max(100).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional()
});

export async function workspaceRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get user's workspaces
  app.get('/', async (request, reply) => {
    const workspaces = await workspaceService.getUserWorkspaces(
      request.user.id
    );
    reply.cache({ maxAge: 300, staleWhileRevalidate: 600 }); // 5min cache, 10min stale
    return { success: true, data: workspaces };
  });

  // Get single workspace
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const workspace = await workspaceService.getWorkspace(request.params.id);
    reply.cache({ maxAge: 300, staleWhileRevalidate: 600 });
    return { success: true, data: workspace };
  });

  // Create workspace
  app.post<{ Body: z.infer<typeof schemas.createWorkspace> }>(
    '/',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(schemas.createWorkspace)
    },
    async (request, reply) => {
      const workspace = await workspaceService.createWorkspace({
        name: request.body.name,
        description: request.body.description,
        ownerId: request.user.id
      });
      return reply.status(201).send({ success: true, data: workspace });
    }
  );

  // Get workspace members
  app.get<{ Params: { id: string } }>(
    '/:id/members',
    async (request, reply) => {
      const members = await workspaceService.getWorkspaceMembers(
        request.params.id
      );
      reply.cache({ maxAge: 60, staleWhileRevalidate: 300 }); // 1min cache, 5min stale
      return { success: true, data: members };
    }
  );

  // Add member to workspace
  app.post<{
    Params: { id: string };
    Body: z.infer<typeof addMemberBody>;
  }>(
    '/:id/members',
    {
      preHandler: app.validateBody(addMemberBody)
    },
    async (request, reply) => {
      const member = await workspaceService.addMember(
        request.params.id,
        request.body.userId,
        request.body.role
      );
      return reply.status(201).send({ success: true, data: member });
    }
  );

  // Remove member from workspace
  app.delete<{
    Params: { id: string; userId: string };
  }>('/:id/members/:userId', async (request, reply) => {
    await workspaceService.removeMember(
      request.params.id,
      request.params.userId,
      request.user.id
    );
    return reply.status(204).send();
  });

  // Leave workspace (current user leaves)
  app.post<{ Params: { id: string } }>('/:id/leave', async (request, reply) => {
    await workspaceService.leaveWorkspace(request.params.id, request.user.id);
    return reply.status(204).send();
  });

  // Delete workspace
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await workspaceService.deleteWorkspace(request.params.id, request.user.id);
    return reply.status(204).send();
  });

  // Update workspace
  app.patch<{
    Params: { id: string };
    Body: z.infer<typeof schemas.updateWorkspace>;
  }>(
    '/:id',
    {
      preHandler: app.validateBody(schemas.updateWorkspace)
    },
    async (request) => {
      const workspace = await workspaceService.updateWorkspace(
        request.params.id,
        request.user.id,
        request.body
      );
      return { success: true, data: workspace };
    }
  );

  // ============================================
  // INVITE ROUTES
  // ============================================

  // Create invite for workspace
  app.post<{
    Params: { id: string };
    Body: z.infer<typeof createInviteBody>;
  }>(
    '/:id/invites',
    {
      preHandler: app.validateBody(createInviteBody)
    },
    async (request, reply) => {
      const invite = await workspaceService.createInvite({
        workspaceId: request.params.id,
        createdBy: request.user.id,
        maxUses: request.body.maxUses,
        expiresInDays: request.body.expiresInDays
      });
      return reply.status(201).send({ success: true, data: invite });
    }
  );

  // Get workspace invites
  app.get<{ Params: { id: string } }>('/:id/invites', async (request) => {
    const invites = await workspaceService.getWorkspaceInvites(
      request.params.id,
      request.user.id
    );
    return { success: true, data: invites };
  });

  // Delete invite
  app.delete<{
    Params: { id: string; inviteId: string };
  }>('/:id/invites/:inviteId', async (request, reply) => {
    await workspaceService.deleteInvite(
      request.params.inviteId,
      request.user.id
    );
    return reply.status(204).send();
  });
}
