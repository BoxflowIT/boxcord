// API Routes Index
import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
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
import { inviteRoutes } from './invite.routes.js';
import { initialDataRoutes } from './initial.routes.js';
import { voiceRoutes } from './voice.routes.js';
import { searchRoutes } from './search.routes.js';
import { categoryRoutes } from './category.routes.js';
import { moderationRoutes } from './moderation.routes.js';
import { healthRoutes } from './health.routes.js';
import embedRoutes from './embed.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  // Health checks (no prefix, no auth required)
  await app.register(healthRoutes);

  // Ensure uploads directory exists
  const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  // Serve uploaded files
  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
    decorateReply: false
  });

  // All API routes under /api/v1
  await app.register(
    async (api) => {
      await api.register(initialDataRoutes); // No prefix, handles /initial
      await api.register(workspaceRoutes, { prefix: '/workspaces' });
      await api.register(channelRoutes, { prefix: '/channels' });
      await api.register(messageRoutes, { prefix: '/messages' });
      await api.register(userRoutes, { prefix: '/users' });
      await api.register(dmRoutes, { prefix: '/dm' });
      await api.register(reactionRoutes, { prefix: '/reactions' });
      await api.register(fileRoutes, { prefix: '/files' });
      await api.register(pushRoutes, { prefix: '/push' });
      await api.register(chatbotRoutes, { prefix: '/chatbot' });
      await api.register(inviteRoutes, { prefix: '/invites' });
      await api.register(voiceRoutes, { prefix: '/voice' });
      await api.register(searchRoutes, { prefix: '/search' });
      await api.register(categoryRoutes, { prefix: '/workspaces' });
      await api.register(moderationRoutes, { prefix: '/workspaces' });
      await api.register(embedRoutes, { prefix: '/embeds' });
    },
    { prefix: '/api/v1' }
  );

  // Webhook routes (external integrations) under /api/webhooks
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
}
