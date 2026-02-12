// User Routes
// Manages local user profiles + syncs from Boxtime
import type { FastifyInstance } from 'fastify';
import type { UserStatus } from '@prisma/client';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { UserService } from '../../../02-application/services/user.service.js';
import { boxtimeService } from '../../../02-application/services/boxtime.service.js';

const userService = new UserService(prisma);

export async function userRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get current user (creates/updates local profile)
  app.get('/me', async (request) => {
    // Upsert local user on each request
    const localUser = await userService.upsertUser({
      id: request.user.id,
      email: request.user.email,
      role: request.user.role
    });

    // Try to get extra info from Boxtime
    try {
      const token = request.headers.authorization?.replace('Bearer ', '') ?? '';
      const boxtimeUser = await boxtimeService.getCurrentUser(token);

      // Update local profile with Boxtime data if available
      if (boxtimeUser.firstName || boxtimeUser.lastName) {
        const updated = await userService.updateProfile(request.user.id, {
          firstName: boxtimeUser.firstName,
          lastName: boxtimeUser.lastName
        });
        return { success: true, data: updated };
      }
    } catch {
      // Boxtime unavailable, continue with local data
    }

    return { success: true, data: localUser };
  });

  // Get user by ID
  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const user = await userService.getUser(request.params.id);
    return { success: true, data: user };
  });

  // Update current user's profile
  app.patch<{
    Body: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      bio?: string;
    };
  }>('/me', async (request) => {
    const user = await userService.updateProfile(request.user.id, request.body);
    return { success: true, data: user };
  });

  // Search users
  app.get<{ Querystring: { q: string; limit?: string } }>(
    '/search',
    async (request) => {
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 20;
      const users = await userService.searchUsers(request.query.q, limit);
      return { success: true, data: users };
    }
  );

  // Update presence/status
  app.post<{
    Body: { status: UserStatus; customStatus?: string };
  }>('/me/presence', async (request) => {
    await userService.updatePresence(
      request.user.id,
      request.body.status,
      request.body.customStatus
    );
    return { success: true };
  });

  // Get multiple users by IDs (for batch loading)
  app.post<{ Body: { userIds: string[] } }>('/batch', async (request) => {
    const users = await userService.getUsersByIds(request.body.userIds);
    return { success: true, data: users };
  });

  // Get all online users
  app.get('/online', async () => {
    const users = await userService.getAllOnlineUsers();
    return { success: true, data: users };
  });

  // Delete current user account
  app.delete('/me', async (request) => {
    await userService.deleteUser(request.user.id);
    return { success: true };
  });
}
