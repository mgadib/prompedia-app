import { Database } from '@/integrations/supabase/types';
import { Tag, Prompt } from '@/lib/storage';

/**
 * Type-safe definitions for Supabase query responses
 * Eliminates the need for 'as any' type assertions
 */

// Base table types
export type SupabaseTag = Database['public']['Tables']['tags']['Row'];
export type SupabasePrompt = Database['public']['Tables']['prompts']['Row'];
export type SupabasePromptTag = Database['public']['Tables']['prompt_tags']['Row'];
export type SupabaseUser = Database['public']['Tables']['users']['Row'];

// Response types for queries with joins
export interface PromptTagJoinResponse {
  prompt_id: string;
  tag_id: string;
  tags: SupabaseTag | null;
}

export interface PromptWithUserResponse extends SupabasePrompt {
  users: {
    username: string;
    display_name: string | null;
  } | null;
}

export interface TagWithPromptCount {
  tag: SupabaseTag;
  count: number;
}

// RPC function response types
export interface UsageResponse {
  usage_count: number;
  remaining: number;
  last_used_at: string | null;
  session_id: string | null;
}

export interface IncrementUsageResponse {
  success: boolean;
  usage: UsageResponse;
  error?: string;
}

// Type guards
export function isTag(value: unknown): value is SupabaseTag {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as SupabaseTag).id === 'string' &&
    typeof (value as SupabaseTag).name === 'string'
  );
}

export function isPrompt(value: unknown): value is SupabasePrompt {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'content' in value &&
    typeof (value as SupabasePrompt).id === 'string' &&
    typeof (value as SupabasePrompt).title === 'string' &&
    typeof (value as SupabasePrompt).content === 'string'
  );
}

export function isUsageResponse(value: unknown): value is UsageResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'usage_count' in value &&
    'remaining' in value &&
    typeof (value as UsageResponse).usage_count === 'number' &&
    typeof (value as UsageResponse).remaining === 'number'
  );
}

// Conversion helpers
export function convertSupabaseTagToTag(supabaseTag: SupabaseTag): Tag {
  return {
    id: supabaseTag.id,
    name: supabaseTag.name,
    color: supabaseTag.color || undefined,
    description: supabaseTag.description || undefined,
  };
}

export function convertSupabasePromptToPrompt(
  supabasePrompt: SupabasePrompt,
  defaultModelId?: string,
  defaultModeId?: string
): Prompt {
  return {
    id: supabasePrompt.id,
    user_id: supabasePrompt.user_id,
    title: supabasePrompt.title,
    content: supabasePrompt.content,
    model_id: supabasePrompt.model_id || defaultModelId || null,
    mode_id: supabasePrompt.mode_id || defaultModeId || null,
    color: supabasePrompt.color || '#3b82f6',
    is_public: supabasePrompt.is_public,
    is_featured: supabasePrompt.is_featured,
    description: supabasePrompt.description,
    original_prompt_id: supabasePrompt.original_prompt_id,
  };
}

