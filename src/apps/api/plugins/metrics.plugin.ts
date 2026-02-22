// Fastify Metrics Plugin - Automatic HTTP request monitoring
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import {
  httpRequestCounter,
  httpRequestDuration
} from '../../../03-infrastructure/monitoring/metrics.service.js';

async function metricsPlugin(fastify: FastifyInstance) {
  const requestStartTimes = new Map<string, number>();

  // Hook to measure request duration
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    requestStartTimes.set(request.id, Date.now());
  });

  // Hook to record metrics after response
  fastify.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Skip metrics collection for /metrics and /health endpoints to avoid noise
      const skipRoutes = ['/metrics', '/health', '/ready', '/live'];
      if (skipRoutes.includes(request.url)) return;

      // Calculate duration
      const startTime = requestStartTimes.get(request.id) ?? Date.now();
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      requestStartTimes.delete(request.id);

      // Normalize route path (replace IDs with placeholders)
      const route = normalizeRoute(request.url);

      const labels = {
        method: request.method,
        route,
        status_code: reply.statusCode.toString()
      };

      // Record metrics
      httpRequestCounter.inc(labels);
      httpRequestDuration.observe(labels, duration);
    }
  );

  fastify.log.info('✅ Metrics plugin registered');
}

// Normalize routes to avoid high cardinality
// e.g., /api/v1/messages/123 -> /api/v1/messages/:id
function normalizeRoute(url: string): string {
  return url
    .replace(/\/\d+/g, '/:id') // Replace numeric IDs
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:uuid'
    ) // UUIDs
    .split('?')[0]; // Remove query params
}

export default fp(metricsPlugin, {
  name: 'metrics-plugin'
});
