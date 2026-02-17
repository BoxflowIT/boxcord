// HTTP Cache Headers Plugin
// Add proper cache headers to reduce server load
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export interface CacheOptions {
  maxAge?: number; // Cache duration in seconds
  private?: boolean; // Private vs public cache
  staleWhileRevalidate?: number; // Time to serve stale content while revalidating
}

declare module 'fastify' {
  interface FastifyReply {
    cache(options: CacheOptions): FastifyReply;
  }
}

async function cachePlugin(app: FastifyInstance) {
  app.decorateReply(
    'cache',
    function (this: FastifyReply, options: CacheOptions) {
      const {
        maxAge = 0,
        private: isPrivate = false,
        staleWhileRevalidate
      } = options;

      const directives = [
        isPrivate ? 'private' : 'public',
        `max-age=${maxAge}`
      ];

      if (staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
      }

      this.header('Cache-Control', directives.join(', '));
      this.header('Vary', 'Authorization'); // Cache varies by auth token

      return this;
    }
  );

  // Add ETag support for GET requests
  app.addHook(
    'onSend',
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      if (request.method === 'GET' && reply.statusCode === 200 && payload) {
        // Generate simple ETag from payload
        const etag = `"${Buffer.from(String(payload)).toString('base64').substring(0, 20)}"`;
        reply.header('ETag', etag);

        // Check If-None-Match header
        const ifNoneMatch = request.headers['if-none-match'];
        if (ifNoneMatch === etag) {
          reply.code(304);
          return '';
        }
      }
      return payload;
    }
  );
}

export default fp(cachePlugin, {
  name: 'cache-plugin'
});
