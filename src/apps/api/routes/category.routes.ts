// Category Routes - Channel category management
import type { FastifyInstance } from 'fastify';
import { CategoryService } from '../../../02-application/services/category.service.js';
import { prisma } from '../../../03-infrastructure/database/client.js';

export async function categoryRoutes(fastify: FastifyInstance) {
  const categoryService = new CategoryService(prisma);

  // GET /api/v1/workspaces/:workspaceId/categories - Get all categories
  fastify.get(
    '/:workspaceId/categories',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      const categories =
        await categoryService.getWorkspaceCategories(workspaceId);

      return reply.send({
        success: true,
        data: categories
      });
    }
  );

  // POST /api/v1/workspaces/:workspaceId/categories - Create category
  fastify.post(
    '/:workspaceId/categories',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 }
          }
        }
      }
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { name } = request.body as { name: string };
      const userId = request.user.id;

      const category = await categoryService.createCategory(
        workspaceId,
        userId,
        name
      );

      // Emit socket event
      if (fastify.io) {
        fastify.io
          .to(`workspace:${workspaceId}`)
          .emit('category:created', category);
      }

      return reply.send({
        success: true,
        data: category
      });
    }
  );

  // PATCH /api/v1/categories/:categoryId - Update category
  fastify.patch(
    '/categories/:categoryId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            collapsed: { type: 'boolean' }
          }
        }
      }
    },
    async (request, reply) => {
      const { categoryId } = request.params as { categoryId: string };
      const updates = request.body as { name?: string; collapsed?: boolean };
      const userId = request.user.id;

      const category = await categoryService.updateCategory(
        categoryId,
        userId,
        updates
      );

      // Emit socket event
      if (fastify.io) {
        fastify.io
          .to(`workspace:${category.workspaceId}`)
          .emit('category:updated', category);
      }

      return reply.send({
        success: true,
        data: category
      });
    }
  );

  // DELETE /api/v1/categories/:categoryId - Delete category
  fastify.delete(
    '/categories/:categoryId',
    {
      onRequest: [fastify.authenticate]
    },
    async (request, reply) => {
      const { categoryId } = request.params as { categoryId: string };
      const userId = request.user.id;

      await categoryService.deleteCategory(categoryId, userId);

      return reply.send({
        success: true,
        data: { message: 'Category deleted' }
      });
    }
  );

  // PUT /api/v1/channels/:channelId/category - Move channel to category
  fastify.put(
    '/channels/:channelId/category',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            categoryId: { type: ['string', 'null'] }
          }
        }
      }
    },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string };
      const { categoryId } = request.body as { categoryId: string | null };
      const userId = request.user.id;

      await categoryService.moveChannelToCategory(
        channelId,
        categoryId,
        userId
      );

      return reply.send({
        success: true,
        data: { message: 'Channel moved' }
      });
    }
  );
}
