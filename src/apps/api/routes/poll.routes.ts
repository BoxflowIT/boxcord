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
  app.get<{ Params: { pollId: string } }>(
    '/:pollId',
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute'
        }
      }
    },
    async (request, reply) => {
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      const poll = await pollService.getPoll(
        request.params.pollId,
        request.user.id
      );
      return { success: true, data: poll };
    }
  );

  // Get poll by message ID
  app.get<{ Params: { messageId: string } }>(
    '/message/:messageId',
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute'
        }
      }
    },
    async (request, reply) => {
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
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

      // Broadcast lightweight vote event so other clients update counts.
      // Use the formatted result from vote() — it already includes
      // voteCount, percentage, voters (empty for anonymous polls).
      // This avoids a redundant DB query.
      if (app.io) {
        app.io.to(`channel:${poll.channelId}`).emit(SOCKET_EVENTS.POLL_VOTED, {
          pollId: poll.id,
          messageId: poll.messageId,
          channelId: poll.channelId,
          // Omit voterId for anonymous polls — including it would
          // leak who just voted when combined with count changes.
          voterId: poll.isAnonymous ? undefined : request.user.id,
          options: poll.options.map((o) => ({
            id: o.id,
            voteCount: o.voteCount,
            percentage: o.percentage,
            // voters is already [] for anonymous polls (formatPollResults)
            voters: o.voters
          })),
          totalVotes: poll.totalVotes
        });
      }

      return { success: true, data: poll };
    }
  );

  // End a poll early
  app.post<{ Params: { pollId: string } }>(
    '/:pollId/end',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      }
    },
    async (request) => {
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
    }
  );

  // Delete a poll
  app.delete<{ Params: { pollId: string } }>(
    '/:pollId',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      }
    },
    async (request) => {
      // Fetch poll data before deletion so we can broadcast the correct events
      const poll = await pollService.getPoll(
        request.params.pollId,
        request.user.id
      );

      await pollService.deletePoll(request.params.pollId, request.user.id);

      // Broadcast deletion so other clients remove the poll/message
      if (app.io) {
        app.io
          .to(`channel:${poll.channelId}`)
          .emit(SOCKET_EVENTS.POLL_DELETED, {
            pollId: poll.id,
            messageId: poll.messageId,
            channelId: poll.channelId
          });
        app.io
          .to(`channel:${poll.channelId}`)
          .emit(SOCKET_EVENTS.MESSAGE_DELETED, {
            id: poll.messageId,
            channelId: poll.channelId
          });
      }

      return { success: true };
    }
  );
}
