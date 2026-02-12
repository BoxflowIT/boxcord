// JWT Authentication Plugin
// Validates tokens from AWS Cognito (same as Boxtime)
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Server as SocketIOServer } from 'socket.io';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { AuthUser } from '../../../00-core/types.js';
import { UnauthorizedError } from '../../../00-core/errors.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    io?: SocketIOServer;
  }
  interface FastifyRequest {
    user: AuthUser;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      'custom:role'?: string;
    };
    user: AuthUser;
  }
}

const isDev = process.env.NODE_ENV !== 'production';

async function jwtPluginImpl(app: FastifyInstance) {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    decode: { complete: true }
  });

  // Auth decorator for protected routes
  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      const authHeader = request.headers.authorization;

      // Dev mode: Accept mock tokens (format: mock.base64payload.signature)
      if (isDev && authHeader?.startsWith('Bearer mock.')) {
        const parts = authHeader.split('.');
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString()
            );
            request.user = {
              id: payload.sub ?? payload.userId ?? 'dev-user',
              email: payload.email ?? 'dev@boxflow.se',
              role: (payload['custom:role'] ?? payload.role) as AuthUser['role'] ?? 'ADMIN'
            };
            return;
          } catch {
            // Fall through to regular JWT verification
          }
        }
      }

      const decoded = await request.jwtVerify<{
        sub: string;
        email: string;
        'custom:role'?: string;
      }>();

      // Map Cognito JWT claims to AuthUser
      request.user = {
        id: decoded.sub,
        email: decoded.email,
        role: (decoded['custom:role'] as AuthUser['role']) ?? 'STAFF'
      };
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

export const jwtPlugin = fp(jwtPluginImpl, {
  name: 'jwt-plugin'
});
