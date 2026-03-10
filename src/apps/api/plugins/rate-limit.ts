// Rate Limiting Plugin
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Redis } from 'ioredis';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { cacheService } from '../../../03-infrastructure/cache/redis.cache.js';

interface RedisCache {
  client?: Redis;
}

// Rate limit configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  DEFAULT: { max: 100, timeWindow: '1 minute' },
  STRICT: { max: 20, timeWindow: '1 minute' },
  UPLOAD: { max: 10, timeWindow: '1 minute' },
  SEARCH: { max: 30, timeWindow: '1 minute' },
  AUTH: { max: 5, timeWindow: '1 minute' }
} as const;

async function rateLimitPlugin(app: FastifyInstance) {
  // Use Redis for rate limiting if connected, otherwise in-memory
  const redisClient = cacheService.isConnected()
    ? (cacheService as RedisCache).client
    : undefined;

  // Routes excluded from rate limiting (health checks, readiness probes)
  const RATE_LIMIT_SKIP_ROUTES = new Set([
    '/health',
    '/ready',
    '/live',
    '/metrics'
  ]);

  await app.register(rateLimit, {
    global: true,
    max: 100, // 100 requests per timeWindow
    timeWindow: '1 minute',
    cache: 10000, // Cache for up to 10k users
    // Allow localhost and health/readiness endpoints (ALB health checks, monitoring, load tests)
    allowList: (request: FastifyRequest) => {
      const ip = request.ip;
      if (ip === '127.0.0.1') return true;
      const path = request.url.split('?')[0];
      return RATE_LIMIT_SKIP_ROUTES.has(path);
    },
    redis: redisClient, // Pass Redis client directly
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    }),
    keyGenerator: (request: FastifyRequest) => {
      // Use user ID if authenticated, otherwise use IP
      return request.user?.id || request.ip;
    }
  });

  // Helper to apply custom rate limits to specific routes
  app.decorate(
    'applyRateLimit',
    function (config: keyof typeof RATE_LIMIT_CONFIGS) {
      const limits = RATE_LIMIT_CONFIGS[config];
      return {
        config: {
          rateLimit: limits
        }
      };
    }
  );
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit-plugin',
  dependencies: []
});
