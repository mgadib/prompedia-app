/**
 * Comprehensive logging system for monitoring data storage flow
 * Provides different log levels and structured logging for debugging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.currentLevel = LogLevel.DEBUG;
    }
  }

  private createLogEntry(level: LogLevel, category: string, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const logMethod = this.getConsoleMethod(entry.level);
      const prefix = `[${entry.category}] ${entry.message}`;
      
      if (entry.data && entry.error) {
        logMethod(prefix, entry.data, entry.error);
      } else if (entry.data) {
        logMethod(prefix, entry.data);
      } else if (entry.error) {
        logMethod(prefix, entry.error);
      } else {
        logMethod(prefix);
      }
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  debug(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, category, message, data));
    }
  }

  info(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createLogEntry(LogLevel.INFO, category, message, data));
    }
  }

  warn(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createLogEntry(LogLevel.WARN, category, message, data));
    }
  }

  error(category: string, message: string, error?: Error, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(this.createLogEntry(LogLevel.ERROR, category, message, data, error));
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions for common categories
export const storageLogger = {
  debug: (message: string, data?: any) => logger.debug('STORAGE', message, data),
  info: (message: string, data?: any) => logger.info('STORAGE', message, data),
  warn: (message: string, data?: any) => logger.warn('STORAGE', message, data),
  error: (message: string, error?: Error, data?: any) => logger.error('STORAGE', message, error, data)
};

export const authLogger = {
  debug: (message: string, data?: any) => logger.debug('AUTH', message, data),
  info: (message: string, data?: any) => logger.info('AUTH', message, data),
  warn: (message: string, data?: any) => logger.warn('AUTH', message, data),
  error: (message: string, error?: Error, data?: any) => logger.error('AUTH', message, error, data)
};

export const supabaseLogger = {
  debug: (message: string, data?: any) => logger.debug('SUPABASE', message, data),
  info: (message: string, data?: any) => logger.info('SUPABASE', message, data),
  warn: (message: string, data?: any) => logger.warn('SUPABASE', message, data),
  error: (message: string, error?: Error, data?: any) => logger.error('SUPABASE', message, error, data)
};