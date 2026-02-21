// Boxcord API - Main Entry Point
import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { config, isProduction } from '../../00-core/config.js';
import { logger } from '../../00-core/logger.js';
import { setupGracefulShutdown } from '../../00-core/shutdown.js';
import { initSentry } from '../../03-infrastructure/sentry.js';
import {
  connectDatabase,
  prisma
} from '../../03-infrastructure/database/client.js';
import { jwtPlugin } from './plugins/jwt.js';
import { setupSocketHandlers } from './plugins/socket.js';
import { errorHandler } from './plugins/error-handler.js';
import cachePlugin from './plugins/cache.js';
import metricsPlugin from './plugins/metrics.plugin.js';
import securityPlugin from './plugins/security.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import validationPlugin from './plugins/validation.js';
import { registerRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(config.PORT, 10);
const HOST = config.HOST;

async function main() {
  // Initialize Sentry for error tracking
  initSentry();

  logger.info('Starting Boxcord API...');

  // Create Fastify instance
  const app = Fastify({
    logger: false, // Use Pino directly instead
    // Connection pooling
    connectionTimeout: 10000,
    keepAliveTimeout: 65000,
    // Request payload optimization (increased for voice channels)
    bodyLimit: 100 * 1024 * 1024 // 100MB max for audio uploads
  });

  // Register plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true
  });

  // Security headers (helmet)
  if (isProduction) {
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

  // Input validation
  await app.register(validationPlugin);

  // Cache plugin for performance
  await app.register(cachePlugin);

  // Metrics plugin for monitoring
  await app.register(metricsPlugin);

  // Custom error handler
  app.setErrorHandler(errorHandler);

  // API routes
  await registerRoutes(app);

  // Serve frontend in production
  if (isProduction) {
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
    logger.info('🔥 Database connection warmed up');
  } catch (err) {
    logger.warn(
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
  logger.info(`🚀 Boxcord API running at http://${HOST}:${PORT}`);
  logger.info('🔌 WebSocket server ready');

  // Setup graceful shutdown handlers
  setupGracefulShutdown({ server: app, io });
}

main().catch((err) => {
  console.error('❌ Failed to start server');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  if (err.code) console.error('Error code:', err.code);
  logger.error({ error: err }, 'Failed to start server');
  process.exit(1);
});
