import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AIModel = Database['public']['Tables']['ai_models']['Row'];

/**
 * Service for managing AI models
 * Replaces deprecated SupabaseService.getAIModels()
 */
class ModelService {
  private static aiModelsCache: AIModel[] | null = null;

  /**
   * Get all available AI models
   * @param forceRefresh - Force refresh cache
   * @returns Array of AI models
   */
  static async getAIModels(forceRefresh = false): Promise<AIModel[]> {
    if (!forceRefresh && this.aiModelsCache) {
      return this.aiModelsCache;
    }

    const allowedModelIds = ['meta-llama/llama-4-maverick:free', 'qwen/qwen3-30b-a3b:free'];
    
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .in('id', allowedModelIds)
      .order('name');
    
    if (error) {
      // Jika kolom is_active belum ada, filter di memory
      const { data: allData, error: allError } = await supabase
        .from('ai_models')
        .select('*')
        .order('name');
      
      if (allError) throw allError;
      
      // Filter untuk hanya mengizinkan 2 model yang ditentukan
      this.aiModelsCache = (allData || []).filter(model => allowedModelIds.includes(model.id));
      return this.aiModelsCache;
    }
    
    // Filter untuk hanya mengizinkan 2 model yang ditentukan (double check)
    this.aiModelsCache = (data || []).filter(model => allowedModelIds.includes(model.id));
    return this.aiModelsCache;
  }

  /**
   * Get a single AI model by ID
   * @param id - Model ID
   * @returns AI model or null
   */
  static async getAIModel(id: string): Promise<AIModel | null> {
    const models = await this.getAIModels();
    return models.find(model => model.id === id) || null;
  }

  /**
   * Clear the models cache
   */
  static clearCache(): void {
    this.aiModelsCache = null;
  }
}

export const modelService = ModelService;

