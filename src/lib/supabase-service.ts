import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { storage } from './storage'

// Type aliases for better readability (updated for minimalist schema)
type User = Database['public']['Tables']['users']['Row']
type Prompt = Database['public']['Tables']['prompts']['Row']
type Tag = Database['public']['Tables']['tags']['Row']
type AIModel = Database['public']['Tables']['ai_models']['Row']
type ThinkingMode = Database['public']['Tables']['thinking_modes']['Row']
type UserSession = Database['public']['Tables']['user_sessions']['Row']
type PromptTag = Database['public']['Tables']['prompt_tags']['Row']

// Insert types
type UserInsert = Database['public']['Tables']['users']['Insert']
type PromptInsert = Database['public']['Tables']['prompts']['Insert']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert']
type PromptTagInsert = Database['public']['Tables']['prompt_tags']['Insert']

export class SupabaseService {
  // ========================================
  // AUTHENTICATION
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
  // USERS (formerly profiles)
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

  // Legacy methods for backward compatibility
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

  static async getPrompts(userId?: string): Promise<Prompt[]> {
    let query = supabase
      .from('prompts')
      .select(`
        *,
        users!prompts_user_id_fkey1(username, display_name)
      `)
      // Note: updated_at field removed in minimalist schema

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async getPublicPrompts(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_public', true)
      .order('id', { ascending: false })

    if (error) throw error
    return data || []
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
    // Get original prompt
    const originalPrompt = await this.getPrompt(originalPromptId)
    if (!originalPrompt) {
      throw new Error('Original prompt not found')
    }

    // Create forked prompt (simplified - no computed fields)
    const forkedPrompt: PromptInsert = {
      user_id: (await this.getCurrentUser())?.id || '',
      title: newTitle || `Fork of ${originalPrompt.title}`,
      content: originalPrompt.content,
      description: originalPrompt.description,
      model: originalPrompt.model,
      mode: originalPrompt.mode,
      color: originalPrompt.color,
      is_public: false, // Forks start as private
      original_prompt_id: originalPromptId
    }

    const newPrompt = await this.createPrompt(forkedPrompt)

    // Copy tags from original prompt to forked prompt
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
  // PROMPT TAGS (new junction table)
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
    // Note: View count tracking removed in minimalist schema
    // Views are now tracked externally if needed
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

  // Cache for models and modes to avoid repeated DB calls
  private static aiModelsCache: AIModel[] | null = null
  private static thinkingModesCache: ThinkingMode[] | null = null

  static async getAIModels(forceRefresh = false): Promise<AIModel[]> {
    if (!forceRefresh && this.aiModelsCache) {
      return this.aiModelsCache
    }

    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .order('name')
    
    if (error) throw error
    
    this.aiModelsCache = data || []
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

  // Clear caches (useful for development/testing)
  static clearCaches(): void {
    this.aiModelsCache = null
    this.thinkingModesCache = null
  }

  // ========================================
  // USER SESSIONS (ANALYTICS)
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

  static async processWithAI(model: string, prompt: string, mode?: string, options?: any) {
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

  static async enhancePrompts(prompts: Array<{id: string, content: string, currentMode?: string}>, operation: string, options?: any) {
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
  // STORAGE
  // ========================================

  static async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  }

  static async uploadPromptAsset(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('prompt-assets')
      .upload(fileName, file)

    if (error) throw error

    // Get public URL (though this bucket is private, we can generate signed URLs)
    const { data: { publicUrl } } = supabase.storage
      .from('prompt-assets')
      .getPublicUrl(fileName)

    return publicUrl
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  static async syncWithLocalStorage() {
    // This function helps migrate from local storage to Supabase
    // Get current user
    const user = await this.getCurrentUser()
    if (!user) return

    // Get local prompts
    const localPrompts = storage.getPrompts()
    const userLocalPrompts = localPrompts.filter(p => p.user_id === user.id)

    if (userLocalPrompts.length === 0) return

    // Check if user already has prompts in Supabase
    const existingPrompts = await this.getPrompts(user.id)

    if (existingPrompts.length > 0) {
      // User already has data in Supabase, don't sync
      return
    }

    // Sync local prompts to Supabase
    for (const localPrompt of userLocalPrompts) {
      try {
        const newPrompt = await this.createPrompt({
          user_id: user.id,
          title: localPrompt.title,
          content: localPrompt.content,
          description: localPrompt.description,
          model: localPrompt.model,
          mode: localPrompt.mode,
          color: localPrompt.color,
          is_public: localPrompt.is_public
        })

        // Tags are handled separately via prompt_tags table
        // No tags property on Prompt interface anymore
      } catch (error) {
        console.error('Error syncing prompt:', error)
      }
    }

    console.log(`Synced ${userLocalPrompts.length} prompts from local storage`)
  }

  // ========================================
  // SECURE USER QUERY METHODS
  // ========================================

  /**
   * Get public profile (safe fields only - excludes role field)
   * Used for displaying other users' profiles
   */
  static async getUserPublicProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name') // Exclude role field
      .eq('id', userId)
      .single();
    return { data, error };
  }

  /**
   * Get own profile (includes role field)
   * Used for authenticated user's own profile
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
   * Get all users for public display (safe fields only)
   * Used for user lists, mentions, etc.
   */
  static async getAllUsersPublic() {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, display_name') // Exclude role field
      .order('username');
    return { data, error };
  }
}
