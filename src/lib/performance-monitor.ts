/**
 * Performance Monitoring
 * 
 * Tracks Web Vitals and API response times for performance insights.
 */

import { config } from './config';
import { logger, logWarning } from './logger';
import { captureMessage } from './sentry';

/**
 * Web Vitals metrics
 */
interface WebVitals {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Track Web Vitals (Core Web Vitals)
 * Only in production
 */
export function trackWebVitals(metric: WebVitals): void {
  if (!config.env.isProd) {
    return;
  }

  if (config.features.enableDebugLogging) {
    logger.log('Web Vital:', metric.name, metric.value, metric.rating);
  }

  // Send to Sentry as performance data
  captureMessage(`Web Vital: ${metric.name}`, 'info', {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  });
}

/**
 * Track API response time
 */
export function trackApiResponseTime(
  endpoint: string,
  method: string,
  duration: number,
  statusCode?: number
): void {
  if (!config.env.isProd) {
    return;
  }

  // Log slow API calls (> 1 second)
  if (duration > 1000) {
    captureMessage('Slow API Response', 'warning', {
      endpoint,
      method,
      duration,
      statusCode,
    });
  }

  // Log very slow API calls (> 3 seconds) as errors
  if (duration > 3000) {
    captureMessage('Very Slow API Response', 'error', {
      endpoint,
      method,
      duration,
      statusCode,
    });
  }
}

/**
 * Initialize Web Vitals tracking
 * Uses web-vitals library if available
 */
export function initWebVitalsTracking(): void {
  if (!config.env.isProd) {
    return;
  }

  // Dynamically import web-vitals to avoid adding to bundle if not needed
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS(trackWebVitals);
    onFID(trackWebVitals);
    onFCP(trackWebVitals);
    onLCP(trackWebVitals);
    onTTFB(trackWebVitals);
    onINP(trackWebVitals);
  }).catch(() => {
    if (config.features.enableDebugLogging) {
      logWarning('web-vitals not installed. Performance tracking disabled.', {
        context: 'initWebVitalsTracking',
      });
    }
  });
}
