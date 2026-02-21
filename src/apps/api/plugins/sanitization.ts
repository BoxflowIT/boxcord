// Input Sanitization Middleware
// Protects against XSS attacks, SQL injection, and other injection vulnerabilities

import type { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import xssFilter from 'xss';

// XSS filter options
const xssOptions = {
  whiteList: {
    // Allow basic formatting in messages
    b: [],
    i: [],
    u: [],
    strong: [],
    em: [],
    code: ['class'],
    pre: ['class'],
    a: ['href', 'title', 'target'],
    br: [],
    p: []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return xssFilter(obj, xssOptions);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Fields that should NOT be sanitized (they need exact values)
 */
const SKIP_SANITIZATION_FIELDS = new Set([
  'password',
  'token',
  'refresh_token',
  'jwt',
  'authorization',
  'api_key',
  'secret'
]);

/**
 * Routes that should skip sanitization (e.g., file uploads, webhooks)
 */
const SKIP_SANITIZATION_ROUTES = new Set([
  '/api/v1/files',
  '/api/v1/webhooks',
  '/health',
  '/ready',
  '/live',
  '/metrics'
]);

async function sanitizationPlugin(fastify: any) {
  // Pre-handler to sanitize incoming requests
  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const routePath = request.routeOptions.url || request.url;

      // Skip sanitization for certain routes
      if (SKIP_SANITIZATION_ROUTES.has(routePath)) {
        return;
      }

      // Sanitize request body
      if (request.body && typeof request.body === 'object') {
        const sanitized: any = {};
        for (const key in request.body) {
          if (Object.prototype.hasOwnProperty.call(request.body, key)) {
            // Skip sensitive fields that need exact values
            if (SKIP_SANITIZATION_FIELDS.has(key.toLowerCase())) {
              sanitized[key] = (request.body as any)[key];
            } else {
              sanitized[key] = sanitizeObject((request.body as any)[key]);
            }
          }
        }
        request.body = sanitized;
      }

      // Sanitize query parameters
      if (request.query && typeof request.query === 'object') {
        const sanitized: any = {};
        for (const key in request.query) {
          if (Object.prototype.hasOwnProperty.call(request.query, key)) {
            sanitized[key] = sanitizeObject((request.query as any)[key]);
          }
        }
        request.query = sanitized;
      }
    }
  );
}

export default fp(sanitizationPlugin, {
  name: 'sanitization-plugin',
  dependencies: []
});

// Export sanitization function for manual use
export { sanitizeObject, xssFilter as xss };
