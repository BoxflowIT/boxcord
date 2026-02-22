/**
 * Message Queue Infrastructure Exports
 *
 * Background job processing with graceful degradation:
 * - With Redis: Uses BullMQ for reliable job processing
 * - Without Redis: Executes jobs directly
 */

export {
  initializeQueues,
  closeQueues,
  queueEmail,
  queueWebhook,
  queueNotification,
  getQueueStats
} from './message-queue.js';
