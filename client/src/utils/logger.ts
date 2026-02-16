/**
 * Logger Utility
 *
 * Wraps console methods to only log in development mode.
 * In production, logs are silenced to avoid exposing debug info.
 */

import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  error: (...args: unknown[]) => {
    // Always log errors to console
    console.error(...args);

    // Send to Sentry in production
    if (!isDev) {
      const [message, ...context] = args;
      if (message instanceof Error) {
        Sentry.captureException(message, { extra: { context } });
      } else {
        Sentry.captureMessage(String(message), {
          level: 'error',
          extra: { context }
        });
      }
    }
  },

  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },

  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  }
};
