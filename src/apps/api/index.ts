// Boxcord API - Main Entry Point
import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
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
import cachePlugin from './plugins/cache.js';
import securityPlugin from './plugins/security.js';
import rateLimitPlugin from './plugins/rate-limit.js';
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
    },
    // Connection pooling
    connectionTimeout: 10000,
    keepAliveTimeout: 65000,
    // Request payload optimization
    bodyLimit: 10 * 1024 * 1024 // 10MB max
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true
  });

  // Security headers (helmet)
  if (isProd) {
    await app.register(securityPlugin);
  }

  // Rate limiting
  await app.register(rateLimitPlugin);

  // Compression for responses (gzip/brotli)
  await app.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['gzip', 'deflate']
  });

  // JWT authentication
  await app.register(jwtPlugin);

  // Cache plugin for performance
  await app.register(cachePlugin);

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

  // Warmup database connection (prevent initial 500 errors)
  try {
    await prisma.$queryRaw`SELECT 1`;
    app.log.info('🔥 Database connection warmed up');
  } catch (err) {
    app.log.warn(
      `Database warmup failed, but continuing... ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Setup Socket.io before starting server
  const io = new Server(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? '*',
      credentials: true
    },
    // Explicit transport config to help with WebSocket upgrades
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    pingTimeout: 90000, // 90s before timeout (longer = fewer reconnects)
    pingInterval: 45000 // Ping every 45 seconds (longer = fewer requests)
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
