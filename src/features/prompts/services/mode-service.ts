import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ThinkingMode = Database['public']['Tables']['thinking_modes']['Row'];

/**
 * Service for managing thinking modes
 * Replaces deprecated SupabaseService.getThinkingModes()
 */
class ModeService {
  private static thinkingModesCache: ThinkingMode[] | null = null;

  /**
   * Get all available thinking modes
   * @param forceRefresh - Force refresh cache
   * @returns Array of thinking modes
   */
  static async getThinkingModes(forceRefresh = false): Promise<ThinkingMode[]> {
    if (!forceRefresh && this.thinkingModesCache) {
      return this.thinkingModesCache;
    }

    const { data, error } = await supabase
      .from('thinking_modes')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    this.thinkingModesCache = data || [];
    return this.thinkingModesCache;
  }

  /**
   * Get a single thinking mode by ID
   * @param id - Mode ID
   * @returns Thinking mode or null
   */
  static async getThinkingMode(id: string): Promise<ThinkingMode | null> {
    const modes = await this.getThinkingModes();
    return modes.find(mode => mode.id === id) || null;
  }

  /**
   * Clear the modes cache
   */
  static clearCache(): void {
    this.thinkingModesCache = null;
  }
}

export const modeService = ModeService;

