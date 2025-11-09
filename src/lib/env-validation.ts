import { z } from 'zod';
import { getErrorMessage } from './i18n-helpers';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid at runtime
 */
const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(getErrorMessage('env.invalidSupabaseUrl')),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, getErrorMessage('env.supabaseKeyRequired')),
  MODE: z.enum(['development', 'production', 'test']),
  DEV: z.boolean(),
  PROD: z.boolean()
});

export type Env = z.infer<typeof EnvSchema>;

// Fallback values untuk development/preview (jika env vars tidak diset di Lovable)
// Di production, env vars harus diset melalui Lovable dashboard
const FALLBACK_SUPABASE_URL = 'https://kecpjbrlvaoujdnerhwe.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3BqYnJsdmFvdWpkbmVyaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODQ4MDIsImV4cCI6MjA3NjU2MDgwMn0.CFBQJhZDMmfKGdg5GVeB2ns3uiojyCVQqXNvHZXpGyI';

let validatedEnv: Env | null = null;

/**
 * Check if we're in a build environment (Node.js, not browser)
 */
function isBuildEnvironment(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined';
}

/**
 * Safely access import.meta.env with fallback for build environments
 */
function safeGetEnvVar(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key];
    }
  } catch {
    // Ignore errors when import.meta is not available (build time)
  }
  return undefined;
}

/**
 * Get build mode safely
 */
function safeGetMode(): 'development' | 'production' | 'test' {
  try {
    const mode = safeGetEnvVar('MODE');
    if (mode === 'development' || mode === 'production' || mode === 'test') {
      return mode;
    }
  } catch {
    // Fallback
  }
  // Default to development for build safety
  return 'development';
}

/**
 * Get boolean env var safely
 */
function safeGetBoolean(key: string, defaultValue: boolean): boolean {
  try {
    const value = safeGetEnvVar(key);
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  } catch {
    return defaultValue;
  }
}

/**
 * Validates environment variables at startup
 * Uses graceful fallback for development/preview/build environments
 * In production (Lovable), env vars should be set via dashboard
 * Build-safe: never throws, always returns valid config
 * @returns Validated environment configuration
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const isBuild = isBuildEnvironment();
  
  // Safely access environment variables
  const envUrl = safeGetEnvVar('VITE_SUPABASE_URL');
  const envKey = safeGetEnvVar('VITE_SUPABASE_ANON_KEY');

  // Gunakan env vars jika ada, fallback ke hardcoded untuk development/build
  const supabaseUrl = envUrl || FALLBACK_SUPABASE_URL;
  const supabaseKey = envKey || FALLBACK_SUPABASE_ANON_KEY;

  // Log warning jika menggunakan fallback (untuk development/preview/build)
  if (!envUrl || !envKey) {
    if (!isBuild) {
      // Only log warnings in runtime, not during build
      console.warn('⚠️ Environment variables not set. Using fallback values for development.');
      console.warn('💡 For production, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Lovable dashboard.');
    }
  }

  try {
    const mode = safeGetMode();
    const dev = safeGetBoolean('DEV', mode === 'development');
    const prod = safeGetBoolean('PROD', mode === 'production');
    
    validatedEnv = EnvSchema.parse({
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseKey,
      MODE: mode,
      DEV: dev,
      PROD: prod
    });

    if (!isBuild && envUrl && envKey) {
      console.log('✅ Environment validation passed');
    } else if (!isBuild) {
      console.log('✅ Environment validation passed (using fallback values)');
    }
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      if (!isBuild) {
        // Only log errors in runtime, not during build
        console.error('❌ Environment validation failed:');
        error.errors.forEach(err => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        console.error('\n💡 Please set environment variables in Lovable dashboard:');
        console.error('   - VITE_SUPABASE_URL');
        console.error('   - VITE_SUPABASE_ANON_KEY');
        console.error('   See .env.example for reference.\n');
      }
      
      // Always return dengan fallback values untuk mencegah crash (build-safe)
      const mode = safeGetMode();
      validatedEnv = {
        VITE_SUPABASE_URL: FALLBACK_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: FALLBACK_SUPABASE_ANON_KEY,
        MODE: mode,
        DEV: mode === 'development',
        PROD: mode === 'production'
      };
      
      return validatedEnv;
    }
    // For non-Zod errors, still return fallback to prevent build failure
    if (isBuild) {
      const mode = safeGetMode();
      validatedEnv = {
        VITE_SUPABASE_URL: FALLBACK_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: FALLBACK_SUPABASE_ANON_KEY,
        MODE: mode,
        DEV: mode === 'development',
        PROD: mode === 'production'
      };
      return validatedEnv;
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 * Must call validateEnv() first
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    // Auto-validate jika belum dipanggil
    return validateEnv();
  }
  return validatedEnv;
}


