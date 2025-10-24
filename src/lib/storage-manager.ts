import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, User as LocalUser } from './storage';
import { storageLogger, supabaseLogger } from './logger';
import { promptSchema } from './validation';
import { z } from 'zod';

/**
 * Unified storage manager that handles both Supabase and localStorage
 * Automatically detects authentication state and routes to appropriate storage
 */

export class StorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export interface StorageCapacityInfo {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

class StorageManager {
  private authUser: User | null = null;
  private isInitialized = false;
  private storageOperationQueue: Promise<any> = Promise.resolve();

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state monitoring
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        supabaseLogger.error('Failed to get initial session', error);
      } else {
        this.authUser = session?.user ?? null;
        supabaseLogger.info('Initial auth state', { userId: this.authUser?.id });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        const previousUserId = this.authUser?.id;
        this.authUser = session?.user ?? null;
        
        supabaseLogger.info('Auth state changed', {
          event,
          previousUserId,
          currentUserId: this.authUser?.id
        });
      });

      this.isInitialized = true;
    } catch (error) {
      supabaseLogger.error('Failed to initialize auth', error as Error);
      this.isInitialized = true; // Continue with localStorage fallback
    }
  }

  /**
   * Wait for initialization to complete
   */
  private async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.authUser;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.authUser;
  }

  /**
   * Queue storage operations to prevent race conditions
   */
  private queueOperation<T>(operation: () => Promise<T>): Promise<T> {
    this.storageOperationQueue = this.storageOperationQueue
      .then(() => operation())
      .catch((error) => {
        storageLogger.error('Queued operation failed', error);
        throw error;
      });
    
    return this.storageOperationQueue;
  }

  /**
   * Check localStorage capacity and availability
   */
  private checkLocalStorageCapacity(): StorageCapacityInfo {
    try {
      const testKey = '__storage_test__';
      const testValue = 'x';
      let used = 0;
      
      // Calculate current usage
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Test available space
      let available = 0;
      try {
        let testString = testValue;
        while (true) {
          localStorage.setItem(testKey, testString);
          testString += testValue.repeat(1000);
          available += 1000;
          
          // Safety limit to prevent browser freeze
          if (available > 10 * 1024 * 1024) break; // 10MB limit
        }
      } catch {
        // Storage full
      } finally {
        localStorage.removeItem(testKey);
      }

      const total = used + available;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      return { used, available, total, percentage };
    } catch (error) {
      storageLogger.error('Failed to check localStorage capacity', error as Error);
      return { used: 0, available: 0, total: 0, percentage: 100 };
    }
  }

  /**
   * Safe localStorage operations with fallback
   */
  private safeLocalStorageSet(key: string, value: string): void {
    try {
      const capacity = this.checkLocalStorageCapacity();
      
      if (capacity.percentage > 90) {
        throw new StorageError('localStorage is nearly full (>90%)');
      }

      localStorage.setItem(key, value);
      storageLogger.debug('localStorage set successful', { key, size: value.length });
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      storageLogger.error('localStorage set failed', error as Error, { key });
      
      if (error instanceof DOMException && error.code === 22) {
        throw new StorageError('localStorage quota exceeded', error as Error);
      }
      
      throw new StorageError('Failed to save to localStorage', error as Error);
    }
  }

  private safeLocalStorageGet(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      storageLogger.debug('localStorage get successful', { key, hasValue: !!value });
      return value;
    } catch (error) {
      storageLogger.error('localStorage get failed', error as Error, { key });
      return null;
    }
  }

  private safeLocalStorageRemove(key: string): void {
    try {
      localStorage.removeItem(key);
      storageLogger.debug('localStorage remove successful', { key });
    } catch (error) {
      storageLogger.error('localStorage remove failed', error as Error, { key });
    }
  }

  /**
   * Save prompt with automatic storage selection
   */
  public async savePrompt(prompt: Prompt): Promise<void> {
    await this.waitForInitialization();
    
    return this.queueOperation(async () => {
      try {
        // Validate prompt data
        const validatedPrompt = promptSchema.parse(prompt);
        
        if (this.isAuthenticated()) {
          await this.savePromptToSupabase(validatedPrompt);
        } else {
          await this.savePromptToLocalStorage(validatedPrompt);
        }
        
        storageLogger.info('Prompt saved successfully', {
          promptId: prompt.id,
          storage: this.isAuthenticated() ? 'supabase' : 'localStorage'
        });
      } catch (error) {
        storageLogger.error('Failed to save prompt', error as Error, { promptId: prompt.id });
        throw new StorageError('Gagal menyimpan prompt', error as Error);
      }
    });
  }

  /**
   * Save prompt to Supabase
   */
  private async savePromptToSupabase(prompt: Prompt): Promise<void> {
    if (!this.authUser) {
      throw new StorageError('User not authenticated for Supabase storage');
    }

    try {
      const promptData = {
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        description: prompt.description || '',
        model: prompt.model,
        mode: prompt.mode,
        is_public: prompt.is_public || false,
        user_id: this.authUser.id,
        color: prompt.color || null,
        is_featured: prompt.is_featured || false,
        original_prompt_id: prompt.original_prompt_id || null
      };

      const { error } = await supabase
        .from('prompts')
        .upsert(promptData, { onConflict: 'id' });

      if (error) {
        supabaseLogger.error('Supabase upsert failed', error, { promptId: prompt.id });
        throw new StorageError('Failed to save prompt to Supabase', error);
      }

      supabaseLogger.info('Prompt saved to Supabase', { promptId: prompt.id });
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      supabaseLogger.error('Unexpected error saving to Supabase', error as Error);
      throw new StorageError('Unexpected error during Supabase save', error as Error);
    }
  }

  /**
   * Save prompt to localStorage
   */
  private async savePromptToLocalStorage(prompt: Prompt): Promise<void> {
    try {
      const existingPrompts = this.getPromptsFromLocalStorage();
      const updatedPrompts = existingPrompts.filter(p => p.id !== prompt.id);
      updatedPrompts.push(prompt);

      const promptsJson = JSON.stringify(updatedPrompts);
      this.safeLocalStorageSet('prompts', promptsJson);
      
      storageLogger.info('Prompt saved to localStorage', { promptId: prompt.id });
    } catch (error) {
      storageLogger.error('Failed to save prompt to localStorage', error as Error);
      throw new StorageError('Failed to save prompt to localStorage', error as Error);
    }
  }

  /**
   * Get prompts with automatic storage selection
   */
  public async getPrompts(): Promise<Prompt[]> {
    await this.waitForInitialization();
    
    try {
      if (this.isAuthenticated()) {
        return await this.getPromptsFromSupabase();
      } else {
        return this.getPromptsFromLocalStorage();
      }
    } catch (error) {
      storageLogger.error('Failed to get prompts', error as Error);
      
      // Fallback to localStorage if Supabase fails
      if (this.isAuthenticated()) {
        storageLogger.warn('Falling back to localStorage due to Supabase error');
        return this.getPromptsFromLocalStorage();
      }
      
      throw new StorageError('Failed to retrieve prompts', error as Error);
    }
  }

  /**
   * Get prompts from Supabase
   */
  private async getPromptsFromSupabase(): Promise<Prompt[]> {
    if (!this.authUser) {
      throw new StorageError('User not authenticated for Supabase storage');
    }

    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          users!prompts_user_id_fkey1(username, display_name)
        `)
        .eq('user_id', this.authUser.id);

      if (error) {
        supabaseLogger.error('Failed to fetch prompts from Supabase', error);
        throw new StorageError('Failed to fetch prompts from Supabase', error);
      }

      const prompts: Prompt[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        description: item.description,
        model: item.model,
        mode: item.mode,
        is_public: item.is_public,
        user_id: item.user_id,
        color: item.color,
        is_featured: item.is_featured,
        original_prompt_id: item.original_prompt_id
        // Note: tags are now loaded separately via junction table
        // createdAt and updatedAt are not stored in the minimal schema
      }));

      supabaseLogger.info('Prompts fetched from Supabase', { count: prompts.length });
      return prompts;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      supabaseLogger.error('Unexpected error fetching from Supabase', error as Error);
      throw new StorageError('Unexpected error during Supabase fetch', error as Error);
    }
  }

  /**
   * Get prompts from localStorage
   */
  private getPromptsFromLocalStorage(): Prompt[] {
    try {
      const promptsJson = this.safeLocalStorageGet('prompts');
      if (!promptsJson) {
        return [];
      }

      const prompts = JSON.parse(promptsJson);
      if (!Array.isArray(prompts)) {
        storageLogger.warn('Invalid prompts data in localStorage, resetting');
        this.safeLocalStorageRemove('prompts');
        return [];
      }

      storageLogger.info('Prompts fetched from localStorage', { count: prompts.length });
      return prompts;
    } catch (error) {
      storageLogger.error('Failed to parse prompts from localStorage', error as Error);
      this.safeLocalStorageRemove('prompts'); // Clear corrupted data
      return [];
    }
  }

  /**
   * Delete prompt with automatic storage selection
   */
  public async deletePrompt(promptId: string): Promise<void> {
    await this.waitForInitialization();
    
    return this.queueOperation(async () => {
      try {
        if (this.isAuthenticated()) {
          await this.deletePromptFromSupabase(promptId);
        } else {
          await this.deletePromptFromLocalStorage(promptId);
        }
        
        storageLogger.info('Prompt deleted successfully', {
          promptId,
          storage: this.isAuthenticated() ? 'supabase' : 'localStorage'
        });
      } catch (error) {
        storageLogger.error('Failed to delete prompt', error as Error, { promptId });
        throw new StorageError('Failed to delete prompt', error as Error);
      }
    });
  }

  /**
   * Delete prompt from Supabase
   */
  private async deletePromptFromSupabase(promptId: string): Promise<void> {
    if (!this.authUser) {
      throw new StorageError('User not authenticated for Supabase storage');
    }

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)
        .eq('user_id', this.authUser.id);

      if (error) {
        supabaseLogger.error('Failed to delete prompt from Supabase', error);
        throw new StorageError('Failed to delete prompt from Supabase', error);
      }

      supabaseLogger.info('Prompt deleted from Supabase', { promptId });
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      supabaseLogger.error('Unexpected error deleting from Supabase', error as Error);
      throw new StorageError('Unexpected error during Supabase delete', error as Error);
    }
  }

  /**
   * Delete prompt from localStorage
   */
  private async deletePromptFromLocalStorage(promptId: string): Promise<void> {
    try {
      const existingPrompts = this.getPromptsFromLocalStorage();
      const updatedPrompts = existingPrompts.filter(p => p.id !== promptId);
      
      const promptsJson = JSON.stringify(updatedPrompts);
      this.safeLocalStorageSet('prompts', promptsJson);
      
      storageLogger.info('Prompt deleted from localStorage', { promptId });
    } catch (error) {
      storageLogger.error('Failed to delete prompt from localStorage', error as Error);
      throw new StorageError('Failed to delete prompt from localStorage', error as Error);
    }
  }

  /**
   * Get storage status and diagnostics
   */
  public getStorageStatus(): {
    isAuthenticated: boolean;
    userId: string | null;
    localStorageCapacity: StorageCapacityInfo;
    supabaseConnected: boolean;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      userId: this.authUser?.id || null,
      localStorageCapacity: this.checkLocalStorageCapacity(),
      supabaseConnected: !!supabase
    };
  }
}

// Create singleton instance
export const storageManager = new StorageManager();