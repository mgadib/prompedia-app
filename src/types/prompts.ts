import { Tables } from '@/integrations/supabase/types';

/**
 * Shared type definitions for prompts across the application.
 * This is the single source of truth for prompt-related types.
 */

/**
 * Tag type based on Supabase schema
 */
export type Tag = Tables<'tags'>;

/**
 * Extended Prompt type with relations from Supabase
 */
export interface Prompt extends Tables<'prompts'> {
    prompt_contents: { body: string } | null;
    prompt_tags: { tags: Pick<Tag, 'id' | 'name'> | null }[];
    users: {
        username: string;
        display_name: string | null;
    } | null;
}

/**
 * UI-friendly prompt representation used throughout the application.
 * This is the transformed version of Supabase data.
 */
export interface PromptUI {
    id: string;
    title: string;
    content: string;
    description: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    tags: Pick<Tag, 'id' | 'name'>[];
    author: string;
    user_id: string;
}

/**
 * Options for fetching prompts
 */
export interface UsePromptsOptions {
    userId?: string;
    page?: number;
    pageSize?: number;
    filterText?: string;
    filterTag?: string;
    visibility?: 'all' | 'public' | 'private';
    enabled?: boolean;
}

/**
 * Public prompt summary for recent prompts lists
 */
export interface PublicPromptSummary {
    id: string;
    title: string;
    author: string;
}

/**
 * Tag with count for tag clouds
 */
export interface TagWithCount {
    name: string;
    count: number;
}
