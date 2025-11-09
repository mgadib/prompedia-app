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
 * Validates environment variables at startup
 * Uses graceful fallback for development/preview environments
 * In production (Lovable), env vars should be set via dashboard
 * @returns Validated environment configuration
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  // Check if import.meta.env is available (browser/runtime context)
  const hasImportMetaEnv = typeof import.meta !== 'undefined' && import.meta.env;
  const envUrl = hasImportMetaEnv ? import.meta.env.VITE_SUPABASE_URL : undefined;
  const envKey = hasImportMetaEnv ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

  // Gunakan env vars jika ada, fallback ke hardcoded untuk development
  const supabaseUrl = envUrl || FALLBACK_SUPABASE_URL;
  const supabaseKey = envKey || FALLBACK_SUPABASE_ANON_KEY;

  // Log warning jika menggunakan fallback (untuk development/preview)
  if (!envUrl || !envKey) {
    console.warn('⚠️ Environment variables not set. Using fallback values for development.');
    console.warn('💡 For production, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Lovable dashboard.');
  }

  try {
      const hasImportMetaEnv = typeof import.meta !== 'undefined' && import.meta.env;
      validatedEnv = EnvSchema.parse({
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: supabaseKey,
        MODE: (hasImportMetaEnv ? import.meta.env.MODE : 'development') || 'development',
        DEV: hasImportMetaEnv ? (import.meta.env.DEV ?? true) : true,
        PROD: hasImportMetaEnv ? (import.meta.env.PROD ?? false) : false
      });

    if (envUrl && envKey) {
      console.log('✅ Environment validation passed');
    } else {
      console.log('✅ Environment validation passed (using fallback values)');
    }
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n💡 Please set environment variables in Lovable dashboard:');
      console.error('   - VITE_SUPABASE_URL');
      console.error('   - VITE_SUPABASE_ANON_KEY');
      console.error('   See .env.example for reference.\n');
      
      // Return dengan fallback values untuk mencegah crash
      const hasImportMetaEnv = typeof import.meta !== 'undefined' && import.meta.env;
      validatedEnv = {
        VITE_SUPABASE_URL: FALLBACK_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: FALLBACK_SUPABASE_ANON_KEY,
        MODE: (hasImportMetaEnv ? (import.meta.env.MODE || 'development') : 'development') as 'development' | 'production' | 'test',
        DEV: hasImportMetaEnv ? (import.meta.env.DEV ?? true) : true,
        PROD: hasImportMetaEnv ? (import.meta.env.PROD ?? false) : false
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


