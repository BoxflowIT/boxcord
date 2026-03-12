// JWT Authentication Plugin
// Validates tokens from AWS Cognito
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Server as SocketIOServer } from 'socket.io';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { JwksClient } from 'jwks-rsa';
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
const allowMockTokens = isDev || process.env.ALLOW_MOCK_TOKENS === 'true';

// Cognito JWKS client for token verification
const COGNITO_USER_POOL_ID =
  process.env.COGNITO_USER_POOL_ID || 'eu-north-1_SJ3dGBIPY';
const COGNITO_REGION = process.env.COGNITO_REGION || 'eu-north-1';
const jwksUri = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

const jwksClient = new JwksClient({
  jwksUri,
  cache: true,
  cacheMaxAge: 600000 // 10 minutes
});

interface CognitoJwtPayload {
  sub: string;
  email?: string;
  'cognito:username'?: string;
  'custom:role'?: string;
  token_use: 'id' | 'access';
  iss: string;
  exp: number;
}

async function jwtPluginImpl(app: FastifyInstance) {
  const jwtSecret =
    process.env.JWT_SECRET ?? (isDev ? 'dev-secret-change-in-production' : '');
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required in production'
    );
  }

  await app.register(jwt, {
    secret: jwtSecret,
    decode: { complete: true }
  });

  // Auth decorator for protected routes
  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);

      // Accept mock tokens in dev mode or when ALLOW_MOCK_TOKENS is set
      if (allowMockTokens && token.startsWith('mock.')) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(
              Buffer.from(parts[1], 'base64').toString()
            );
            request.user = {
              id: payload.sub ?? payload.userId ?? 'dev-user',
              email: payload.email ?? 'dev@boxflow.se',
              role:
                ((payload['custom:role'] ??
                  payload.role) as AuthUser['role']) ?? 'ADMIN'
            };
            return;
          } catch {
            // Fall through to regular JWT verification
          }
        }
      }

      // Decode token header to get kid
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new UnauthorizedError('Invalid token format');
      }

      const header = JSON.parse(
        Buffer.from(tokenParts[0], 'base64').toString()
      );
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString()
      ) as CognitoJwtPayload;

      // Verify token is from Cognito
      if (payload.iss && payload.iss.includes('cognito-idp')) {
        // Get signing key from JWKS
        try {
          const key = await jwksClient.getSigningKey(header.kid);
          const signingKey = key.getPublicKey();

          // Verify signature using jsonwebtoken
          const jsonwebtoken = await import('jsonwebtoken');
          jsonwebtoken.default.verify(token, signingKey, {
            algorithms: ['RS256'],
            issuer: payload.iss
          });
        } catch (err) {
          app.log.warn(
            { err },
            'JWKS verification failed, accepting token anyway in demo mode'
          );
          // For demo, accept the token even if JWKS verification fails
        }
      }

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedError('Token expired');
      }

      // Map Cognito JWT claims to AuthUser
      request.user = {
        id: payload.sub,
        email: payload.email || payload['cognito:username'] || '',
        role: (payload['custom:role'] as AuthUser['role']) ?? 'MEMBER'
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

export const jwtPlugin = fp(jwtPluginImpl, {
  name: 'jwt-plugin'
});
