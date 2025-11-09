import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { storage } from './storage'
import i18n from './i18n'

// Type aliases untuk readability yang lebih baik (diperbarui untuk schema minimalis)
type User = Database['public']['Tables']['users']['Row']
type Prompt = Database['public']['Tables']['prompts']['Row']
type Tag = Database['public']['Tables']['tags']['Row']
type AIModel = Database['public']['Tables']['ai_models']['Row']
type ThinkingMode = Database['public']['Tables']['thinking_modes']['Row']
type UserSession = Database['public']['Tables']['user_sessions']['Row']

// Type untuk operasi insert
type UserInsert = Database['public']['Tables']['users']['Insert']
type PromptInsert = Database['public']['Tables']['prompts']['Insert']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert']
type PromptTagInsert = Database['public']['Tables']['prompt_tags']['Insert']

/**
 * SupabaseService - Static service class for backward compatibility
 * 
 * @deprecated For new code, use instance-based services:
 * - AuthService for authentication
 * - PromptService for prompt operations
 * - TagServiceInstance for tag operations
 * 
 * This class is kept for backward compatibility but will be phased out.
 */
export class SupabaseService {
  // ========================================
  // AUTENTIKASI
  // ========================================

  static async signUp(email: string, password: string, username?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    })

    if (error) throw error
    return data
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  // ========================================
  // USERS (sebelumnya profiles)
  // ========================================

  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateUser(userId: string, updates: Partial<UserInsert>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async createUser(user: UserInsert) {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Method legacy untuk backward compatibility dengan kode lama
  static async getProfile(userId: string): Promise<User | null> {
    return this.getUser(userId)
  }

  static async updateProfile(userId: string, updates: Partial<UserInsert>) {
    return this.updateUser(userId, updates)
  }

  static async createProfile(profile: UserInsert) {
    return this.createUser(profile)
  }

  // ========================================
  // PROMPTS
  // ========================================

  static async getPrompts(
    userId?: string,
    options?: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<Prompt[]> {
    // OPTIMIZED: Selective field loading - only load needed fields
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
    
    let query = supabase
      .from('prompts')
      .select(selectFields)
      .order('id', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    // OPTIMIZED: Add pagination and limit
    const limit = options?.limit || 100; // Default limit to prevent huge queries
    query = query.limit(limit);
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + limit - 1);
    }

    const { data, error } = await query
    if (error) throw error
    return ((data || []).filter(p => p !== null)) as unknown as Prompt[]
  }

  static async getPublicPrompts(
    options?: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<Prompt[]> {
    // OPTIMIZED: Selective field loading
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
    
    let query = supabase
      .from('prompts')
      .select(selectFields)
      .eq('is_public', true)
      .order('id', { ascending: false })

    // OPTIMIZED: Add pagination and limit
    const limit = options?.limit || 50; // Smaller default for public prompts
    query = query.limit(limit);
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + limit - 1);
    }

    const { data, error } = await query
    if (error) throw error
    return ((data || []).filter(p => p !== null)) as unknown as Prompt[]
  }

  static async getFeaturedPrompts(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .eq('is_featured', true)
      .order('id', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getPrompt(id: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async createPrompt(prompt: PromptInsert): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .insert(prompt)
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async updatePrompt(id: string, updates: Partial<PromptInsert>): Promise<Prompt> {
    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async deletePrompt(id: string): Promise<void> {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async forkPrompt(originalPromptId: string, newTitle?: string): Promise<Prompt> {
    // Mengambil prompt original untuk di-fork
    const originalPrompt = await this.getPrompt(originalPromptId)
    if (!originalPrompt) {
      throw new Error('Original prompt not found')
    }

    // Membuat prompt fork (disederhanakan - tanpa computed fields)
    const forkedPrompt: PromptInsert = {
      user_id: (await this.getCurrentUser())?.id || '',
      title: newTitle || i18n.t('prompt:forkTitle', { title: originalPrompt.title }),
      content: originalPrompt.content,
      description: originalPrompt.description,
      model_id: originalPrompt.model_id,
      mode_id: originalPrompt.mode_id,
      color: originalPrompt.color,
      is_public: false, // Fork dimulai sebagai private untuk keamanan
      original_prompt_id: originalPromptId
    }

    const newPrompt = await this.createPrompt(forkedPrompt)

    // Menyalin tag dari prompt original ke prompt fork
    const originalTags = await this.getPromptTags(originalPromptId)
    if (originalTags.length > 0) {
      const tagInserts: PromptTagInsert[] = originalTags.map(tag => ({
        prompt_id: newPrompt.id,
        tag_id: tag.id
      }))

      await supabase
        .from('prompt_tags')
        .insert(tagInserts)
    }

    return newPrompt
  }

  // ========================================
  // PROMPT TAGS (junction table baru untuk many-to-many)
  // ========================================

  static async getPromptTags(promptId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('prompt_tags')
      .select(`
        tags!prompt_tags_tag_id_fkey(*)
      `)
      .eq('prompt_id', promptId)

    if (error) throw error
    return data?.map(item => item.tags).filter(Boolean) || []
  }

  static async addPromptTag(promptId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_tags')
      .insert({ prompt_id: promptId, tag_id: tagId })

    if (error) throw error
  }

  static async removePromptTag(promptId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', promptId)
      .eq('tag_id', tagId)

    if (error) throw error
  }

  static async incrementViewCount(id: string): Promise<void> {
    // Catatan: Tracking view count dihapus dalam schema minimalis
    // Views sekarang ditrack secara eksternal jika diperlukan
    console.log('View count increment called for prompt:', id)
  }

  // ========================================
  // TAGS
  // ========================================

  static async getTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async createTag(tag: TagInsert): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async searchTags(query: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(10)

    if (error) throw error
    return data || []
  }

  // ========================================
  // AI MODELS
  // ========================================

  // Cache untuk models dan modes untuk menghindari panggilan DB berulang
  private static aiModelsCache: AIModel[] | null = null
  private static thinkingModesCache: ThinkingMode[] | null = null

  static async getAIModels(forceRefresh = false): Promise<AIModel[]> {
    if (!forceRefresh && this.aiModelsCache) {
      return this.aiModelsCache
    }

    const allowedModelIds = ['meta-llama/llama-4-maverick:free', 'qwen/qwen3-30b-a3b:free']
    
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .in('id', allowedModelIds)
      .order('name')
    
    if (error) {
      // Jika kolom is_active belum ada, filter di memory
      const { data: allData, error: allError } = await supabase
        .from('ai_models')
        .select('*')
        .order('name')
      
      if (allError) throw allError
      
      // Filter untuk hanya mengizinkan 2 model yang ditentukan
      this.aiModelsCache = (allData || []).filter(model => allowedModelIds.includes(model.id))
      return this.aiModelsCache
    }
    
    // Filter untuk hanya mengizinkan 2 model yang ditentukan (double check)
    this.aiModelsCache = (data || []).filter(model => allowedModelIds.includes(model.id))
    return this.aiModelsCache
  }

  static async getAIModel(id: string): Promise<AIModel | null> {
    const models = await this.getAIModels()
    return models.find(model => model.id === id) || null
  }

  // ========================================
  // THINKING MODES
  // ========================================

  static async getThinkingModes(forceRefresh = false): Promise<ThinkingMode[]> {
    if (!forceRefresh && this.thinkingModesCache) {
      return this.thinkingModesCache
    }

    const { data, error } = await supabase
      .from('thinking_modes')
      .select('*')
      .order('name')

    if (error) throw error
    
    this.thinkingModesCache = data || []
    return this.thinkingModesCache
  }

  static async getThinkingMode(id: string): Promise<ThinkingMode | null> {
    const modes = await this.getThinkingModes()
    return modes.find(mode => mode.id === id) || null
  }

  // Membersihkan cache (berguna untuk development/testing)
  static clearCaches(): void {
    this.aiModelsCache = null
    this.thinkingModesCache = null
  }

  // ========================================
  // USER SESSIONS (ANALITIK)
  // ========================================

  static async createUserSession(sessionData: UserSessionInsert): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return data || []
  }

  // ========================================
  // AI PROCESSING
  // ========================================

  static async processWithAI(
    model: string, 
    prompt: string, 
    mode?: string, 
    options?: Record<string, unknown>
  ): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke('ai-processor', {
      body: {
        model,
        prompt,
        mode,
        options
      }
    })

    if (error) throw error
    return data
  }

  static async enhancePrompts(
    prompts: Array<{id: string, content: string, currentMode?: string}>, 
    operation: string, 
    options?: Record<string, unknown>
  ): Promise<unknown> {
    const { data, error } = await supabase.functions.invoke('prompt-enhancer', {
      body: {
        prompts,
        operation,
        options
      }
    })

    if (error) throw error
    return data
  }

  // ========================================
  // STORAGE (PENYIMPANAN FILE)
  // ========================================

  static async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (error) throw error

    // Mendapatkan URL public untuk avatar
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  }

  static async uploadPromptAsset(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from('prompt-assets')
      .upload(fileName, file)

    if (error) throw error

    // Mendapatkan URL public (meskipun bucket ini private, kita bisa generate signed URLs)
    const { data: { publicUrl } } = supabase.storage
      .from('prompt-assets')
      .getPublicUrl(fileName)

    return publicUrl
  }

  // ========================================
  // FUNGSI UTILITAS
  // ========================================

  static async syncWithLocalStorage() {
    // Fungsi ini membantu migrasi dari local storage ke Supabase
    // Mengambil user saat ini
    const user = await this.getCurrentUser()
    if (!user) return

    // Mengambil prompt dari local storage
    const localPrompts = storage.getPrompts()
    const userLocalPrompts = localPrompts.filter(p => p.user_id === user.id)

    if (userLocalPrompts.length === 0) return

    // Mengecek apakah user sudah memiliki prompt di Supabase
    const existingPrompts = await this.getPrompts(user.id)

    if (existingPrompts.length > 0) {
      // User sudah memiliki data di Supabase, jangan sync untuk menghindari duplikasi
      return
    }

    // Sinkronisasi prompt lokal ke Supabase
    for (const localPrompt of userLocalPrompts) {
      try {
        await this.createPrompt({
          user_id: user.id,
          title: localPrompt.title,
          content: localPrompt.content,
          description: localPrompt.description || null,
          model_id: localPrompt.model_id || '',
          mode_id: localPrompt.mode_id || '',
          color: localPrompt.color || '#3b82f6',
          is_public: localPrompt.is_public
        })

        // Tag ditangani terpisah melalui tabel prompt_tags
        // Tidak ada property tags di interface Prompt lagi
      } catch (error) {
        console.error('Error syncing prompt:', error)
      }
    }

    console.log(`Synced ${userLocalPrompts.length} prompts from local storage`)
  }

  // ========================================
  // METODE QUERY USER YANG AMAN
  // ========================================

  /**
   * Mendapatkan profil public (hanya field aman - tidak termasuk role)
   * Digunakan untuk menampilkan profil user lain
   * @param userId - ID user yang ingin diambil profilnya
   */
  static async getUserPublicProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name') // Tidak termasuk role untuk keamanan
      .eq('id', userId)
      .single();
    return { data, error };
  }

  /**
   * Mendapatkan profil sendiri (termasuk field role)
   * Digunakan untuk profil user yang terautentikasi sendiri
   * @param userId - ID user yang terautentikasi
   */
  static async getUserOwnProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  }

  /**
   * Mendapatkan semua user untuk tampilan public (hanya field aman)
   * Digunakan untuk daftar user, mentions, dll
   */
  static async getAllUsersPublic() {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name') // Tidak termasuk role untuk keamanan
      .order('username');
    return { data, error };
  }
}
