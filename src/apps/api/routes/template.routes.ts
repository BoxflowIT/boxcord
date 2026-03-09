// Template Routes - CRUD for user message templates
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { TemplateService } from '../../../02-application/services/template.service.js';

const templateService = new TemplateService(prisma);

// Schemas
const createBody = z.object({
  name: z.string().min(1).max(100).trim(),
  content: z.string().min(1).max(2000).trim()
});

const updateBody = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  content: z.string().min(1).max(2000).trim().optional()
});

const templateParams = z.object({
  id: z.string().uuid()
});

export async function templateRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // GET /templates — List all templates for current user
  app.get(
    '/',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' }
      }
    },
    async (request) => {
      const templates = await templateService.getTemplates(request.user.id);
      return { success: true, data: templates };
    }
  );

  // POST /templates — Create new template
  app.post<{ Body: z.infer<typeof createBody> }>(
    '/',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' }
      },
      preHandler: app.validateBody(createBody)
    },
    async (request) => {
      const template = await templateService.createTemplate({
        userId: request.user.id,
        name: request.body.name,
        content: request.body.content
      });
      return { success: true, data: template };
    }
  );

  // PATCH /templates/:id — Update template
  app.patch<{
    Params: z.infer<typeof templateParams>;
    Body: z.infer<typeof updateBody>;
  }>(
    '/:id',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      preHandler: [
        app.validateParams(templateParams),
        app.validateBody(updateBody)
      ]
    },
    async (request) => {
      const template = await templateService.updateTemplate(
        request.params.id,
        request.user.id,
        request.body
      );
      return { success: true, data: template };
    }
  );

  // DELETE /templates/:id — Delete template
  app.delete<{ Params: z.infer<typeof templateParams> }>(
    '/:id',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' }
      },
      preHandler: app.validateParams(templateParams)
    },
    async (request) => {
      await templateService.deleteTemplate(request.params.id, request.user.id);
      return { success: true };
    }
  );
}
