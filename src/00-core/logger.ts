import pino from 'pino';
import { config, isDevelopment, isProduction } from './config.js';

// Create Pino logger instance
export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  
  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Production settings
  ...(isProduction && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),

  // Base fields
  base: {
    env: config.NODE_ENV,
  },
});

// Child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Utility functions for structured logging
export const logRequest = (method: string, url: string, statusCode: number, responseTime: number) => {
  logger.info({
    type: 'request',
    method,
    url,
    statusCode,
    responseTime,
  });
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

export const logSlow = (operation: string, duration: number, threshold: number) => {
  if (duration > threshold) {
    logger.warn({
      type: 'slow_operation',
      operation,
      duration,
      threshold,
    });
  }
};
