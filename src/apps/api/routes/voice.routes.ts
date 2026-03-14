// Voice Channel Routes
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { VoiceService } from '../../../02-application/services/voice.service.js';

const voiceService = new VoiceService(prisma);

export async function voiceRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Join voice channel
  app.post<{ Params: { channelId: string } }>(
    '/channels/:channelId/join',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute'
        }
      }
    },
    async (request, reply) => {
      const session = await voiceService.joinChannel(
        request.params.channelId,
        request.user.id
      );

      // Get channel to find workspace
      const channel = await prisma.channel.findUnique({
        where: { id: request.params.channelId },
        select: { workspaceId: true }
      });

      // Notify via WebSocket
      if (app.io) {
        const activeUsers = await voiceService.getActiveUsers(
          request.params.channelId
        );

        const eventData = {
          channelId: request.params.channelId,
          userId: request.user.id,
          sessionId: session.id,
          activeUsers
        };

        // Emit to voice channel room (for WebRTC signaling)
        app.io
          .to(`voice:${request.params.channelId}`)
          .emit('voice:user-joined', eventData);

        // Also emit to workspace room (for sidebar updates)
        if (channel?.workspaceId) {
          app.io
            .to(`workspace:${channel.workspaceId}`)
            .emit('voice:users-updated', {
              channelId: request.params.channelId,
              users: activeUsers
            });
        }
      }

      return reply.status(200).send({ success: true, data: session });
    }
  );

  // Leave voice channel
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/leave',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const session = await voiceService.getCurrentSession(request.user.id);

      if (session) {
        // Get channel to find workspace before leaving
        const channel = await prisma.channel.findUnique({
          where: { id: session.channelId },
          select: { workspaceId: true }
        });

        await voiceService.leaveChannel(
          request.params.sessionId,
          request.user.id
        );

        // Notify via WebSocket
        if (app.io) {
          const activeUsers = await voiceService.getActiveUsers(
            session.channelId
          );

          // Emit to voice channel room
          app.io.to(`voice:${session.channelId}`).emit('voice:user-left', {
            channelId: session.channelId,
            userId: request.user.id,
            activeUsers
          });

          // Also emit to workspace room
          if (channel?.workspaceId) {
            app.io
              .to(`workspace:${channel.workspaceId}`)
              .emit('voice:users-updated', {
                channelId: session.channelId,
                users: activeUsers
              });
          }
        }
      }

      return reply.status(204).send();
    }
  );

  // Update voice state (mute/deafen/speaking)
  app.patch<{
    Params: { sessionId: string };
    Body: { isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean };
  }>(
    '/sessions/:sessionId',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, _reply) => {
      const updated = await voiceService.updateVoiceState(
        request.params.sessionId,
        request.user.id,
        request.body
      );

      // Get channel to find workspace
      const channel = await prisma.channel.findUnique({
        where: { id: updated.channelId },
        select: { workspaceId: true }
      });

      // Notify via WebSocket
      if (app.io) {
        const stateData = {
          channelId: updated.channelId,
          userId: request.user.id,
          sessionId: updated.id,
          isMuted: updated.isMuted,
          isDeafened: updated.isDeafened,
          isSpeaking: updated.isSpeaking
        };

        // Emit to voice channel room
        app.io
          .to(`voice:${updated.channelId}`)
          .emit('voice:state-changed', stateData);

        // Also emit to workspace room (for sidebar status updates)
        if (channel?.workspaceId) {
          app.io
            .to(`workspace:${channel.workspaceId}`)
            .emit('voice:users-updated', {
              channelId: updated.channelId
            });
        }
      }

      return { success: true, data: updated };
    }
  );

  // Get active users in voice channel
  app.get<{ Params: { channelId: string } }>(
    '/channels/:channelId/users',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const activeUsers = await voiceService.getActiveUsers(
        request.params.channelId
      );

      // Don't cache - this is real-time data that changes when users join/leave
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');

      return { success: true, data: activeUsers };
    }
  );

  // Get active users for all voice channels in workspace (batch optimization)
  app.get<{ Params: { workspaceId: string } }>(
    '/workspaces/:workspaceId/voice-users',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const voiceUsers = await voiceService.getWorkspaceVoiceUsers(
        request.params.workspaceId
      );

      // Don't cache - this is real-time data that changes when users join/leave
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');

      return { success: true, data: voiceUsers };
    }
  );

  // Get current voice session
  app.get(
    '/sessions/current',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request) => {
      const session = await voiceService.getCurrentSession(request.user.id);
      return { success: true, data: session };
    }
  );

  // Cleanup all active voice sessions for current user
  // Used on app mount to clean up stale sessions from previous page loads
  app.delete(
    '/users/me/sessions',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      await voiceService.cleanupUserSessions(request.user.id);
      app.log.debug(`Cleaned up voice sessions for user: ${request.user.id}`);
      return reply.status(204).send();
    }
  );
}
