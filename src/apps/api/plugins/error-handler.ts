// Error Handler Plugin
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../../../00-core/errors.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Handle our custom AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
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
        details: error.validation
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

  // Default error response
  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : error.message
    }
  });
}
