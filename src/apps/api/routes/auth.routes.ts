// Auth Routes
// Handle user registration after Cognito signup
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { UserService } from '../../../02-application/services/user.service.js';
import { logger } from '../../../00-core/index.js';

const userService = new UserService(prisma);

// Registration body schema
const registerBody = z.object({
  id: z.string().min(1).max(255),
  email: z.string().email().max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100)
});

export async function authRoutes(app: FastifyInstance) {
  // Register new user (requires authentication - user must have valid Cognito token)
  // This endpoint is called after successful Cognito signup and email verification
  app.post(
    '/register',
    {
      onRequest: [app.authenticate],
      schema: {
        body: registerBody
      }
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof registerBody>;
      const { id, email, firstName, lastName } = body;

      // Validate that the authenticated user matches the registration data
      if (request.user.id !== id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'User ID mismatch'
        });
      }

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { id }
        });

        if (existingUser) {
          logger.info(`User already registered: ${id}`);
          return reply.code(200).send({
            message: 'User already registered',
            user: existingUser
          });
        }

        // Create new user in database with STAFF role
        const user = await userService.upsertUser({
          id,
          email,
          firstName,
          lastName,
          role: 'STAFF' // New users start as STAFF
        });

        // Create initial presence record
        await prisma.userPresence.create({
          data: {
            userId: id,
            status: 'ONLINE'
          }
        });

        // Check if any workspaces exist
        const workspaceCount = await prisma.workspace.count();

        // If no workspaces exist, create a default one with this user as owner
        if (workspaceCount === 0) {
          logger.info('No workspaces exist, creating default workspace');

          const defaultWorkspace = await prisma.workspace.create({
            data: {
              name: 'General Workspace',
              description: 'Default workspace for Boxcord',
              members: {
                create: {
                  userId: id,
                  role: 'ADMIN'
                }
              },
              channels: {
                create: [
                  {
                    name: 'general',
                    description: 'General discussion',
                    type: 'TEXT',
                    position: 0
                  },
                  {
                    name: 'random',
                    description: 'Random chat',
                    type: 'TEXT',
                    position: 1
                  }
                ]
              }
            },
            include: {
              channels: true
            }
          });

          logger.info(
            `Created default workspace: ${defaultWorkspace.id} with ${defaultWorkspace.channels.length} channels`
          );
        }

        logger.info(`New user registered: ${email} (${id})`);

        return reply.code(201).send({
          message: 'User registered successfully',
          user
        });
      } catch (err) {
        const error = err as Error;
        logger.error({ err: error }, 'Registration error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to register user'
        });
      }
    }
  );
}
