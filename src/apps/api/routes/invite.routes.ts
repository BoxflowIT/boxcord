// Invite Routes - Join workspaces via invite codes
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { WorkspaceService } from '../../../02-application/services/workspace.service.js';

const workspaceService = new WorkspaceService(prisma);

export async function inviteRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Preview invite (get workspace info without joining)
  app.get<{ Params: { code: string } }>('/:code', async (request, reply) => {
    const invite = await workspaceService.getInviteByCode(request.params.code);

    if (!invite) {
      return reply.status(404).send({
        success: false,
        error: 'Invite not found or expired'
      });
    }

    return {
      success: true,
      data: {
        code: invite.code,
        workspace: {
          id: invite.workspace.id,
          name: invite.workspace.name,
          description: invite.workspace.description,
          iconUrl: invite.workspace.iconUrl
        }
      }
    };
  });

  // Use invite to join workspace
  app.post<{ Params: { code: string } }>(
    '/:code/join',
    async (request, reply) => {
      try {
        const result = await workspaceService.useInvite(
          request.params.code,
          request.user.id
        );

        return reply.status(201).send({
          success: true,
          data: {
            workspace: result.workspace,
            member: result.member
          }
        });
      } catch {
        return reply.status(404).send({
          success: false,
          error: 'Invite not found or expired'
        });
      }
    }
  );
}
