// Channel Webhook Routes - Bot Integration CRUD + Execution
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { ChannelWebhookService } from '../../../02-application/services/channel-webhook.service.js';

const webhookService = new ChannelWebhookService(prisma);

// Schemas
const channelIdParam = z.object({
  channelId: z.string().min(1)
});

const webhookIdParam = z.object({
  id: z.string().min(1)
});

const createBody = z.object({
  name: z.string().min(1).max(80).trim(),
  avatarUrl: z.string().url().optional(),
  description: z.string().max(200).optional()
});

const updateBody = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional()
});

const executeBody = z.object({
  content: z.string().min(1).max(4000),
  username: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional()
});

const _tokenParam = z.object({
  token: z.string().min(1)
});

// Authenticated CRUD routes under /api/v1/channel-webhooks
export async function channelWebhookRoutes(app: FastifyInstance) {
  // Set socket server reference
  if (app.io) {
    webhookService.setSocketServer(app.io);
  }

  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // GET /channel-webhooks/:channelId — List webhooks for a channel
  app.get<{ Params: z.infer<typeof channelIdParam> }>(
    '/:channelId',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' }
      },
      preHandler: app.validateParams(channelIdParam)
    },
    async (request) => {
      const webhooks = await webhookService.getWebhooks(
        request.params.channelId
      );
      // Strip tokens from response for non-creators
      const sanitized = webhooks.map((w) => ({
        ...w,
        token: w.createdBy === request.user.id ? w.token : '••••••••'
      }));
      return { success: true, data: sanitized };
    }
  );

  // POST /channel-webhooks/:channelId — Create webhook for a channel
  app.post<{
    Params: z.infer<typeof channelIdParam>;
    Body: z.infer<typeof createBody>;
  }>(
    '/:channelId',
    {
      config: {
        rateLimit: { max: 5, timeWindow: '1 minute' }
      },
      preHandler: [
        app.validateParams(channelIdParam),
        app.validateBody(createBody)
      ]
    },
    async (request) => {
      const webhook = await webhookService.createWebhook({
        channelId: request.params.channelId,
        name: request.body.name,
        avatarUrl: request.body.avatarUrl,
        description: request.body.description,
        createdBy: request.user.id
      });
      return { success: true, data: webhook };
    }
  );

  // PATCH /channel-webhooks/manage/:id — Update webhook
  app.patch<{
    Params: z.infer<typeof webhookIdParam>;
    Body: z.infer<typeof updateBody>;
  }>(
    '/manage/:id',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      preHandler: [
        app.validateParams(webhookIdParam),
        app.validateBody(updateBody)
      ]
    },
    async (request) => {
      const webhook = await webhookService.updateWebhook(
        request.params.id,
        request.user.id,
        request.body
      );
      return { success: true, data: webhook };
    }
  );

  // DELETE /channel-webhooks/manage/:id — Delete webhook
  app.delete<{ Params: z.infer<typeof webhookIdParam> }>(
    '/manage/:id',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      preHandler: app.validateParams(webhookIdParam)
    },
    async (request) => {
      await webhookService.deleteWebhook(request.params.id, request.user.id);
      return { success: true };
    }
  );

  // POST /channel-webhooks/manage/:id/regenerate — Regenerate webhook token
  app.post<{ Params: z.infer<typeof webhookIdParam> }>(
    '/manage/:id/regenerate',
    {
      config: {
        rateLimit: { max: 5, timeWindow: '1 minute' }
      },
      preHandler: app.validateParams(webhookIdParam)
    },
    async (request) => {
      const webhook = await webhookService.regenerateToken(
        request.params.id,
        request.user.id
      );
      return { success: true, data: webhook };
    }
  );
}

// Webhook execution route — no auth, token-based
// Registered separately at /api/webhooks/execute
export async function webhookExecuteRoutes(app: FastifyInstance) {
  // Set socket server reference
  if (app.io) {
    webhookService.setSocketServer(app.io);
  }

  // POST /api/webhooks/execute/:token — Execute webhook (send message)
  app.post<{
    Params: z.infer<typeof tokenParam>;
    Body: z.infer<typeof executeBody>;
  }>(
    '/:token',
    {
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' }
      },
      preHandler: app.validateBody(executeBody)
    },
    async (request) => {
      const result = await webhookService.executeWebhook(
        request.params.token,
        request.body
      );
      return { success: true, data: result };
    }
  );
}

// Export service for socket server injection
export { webhookService as channelWebhookServiceInstance };
