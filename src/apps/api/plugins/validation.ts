// Input Validation Plugin using Zod
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { z, ZodError, ZodSchema } from 'zod';

// Common validation schemas
export const schemas = {
  // ID schemas
  uuid: z.string().uuid(),

  // Message schemas
  createMessage: z.object({
    channelId: z.string().uuid(),
    content: z.string().min(1).max(4000),
    parentId: z.string().uuid().optional()
  }),

  updateMessage: z.object({
    content: z.string().min(1).max(4000)
  }),

  // Channel schemas
  createChannel: z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .regex(
        /^[a-z0-9-]+$/,
        'Channel name must be lowercase with hyphens only'
      ),
    workspaceId: z.string().uuid(),
    type: z.enum(['TEXT', 'VOICE']).optional(),
    categoryId: z.string().uuid().optional()
  }),

  updateChannel: z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    topic: z.string().max(500).optional()
  }),

  // Workspace schemas
  createWorkspace: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional()
  }),

  updateWorkspace: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    iconUrl: z.string().url().optional()
  }),

  // User schemas
  updateProfile: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional().nullable(),
    statusText: z.string().max(128).optional().nullable(),
    statusEmoji: z.string().max(10).optional().nullable()
  }),

  // DM schemas
  createDM: z.object({
    participantEmail: z.string().email()
  }),

  sendDM: z.object({
    content: z.string().min(1).max(4000)
  }),

  // Reaction schemas
  toggleReaction: z.object({
    emoji: z.string().min(1).max(10)
  }),

  // Pin schemas
  pinMessage: z.object({
    channelId: z.string().uuid()
  }),

  // Invite schemas
  createInvite: z.object({
    workspaceId: z.string().uuid(),
    maxUses: z.number().int().min(1).max(100).optional(),
    expiresInDays: z.number().int().min(1).max(30).optional()
  }),

  // Push notification schemas
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }),

  // Category schemas
  createCategory: z.object({
    name: z.string().min(1).max(100),
    workspaceId: z.string().uuid()
  }),

  updateCategory: z.object({
    name: z.string().min(1).max(100).optional(),
    position: z.number().int().min(0).optional()
  }),

  // Search schemas
  search: z.object({
    query: z.string().min(1).max(200),
    workspaceId: z.string().uuid().optional(),
    channelId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).optional()
  }),

  // Chatbot command schema
  chatbotCommand: z.object({
    command: z.string().min(1).max(500),
    channelId: z.string().uuid().optional(),
    workspaceId: z.string().uuid().optional()
  }),

  // Moderation schemas
  kickMember: z.object({
    workspaceId: z.string().uuid(),
    userId: z.string().uuid()
  }),

  updateMemberRole: z.object({
    workspaceId: z.string().uuid(),
    userId: z.string().uuid(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER'])
  })
} as const;

// Validation helper function
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Validation error handler
export function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
}

// Fastify plugin that adds validation decorator
async function validationPlugin(app: FastifyInstance) {
  // Add schema validation hook factory
  app.decorate('validateBody', <T>(schema: ZodSchema<T>) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        request.body = schema.parse(request.body);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: formatZodError(err),
              details: err.errors
            }
          });
        }
        throw err;
      }
    };
  });

  app.decorate('validateQuery', <T>(schema: ZodSchema<T>) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        request.query = schema.parse(request.query) as typeof request.query;
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: formatZodError(err),
              details: err.errors
            }
          });
        }
        throw err;
      }
    };
  });

  app.decorate('validateParams', <T>(schema: ZodSchema<T>) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        request.params = schema.parse(request.params) as typeof request.params;
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: formatZodError(err),
              details: err.errors
            }
          });
        }
        throw err;
      }
    };
  });
}

// TypeScript declarations
declare module 'fastify' {
  interface FastifyInstance {
    validateBody: <T>(
      schema: ZodSchema<T>
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    validateQuery: <T>(
      schema: ZodSchema<T>
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    validateParams: <T>(
      schema: ZodSchema<T>
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(validationPlugin, {
  name: 'validation-plugin'
});
