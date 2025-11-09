import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { getEnv } from '@/lib/env-validation';

// Fallback values untuk development/preview (jika env vars tidak diset di Lovable)
// Di production (Lovable), env vars harus diset melalui dashboard
const FALLBACK_SUPABASE_URL = 'https://kecpjbrlvaoujdnerhwe.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3BqYnJsdmFvdWpkbmVyaHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODQ4MDIsImV4cCI6MjA3NjU2MDgwMn0.CFBQJhZDMmfKGdg5GVeB2ns3uiojyCVQqXNvHZXpGyI';

// Query result cache untuk mengurangi duplicate requests
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 menit default

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const queryCache = new QueryCache();

// Cleanup cache setiap 1 menit
if (typeof window !== 'undefined') {
  setInterval(() => queryCache.cleanup(), 60 * 1000);
}

let supabaseClient: SupabaseClient<Database> | null = null;
let initializationPromise: Promise<SupabaseClient<Database>> | null = null;

/**
 * Get Supabase client instance with optimized configuration
 * Singleton pattern with promise-based initialization to prevent race conditions
 */
function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  // If initialization is in progress, return the promise
  if (initializationPromise) {
    // This shouldn't happen in practice, but handle it gracefully
    throw new Error('Supabase client initialization in progress');
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

  // Create client with optimized configuration
  supabaseClient = createClient<Database>(url, key, {
    auth: {
      storage: isBrowser ? localStorage : undefined,
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      flowType: 'pkce', // More secure auth flow
    },
    global: {
      headers: {
        'x-client-info': 'prompedia-ai@1.0.0',
      },
      // Fetch configuration with timeout and retry
      fetch: (url, options = {}) => {
        // Add timeout to requests (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Limit realtime events
      },
    },
  });

  return supabaseClient;
}

/**
 * Retry wrapper for Supabase operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = typeof (error as { status?: unknown }).status === 'number' 
          ? (error as { status: number }).status 
          : null;
        if (status !== null && status >= 400 && status < 500) {
          throw error;
        }
      }

      // Don't retry on last attempt
      if (attempt < maxRetries) {
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Cached query helper
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query with retry
  const result = await withRetry(queryFn);
  
  // Cache result
  queryCache.set(key, result, ttl);
  
  return result;
}

/**
 * Clear query cache (useful for mutations)
 */
export function clearQueryCache(): void {
  queryCache.clear();
}

// Export lazy-initialized client
// Import supabase client seperti ini:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = getSupabaseClient();