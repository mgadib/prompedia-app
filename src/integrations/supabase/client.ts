// File ini dihasilkan secara otomatis. Jangan edit langsung.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { config } from '@/lib/config';

// Konfigurasi Supabase dari config module
// Anon key adalah public key yang aman diekspos - keamanan dijaga oleh RLS
const SUPABASE_URL = config.supabase.url;
const SUPABASE_PUBLISHABLE_KEY = config.supabase.anonKey;

// Enforce environment variables - no hardcoded fallbacks
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

// Import supabase client seperti ini:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});