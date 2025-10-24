import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/integrations/supabase/types';

export interface TagInsert {
  name: string;
  description?: string;
}

export class TagService {
  /**
   * Get all tags created by the current user
   */
  static async getUserTags(userId: string): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user tags:', error);
      return [];
    }
  }

  /**
   * Get user's most frequently used tags (max 7)
   */
  static async getUserMostUsedTags(userId: string, limit: number = 7): Promise<Tag[]> {
    try {
      // First get all user's tags with usage count
      const { data: tagUsage, error } = await supabase
        .from('prompt_tags')
        .select(`
          tags!prompt_tags_tag_id_fkey(*)
        `)
        .eq('tags.user_id', userId);

      if (error) throw error;

      // Count usage for each tag
      const tagCounts: { [key: string]: { tag: Tag; count: number } } = {};
      
      tagUsage?.forEach(item => {
        if (item.tags) {
          const tagId = item.tags.id;
          if (tagCounts[tagId]) {
            tagCounts[tagId].count++;
          } else {
            tagCounts[tagId] = { tag: item.tags, count: 1 };
          }
        }
      });

      // Sort by usage count and return top tags
      const sortedTags = Object.values(tagCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.tag);

      return sortedTags;
    } catch (error) {
      console.error('Failed to get user most used tags:', error);
      // Fallback to regular user tags if counting fails
      return await this.getUserTags(userId);
    }
  }

  /**
   * Get all public tags (for suggestions)
   */
  static async getAllTags(): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get all tags:', error);
      return [];
    }
  }

  /**
   * Create a new tag (user-specific)
   */
  static async createTag(tagData: TagInsert, userId: string): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: tagData.name.toLowerCase().trim(),
        description: tagData.description,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Find or create a tag by name (user-specific)
   */
  static async findOrCreateTag(tagName: string, userId: string): Promise<Tag> {
    try {
      // First, try to find existing tag for this user
      const { data: existingTag, error: findError } = await supabase
        .from('tags')
        .select('*')
        .eq('name', tagName.toLowerCase().trim())
        .eq('user_id', userId)
        .single();

      if (existingTag && !findError) {
        return existingTag;
      }

      // If not found, create new tag for this user
      return await this.createTag({ name: tagName.toLowerCase().trim() }, userId);
    } catch (error) {
      console.error('Failed to find or create tag:', error);
      throw error;
    }
  }

  /**
   * Save tags for a prompt
   */
  static async savePromptTags(promptId: string, tagNames: string[], userId: string): Promise<void> {
    try {
      // First, remove all existing tags for this prompt
      await this.removeAllPromptTags(promptId);

      // Then add new tags
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

  /**
   * Get tags for a specific prompt
   */
  static async getPromptTags(promptId: string): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .from('prompt_tags')
        .select(`
          tags!prompt_tags_tag_id_fkey(*)
        `)
        .eq('prompt_id', promptId);

      if (error) throw error;
      return data?.map(item => item.tags).filter(Boolean) || [];
    } catch (error) {
      console.error('Failed to get prompt tags:', error);
      return [];
    }
  }

  /**
   * Add a tag to a prompt
   */
  static async addPromptTag(promptId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_tags')
      .insert({ prompt_id: promptId, tag_id: tagId });

    if (error) throw error;
  }

  /**
   * Remove a tag from a prompt
   */
  static async removePromptTag(promptId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', promptId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }

  /**
   * Remove all tags from a prompt
   */
  static async removeAllPromptTags(promptId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', promptId);

    if (error) throw error;
  }

  /**
   * Search tags by name (user-specific)
   */
  static async searchTags(query: string, userId?: string): Promise<Tag[]> {
    try {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${query.toLowerCase()}%`)
        .order('name', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to search tags:', error);
      return [];
    }
  }
}
