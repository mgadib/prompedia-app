import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Prompt, User as LocalUser } from './storage';
import { storageLogger, supabaseLogger } from './logger';
import { promptSchema } from './validation';
import { z } from 'zod';

/**
 * Storage manager terpadu yang menangani Supabase dan localStorage
 * Secara otomatis mendeteksi state autentikasi dan mengarahkan ke storage yang sesuai
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
  // Cache untuk kapasitas storage (diperbarui setiap 5 menit atau saat diperlukan)
  private capacityCache: StorageCapacityInfo | null = null;
  private capacityCacheTimestamp: number = 0;
  private readonly CAPACITY_CACHE_TTL = 5 * 60 * 1000; // 5 menit

  constructor() {
    this.initializeAuth();
  }

  /**
   * Inisialisasi monitoring state autentikasi
   * Mendengarkan perubahan auth state dan memperbarui user yang terautentikasi
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Mendapatkan session awal
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        supabaseLogger.error('Failed to get initial session', error);
      } else {
        this.authUser = session?.user ?? null;
        supabaseLogger.info('Initial auth state', { userId: this.authUser?.id });
      }

      // Mendengarkan perubahan auth state
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
      this.isInitialized = true; // Lanjutkan dengan localStorage fallback
    }
  }

  /**
   * Menunggu inisialisasi selesai
   * Mencegah operasi storage sebelum auth state siap
   */
  private async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Mengecek apakah user terautentikasi
   * @returns true jika user terautentikasi, false jika tidak
   */
  public isAuthenticated(): boolean {
    return !!this.authUser;
  }

  /**
   * Mendapatkan user saat ini
   * @returns User yang terautentikasi atau null jika tidak ada
   */
  public getCurrentUser(): User | null {
    return this.authUser;
  }

  /**
   * Mendapatkan info debug autentikasi
   * Berguna untuk troubleshooting masalah auth
   */
  public getAuthDebugInfo(): {
    isAuthenticated: boolean;
    userId: string | null;
    hasAuthUser: boolean;
  } {
    return {
      isAuthenticated: !!this.authUser,
      userId: this.authUser?.id || null,
      hasAuthUser: !!this.authUser
    };
  }

  /**
   * Memperbarui state autentikasi
   * Berguna ketika perlu memastikan state auth terbaru
   */
  public async refreshAuthState(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        supabaseLogger.error('Failed to refresh auth state', error);
      } else {
        const previousUserId = this.authUser?.id;
        this.authUser = session?.user ?? null;
        supabaseLogger.info('Auth state refreshed', { 
          previousUserId,
          currentUserId: this.authUser?.id 
        });
      }
    } catch (error) {
      supabaseLogger.error('Failed to refresh auth state', error as Error);
    }
  }

  /**
   * Mengantri operasi storage untuk mencegah race conditions
   * Memastikan operasi storage dieksekusi secara berurutan
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
   * Mengecek kapasitas dan ketersediaan localStorage
   * Menggunakan navigator.storage.estimate() untuk performa optimal (async, non-blocking)
   * Fallback ke single test write jika API tidak tersedia (sync, blocking minimal)
   * Hasil di-cache untuk menghindari overhead berulang
   */
  private checkLocalStorageCapacity(): StorageCapacityInfo {
    const now = Date.now();
    
    // Return cached result jika masih valid (O(1) untuk operasi normal)
    if (this.capacityCache && (now - this.capacityCacheTimestamp) < this.CAPACITY_CACHE_TTL) {
      return this.capacityCache;
    }

    // Jika cache expired, gunakan fallback sync method untuk immediate return
    // Update cache async di background jika StorageManager API tersedia
    const result = this.checkCapacityWithTestWrite();
    
    // Update cache async dengan StorageManager API jika tersedia (non-blocking)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      this.updateCapacityCacheAsync().catch(() => {
        // Ignore errors - fallback sudah digunakan
      });
    }
    
    return result;
  }

  /**
   * Update cache dengan StorageManager API secara async (non-blocking)
   */
  private async updateCapacityCacheAsync(): Promise<void> {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      this.capacityCache = {
        used: usage,
        available: Math.max(0, available),
        total: quota,
        percentage
      };
      this.capacityCacheTimestamp = Date.now();
    } catch (error) {
      // Ignore - fallback method sudah digunakan
      storageLogger.debug('StorageManager API update failed, using fallback cache', error as Error);
    }
  }

  /**
   * Fallback: single test write untuk menentukan apakah storage penuh
   * Hanya melakukan satu write test, bukan loop hingga 10MB
   */
  private checkCapacityWithTestWrite(): StorageCapacityInfo {
    const testKey = '__storage_test__';
    let used = 0;
    
    // Menghitung penggunaan saat ini (hanya iterasi, tidak blocking)
    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }
    } catch {
      // Ignore errors saat menghitung
    }

    // Single test write untuk cek apakah masih ada space
    let available = 0;
    let canWrite = false;
    try {
      const testValue = 'x'.repeat(1024); // 1KB test
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      canWrite = true;
      // Jika bisa write, estimasi available space (konservatif)
      // Asumsi default browser quota ~5-10MB, kita estimasi berdasarkan usage
      const estimatedQuota = Math.max(5 * 1024 * 1024, used * 2); // Minimal 5MB atau 2x usage
      available = Math.max(0, estimatedQuota - used);
    } catch {
      // Storage penuh atau error
      canWrite = false;
      available = 0;
    }

    const total = used + available;
    const percentage = total > 0 ? (used / total) * 100 : 100;

    const result: StorageCapacityInfo = {
      used,
      available,
      total,
      percentage
    };

    // Cache hasil
    this.capacityCache = result;
    this.capacityCacheTimestamp = Date.now();
    
    return result;
  }

  /**
   * Operasi localStorage yang aman dengan fallback
   * Mengecek kapasitas hanya jika cache sudah expired (O(1) untuk operasi normal)
   * Menangani error dengan graceful
   */
  private safeLocalStorageSet(key: string, value: string): void {
    try {
      // Cek kapasitas hanya jika cache expired (akan return cached jika masih valid)
      const capacity = this.checkLocalStorageCapacity();
      
      // Validasi cepat: jika percentage > 90, coba write dulu (mungkin cache outdated)
      if (capacity.percentage > 90) {
        // Invalidate cache dan coba write langsung
        this.capacityCache = null;
        this.capacityCacheTimestamp = 0;
      }

      // Langsung write - browser akan throw error jika benar-benar penuh
      localStorage.setItem(key, value);
      
      if (import.meta.env.DEV) {
        const perfStart = performance.now();
        storageLogger.debug('localStorage set successful', { key, size: value.length });
        const perfEnd = performance.now();
        if (perfEnd - perfStart > 10) {
          console.warn(`[PERF] localStorage set took ${(perfEnd - perfStart).toFixed(2)}ms`);
        }
      } else {
        storageLogger.debug('localStorage set successful', { key, size: value.length });
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      storageLogger.error('localStorage set failed', error as Error, { key });
      
      // Invalidate cache saat error untuk force recheck next time
      this.capacityCache = null;
      this.capacityCacheTimestamp = 0;
      
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
        // Refresh auth state before saving
        await this.refreshAuthState();
        
        // Validate prompt data - ensure required fields are present
        if (!prompt.id || !prompt.title || !prompt.content || !prompt.model) {
          throw new StorageError('Missing required prompt fields');
        }
        
        if (this.isAuthenticated()) {
          await this.savePromptToSupabase(prompt as Prompt);
        } else {
          await this.savePromptToLocalStorage(prompt as Prompt);
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
      // Use ONLY FK columns (model_id/mode_id) - no more dual-write
      const promptData = {
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        description: prompt.description || '',
        
        // FK only approach (model and mode TEXT columns have been dropped)
        model_id: prompt.model_id || prompt.model,  // Keep fallback to old field for migration
        mode_id: prompt.mode_id || prompt.mode,      // Keep fallback to old field for migration
        
        is_public: prompt.is_public || false,
        user_id: prompt.user_id || this.authUser.id,
        color: prompt.color || null,
        is_featured: prompt.is_featured || false,
        original_prompt_id: prompt.original_prompt_id || null
      };

      supabaseLogger.info('Attempting to save prompt to Supabase', {
        promptId: prompt.id,
        promptData: promptData,
        authUser: this.authUser?.id
      });

      const { error } = await supabase
        .from('prompts')
        .upsert(promptData, { onConflict: 'id' });

      if (error) {
        supabaseLogger.error('Supabase upsert failed', error, { 
          promptId: prompt.id,
          promptData: promptData,
          authUser: this.authUser?.id
        });
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
        
        // Read ONLY from FK columns (model and mode TEXT columns have been dropped)
        model_id: item.model_id,
        mode_id: item.mode_id,
        
        // Keep model/mode fields populated for app compatibility
        model: item.model_id,
        mode: (item.mode_id || 'normal') as 'meta-prompt' | 'thinking' | 'normal',
        
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
        // Refresh auth state before deleting
        await this.refreshAuthState();
        
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
      supabaseLogger.info('Attempting to delete prompt from Supabase', {
        promptId,
        authUser: this.authUser?.id
      });

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)
        .eq('user_id', this.authUser.id);

      if (error) {
        supabaseLogger.error('Failed to delete prompt from Supabase', error, {
          promptId,
          authUser: this.authUser?.id
        });
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