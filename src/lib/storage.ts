import { STORAGE_KEYS, ERROR_MESSAGES } from './constants';
import { validateData, promptSchema, userProfileSchema } from './validation';

export interface User {
  id: string;
  email?: string;
  username?: string;
  display_name?: string;
  role?: 'admin' | 'moderator' | 'user';
}

export interface Prompt {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  model: string;
  mode: 'meta-prompt' | 'thinking' | 'normal';
  color: string;
  is_public: boolean;
  is_featured: boolean;
  description?: string | null;
  original_prompt_id?: string | null;
  // Note: tags are now handled via prompt_tags junction table
  // created_at and updated_at are not stored in the minimal schema
}

// Tag interface for local use
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string | null;
}

/**
 * Storage error class for better error handling
 */
export class StorageError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Safe JSON parsing with error handling
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
 * Safe localStorage operations with error handling
 */
function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    throw new StorageError(
      'Gagal menyimpan data ke penyimpanan lokal',
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
 * User storage operations
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
    
    if (!parsed) return null;
    
    try {
      return validateData(userProfileSchema, parsed);
    } catch (error) {
      console.warn('Invalid user data in storage, clearing:', error);
      userStorage.clearUser();
      return null;
    }
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
    
    // Validate each prompt and filter out invalid ones
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
      const validatedPrompt = validateData(promptSchema, prompt);
      const prompts = promptStorage.getPrompts();
      const index = prompts.findIndex(p => p.id === validatedPrompt.id);
      
      const updatedPrompt = validatedPrompt;
      
      if (index >= 0) {
        prompts[index] = updatedPrompt;
      } else {
        prompts.push(updatedPrompt);
      }
      
      safeLocalStorageSet(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
      return updatedPrompt;
    } catch (error) {
      throw new StorageError(ERROR_MESSAGES.PROMPT.SAVE_FAILED, 'savePrompt');
    }
  },
  
  deletePrompt: (id: string): void => {
    try {
      if (!id) {
        throw new Error('Prompt ID is required');
      }
      
      const prompts = promptStorage.getPrompts().filter(p => p.id !== id);
      safeLocalStorageSet(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
      
      // Clear current prompt if it was deleted
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
  
  // Current prompt management
  setCurrentPrompt: (promptId: string): void => {
    if (!promptId) {
      throw new StorageError('Prompt ID is required', 'setCurrentPrompt');
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

// Named exports for better tree shaking
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
