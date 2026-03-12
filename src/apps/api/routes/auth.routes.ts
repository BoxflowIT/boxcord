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
      onRequest: [app.authenticate]
    },
    async (request, reply) => {
      // Validate request body with Zod
      const validation = registerBody.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid request body',
          details: validation.error.errors
        });
      }

      const { id, email, firstName, lastName } = validation.data;

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

        // Create new user in database with MEMBER role
        const user = await userService.upsertUser({
          id,
          email,
          firstName,
          lastName,
          role: 'MEMBER' // New users start as MEMBER
        });

        // Create initial presence record
        await prisma.userPresence.create({
          data: {
            userId: id,
            status: 'ONLINE'
          }
        });

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
