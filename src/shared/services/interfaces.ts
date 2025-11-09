/**
 * Service interfaces for dependency inversion
 * Components depend on abstractions, not concrete implementations
 */

import type { Prompt } from '@/lib/storage';
import type { PromptWithTags } from '@/shared/types/prompts';
import type { User } from '@supabase/supabase-js';

/**
 * Prompt Service Interface
 */
export interface IPromptService {
  getPrompt(id: string): Promise<Prompt | null>;
  getPrompts(userId?: string): Promise<Prompt[]>;
  getPublicPrompts(): Promise<Prompt[]>;
  createPrompt(prompt: Partial<Prompt>): Promise<Prompt>;
  updatePrompt(id: string, prompt: Partial<Prompt>): Promise<Prompt>;
  deletePrompt(id: string): Promise<void>;
  getPromptsWithTags(prompts: Prompt[]): Promise<PromptWithTags[]>;
}

/**
 * Auth Service Interface
 */
export interface IAuthService {
  signUp(email: string, password: string, username?: string): Promise<{ user: User | null; error: Error | null }>;
  signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  getCurrentUser(): Promise<User | null>;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

/**
 * Tag Service Interface
 */
export interface ITagService {
  getTags(): Promise<Array<{ id: string; name: string; color?: string }>>;
  getTagsByPromptId(promptId: string): Promise<Array<{ id: string; name: string; color?: string }>>;
  createTag(name: string, color?: string): Promise<{ id: string; name: string; color?: string }>;
  linkTagToPrompt(promptId: string, tagId: string): Promise<void>;
  unlinkTagFromPrompt(promptId: string, tagId: string): Promise<void>;
}

/**
 * Rate Limiting Service Interface
 */
export interface IRateLimitingService {
  canMakeAICall(user: User | null): Promise<{
    allowed: boolean;
    usage: { limit: number; used: number; remaining: number };
    error?: string;
  }>;
  recordAICall(user: User | null): Promise<void>;
}

