/**
 * Performance monitoring untuk query execution time dan network latency
 */

interface QueryMetrics {
  queryKey: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 metrics
  private slowQueryThreshold = 1000; // 1 second

  /**
   * Start tracking a query
   */
  startQuery(queryKey: string): () => void {
    const startTime = performance.now();
    const metric: QueryMetrics = {
      queryKey,
      startTime,
      success: false,
    };

    // Return end function
    return (success: boolean = true, error?: string) => {
      const endTime = performance.now();
      metric.endTime = endTime;
      metric.duration = endTime - startTime;
      metric.success = success;
      if (error) {
        metric.error = error;
      }

      this.recordMetric(metric);
    };
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow queries
    if (metric.duration && metric.duration > this.slowQueryThreshold) {
      console.warn(`[Performance] Slow query detected:`, {
        queryKey: metric.queryKey,
        duration: `${metric.duration.toFixed(2)}ms`,
        threshold: `${this.slowQueryThreshold}ms`,
      });
    }

    // Log errors
    if (!metric.success && metric.error) {
      console.error(`[Performance] Query failed:`, {
        queryKey: metric.queryKey,
        error: metric.error,
        duration: metric.duration ? `${metric.duration.toFixed(2)}ms` : 'N/A',
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageDuration: number;
    slowQueries: number;
    slowestQueries: QueryMetrics[];
  } {
    const successful = this.metrics.filter(m => m.success);
    const failed = this.metrics.filter(m => !m.success);
    const withDuration = this.metrics.filter(m => m.duration !== undefined) as Array<
      QueryMetrics & { duration: number }
    >;

    const totalDuration = withDuration.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = withDuration.length > 0 ? totalDuration / withDuration.length : 0;

    const slowQueries = withDuration.filter(m => m.duration > this.slowQueryThreshold);
    const slowestQueries = [...withDuration]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      totalQueries: this.metrics.length,
      successfulQueries: successful.length,
      failedQueries: failed.length,
      averageDuration,
      slowQueries: slowQueries.length,
      slowestQueries: slowestQueries as QueryMetrics[],
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Wrapper untuk track query performance
 */
export async function trackQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const endTracking = performanceMonitor.startQuery(queryKey);

  try {
    const result = await queryFn();
    endTracking(true);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    endTracking(false, errorMessage);
    throw error;
  }
}

/**
 * Structured logging untuk slow queries
 */
export function logSlowQuery(queryKey: string, duration: number, details?: Record<string, any>): void {
  const logData = {
    type: 'slow_query',
    queryKey,
    duration: `${duration.toFixed(2)}ms`,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn('[Performance] Slow Query:', logData);
  }

  // In production, you could send this to an analytics service
  // Example: analytics.track('slow_query', logData);
}

