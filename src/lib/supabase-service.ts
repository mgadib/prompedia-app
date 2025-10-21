import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { storage } from './storage'

// Type aliases for better readability
type Profile = Database['public']['Tables']['profiles']['Row']
type Prompt = Database['public']['Tables']['prompts']['Row']
type Tag = Database['public']['Tables']['tags']['Row']
type AIModel = Database['public']['Tables']['ai_models']['Row']
type ThinkingMode = Database['public']['Tables']['thinking_modes']['Row']
type UserSession = Database['public']['Tables']['user_sessions']['Row']

// Insert types
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type PromptInsert = Database['public']['Tables']['prompts']['Insert']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type UserSessionInsert = Database['public']['Tables']['user_sessions']['Insert']

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
  // PROFILES
  // ========================================

  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateProfile(userId: string, updates: Partial<ProfileInsert>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async createProfile(profile: ProfileInsert) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ========================================
  // PROMPTS
  // ========================================

  static async getPrompts(userId?: string): Promise<Prompt[]> {
    let query = supabase
      .from('prompts')
      .select(`
        *,
        profiles!prompts_user_id_fkey(username, display_name, avatar_url)
      `)
      .order('updated_at', { ascending: false })

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
      .select(`
        *,
        profiles!prompts_user_id_fkey(username, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getFeaturedPrompts(): Promise<Prompt[]> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        profiles!prompts_user_id_fkey(username, display_name, avatar_url)
      `)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getPrompt(id: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        profiles!prompts_user_id_fkey(username, display_name, avatar_url)
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
        profiles!prompts_user_id_fkey(username, display_name, avatar_url)
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
        profiles!prompts_user_id_fkey(username, display_name, avatar_url)
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

    // Create forked prompt
    const forkedPrompt: PromptInsert = {
      user_id: (await this.getCurrentUser())?.id || '',
      title: newTitle || `Fork of ${originalPrompt.title}`,
      content: originalPrompt.content,
      description: originalPrompt.description,
      model: originalPrompt.model,
      mode: originalPrompt.mode,
      tags: originalPrompt.tags,
      color: originalPrompt.color,
      is_public: false, // Forks start as private
      original_prompt_id: originalPromptId,
      usage_stats: {}
    }

    const newPrompt = await this.createPrompt(forkedPrompt)

    // Increment fork count on original
    await supabase
      .from('prompts')
      .update({ fork_count: (originalPrompt.fork_count || 0) + 1 })
      .eq('id', originalPromptId)

    return newPrompt
  }

  static async incrementViewCount(id: string): Promise<void> {
    // Call the increment_view_count function directly
    const { error } = await supabase.rpc('increment_view_count' as any, { prompt_id: id })
    if (error) throw error
  }

  // ========================================
  // TAGS
  // ========================================

  static async getTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false })

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
      .order('usage_count', { ascending: false })
      .limit(10)

    if (error) throw error
    return data || []
  }

  // ========================================
  // AI MODELS
  // ========================================

  static async getAIModels(): Promise<AIModel[]> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getAIModel(id: string): Promise<AIModel | null> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // ========================================
  // THINKING MODES
  // ========================================

  static async getThinkingModes(): Promise<ThinkingMode[]> {
    const { data, error } = await supabase
      .from('thinking_modes')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getThinkingMode(id: string): Promise<ThinkingMode | null> {
    const { data, error } = await supabase
      .from('thinking_modes')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
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
    const userLocalPrompts = localPrompts.filter(p => p.userId === user.id)

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
        await this.createPrompt({
          user_id: user.id,
          title: localPrompt.title,
          content: localPrompt.content,
          description: localPrompt.description,
          model: localPrompt.model,
          mode: localPrompt.mode,
          tags: localPrompt.tags,
          color: localPrompt.color,
          is_public: localPrompt.isPublic,
          created_at: localPrompt.createdAt,
          updated_at: localPrompt.updatedAt
        })
      } catch (error) {
        console.error('Error syncing prompt:', error)
      }
    }

    console.log(`Synced ${userLocalPrompts.length} prompts from local storage`)
  }
}
