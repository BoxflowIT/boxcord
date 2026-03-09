/**
 * Redis Adapter for Socket.io Clustering
 *
 * Enables WebSocket communication across multiple server instances.
 * When Redis is available, messages broadcast to all connected servers.
 * Without Redis, falls back to single-instance mode (works perfectly for 1 replica).
 *
 * Cost: $0 until you add Redis service
 * Use case: Required when running 2+ ECS tasks
 */

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { FastifyInstance } from 'fastify';

let redisAdapter: { pubClient: Redis; subClient: Redis } | null = null;

/**
 * Setup Redis adapter for Socket.io clustering
 * Gracefully degrades to single instance if Redis unavailable
 */
export async function setupRedisAdapter(
  io: Server,
  app: FastifyInstance
): Promise<void> {
  const redisUrl = process.env.REDIS_URL;

  // No Redis configured - single instance mode (works fine!)
  if (!redisUrl) {
    app.log.info('📡 Socket.io: Single instance mode (no Redis)');
    app.log.info('💡 Add REDIS_URL to enable clustering for multiple replicas');
    return;
  }

  try {
    // Create Redis clients for pub/sub
    const pubClient = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        if (times > 3) {
          app.log.warn(
            'Redis connection failed after 3 retries, using single instance mode'
          );
          return null; // Stop retrying
        }
        return Math.min(times * 50, 2000); // Exponential backoff
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    const subClient = pubClient.duplicate();

    // Connect both clients
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Setup adapter
    io.adapter(createAdapter(pubClient, subClient));

    redisAdapter = { pubClient, subClient };

    app.log.info('🔗 Socket.io: Redis clustering enabled');
    app.log.info(
      '✅ Can now run multiple ECS tasks with shared WebSocket state'
    );

    // Handle Redis errors gracefully
    pubClient.on('error', (err: Error) => {
      app.log.error({ err }, 'Redis pub client error');
    });

    subClient.on('error', (err: Error) => {
      app.log.error({ err }, 'Redis sub client error');
    });
  } catch (err) {
    app.log.warn(
      { err },
      'Failed to setup Redis adapter, falling back to single instance mode'
    );
    // Continue without Redis - single instance works fine
  }
}

/**
 * Cleanup Redis connections on shutdown
 */
export async function closeRedisAdapter(app: FastifyInstance): Promise<void> {
  if (!redisAdapter) return;

  try {
    await Promise.all([
      redisAdapter.pubClient.quit(),
      redisAdapter.subClient.quit()
    ]);
    app.log.info('✅ Redis adapter connections closed');
  } catch (err) {
    app.log.error({ err }, 'Error closing Redis adapter');
  }
}
