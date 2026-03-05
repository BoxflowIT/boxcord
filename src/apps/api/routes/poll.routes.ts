// Poll Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { PollService } from '../../../02-application/services/poll.service.js';
import { schemas } from '../plugins/validation.js';
import { SOCKET_EVENTS } from '../../../00-core/constants.js';

const pollService = new PollService(prisma);

export async function pollRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Create a poll
  app.post<{
    Body: z.infer<typeof schemas.createPoll>;
  }>(
    '/',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(schemas.createPoll)
    },
    async (request) => {
      const result = await pollService.createPoll({
        channelId: request.body.channelId,
        creatorId: request.user.id,
        question: request.body.question,
        options: request.body.options,
        isMultiple: request.body.isMultiple,
        isAnonymous: request.body.isAnonymous,
        endsAt: request.body.endsAt ? new Date(request.body.endsAt) : undefined
      });

      // Broadcast via socket so the message appears in the channel in real-time
      if (app.io) {
        // Emit message:new so the message list updates
        app.io
          .to(`channel:${result.poll.channelId}`)
          .emit(SOCKET_EVENTS.MESSAGE_NEW, result.message);

        // Also broadcast to workspace for unread badge updates
        const channel = await prisma.channel.findUnique({
          where: { id: result.poll.channelId },
          select: { workspaceId: true }
        });
        if (channel) {
          app.io
            .to(`workspace:${channel.workspaceId}`)
            .emit(SOCKET_EVENTS.MESSAGE_NEW, result.message);
        }

        // Emit poll:created for any poll-specific listeners
        app.io
          .to(`channel:${result.poll.channelId}`)
          .emit(SOCKET_EVENTS.POLL_CREATED, result.poll);
      }

      return { success: true, data: result.poll };
    }
  );

  // Get poll by ID
  app.get<{ Params: { pollId: string } }>('/:pollId', async (request) => {
    const poll = await pollService.getPoll(
      request.params.pollId,
      request.user.id
    );
    return { success: true, data: poll };
  });

  // Get poll by message ID
  app.get<{ Params: { messageId: string } }>(
    '/message/:messageId',
    async (request) => {
      const poll = await pollService.getPollByMessageId(
        request.params.messageId,
        request.user.id
      );
      return { success: true, data: poll };
    }
  );

  // Vote on a poll
  app.post<{
    Params: { pollId: string };
    Body: z.infer<typeof schemas.votePoll>;
  }>(
    '/:pollId/vote',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute'
        }
      },
      preHandler: app.validateBody(schemas.votePoll)
    },
    async (request) => {
      const poll = await pollService.vote(
        request.params.pollId,
        request.body.optionId,
        request.user.id
      );

      // Broadcast lightweight vote event (user-agnostic)
      // Each client derives its own hasVoted from its userId
      // NOTE: Always send actual voter IDs so clients can derive hasVoted,
      // even for anonymous polls (client handles anonymity in display)
      if (app.io) {
        // Get raw poll data with actual voter IDs
        const rawPoll = await prisma.poll.findUnique({
          where: { id: request.params.pollId },
          include: {
            options: {
              include: { votes: { select: { userId: true } } },
              orderBy: { position: 'asc' }
            }
          }
        });

        if (rawPoll) {
          const totalVotes = rawPoll.options.reduce(
            (sum, o) => sum + o.votes.length,
            0
          );
          app.io
            .to(`channel:${poll.channelId}`)
            .emit(SOCKET_EVENTS.POLL_VOTED, {
              pollId: poll.id,
              messageId: poll.messageId,
              channelId: poll.channelId,
              voterId: request.user.id,
              options: rawPoll.options.map((o) => ({
                id: o.id,
                voteCount: o.votes.length,
                percentage:
                  totalVotes > 0
                    ? Math.round((o.votes.length / totalVotes) * 100)
                    : 0,
                voters: o.votes.map((v) => v.userId)
              })),
              totalVotes
            });
        }
      }

      return { success: true, data: poll };
    }
  );

  // End a poll early
  app.post<{ Params: { pollId: string } }>('/:pollId/end', async (request) => {
    const poll = await pollService.endPoll(
      request.params.pollId,
      request.user.id
    );

    // Broadcast poll end via socket
    if (app.io) {
      app.io
        .to(`channel:${poll.channelId}`)
        .emit(SOCKET_EVENTS.POLL_ENDED, poll);
    }

    return { success: true, data: poll };
  });

  // Delete a poll
  app.delete<{ Params: { pollId: string } }>('/:pollId', async (request) => {
    await pollService.deletePoll(request.params.pollId, request.user.id);
    return { success: true };
  });
}
