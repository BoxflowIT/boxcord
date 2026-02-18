// Security Headers Plugin (helmet)
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';

async function securityPlugin(app: FastifyInstance) {
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'wss:',
          'ws:',
          'https://cognito-idp.eu-north-1.amazonaws.com',
          'https://*.sentry.io'
        ],
        workerSrc: ["'self'", 'blob:'], // For Web Workers (RNNoise audio processing)
        mediaSrc: ["'self'", 'blob:', 'data:'] // For audio/video
      }
    },
    crossOriginEmbedderPolicy: false // Allow uploads from different origins
  });
}

export default fp(securityPlugin, {
  name: 'security-plugin'
});
