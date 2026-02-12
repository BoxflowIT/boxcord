// Boxcord API - Main Entry Point
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  connectDatabase,
  prisma
} from '../../03-infrastructure/database/client.js';
import { jwtPlugin } from './plugins/jwt.js';
import { setupSocketHandlers } from './plugins/socket.js';
import { errorHandler } from './plugins/error-handler.js';
import { registerRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';

async function main() {
  // Create Fastify instance
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true
  });

  // JWT authentication
  await app.register(jwtPlugin);

  // Custom error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }));

  // API routes
  await registerRoutes(app);

  // Serve frontend in production
  if (isProd) {
    const clientDistPath = join(__dirname, '../../../client/dist');
    await app.register(fastifyStatic, {
      root: clientDistPath,
      prefix: '/'
    });

    // SPA fallback - serve index.html for non-API routes
    app.setNotFoundHandler((request, reply) => {
      if (
        !request.url.startsWith('/api/') &&
        !request.url.startsWith('/socket.io')
      ) {
        return reply.sendFile('index.html');
      }
      return reply.status(404).send({ error: 'Not found' });
    });
  }

  // Connect to database
  await connectDatabase();

  // Setup Socket.io before starting server
  const io = new Server(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? '*',
      credentials: true
    }
  });

  // Setup socket handlers (not as Fastify plugin)
  setupSocketHandlers(io, app, prisma);

  // Attach io to app for use in routes
  app.decorate('io', io);

  // Start server
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`🚀 Boxcord API running at http://${HOST}:${PORT}`);
  app.log.info('🔌 WebSocket server ready');

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`${signal} received, shutting down...`);
      io.close();
      await app.close();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
