/**
 * Message Queue Service with Graceful Degradation
 *
 * Handles background jobs like email notifications, webhooks, file processing.
 * When Redis is available, uses BullMQ for reliable job processing.
 * Without Redis, executes jobs directly (works fine for low traffic).
 *
 * Cost: $0 until you add Redis service
 * Benefits: Prevents timeouts, better reliability, automatic retries
 */

import { Queue, Worker, QueueEvents, type Job } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import { logger } from '../../00-core/logger.js';

interface EmailJobPayload {
  to: string;
  subject: string;
  body: string;
  userId?: number;
}

interface WebhookJobPayload {
  url: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
}

interface NotificationJobPayload {
  userId: number;
  type: 'mention' | 'dm' | 'invite';
  data: unknown;
}

let emailQueue: Queue | null = null;
let webhookQueue: Queue | null = null;
let notificationQueue: Queue | null = null;

let emailWorker: Worker | null = null;
let webhookWorker: Worker | null = null;
let notificationWorker: Worker | null = null;

const queueEvents: QueueEvents[] = [];

const REDIS_AVAILABLE = Boolean(process.env.REDIS_URL);

/**
 * Initialize message queues
 * Only creates queues if Redis is available
 */
export async function initializeQueues(app: FastifyInstance): Promise<void> {
  if (!REDIS_AVAILABLE) {
    app.log.info('📬 Message Queue: Direct execution mode (no Redis)');
    app.log.info(
      '💡 Add REDIS_URL to enable reliable background job processing'
    );
    return;
  }

  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null // Required for BullMQ
  };

  try {
    // Create queues
    emailQueue = new Queue('emails', { connection });
    webhookQueue = new Queue('webhooks', { connection });
    notificationQueue = new Queue('notifications', { connection });

    // Create workers
    emailWorker = new Worker('emails', processEmailJob, {
      connection,
      concurrency: 5
    });
    webhookWorker = new Worker('webhooks', processWebhookJob, {
      connection,
      concurrency: 10
    });
    notificationWorker = new Worker('notifications', processNotificationJob, {
      connection,
      concurrency: 20
    });

    // Setup event listeners
    const emailEvents = new QueueEvents('emails', { connection });
    const webhookEvents = new QueueEvents('webhooks', { connection });
    const notificationEvents = new QueueEvents('notifications', { connection });

    queueEvents.push(emailEvents, webhookEvents, notificationEvents);

    // Log queue activity
    emailEvents.on('completed', ({ jobId }) => {
      app.log.debug(`Email job ${jobId} completed`);
    });

    webhookEvents.on('failed', ({ jobId, failedReason }) => {
      app.log.error(`Webhook job ${jobId} failed: ${failedReason}`);
    });

    app.log.info('🚀 Message Queue: BullMQ enabled with Redis');
    app.log.info('✅ Background jobs will be processed reliably');
  } catch (err) {
    app.log.warn(
      { err },
      'Failed to initialize queues, falling back to direct execution'
    );
  }
}

/**
 * Add email job to queue or execute directly
 */
export async function queueEmail(data: EmailJobPayload): Promise<void> {
  if (emailQueue) {
    await emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  } else {
    // Direct execution without queue
    await processEmailJob({ data } as Job<EmailJobPayload>);
  }
}

/**
 * Add webhook job to queue or execute directly
 */
export async function queueWebhook(data: WebhookJobPayload): Promise<void> {
  if (webhookQueue) {
    await webhookQueue.add('send-webhook', data, {
      attempts: data.retries || 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
      // Note: BullMQ doesn't support job-level timeout, use global worker timeout instead
    });
  } else {
    // Direct execution without queue
    await processWebhookJob({ data } as Job<WebhookJobPayload>);
  }
}

/**
 * Add notification job to queue or execute directly
 */
export async function queueNotification(
  data: NotificationJobPayload
): Promise<void> {
  if (notificationQueue) {
    await notificationQueue.add('send-notification', data, {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 1000
      }
    });
  } else {
    // Direct execution without queue
    await processNotificationJob({ data } as Job<NotificationJobPayload>);
  }
}

/**
 * Process email job
 * TODO: Integrate with actual email service (SendGrid, SES, etc.)
 */
async function processEmailJob(job: Job<EmailJobPayload>): Promise<void> {
  const { to, subject } = job.data;

  // Simulate email sending
  logger.info(`📧 Sending email to ${to}: ${subject}`);

  // TODO: Implement actual email service
  // await sendGridService.send({ to, subject, body: job.data.body });

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Process webhook job
 */
async function processWebhookJob(job: Job<WebhookJobPayload>): Promise<void> {
  const { url, method, headers, body } = job.data;

  logger.info(`🪝 Sending webhook ${method} to ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(
        `Webhook failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (err) {
    logger.error(
      `❌ Webhook failed: ${err instanceof Error ? err.message : String(err)}`
    );
    throw err; // Will trigger retry
  }
}

/**
 * Process notification job
 * TODO: Integrate with push notification service
 */
async function processNotificationJob(
  job: Job<NotificationJobPayload>
): Promise<void> {
  const { userId, type } = job.data;

  logger.info(`🔔 Sending ${type} notification to user ${userId}`);

  // TODO: Implement push notification service
  // await pushService.send(userId, { type, data: job.data.data });

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 50));
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<Record<string, unknown>> {
  if (!REDIS_AVAILABLE) {
    return {
      mode: 'direct-execution',
      redis: false
    };
  }

  const stats: Record<string, unknown> = {
    mode: 'bullmq',
    redis: true
  };

  if (emailQueue) {
    stats.emails = await emailQueue.getJobCounts();
  }

  if (webhookQueue) {
    stats.webhooks = await webhookQueue.getJobCounts();
  }

  if (notificationQueue) {
    stats.notifications = await notificationQueue.getJobCounts();
  }

  return stats;
}

/**
 * Cleanup queues on shutdown
 */
export async function closeQueues(app: FastifyInstance): Promise<void> {
  if (!REDIS_AVAILABLE) return;

  try {
    // Close workers
    await Promise.all([
      emailWorker?.close(),
      webhookWorker?.close(),
      notificationWorker?.close()
    ]);

    // Close queues
    await Promise.all([
      emailQueue?.close(),
      webhookQueue?.close(),
      notificationQueue?.close()
    ]);

    // Close events
    await Promise.all(queueEvents.map((events) => events.close()));

    app.log.info('✅ Message queues closed');
  } catch (err) {
    app.log.error({ err }, 'Error closing message queues');
  }
}
