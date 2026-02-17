// Initial Data Route - Get all initial data in one request
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { getInitialData } from '../../../02-application/services/initial-data.service.js';

export async function initialDataRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/initial
   * Get all initial data (workspaces, user, online users) in one request
   * Optimized to reduce initial load time
   */
  app.get('/api/v1/initial', {
    onRequest: [app.authenticate],
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const data = await getInitialData(prisma, userId);
      return data;
    }
  });
}
