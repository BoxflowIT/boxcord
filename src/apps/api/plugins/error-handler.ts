// Error Handler Plugin - Environment-specific Error Handling
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../../00-core/errors.js';
import * as Sentry from '@sentry/node';

const isDevelopment = process.env.NODE_ENV === 'development';
const _isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode ?? 500;

  // Enhanced logging with context
  const errorLog = {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: isDevelopment ? error.stack : undefined
    },
    request: {
      method: request.method,
      url: request.url,
      ip: request.ip,
      user: (request as any).user?.id,
      headers: {
        'user-agent': request.headers['user-agent'],
        referer: request.headers['referer']
      }
    }
  };

  if (statusCode >= 500) {
    request.log.error(errorLog, 'Internal server error');
    // Report to Sentry in production
    if (isProduction) {
      Sentry.captureException(error, {
        extra: {
          url: request.url,
          method: request.method,
          userId: (request as any).user?.id,
          ip: request.ip
        }
      });
    }
  } else {
    request.log.warn(errorLog, 'Client error');
  }

  // Handle our custom AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: isDevelopment ? error.details : undefined
      }
    });
  }

  // Handle Zod validation errors
  if (error.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: isDevelopment ? error.validation : undefined
      }
    });
  }

  // Handle JWT errors
  if (
    error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER' ||
    error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID'
  ) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing authentication token'
      }
    });
  }

  // PRODUCTION: Never expose internal error details or stack traces
  // DEVELOPMENT: Show full error details for debugging
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: isProduction
        ? statusCode >= 500
          ? 'An unexpected error occurred. Please try again later.'
          : error.message
        : error.message,
      stack: isDevelopment ? error.stack : undefined,
      details: isDevelopment ? error : undefined
    }
  });
}
