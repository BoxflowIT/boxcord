// Health Check Route
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { redisCache } from '../../../03-infrastructure/cache/redis.cache.js';
import { register } from '../../../03-infrastructure/monitoring/metrics.service.js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: string; latency?: number; error?: string };
    redis: { status: string; latency?: number; error?: string };
    memory: { status: string; usage: number; limit: number };
  };
}

// In-memory cache for health check results
let cachedHealth: HealthStatus | null = null;
let cacheTimestamp = 0;
const HEALTH_CACHE_TTL = 5000; // 5 seconds cache for health checks

async function performHealthChecks(): Promise<HealthStatus> {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
      memory: { status: 'unknown', usage: 0, limit: 0 }
    }
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Check Redis connection (if configured)
  if (redisCache.isConnected()) {
    try {
      const redisStart = Date.now();
      await redisCache.get('health-check');
      health.checks.redis = {
        status: 'healthy',
        latency: Date.now() - redisStart
      };
    } catch (error) {
      health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
      health.checks.redis = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  } else {
    health.checks.redis = {
      status: 'not_configured'
    };
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const memoryThreshold = 0.9; // 90% threshold

  health.checks.memory = {
    status: heapUsedMB / heapTotalMB > memoryThreshold ? 'warning' : 'healthy',
    usage: heapUsedMB,
    limit: heapTotalMB
  };

  return health;
}

async function getCachedHealth(): Promise<HealthStatus> {
  const now = Date.now();

  // Return cached health if still valid
  if (cachedHealth && now - cacheTimestamp < HEALTH_CACHE_TTL) {
    return cachedHealth;
  }

  // Perform health checks and cache result
  cachedHealth = await performHealthChecks();
  cacheTimestamp = now;

  return cachedHealth;
}

export async function healthRoutes(app: FastifyInstance) {
  // Lightweight health check (cached, no auth required)
  // Perfect for load balancers and monitoring tools
  app.get('/health', async (request, reply) => {
    const health = await getCachedHealth();

    // Set appropriate status code
    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 200
          : 503;

    return reply.code(statusCode).send(health);
  });

  // Detailed health check (uncached, for debugging)
  // Use this sparingly, not for monitoring
  app.get('/health/detailed', async (request, reply) => {
    const health = await performHealthChecks();

    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 200
          : 503;

    return reply.code(statusCode).send(health);
  });

  // Readiness check (for Kubernetes/Railway)
  app.get('/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.code(200).send({ ready: true });
    } catch (error) {
      return reply.code(503).send({
        ready: false,
        error: error instanceof Error ? error.message : 'Database unavailable'
      });
    }
  });

  // Liveness check (for Kubernetes/Railway)
  app.get('/live', async (request, reply) => {
    // Basic check that the process is running
    return reply.code(200).send({
      alive: true,
      uptime: process.uptime()
    });
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (request, reply) => {
    try {
      const metrics = await register.metrics();
      return reply
        .code(200)
        .header('Content-Type', register.contentType)
        .send(metrics);
    } catch (error) {
      return reply.code(500).send({
        error:
          error instanceof Error ? error.message : 'Failed to collect metrics'
      });
    }
  });
}
