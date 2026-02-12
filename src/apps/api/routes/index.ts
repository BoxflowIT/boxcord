// API Routes Index
import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import { workspaceRoutes } from './workspace.routes.js';
import { channelRoutes } from './channel.routes.js';
import { messageRoutes } from './message.routes.js';
import { userRoutes } from './user.routes.js';
import { dmRoutes } from './dm.routes.js';
import { reactionRoutes } from './reaction.routes.js';
import { fileRoutes } from './file.routes.js';
import { pushRoutes } from './push.routes.js';
import { webhookRoutes } from './webhook.routes.js';
import { chatbotRoutes } from './chatbot.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  // Serve uploaded files
  await app.register(fastifyStatic, {
    root: join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads'),
    prefix: '/uploads/',
    decorateReply: false
  });

  // All API routes under /api/v1
  await app.register(
    async (api) => {
      await api.register(workspaceRoutes, { prefix: '/workspaces' });
      await api.register(channelRoutes, { prefix: '/channels' });
      await api.register(messageRoutes, { prefix: '/messages' });
      await api.register(userRoutes, { prefix: '/users' });
      await api.register(dmRoutes, { prefix: '/dm' });
      await api.register(reactionRoutes, { prefix: '/reactions' });
      await api.register(fileRoutes, { prefix: '/files' });
      await api.register(pushRoutes, { prefix: '/push' });
      await api.register(chatbotRoutes, { prefix: '/chatbot' });
    },
    { prefix: '/api/v1' }
  );

  // Webhook routes (external integrations) under /api/webhooks
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
}
