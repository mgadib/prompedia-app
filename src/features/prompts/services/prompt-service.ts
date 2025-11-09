import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Prompt } from '@/lib/storage';
import { convertSupabasePromptToPrompt, isPrompt } from '@/lib/types/supabase-responses';

type SupabasePrompt = Database['public']['Tables']['prompts']['Row'];
type PromptInsert = Database['public']['Tables']['prompts']['Insert'];

/**
 * Instance-based Prompt Service
 * Replaces static SupabaseService methods for prompt operations
 * 
 * @example
 * ```ts
 * const promptService = new PromptService();
 * const prompts = await promptService.getPrompts(userId);
 * ```
 */
export class PromptService {
  constructor(private client = supabase) {}

  /**
   * Get prompts for a user (or all prompts if no userId)
   */
  async getPrompts(
    userId?: string,
    options?: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<Prompt[]> {
    const defaultFields = options?.fields || [
      'id',
      'title',
      'content',
      'description',
      'model_id',
      'mode_id',
      'is_public',
      'user_id',
      'color',
      'is_featured',
      'original_prompt_id'
    ];
    
    const selectFields = defaultFields.join(', ');
    
    let query = this.client
      .from('prompts')
      .select(selectFields)
      .order('id', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const limit = options?.limit || 100;
    query = query.limit(limit);
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || [])
      .filter((p): p is SupabasePrompt => isPrompt(p))
      .map(p => convertSupabasePromptToPrompt(p));
  }

  /**
   * Get public prompts
   */
  async getPublicPrompts(
    options?: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<Prompt[]> {
    const defaultFields = options?.fields || [
      'id',
      'title',
      'content',
      'description',
      'model_id',
      'mode_id',
      'is_public',
      'user_id',
      'color',
      'is_featured',
      'original_prompt_id'
    ];
    
    const selectFields = defaultFields.join(', ');
    
    let query = this.client
      .from('prompts')
      .select(selectFields)
      .eq('is_public', true)
      .order('id', { ascending: false });

    const limit = options?.limit || 50;
    query = query.limit(limit);
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || [])
      .filter((p): p is SupabasePrompt => isPrompt(p))
      .map(p => convertSupabasePromptToPrompt(p));
  }

  /**
   * Get a single prompt by ID
   */
  async getPrompt(id: string): Promise<Prompt | null> {
    const { data, error } = await this.client
      .from('prompts')
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data || !isPrompt(data)) return null;
    
    return convertSupabasePromptToPrompt(data);
  }

  /**
   * Create a new prompt
   */
  async createPrompt(prompt: PromptInsert): Promise<Prompt> {
    const { data, error } = await this.client
      .from('prompts')
      .insert(prompt)
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .single();

    if (error) throw error;
    if (!data || !isPrompt(data)) {
      throw new Error('Failed to create prompt: invalid response');
    }
    
    return convertSupabasePromptToPrompt(data);
  }

  /**
   * Update an existing prompt
   */
  async updatePrompt(id: string, updates: Partial<PromptInsert>): Promise<Prompt> {
    const { data, error } = await this.client
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .single();

    if (error) throw error;
    if (!data || !isPrompt(data)) {
      throw new Error('Failed to update prompt: invalid response');
    }
    
    return convertSupabasePromptToPrompt(data);
  }

  /**
   * Delete a prompt
   */
  async deletePrompt(id: string): Promise<void> {
    const { error } = await this.client
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get featured prompts
   */
  async getFeaturedPrompts(): Promise<Prompt[]> {
    const { data, error } = await this.client
      .from('prompts')
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .eq('is_featured', true)
      .order('id', { ascending: false });

    if (error) throw error;
    
    return (data || [])
      .filter((p): p is SupabasePrompt => isPrompt(p))
      .map(p => convertSupabasePromptToPrompt(p));
  }
}

// Export singleton instance for convenience
export const promptService = new PromptService();
