/**
 * Sistem logging komprehensif untuk memantau alur penyimpanan data
 * Menyediakan berbagai level log dan structured logging untuk debugging
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
  data?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Set level log berdasarkan environment: DEBUG di development, INFO di production
    if (import.meta.env.DEV) {
      this.currentLevel = LogLevel.DEBUG;
    }
  }

  private createLogEntry(level: LogLevel, category: string, message: string, data?: Record<string, unknown>, error?: Error): LogEntry {
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
    
    // Menjaga hanya log terbaru untuk mencegah memory leak
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output ke console hanya di development untuk debugging
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

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
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

  debug(category: string, message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, category, message, data));
    }
  }

  info(category: string, message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createLogEntry(LogLevel.INFO, category, message, data));
    }
  }

  warn(category: string, message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createLogEntry(LogLevel.WARN, category, message, data));
    }
  }

  error(category: string, message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(this.createLogEntry(LogLevel.ERROR, category, message, data, error));
    }
  }

  /**
   * Mendapatkan log terbaru untuk debugging
   * @param count - Jumlah log terbaru yang ingin diambil (default: 50)
   * @returns Array log entries
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Mendapatkan log berdasarkan kategori
   * @param category - Kategori log yang ingin difilter
   * @returns Array log entries dengan kategori yang sesuai
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Menghapus semua log dari memory
   * Berguna untuk reset state saat testing atau debugging
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Mengekspor log sebagai JSON untuk debugging
   * @returns String JSON yang berisi semua log entries
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Membuat singleton instance untuk digunakan di seluruh aplikasi
export const logger = new Logger();

// Fungsi convenience untuk kategori umum yang sering digunakan
export const storageLogger = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug('STORAGE', message, data),
  info: (message: string, data?: Record<string, unknown>) => logger.info('STORAGE', message, data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn('STORAGE', message, data),
  error: (message: string, error?: Error, data?: Record<string, unknown>) => logger.error('STORAGE', message, error, data)
};

export const authLogger = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug('AUTH', message, data),
  info: (message: string, data?: Record<string, unknown>) => logger.info('AUTH', message, data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn('AUTH', message, data),
  error: (message: string, error?: Error, data?: Record<string, unknown>) => logger.error('AUTH', message, error, data)
};

export const supabaseLogger = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug('SUPABASE', message, data),
  info: (message: string, data?: Record<string, unknown>) => logger.info('SUPABASE', message, data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn('SUPABASE', message, data),
  error: (message: string, error?: Error, data?: Record<string, unknown>) => logger.error('SUPABASE', message, error, data)
};