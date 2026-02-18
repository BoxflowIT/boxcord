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
  app.get<{ Querystring: { workspaceId: string } }>(
    '/',
    async (request, reply) => {
      const { workspaceId } = request.query;
      const userId = request.user.id;

      app.log.info(
        `Getting channels for workspace ${workspaceId}, user ${userId}`
      );

      const channels = await channelService.getWorkspaceChannels(
        workspaceId,
        userId
      );

      app.log.info(
        `Found ${channels.length} channels: ${channels.map((c) => `${c.name}(${c.id})`).join(', ')}`
      );

      // Prevent all HTTP caching
      reply.header(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');

      return { success: true, data: channels };
    }
  );

  // Get single channel
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const channel = await channelService.getChannel(request.params.id);
    reply.cache({ maxAge: 300, staleWhileRevalidate: 600 });
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
    app.log.info(
      `Created channel ${channel.name} (${channel.id}), isPrivate: ${channel.isPrivate}`
    );

    // Add creator as member so they can see the channel
    // MUST complete before returning to avoid race condition with GET /channels
    try {
      await prisma.channelMember.create({
        data: {
          channelId: channel.id,
          userId: request.user.id
        }
      });
      app.log.info(
        `Added user ${request.user.id} as member of channel ${channel.id}`
      );
    } catch (err: any) {
      // Only ignore duplicate errors, throw everything else
      if (!err.message?.includes('Unique constraint')) {
        app.log.error('Failed to create channel member:', err);
        throw err;
      }
      app.log.info(
        `User ${request.user.id} already member of channel ${channel.id}`
      );
    }

    // Emit socket event to all users in workspace
    const io = app.io;
    if (io) {
      io.to(`workspace:${channel.workspaceId}`).emit(
        'channel:created',
        channel
      );
    }

    return reply.status(201).send({ success: true, data: channel });
  });

  // Delete channel
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    // Get channel info before deletion for socket event
    const channel = await channelService.getChannel(request.params.id);
    await channelService.deleteChannel(request.params.id);

    // Emit socket event to all users in workspace
    const io = app.io;
    if (io && channel) {
      io.to(`workspace:${channel.workspaceId}`).emit('channel:deleted', {
        channelId: request.params.id,
        workspaceId: channel.workspaceId
      });
    }

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

  // Mark channel as read
  app.post<{ Params: { id: string } }>('/:id/read', async (request, reply) => {
    // Use upsert to create membership if it doesn't exist (for public channels)
    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: request.params.id,
          userId: request.user.id
        }
      },
      update: {
        lastReadAt: new Date()
      },
      create: {
        channelId: request.params.id,
        userId: request.user.id,
        lastReadAt: new Date()
      }
    });

    return reply.status(204).send();
  });
}
