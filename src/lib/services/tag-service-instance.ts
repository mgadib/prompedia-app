import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/lib/storage';
import { Database } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isTag, convertSupabaseTagToTag } from '../types/supabase-responses';

type SupabaseTag = Database['public']['Tables']['tags']['Row'];
type TagInsert = Database['public']['Tables']['tags']['Insert'];

/**
 * Tag Service - Instance-based service for tag operations
 * Enables dependency injection and easier testing
 */
export class TagServiceInstance {
  constructor(private client: SupabaseClient = supabase) {}

  async getUserTags(userId: string): Promise<Tag[]> {
    try {
      const { data, error } = await this.client
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(convertSupabaseTagToTag);
    } catch (error) {
      console.error('Failed to get user tags:', error);
      return [];
    }
  }

  async getAllTags(): Promise<Tag[]> {
    try {
      const { data, error } = await this.client
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(convertSupabaseTagToTag);
    } catch (error) {
      console.error('Failed to get all tags:', error);
      return [];
    }
  }

  async createTag(tagData: TagInsert, userId: string): Promise<Tag> {
    const { data, error } = await this.client
      .from('tags')
      .insert({
        name: tagData.name.toLowerCase().trim(),
        description: tagData.description,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return convertSupabaseTagToTag(data);
  }

  async findOrCreateTag(tagName: string, userId: string): Promise<Tag> {
    try {
      const { data: existingTag, error: findError } = await this.client
        .from('tags')
        .select('*')
        .eq('name', tagName.toLowerCase().trim())
        .eq('user_id', userId)
        .single();

      if (existingTag && !findError && isTag(existingTag)) {
        return convertSupabaseTagToTag(existingTag);
      }

      return await this.createTag({ name: tagName.toLowerCase().trim() }, userId);
    } catch (error) {
      console.error('Failed to find or create tag:', error);
      throw error;
    }
  }

  async getPromptTags(promptId: string): Promise<Tag[]> {
    try {
      const { data, error } = await this.client
        .from('prompt_tags')
        .select(`
          tags!prompt_tags_tag_id_fkey(*)
        `)
        .eq('prompt_id', promptId);

      if (error) throw error;
      return (data || [])
        .map((item: any) => item.tags)
        .filter((tag): tag is SupabaseTag => tag !== null && isTag(tag))
        .map(convertSupabaseTagToTag);
    } catch (error) {
      console.error('Failed to get prompt tags:', error);
      return [];
    }
  }

  async addPromptTag(promptId: string, tagId: string): Promise<void> {
    const { error } = await this.client
      .from('prompt_tags')
      .insert({ prompt_id: promptId, tag_id: tagId });

    if (error) throw error;
  }

  async removePromptTag(promptId: string, tagId: string): Promise<void> {
    const { error } = await this.client
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', promptId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }

  async removeAllPromptTags(promptId: string): Promise<void> {
    const { error } = await this.client
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', promptId);

    if (error) throw error;
  }

  async savePromptTags(promptId: string, tagNames: string[], userId: string): Promise<void> {
    try {
      // Verify prompt ownership before updating tags
      const { data: prompt, error: promptError } = await this.client
        .from('prompts')
        .select('id, user_id')
        .eq('id', promptId)
        .single();

      if (promptError || !prompt) {
        throw new Error('Prompt not found');
      }

      if (prompt.user_id !== userId) {
        throw new Error('Unauthorized: You do not own this prompt');
      }

      await this.removeAllPromptTags(promptId);

      for (const tagName of tagNames) {
        if (tagName.trim()) {
          const tag = await this.findOrCreateTag(tagName, userId);
          await this.addPromptTag(promptId, tag.id);
        }
      }
    } catch (error) {
      console.error('Failed to save prompt tags:', error);
      throw error;
    }
  }
}

// Export singleton instance for convenience
export const tagServiceInstance = new TagServiceInstance();

