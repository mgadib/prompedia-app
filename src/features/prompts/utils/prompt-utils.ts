import { Prompt } from '@/lib/storage';
import { AVAILABLE_MODELS } from './models';
import { THINKING_MODES } from './modes';
import { validateData } from '@/shared/validation/common';
import { promptSchema } from '@/features/prompts/validation/prompt-schemas';

/**
 * Utility functions for prompt manipulation
 * Single source of truth for prompt transformation logic
 */

/**
 * Sanitizes a prompt object to ensure it has all required fields
 * Handles both old and new schema formats for backward compatibility
 * 
 * @param prompt - Prompt object (may be partial or from different sources)
 * @param defaultModelId - Default model ID if not provided (optional)
 * @param defaultModeId - Default mode ID if not provided (optional)
 * @returns Sanitized prompt with all required fields
 */
export function sanitizePrompt(
  prompt: Partial<Prompt> | null | undefined,
  defaultModelId?: string,
  defaultModeId?: string
): Prompt {
  if (!prompt) {
    // Return a default prompt if input is null/undefined
    return {
      id: '',
      user_id: '',
      title: '',
      content: '',
      model_id: defaultModelId || AVAILABLE_MODELS[1]?.id || '',
      mode_id: defaultModeId || THINKING_MODES[5]?.id || '',
      color: '#3b82f6',
      is_public: false,
      is_featured: false,
    };
  }

  // Ensure we have required fields with defaults
  const sanitized: Prompt = {
    id: prompt.id || '',
    user_id: prompt.user_id || '',
    title: prompt.title || '',
    content: prompt.content || '',
    
    // Handle both old and new schema formats
    model_id: prompt.model_id || prompt.model || defaultModelId || AVAILABLE_MODELS[1]?.id || '',
    mode_id: prompt.mode_id || (prompt.mode as string) || defaultModeId || THINKING_MODES[5]?.id || '',
    
    color: prompt.color || '#3b82f6',
    is_public: prompt.is_public ?? false,
    is_featured: prompt.is_featured ?? false,
    description: prompt.description ?? null,
    original_prompt_id: prompt.original_prompt_id ?? null,
  };

  // Validate using Zod schema
  try {
    return validateData(promptSchema, sanitized);
  } catch (error) {
    // If validation fails, return sanitized version anyway (graceful degradation)
    console.warn('Prompt validation failed, using sanitized version:', error);
    return sanitized;
  }
}

/**
 * Creates a new prompt with default values
 * 
 * @param userId - User ID for the prompt
 * @param overrides - Optional fields to override defaults
 * @returns New prompt object
 */
export function createNewPrompt(
  userId: string | null | undefined,
  overrides?: Partial<Prompt>
): Prompt {
  const basePrompt: Prompt = {
    id: crypto.randomUUID(),
    user_id: userId || 'guest',
    title: 'Untitled Prompt',
    content: '',
    model_id: AVAILABLE_MODELS[1]?.id || '',
    mode_id: THINKING_MODES[5]?.id || '',
    color: '#3b82f6',
    is_public: false,
    is_featured: false,
  };

  return sanitizePrompt({ ...basePrompt, ...overrides });
}

/**
 * Creates a copy of a prompt with a new ID
 * 
 * @param prompt - Prompt to copy
 * @param userId - New user ID (optional, defaults to original)
 * @param titlePrefix - Prefix for the copied prompt title (default: "Copy of ")
 * @returns New prompt object with copied data
 */
export function copyPrompt(
  prompt: Prompt,
  userId?: string,
  titlePrefix: string = 'Copy of '
): Prompt {
  return sanitizePrompt({
    ...prompt,
    id: crypto.randomUUID(),
    user_id: userId || prompt.user_id,
    title: `${titlePrefix}${prompt.title}`,
    is_public: false, // Copies are always private
  });
}

/**
 * Type guard to check if a value is a valid Prompt
 * 
 * @param value - Value to check
 * @returns True if value is a valid Prompt
 */
export function isPrompt(value: unknown): value is Prompt {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'content' in value &&
    typeof (value as Prompt).id === 'string' &&
    typeof (value as Prompt).title === 'string' &&
    typeof (value as Prompt).content === 'string'
  );
}

