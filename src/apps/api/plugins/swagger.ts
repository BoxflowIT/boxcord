// Swagger API Documentation Configuration
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

async function swaggerPlugin(app: FastifyInstance) {
  // Register Swagger schema generator
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Boxcord API',
        description:
          'Internal chat system for Boxflow - Discord-like chat integrated with Boxtime',
        version: '1.0.0',
        contact: {
          name: 'Boxflow IT',
          email: 'dev@boxflow.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        },
        {
          url: 'https://boxcord.boxflow.com',
          description: 'Production server'
        }
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication endpoints'
        },
        { name: 'Workspaces', description: 'Workspace management' },
        { name: 'Channels', description: 'Channel operations' },
        { name: 'Messages', description: 'Message CRUD operations' },
        { name: 'Direct Messages', description: 'Private messaging' },
        { name: 'Users', description: 'User profile management' },
        { name: 'Voice', description: 'Voice channel operations' },
        { name: 'Files', description: 'File upload and management' },
        { name: 'Reactions', description: 'Message reactions' },
        { name: 'Push Notifications', description: 'Web push notifications' },
        { name: 'Search', description: 'Search across messages' },
        { name: 'Webhooks', description: 'Webhook integrations' },
        { name: 'Health', description: 'Health check endpoints' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token from Cognito authentication'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  });

  // Register Swagger UI
  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject) => {
      return swaggerObject;
    },
    transformSpecificationClone: true
  });

  app.log.info('📚 Swagger documentation available at /api/docs');
}

export default fp(swaggerPlugin, {
  name: 'swagger-plugin',
  dependencies: []
});
