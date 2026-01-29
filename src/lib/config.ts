/**
 * Application Configuration Module
 * 
 * Single source of truth for environment-based configuration.
 * All environment variables and feature flags should be accessed through this module.
 * 
 * This ensures:
 * - Type safety for environment variables
 * - Consistent environment detection
 * - Easy testing and mocking
 * - No hardcoded values
 */

/**
 * Environment detection utilities
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isTest = import.meta.env.MODE === 'test';

/**
 * Application configuration
 */
export const config = {
  /**
   * Environment mode
   */
  env: {
    mode: import.meta.env.MODE,
    isDev: isDevelopment,
    isProd: isProduction,
    isTest,
  },

  /**
   * Supabase configuration
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  /**
   * Feature flags and debug settings
   */
  features: {
    /**
     * Enable debug logging (only in development)
     */
    enableDebugLogging: isDevelopment,
    
    /**
     * Show error details in UI (only in development)
     */
    showErrorDetails: isDevelopment,
    
    /**
     * Enable React DevTools (only in development)
     */
    enableDevTools: isDevelopment,
  },

  /**
   * Build metadata
   */
  build: {
    version: import.meta.env.VITE_APP_VERSION || 'unknown',
    buildTime: import.meta.env.VITE_BUILD_TIME || '',
  },
} as const;

/**
 * Type-safe environment variable access
 */
export type Config = typeof config;

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (isProduction && !config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required in production');
  }

  if (isProduction && !config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required in production');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

// Validate configuration on module load (only in production)
if (isProduction) {
  validateConfig();
}
