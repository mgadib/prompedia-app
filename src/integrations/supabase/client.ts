import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getEnv } from '@/lib/env-validation';

// Fallback values untuk development/preview (jika env vars tidak diset di Lovable)
// Di production (Lovable), env vars harus diset melalui dashboard
const FALLBACK_SUPABASE_URL = 'https://kecpjbrlvaoujdnerhwe.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3BqYnJsdmFvdWpkbmVyaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODQ4MDIsImV4cCI6MjA3NjU2MDgwMn0.CFBQJhZDMmfKGdg5GVeB2ns3uiojyCVQqXNvHZXpGyI';

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Get Supabase client instance
 * Lazy initialization to prevent issues during build time
 */
function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';
  
  let url: string;
  let key: string;

  if (isBrowser && typeof import.meta !== 'undefined' && import.meta.env) {
    // In browser/runtime: use validated env vars
    try {
      const env = getEnv();
      url = env.VITE_SUPABASE_URL;
      key = env.VITE_SUPABASE_ANON_KEY;
    } catch {
      // Fallback if validation fails
      url = FALLBACK_SUPABASE_URL;
      key = FALLBACK_SUPABASE_ANON_KEY;
    }
  } else {
    // In Node.js/build time: use fallback values
    url = FALLBACK_SUPABASE_URL;
    key = FALLBACK_SUPABASE_ANON_KEY;
  }

  supabaseClient = createClient<Database>(url, key, {
    auth: {
      storage: isBrowser ? localStorage : undefined,
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
    }
  });

  return supabaseClient;
}

// Export lazy-initialized client
// Import supabase client seperti ini:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = getSupabaseClient();