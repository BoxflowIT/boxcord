// Boxtime Webhook Routes
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../03-infrastructure/database/client.js';
import {
  WebhookService,
  type WebhookEventType
} from '../../../02-application/services/webhook.service.js';

const webhookService = new WebhookService(prisma);

// Webhook secret for validation
const WEBHOOK_SECRET = process.env.BOXTIME_WEBHOOK_SECRET ?? '';

const webhookPayloadSchema = z.object({
  event: z.enum([
    'booking.created',
    'booking.updated',
    'booking.cancelled',
    'staff.joined',
    'staff.left',
    'office.updated',
    'shift.started',
    'shift.ended'
  ]),
  timestamp: z.string(),
  data: z.record(z.unknown())
});

export async function webhookRoutes(app: FastifyInstance) {
  // Set socket server reference
  if (app.io) {
    webhookService.setSocketServer(app.io);
  }

  // Webhook endpoint - no authentication, uses signature validation
  app.post<{
    Body: {
      event: WebhookEventType;
      timestamp: string;
      data: Record<string, unknown>;
    };
    Headers: { 'x-webhook-signature'?: string };
  }>('/boxtime', async (request, reply) => {
    // Validate webhook signature in production
    if (WEBHOOK_SECRET) {
      const signature = request.headers['x-webhook-signature'];
      const isValid = webhookService.validateSignature(
        JSON.stringify(request.body),
        signature ?? '',
        WEBHOOK_SECRET
      );

      if (!isValid) {
        return reply.status(401).send({
          success: false,
          error: { message: 'Invalid webhook signature' }
        });
      }
    }

    // Validate payload
    const result = webhookPayloadSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { message: 'Invalid webhook payload', details: result.error }
      });
    }

    // Process the event
    try {
      await webhookService.processEvent(result.data);
      app.log.info(`[WEBHOOK] Processed event: ${result.data.event}`);
    } catch (err) {
      app.log.error(`[WEBHOOK] Failed to process event: ${err}`);
      // Still return 200 to prevent retries
    }

    return { success: true, received: true };
  });

  // Health check for webhook endpoint
  app.get('/health', async () => {
    return { success: true, status: 'ready' };
  });

  // List supported event types (for documentation/testing)
  app.get('/events', async () => {
    return {
      success: true,
      data: {
        events: [
          'booking.created',
          'booking.updated',
          'booking.cancelled',
          'staff.joined',
          'staff.left',
          'office.updated',
          'shift.started',
          'shift.ended'
        ],
        channels: {
          bokningar: 'Bokningsrelaterade händelser',
          allmänt: 'Personal-events (nya medlemmar)',
          arbetsstatus: 'Pass-relaterade händelser'
        }
      }
    };
  });
}
