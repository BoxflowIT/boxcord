// Rate Limiting Plugin
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { cacheService } from '../../../03-infrastructure/cache/redis.cache.js';

async function rateLimitPlugin(app: FastifyInstance) {
  // Use Redis for rate limiting if connected, otherwise in-memory
  const redisClient = cacheService.isConnected()
    ? (cacheService as any).client
    : undefined;

  await app.register(rateLimit, {
    max: 100, // 100 requests per timeWindow
    timeWindow: '1 minute',
    cache: 10000, // Cache for up to 10k users
    allowList: ['127.0.0.1'], // Whitelist localhost
    redis: redisClient, // Pass Redis client directly
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    })
  });
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit-plugin',
  dependencies: []
});
