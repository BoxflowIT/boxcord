import * as Sentry from '@sentry/node';
import { config, isProduction, features } from '../00-core/config.js';
import { logger } from '../00-core/logger.js';

// Initialize Sentry for backend error tracking
export function initSentry() {
  if (!features.sentry) {
    logger.info('Sentry is disabled (no SENTRY_DSN configured)');
    return;
  }

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  logger.info('Sentry initialized for backend error tracking');
}

// Capture exception helper
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!features.sentry) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

// Capture message helper
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!features.sentry) {
    return;
  }

  Sentry.captureMessage(message, level);
}

// Set user context
export function setUser(userId: string, email?: string, username?: string) {
  if (!features.sentry) {
    return;
  }

  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

// Clear user context (on logout)
export function clearUser() {
  if (!features.sentry) {
    return;
  }

  Sentry.setUser(null);
}

// Add breadcrumb
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  if (!features.sentry) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
