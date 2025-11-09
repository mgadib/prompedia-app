import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

/**
 * Instance-based Auth Service
 * Handles authentication and user management operations
 * 
 * @example
 * ```ts
 * const authService = new AuthService();
 * await authService.signIn(email, password);
 * ```
 */
export class AuthService {
  constructor(private client: SupabaseClient = supabase) {}

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, username?: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Get user profile from database
   */
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<UserInsert>) {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new user profile
   */
  async createUser(user: UserInsert) {
    const { data, error } = await this.client
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get public user profile (safe fields only)
   */
  async getUserPublicProfile(userId: string) {
    const { data, error } = await this.client
      .from('users')
      .select('id, username, display_name')
      .eq('id', userId)
      .single();
    return { data, error };
  }
}

// Export singleton instance for convenience
export const authService = new AuthService();
