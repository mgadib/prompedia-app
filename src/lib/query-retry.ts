/**
 * React Query retry policy: rate-limit and 5xx handling.
 * Single source of truth for retry logic (uses error-handler for rate-limit detection).
 */

import { isRateLimitError } from './error-handler';

/** Max delay in ms for exponential backoff */
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Whether the query/mutation should retry given failure count and error.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isRateLimitError(error)) {
    return failureCount < 3;
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status >= 400 && status < 500) return false;
  }
  return failureCount < 2;
}

/**
 * Delay in ms before next retry (exponential backoff).
 */
export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY_MS);
}
