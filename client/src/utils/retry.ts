/**
 * Retry utility with exponential backoff
 * Handles transient failures like rate limiting
 */

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: () => true
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!opts.retryableErrors(error)) {
        logger.debug('Non-retryable error, throwing immediately', error);
        throw error;
      }

      // Last attempt - don't wait
      if (attempt === opts.maxAttempts) {
        logger.warn(`All ${opts.maxAttempts} retry attempts failed`);
        break;
      }

      // Log and wait before retry
      logger.debug(
        `Attempt ${attempt}/${opts.maxAttempts} failed, retrying in ${delay}ms...`,
        { error }
      );

      await sleep(delay);

      // Exponential backoff with max delay cap
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Check if error is a rate limit error (425, 429, 503)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    // Giphy SDK errors
    if ('status' in error) {
      const status = (error as { status: number }).status;
      return status === 425 || status === 429 || status === 503;
    }
    // Fetch errors
    if ('response' in error) {
      const response = (error as { response: { status: number } }).response;
      return (
        response?.status === 425 ||
        response?.status === 429 ||
        response?.status === 503
      );
    }
  }
  return false;
}

/**
 * Retry specifically for Giphy API calls
 * Handles 425 (Too Early), 429 (Too Many Requests), 503 (Service Unavailable)
 */
export async function retryGiphy<T>(fn: () => Promise<T>): Promise<T> {
  return retry(fn, {
    maxAttempts: 3,
    initialDelay: 2000, // Start with 2 seconds for Giphy
    maxDelay: 8000,
    backoffMultiplier: 2,
    retryableErrors: isRateLimitError
  });
}
