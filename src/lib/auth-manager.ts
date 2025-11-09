import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized Auth Manager dengan session caching
 * Mengurangi duplicate getSession() calls dan menyediakan single source of truth
 */
class AuthManager {
  private sessionCache: Session | null = null;
  private sessionCacheTimestamp: number = 0;
  private readonly SESSION_CACHE_TTL = 30 * 1000; // 30 detik cache
  private authStateListeners: Set<(user: SupabaseUser | null) => void> = new Set();
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize auth manager dengan shared listener
   */
  private async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // Get initial session
        await this.refreshSession();

        // Setup shared auth state change listener
        supabase.auth.onAuthStateChange(
          async (_event, session) => {
            this.sessionCache = session;
            this.sessionCacheTimestamp = Date.now();
            
            const user = session?.user ?? null;
            
            // Notify all listeners
            this.authStateListeners.forEach(listener => {
              try {
                listener(user);
              } catch (error) {
                console.error('Error in auth state listener:', error);
              }
            });
          }
        );
      } catch (error) {
        console.error('Failed to initialize auth manager:', error);
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Get current session dengan caching
   */
  async getSession(): Promise<Session | null> {
    // Check cache first
    const now = Date.now();
    if (
      this.sessionCache &&
      (now - this.sessionCacheTimestamp) < this.SESSION_CACHE_TTL
    ) {
      return this.sessionCache;
    }

    // Cache expired or missing, refresh
    return await this.refreshSession();
  }

  /**
   * Get current user dengan caching
   */
  async getUser(): Promise<SupabaseUser | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  /**
   * Refresh session dari Supabase
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        this.sessionCache = null;
        this.sessionCacheTimestamp = 0;
        return null;
      }

      this.sessionCache = session;
      this.sessionCacheTimestamp = Date.now();
      return session;
    } catch (error) {
      console.error('Unexpected error getting session:', error);
      this.sessionCache = null;
      this.sessionCacheTimestamp = 0;
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChange(listener: (user: SupabaseUser | null) => void): () => void {
    this.authStateListeners.add(listener);

    // Immediately call with current user if available
    if (this.sessionCache?.user) {
      try {
        listener(this.sessionCache.user);
      } catch (error) {
        console.error('Error in initial auth state listener call:', error);
      }
    }

    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  /**
   * Clear session cache (useful for logout)
   */
  clearCache(): void {
    this.sessionCache = null;
    this.sessionCacheTimestamp = 0;
  }

  /**
   * Get cached user (synchronous, may be stale)
   */
  getCachedUser(): SupabaseUser | null {
    return this.sessionCache?.user ?? null;
  }

  /**
   * Check if user is authenticated (synchronous, uses cache)
   */
  isAuthenticated(): boolean {
    return !!this.sessionCache?.user;
  }
}

// Export singleton instance
export const authManager = new AuthManager();

