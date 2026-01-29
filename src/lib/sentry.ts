/**
 * Sentry Configuration
 * 
 * Error tracking and monitoring for production.
 * Sentry is only initialized in production builds.
 */

import * as Sentry from '@sentry/react';
import { config } from './config';

/**
 * Initialize Sentry for error tracking
 * Only enabled in production
 */
export function initSentry(): void {
  if (!config.env.isProd) {
    return; // Skip Sentry in development
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: config.env.mode,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    // Release tracking
    release: config.build.version,
  });
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (!config.env.isProd) {
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message with level
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  if (!config.env.isProd) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}
