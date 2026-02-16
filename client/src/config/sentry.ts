/**
 * Sentry Configuration
 * 
 * Error tracking and monitoring for production.
 * Set VITE_SENTRY_DSN in your .env file to enable.
 */

import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE; // 'development' or 'production'
  
  // Only initialize if DSN is provided
  if (!dsn) {
    console.log('Sentry: No DSN provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    // Only send errors in production
    enabled: environment === 'production',
    // Sample rate for performance monitoring (10%)
    tracesSampleRate: 0.1,
    // Capture console errors
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text and inputs for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Replay sample rates
    replaysSessionSampleRate: 0, // Don't record normal sessions
    replaysOnErrorSampleRate: 0.1, // Record 10% of sessions with errors
    // Filter out sensitive data
    beforeSend(event) {
      // Remove user IP address
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });

  console.log(`Sentry initialized for ${environment} environment`);
}
