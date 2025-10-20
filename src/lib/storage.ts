export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Prompt {
  id: string;
  userId: string;
  title: string;
  content: string;
  description?: string;
  model?: string;
  tags: string[];
  color?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  USER: 'prompedia_user',
  PROMPTS: 'prompedia_prompts',
  CURRENT_PROMPT: 'prompedia_current_prompt',
};

export const storage = {
  // User management
  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  
  clearUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  // Prompt management
  getPrompts: (): Prompt[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROMPTS);
    return data ? JSON.parse(data) : [];
  },
  
  savePrompt: (prompt: Prompt) => {
    const prompts = storage.getPrompts();
    const index = prompts.findIndex(p => p.id === prompt.id);
    
    if (index >= 0) {
      prompts[index] = { ...prompt, updatedAt: new Date().toISOString() };
    } else {
      prompts.push(prompt);
    }
    
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
    return prompt;
  },
  
  deletePrompt: (id: string) => {
    const prompts = storage.getPrompts().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
  },
  
  getUserPrompts: (userId: string): Prompt[] => {
    return storage.getPrompts().filter(p => p.userId === userId);
  },
  
  getPublicPrompts: (): Prompt[] => {
    return storage.getPrompts().filter(p => p.isPublic);
  },
  
  // Current prompt
  setCurrentPrompt: (promptId: string) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROMPT, promptId);
  },
  
  getCurrentPromptId: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROMPT);
  },
};
