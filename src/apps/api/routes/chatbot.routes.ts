// Chatbot Routes
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { ChatbotService } from '../../../02-application/services/chatbot.service.js';

const chatbotService = new ChatbotService(prisma);

export async function chatbotRoutes(app: FastifyInstance) {
  // Set socket server reference
  if (app.io) {
    chatbotService.setSocketServer(app.io);
  }

  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Get list of available commands
  app.get('/commands', async () => {
    const commands = chatbotService.getCommands().map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.usage
    }));

    return { success: true, data: commands };
  });

  // Execute a command (alternative to sending via socket)
  app.post<{
    Body: {
      command: string;
      channelId: string;
      workspaceId?: string;
    };
  }>('/execute', {
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute'
      }
    }
  }, async (request) => {
    const { command, channelId, workspaceId } = request.body;

    const result = await chatbotService.processMessage(command, {
      userId: request.user.id,
      channelId,
      workspaceId
    });

    if (!result) {
      return {
        success: false,
        error: { message: 'Not a valid command' }
      };
    }

    return { success: true, data: result };
  });
}

// Export service for socket integration
export { chatbotService };
