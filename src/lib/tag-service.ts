import { supabase } from '@/integrations/supabase/client';
import { Tag, Prompt } from './storage';

export interface TagInsert {
  name: string;
  description?: string;
}

export class TagService {
  /**
   * Mendapatkan semua tag yang dibuat oleh user saat ini
   * @param userId - ID user yang ingin diambil tag-nya
   * @returns Array tag milik user
   */
  static async getUserTags(userId: string): Promise<Tag[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Tag[];
    } catch (error) {
      console.error('Failed to get user tags:', error);
      return [];
    }
  }

  /**
   * Mendapatkan tag yang paling sering digunakan user (maksimal 7)
   * @param userId - ID user
   * @param limit - Jumlah maksimal tag yang dikembalikan (default: 7)
   * @returns Array tag yang diurutkan berdasarkan frekuensi penggunaan
   */
  static async getUserMostUsedTags(userId: string, limit: number = 7): Promise<Tag[]> {
    try {
      // Pertama, ambil semua tag user dengan jumlah penggunaan
      const { data: tagUsage, error } = await supabase
        .from('prompt_tags')
        .select(`
          tags!prompt_tags_tag_id_fkey(*)
        `)
        .eq('tags.user_id', userId);

      if (error) throw error;

      // Menghitung penggunaan untuk setiap tag
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

      // Mengurutkan berdasarkan jumlah penggunaan dan mengembalikan tag teratas
      const sortedTags = Object.values(tagCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.tag);

      return sortedTags;
    } catch (error) {
      console.error('Failed to get user most used tags:', error);
      // Fallback ke tag user biasa jika penghitungan gagal
      return await this.getUserTags(userId);
    }
  }

  /**
   * Mendapatkan semua tag public (untuk saran)
   * @returns Array semua tag yang tersedia
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
   * Membuat tag baru (spesifik user)
   * @param tagData - Data tag yang akan dibuat
   * @param userId - ID user yang membuat tag
   * @returns Tag yang baru dibuat
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
      // Pertama, coba cari tag yang sudah ada untuk user ini
      const { data: existingTag, error: findError } = await (supabase as any)
        .from('tags')
        .select('*')
        .eq('name', tagName.toLowerCase().trim())
        .eq('user_id', userId)
        .single();

      if (existingTag && !findError) {
        return existingTag as Tag;
      }

      // Jika tidak ditemukan, buat tag baru untuk user ini
      return await this.createTag({ name: tagName.toLowerCase().trim() }, userId);
    } catch (error) {
      console.error('Failed to find or create tag:', error);
      throw error;
    }
  }

  /**
   * Save tags for a prompt
   * SECURITY FIX: Added ownership validation to prevent unauthorized tag modifications
   */
  static async savePromptTags(promptId: string, tagNames: string[], userId: string): Promise<void> {
    try {
      // PERBAIKAN KEAMANAN: Verifikasi kepemilikan prompt SEBELUM memperbarui tag
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .select('id, user_id')
        .eq('id', promptId)
        .single();

      if (promptError || !prompt) {
        throw new Error('Prompt not found');
      }

      // Mengecek apakah user memiliki prompt ini
      if (prompt.user_id !== userId) {
        throw new Error('Unauthorized: You do not own this prompt');
      }

      // Sekarang aman untuk memperbarui tag
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

      const { data, error } = await (supabase as any)
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${query.toLowerCase()}%`)
        .order('name', { ascending: true })
        .limit(10);

      if (error) throw error;
      return (data || []) as Tag[];
    } catch (error) {
      console.error('Failed to search tags:', error);
      return [];
    }
  }

  /**
   * Get all prompts for a given tag name (user-specific)
   * Returns prompts enriched with their tags for consistent UI display
   */
  static async getUserPromptsByTag(userId: string, tagName: string): Promise<(Prompt & { tags: Tag[] })[]> {
    try {
      if (!userId || !tagName) {
        return [];
      }

      // Mencari tag berdasarkan nama untuk user ini
      const { data: tag, error: tagError } = await (supabase as any)
        .from('tags')
        .select('*')
        .eq('user_id', userId)
        .eq('name', tagName.toLowerCase().trim())
        .single();

      if (tagError || !tag) {
        // Jika tag tidak ditemukan, kembalikan array kosong
        return [];
      }

      // Mengambil semua prompt_id untuk tag ini
      const { data: tagLinks, error: linkError } = await supabase
        .from('prompt_tags')
        .select('prompt_id')
        .eq('tag_id', tag.id);

      if (linkError) throw linkError;

      const promptIds = (tagLinks || []).map((l: any) => l.prompt_id).filter(Boolean);
      if (promptIds.length === 0) {
        return [];
      }

      // Mengambil prompt yang dimiliki user ini yang sesuai dengan ID
      const { data: prompts, error: promptsError } = await (supabase as any)
        .from('prompts')
        .select(`*
        , users!prompts_user_id_fkey1(username, display_name)
        `)
        .in('id', promptIds)
        .eq('user_id', userId)
        .order('id', { ascending: false });

      if (promptsError) throw promptsError;

      const result: (Prompt & { tags: Tag[] })[] = [];
      for (const p of (prompts || [])) {
        try {
          const tags = await this.getPromptTags(p.id);
          result.push({ ...(p as Prompt), tags });
        } catch (tErr) {
          console.warn('Failed to load tags for prompt', p.id, tErr);
          result.push({ ...(p as Prompt), tags: [] });
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get prompts by tag:', error);
      return [];
    }
  }

  /**
   * Get all prompts for a given tag name across all users
   * - If userId is provided: returns user's own prompts + public prompts
   * - If no userId: returns only public prompts
   * Returns prompts enriched with their tags for consistent UI display
   */
  static async getPromptsByTagName(tagName: string, userId?: string): Promise<(Prompt & { tags: Tag[] })[]> {
    try {
      if (!tagName) {
        return [];
      }

      const normalizedName = tagName.toLowerCase().trim();

      // Mencari semua tag berdasarkan nama (di semua user)
      const { data: tags, error: tagsError } = await (supabase as any)
        .from('tags')
        .select('id, name, user_id')
        .eq('name', normalizedName);

      if (tagsError) throw tagsError;

      const tagIds = (tags || []).map((t: any) => t.id).filter(Boolean);
      if (tagIds.length === 0) {
        return [];
      }

      // Mengambil semua prompt_id yang memiliki salah satu dari ID tag ini
      const { data: tagLinks, error: linkError } = await supabase
        .from('prompt_tags')
        .select('prompt_id, tag_id')
        .in('tag_id', tagIds);

      if (linkError) throw linkError;

      const promptIds = Array.from(new Set(((tagLinks || []).map((l: any) => l.prompt_id).filter(Boolean))));
      if (promptIds.length === 0) {
        return [];
      }

      // Mengambil prompt yang sesuai dengan ID
      let query = (supabase as any)
        .from('prompts')
        .select(`*
        , users!prompts_user_id_fkey1(username, display_name)
        `)
        .in('id', promptIds)
        .order('id', { ascending: false });

      if (userId) {
        // Menampilkan public ATAU milik user
        query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
      } else {
        // Hanya public ketika tidak ada user
        query = query.eq('is_public', true);
      }

      const { data: prompts, error: promptsError } = await query;
      if (promptsError) throw promptsError;

      const result: (Prompt & { tags: Tag[] })[] = [];
      for (const p of (prompts || [])) {
        try {
          const tags = await this.getPromptTags(p.id);
          result.push({ ...(p as Prompt), tags });
        } catch (tErr) {
          console.warn('Failed to load tags for prompt', p.id, tErr);
          result.push({ ...(p as Prompt), tags: [] });
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get all prompts by tag name:', error);
      return [];
    }
  }
}
