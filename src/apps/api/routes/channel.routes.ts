// Channel Routes
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { ChannelService } from '../../../02-application/services/channel.service.js';
import type { ChannelType } from '../../../01-domain/entities/channel.js';

const channelService = new ChannelService(prisma);

export async function channelRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get channels for a workspace
  app.get<{ Querystring: { workspaceId: string } }>('/', async (request) => {
    const channels = await channelService.getWorkspaceChannels(
      request.query.workspaceId,
      request.user.id
    );
    return { success: true, data: channels };
  });

  // Get single channel
  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const channel = await channelService.getChannel(request.params.id);
    return { success: true, data: channel };
  });

  // Create channel
  app.post<{
    Body: {
      workspaceId: string;
      name: string;
      description?: string;
      type?: ChannelType;
      isPrivate?: boolean;
    };
  }>('/', async (request, reply) => {
    const channel = await channelService.createChannel(request.body);
    return reply.status(201).send({ success: true, data: channel });
  });

  // Delete channel
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await channelService.deleteChannel(request.params.id);
    return reply.status(204).send();
  });

  // Update channel
  app.patch<{
    Params: { id: string };
    Body: { name?: string; description?: string };
  }>('/:id', async (request) => {
    const channel = await channelService.updateChannel(
      request.params.id,
      request.body
    );
    return { success: true, data: channel };
  });

  // Join channel
  app.post<{ Params: { id: string } }>('/:id/join', async (request) => {
    await channelService.joinChannel(request.params.id, request.user.id);
    return { success: true };
  });

  // Leave channel
  app.post<{ Params: { id: string } }>('/:id/leave', async (request) => {
    await channelService.leaveChannel(request.params.id, request.user.id);
    return { success: true };
  });
}
