import { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../00-core/logger.js';
import { prisma } from '../03-infrastructure/database/client.js';

interface ShutdownOptions {
  server: FastifyInstance;
  io: SocketIOServer;
}

/**
 * Graceful shutdown handler for Kubernetes/Railway deployments
 * Handles SIGTERM and SIGINT signals to cleanly close connections
 */
export function setupGracefulShutdown({ server, io }: ShutdownOptions) {
  // Track if shutdown is in progress
  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, skipping');
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 30000); // 30 seconds

    try {
      // 1. Stop accepting new connections
      logger.info('Closing HTTP server...');
      await server.close();

      // 2. Close all WebSocket connections gracefully
      logger.info('Closing WebSocket connections...');
      const sockets = await io.fetchSockets();
      logger.info({ count: sockets.length }, 'Disconnecting active sockets');
      
      for (const socket of sockets) {
        socket.emit('server:shutdown', { message: 'Server is shutting down' });
        socket.disconnect(true);
      }
      
      await io.close();

      // 3. Close database connections
      logger.info('Closing database connections...');
      await prisma.$disconnect();

      // 4. Cleanup complete
      clearTimeout(forceExitTimeout);
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimeout);
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  // Handle SIGTERM (Kubernetes, Railway, Docker)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle SIGINT (Ctrl+C in terminal)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught exception');
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled promise rejection');
    gracefulShutdown('unhandledRejection');
  });

  logger.info('Graceful shutdown handlers registered');
}
