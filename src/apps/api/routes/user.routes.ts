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
  app.get('/me', async (request, reply) => {
    // Upsert local user on each request (without role - role is admin-managed)
    const localUser = await userService.upsertUser({
      id: request.user.id,
      email: request.user.email
      // NOTE: Don't pass role here - it's admin-managed in database
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
        reply.cache({ maxAge: 300, staleWhileRevalidate: 600 }); // 5min cache
        return { success: true, data: updated };
      }
    } catch {
      // Boxtime unavailable, continue with local data
    }

    reply.cache({ maxAge: 300, staleWhileRevalidate: 600 }); // 5min cache
    return { success: true, data: localUser };
  });

  // Get user by ID
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = await userService.getUser(request.params.id);
    reply.cache({ maxAge: 300, staleWhileRevalidate: 600 });
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

    // Broadcast user profile update to all connected clients
    if (app.io) {
      app.io.emit('user:update', {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio
      });
    }

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

  // Update user role (only SUPER_ADMIN can do this)
  app.patch<{
    Params: { id: string };
    Body: { role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' };
  }>('/:id/role', async (request, reply) => {
    // Get current user's role from database (not from JWT)
    const currentUser = await userService.getUser(request.user.id);

    // Only SUPER_ADMIN can change roles
    if (currentUser.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({
        success: false,
        error: 'Only SUPER_ADMIN can change user roles'
      });
    }

    // Cannot change own role
    if (request.params.id === request.user.id) {
      return reply.code(400).send({
        success: false,
        error: 'Cannot change your own role'
      });
    }

    const user = await userService.updateUserRole(
      request.params.id,
      request.body.role
    );
    return { success: true, data: user };
  });

  // Delete current user account
  app.delete('/me', async (request) => {
    await userService.deleteUser(request.user.id);
    return { success: true };
  });

  // Initialize user (create + add to default workspace)
  // Called after first login to ensure user exists and has access
  app.post('/me/init', async (request) => {
    // Create/update user
    const user = await userService.upsertUser({
      id: request.user.id,
      email: request.user.email,
      role: request.user.role
    });

    // Check if user is member of any workspace
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: request.user.id }
    });

    // If no memberships, add to first workspace (or create one)
    if (memberships.length === 0) {
      const defaultWorkspace = await prisma.workspace.findFirst();

      if (defaultWorkspace) {
        await prisma.workspaceMember.create({
          data: {
            workspaceId: defaultWorkspace.id,
            userId: request.user.id,
            role: 'MEMBER'
          }
        });
      } else {
        // No workspaces exist, create one with this user as owner
        await prisma.workspace.create({
          data: {
            name: 'Boxflow HQ',
            description: 'Huvudkontoret för Boxflow-teamet',
            members: {
              create: {
                userId: request.user.id,
                role: 'OWNER'
              }
            },
            channels: {
              create: {
                name: 'allmänt',
                description: 'Allmän diskussion',
                type: 'TEXT'
              }
            }
          }
        });
      }
    }

    return { success: true, data: user };
  });

  // PATCH /users/me/status - Update custom status
  app.patch<{
    Body: { status: string | null; statusEmoji?: string | null };
  }>('/me/status', async (request, reply) => {
    const { status, statusEmoji } = request.body;

    const user = await userService.updateCustomStatus(
      request.user.id,
      status,
      statusEmoji
    );

    // Emit socket event
    if (app.io) {
      app.io.emit('user:status-changed', {
        userId: request.user.id,
        status,
        statusEmoji
      });
    }

    return { success: true, data: user };
  });

  // PATCH /users/me/dnd - Update DND mode
  app.patch<{
    Body: { dndMode: boolean; dndUntil?: string | null };
  }>('/me/dnd', async (request, reply) => {
    const { dndMode, dndUntil } = request.body;

    const user = await userService.updateDNDMode(
      request.user.id,
      dndMode,
      dndUntil ? new Date(dndUntil) : null
    );

    // Emit socket event
    if (app.io) {
      app.io.emit('user:dnd-changed', {
        userId: request.user.id,
        dndMode,
        dndUntil
      });
    }

    return { success: true, data: user };
  });
}
