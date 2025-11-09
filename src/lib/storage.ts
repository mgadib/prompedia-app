import { STORAGE_KEYS, ERROR_MESSAGES } from './constants';
import { validateData, userProfileSchema } from '@/shared/validation/common';
import { promptSchema } from '@/features/prompts/validation/prompt-schemas';
import { getValidationMessage, getStorageErrorMessage, getErrorMessage } from './i18n-helpers';

export interface User {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  // role field removed - user_roles table tidak digunakan di aplikasi
}

export interface Prompt {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  
  // Dukungan ganda - field lama dan baru untuk backward compatibility
  model?: string | null;        // LAMA - tetap untuk backward compatibility
  mode?: 'meta-prompt' | 'thinking' | 'normal';  // LAMA
  model_id?: string | null;     // BARU - FK ke ai_models
  mode_id?: string | null;      // BARU - FK ke thinking_modes
  
  color: string;
  is_public: boolean;
  is_featured: boolean;
  description?: string | null;
  original_prompt_id?: string | null;
  // Catatan: tag sekarang ditangani melalui tabel prompt_tags (junction table)
  // created_at dan updated_at tidak disimpan dalam schema minimalis
}

// Interface Tag untuk penggunaan lokal
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string | null;
}

/**
 * Class error storage untuk penanganan error yang lebih baik
 */
export class StorageError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Parsing JSON yang aman dengan penanganan error
 */
function safeJsonParse<T>(data: string | null, fallback: T): T {
  if (!data) return fallback;
  
  try {
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to parse JSON from localStorage:', error);
    return fallback;
  }
}

/**
 * Operasi localStorage yang aman dengan penanganan error
 */
function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    throw new StorageError(
      getStorageErrorMessage('saveFailed'),
      'save'
    );
  }
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read from localStorage (${key}):`, error);
    return null;
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
  }
}

/**
 * Operasi storage untuk user
 */
export const userStorage = {
  setUser: (user: User): void => {
    try {
      const validatedUser = validateData(userProfileSchema, user);
      safeLocalStorageSet(STORAGE_KEYS.USER, JSON.stringify(validatedUser));
    } catch (error) {
      throw new StorageError(ERROR_MESSAGES.GENERIC, 'setUser');
    }
  },
  
  getUser: (): User | null => {
    const data = safeLocalStorageGet(STORAGE_KEYS.USER);
    const parsed = safeJsonParse(data, null);
    
    if (!parsed || !parsed.id) return null;
    
    return parsed as User;
  },
  
  clearUser: (): void => {
    safeLocalStorageRemove(STORAGE_KEYS.USER);
  },
};

/**
 * Prompt storage operations
 */
export const promptStorage = {
  getPrompts: (): Prompt[] => {
    const data = safeLocalStorageGet(STORAGE_KEYS.PROMPTS);
    const parsed = safeJsonParse(data, []);
    
    // Memvalidasi setiap prompt dan memfilter yang tidak valid
    return parsed.filter((prompt: unknown) => {
      try {
        validateData(promptSchema, prompt);
        return true;
      } catch (error) {
        console.warn('Invalid prompt data found, skipping:', error);
        return false;
      }
    });
  },
  
  savePrompt: (prompt: Prompt): Prompt => {
    try {
      if (!prompt.id || !prompt.title || !prompt.content || !prompt.model) {
        throw new Error(getValidationMessage('missingFields'));
      }
      
      const prompts = promptStorage.getPrompts();
      const index = prompts.findIndex(p => p.id === prompt.id);
      
      if (index >= 0) {
        prompts[index] = prompt;
      } else {
        prompts.push(prompt);
      }
      
      safeLocalStorageSet(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
      return prompt;
    } catch (error) {
      throw new StorageError(ERROR_MESSAGES.PROMPT.SAVE_FAILED, 'savePrompt');
    }
  },
  
  deletePrompt: (id: string): void => {
    try {
      if (!id) {
        throw new Error(getValidationMessage('missingFields'));
      }
      
      const prompts = promptStorage.getPrompts().filter(p => p.id !== id);
      safeLocalStorageSet(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
      
      // Membersihkan prompt saat ini jika dihapus
      if (promptStorage.getCurrentPromptId() === id) {
        promptStorage.clearCurrentPrompt();
      }
    } catch (error) {
      throw new StorageError(ERROR_MESSAGES.PROMPT.DELETE_FAILED, 'deletePrompt');
    }
  },
  
  getUserPrompts: (userId: string): Prompt[] => {
    if (!userId) return [];
    return promptStorage.getPrompts().filter(p => p.user_id === userId);
  },
  
  getPublicPrompts: (): Prompt[] => {
    return promptStorage.getPrompts().filter(p => p.is_public);
  },
  
  getPromptById: (id: string): Prompt | null => {
    if (!id) return null;
    return promptStorage.getPrompts().find(p => p.id === id) || null;
  },
  
  // Manajemen prompt saat ini
  setCurrentPrompt: (promptId: string): void => {
    if (!promptId) {
      throw new StorageError(getValidationMessage('missingFields'), 'setCurrentPrompt');
    }
    safeLocalStorageSet(STORAGE_KEYS.CURRENT_PROMPT, promptId);
  },
  
  getCurrentPromptId: (): string | null => {
    return safeLocalStorageGet(STORAGE_KEYS.CURRENT_PROMPT);
  },
  
  clearCurrentPrompt: (): void => {
    safeLocalStorageRemove(STORAGE_KEYS.CURRENT_PROMPT);
  },
};

/**
 * Legacy exports for backward compatibility
 * @deprecated Use userStorage and promptStorage instead
 */
export const storage = {
  ...userStorage,
  ...promptStorage,
};

// Named exports untuk tree shaking yang lebih baik
export const { setUser, getUser, clearUser } = userStorage;
export const { 
  getPrompts, 
  savePrompt, 
  deletePrompt, 
  getUserPrompts, 
  getPublicPrompts,
  getPromptById,
  setCurrentPrompt, 
  getCurrentPromptId,
  clearCurrentPrompt
} = promptStorage;
