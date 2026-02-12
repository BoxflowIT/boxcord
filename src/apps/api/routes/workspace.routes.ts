// Workspace Routes
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { WorkspaceService } from '../../../02-application/services/workspace.service.js';

const workspaceService = new WorkspaceService(prisma);

export async function workspaceRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get user's workspaces
  app.get('/', async (request) => {
    const workspaces = await workspaceService.getUserWorkspaces(
      request.user.id
    );
    return { success: true, data: workspaces };
  });

  // Get single workspace
  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const workspace = await workspaceService.getWorkspace(request.params.id);
    return { success: true, data: workspace };
  });

  // Create workspace
  app.post<{ Body: { name: string; description?: string } }>(
    '/',
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
  app.get<{ Params: { id: string } }>('/:id/members', async (request) => {
    const members = await workspaceService.getWorkspaceMembers(
      request.params.id
    );
    return { success: true, data: members };
  });

  // Add member to workspace
  app.post<{
    Params: { id: string };
    Body: { userId: string; role?: 'ADMIN' | 'MEMBER' };
  }>('/:id/members', async (request, reply) => {
    const member = await workspaceService.addMember(
      request.params.id,
      request.body.userId,
      request.body.role
    );
    return reply.status(201).send({ success: true, data: member });
  });

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
}
