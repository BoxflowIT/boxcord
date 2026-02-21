// Reaction Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import {
  ReactionService,
  QUICK_REACTIONS
} from '../../../02-application/services/reaction.service.js';
import { schemas } from '../plugins/validation.js';

const reactionService = new ReactionService(prisma);

// Local schemas
const emojiQuery = z.object({
  emoji: z.string().min(1).max(10)
});

export async function reactionRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get available quick reactions
  app.get('/quick', async () => {
    return { success: true, data: QUICK_REACTIONS };
  });

  // Toggle reaction on channel message
  app.post<{
    Params: { messageId: string };
    Body: z.infer<typeof schemas.toggleReaction>;
  }>(
    '/messages/:messageId',
    {
      preHandler: app.validateBody(schemas.toggleReaction)
    },
    async (request) => {
      const added = await reactionService.toggleReaction(
        request.params.messageId,
        request.user.id,
        request.body.emoji
      );

      // Broadcast reaction change via socket
      if (app.io) {
        const message = await prisma.message.findUnique({
          where: { id: request.params.messageId }
        });
        if (message) {
          app.io.to(`channel:${message.channelId}`).emit('reaction:toggle', {
            messageId: request.params.messageId,
            userId: request.user.id,
            emoji: request.body.emoji,
            added
          });
        }
      }

      return { success: true, data: { added } };
    }
  );

  // Get reaction counts for a message
  app.get<{ Params: { messageId: string } }>(
    '/messages/:messageId',
    async (request) => {
      const counts = await reactionService.getReactionCounts(
        request.params.messageId,
        request.user.id
      );
      return { success: true, data: counts };
    }
  );

  // Get users who reacted with specific emoji
  app.get<{
    Params: { messageId: string };
    Querystring: z.infer<typeof emojiQuery>;
  }>(
    '/messages/:messageId/users',
    {
      preHandler: app.validateQuery(emojiQuery)
    },
    async (request) => {
      const userIds = await reactionService.getReactedUsers(
        request.params.messageId,
        request.query.emoji
      );
      return { success: true, data: userIds };
    }
  );

  // Toggle reaction on DM
  app.post<{
    Params: { messageId: string };
    Body: z.infer<typeof schemas.toggleReaction>;
  }>(
    '/dm/:messageId',
    {
      preHandler: app.validateBody(schemas.toggleReaction)
    },
    async (request) => {
      const added = await reactionService.toggleDMReaction(
        request.params.messageId,
        request.user.id,
        request.body.emoji
      );

      // Broadcast via socket
      if (app.io) {
        const message = await prisma.directMessage.findUnique({
          where: { id: request.params.messageId }
        });
        if (message) {
          app.io.to(`dm:${message.channelId}`).emit('dm:reaction', {
            messageId: request.params.messageId,
            userId: request.user.id,
            emoji: request.body.emoji,
            added
          });
        }
      }

      return { success: true, data: { added } };
    }
  );
}
