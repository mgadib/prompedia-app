/**
 * Logger Utility
 * 
 * Centralized logging that respects environment configuration.
 * All console statements should go through this module.
 * 
 * In production builds, errors are sent to Sentry for tracking.
 */

import { config } from './config';
import { captureException, captureMessage } from './sentry';

/**
 * Logger interface for type-safe logging
 */
interface Logger {
  log: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * No-op logger for production (all methods are empty functions)
 */
const noopLogger: Logger = {
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Development logger that uses console methods
 */
const devLogger: Logger = {
  log: (...args) => console.log(...args),
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

/**
 * Get the appropriate logger based on environment
 */
function getLogger(): Logger {
  return config.features.enableDebugLogging ? devLogger : noopLogger;
}

/**
 * Application logger instance
 * 
 * Usage:
 * ```ts
 * import { logger } from '@/lib/logger';
 * 
 * logger.error('Something went wrong', error);
 * logger.debug('Debug info', data);
 * ```
 */
export const logger = getLogger();

/**
 * Structured error logging for production error tracking
 * Sends errors to Sentry in production
 */
export function logError(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (config.features.enableDebugLogging) {
    console.error('Error:', error, context);
  }
  
  // Send to Sentry in production
  if (config.env.isProd) {
    captureException(error, context);
  }
}

/**
 * Structured warning logging
 * Sends warnings to Sentry in production
 */
export function logWarning(
  message: string,
  context?: Record<string, unknown>
): void {
  if (config.features.enableDebugLogging) {
    console.warn('Warning:', message, context);
  }
  
  // Send to Sentry in production
  if (config.env.isProd) {
    captureMessage(message, 'warning', context);
  }
}
