// Structured Logging Middleware
// Adds request tracking, user context, and performance metrics to logs

import type { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { randomUUID } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    startTime: number;
  }
}

async function loggingPlugin(fastify: any) {
  // Add request ID and timing to all requests
  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Generate unique request ID
      request.requestId = randomUUID();
      request.startTime = Date.now();

      // Add request ID to response headers
      reply.header('X-Request-Id', request.requestId);

      // Add request ID to logger context
      request.log = request.log.child({
        requestId: request.requestId,
        userId: (request as any).user?.id,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
    }
  );

  // Log request completion with metrics
  fastify.addHook(
    'onResponse',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const responseTime = Date.now() - request.startTime;

      const logData = {
        requestId: request.requestId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`,
        userId: (request as any).user?.id,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      };

      // Different log levels based on status code
      if (reply.statusCode >= 500) {
        request.log.error(logData, 'Request failed with server error');
      } else if (reply.statusCode >= 400) {
        request.log.warn(logData, 'Request failed with client error');
      } else if (responseTime > 1000) {
        request.log.warn(logData, 'Slow request detected');
      } else {
        request.log.info(logData, 'Request completed');
      }
    }
  );

  // Log errors with full context
  fastify.addHook(
    'onError',
    async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
      request.log.error(
        {
          requestId: request.requestId,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body
          },
          userId: (request as any).user?.id
        },
        'Request error'
      );
    }
  );
}

export default fp(loggingPlugin, {
  name: 'logging-plugin',
  dependencies: []
});
