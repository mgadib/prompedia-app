import { TFunction } from 'i18next';
import { PromptUI, Tag, Prompt } from '@/types/prompts';

/**
 * Data transformation utilities for converting Supabase responses to UI-friendly formats.
 * Handles JSONB parsing edge cases and provides consistent data transformation.
 */

/**
 * Supabase RPC row type (from search_prompts function)
 */
interface SupabaseRPCRow {
    id: string;
    user_id: string;
    title: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    prompt_contents?: unknown;
    prompt_tags?: unknown;
    users?: unknown;
}

/**
 * Parse JSONB value that might be a string or object
 */
function parseJsonbValue<T>(value: unknown): T | null {
    if (!value) return null;
    
    if (typeof value === 'string') {
        if (value === 'null') return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    }
    
    if (typeof value === 'object' && value !== null) {
        return value as T;
    }
    
    return null;
}

/**
 * Extract prompt content from Supabase response
 */
function extractPromptContent(row: SupabaseRPCRow): string {
    const promptContents = parseJsonbValue<{ body: string }>(row.prompt_contents);
    return promptContents?.body || '';
}

/**
 * Extract tags from Supabase response
 */
function extractTags(row: SupabaseRPCRow): Pick<Tag, 'id' | 'name'>[] {
    let promptTags: Array<{ tags?: Pick<Tag, 'id' | 'name'> | null }> = [];
    
    if (row.prompt_tags) {
        if (Array.isArray(row.prompt_tags)) {
            promptTags = row.prompt_tags as Array<{ tags?: Pick<Tag, 'id' | 'name'> | null }>;
        } else {
            const parsed = parseJsonbValue<Array<{ tags?: Pick<Tag, 'id' | 'name'> | null }>>(row.prompt_tags);
            if (parsed) {
                promptTags = parsed;
            }
        }
    }
    
    return promptTags
        .map((pt) => pt?.tags)
        .filter((t): t is Pick<Tag, 'id' | 'name'> => t !== null && t !== undefined);
}

/**
 * Extract author information from Supabase response
 */
function extractAuthor(
    row: SupabaseRPCRow,
    t: TFunction
): string {
    const users = parseJsonbValue<{ username: string; display_name: string | null }>(row.users);
    return users?.display_name || users?.username || t('prompt.unknown_author');
}

/**
 * Transform Supabase RPC response row to PromptUI format.
 * Used by usePrompts hook for search_prompts RPC function results.
 */
export function transformSupabasePromptToUI(
    row: SupabaseRPCRow,
    t: TFunction
): PromptUI {
    const content = extractPromptContent(row);
    const tags = extractTags(row);
    const author = extractAuthor(row, t);
    
    return {
        id: row.id,
        user_id: row.user_id || '',
        title: row.title || t('prompt.untitled'),
        content: content,
        description: content.length > 150 ? content.substring(0, 150) + '...' : content,
        is_public: Boolean(row.is_public),
        created_at: row.created_at,
        updated_at: row.updated_at || row.created_at,
        tags: tags,
        author: author,
    };
}

/**
 * Supabase select response type
 */
interface SupabaseSelectData {
    id: string;
    user_id: string;
    title: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    prompt_contents?: { body: string } | null;
    prompt_tags?: Array<{ tags: Pick<Tag, 'id' | 'name'> | null }> | null;
    users?: {
        username: string;
        display_name: string | null;
    } | null;
}

/**
 * Transform Supabase select response to PromptUI format.
 * Used for direct table queries (not RPC functions).
 */
export function transformSupabaseSelectToUI(
    data: SupabaseSelectData,
    t: TFunction
): PromptUI {
    const content = data.prompt_contents?.body || '';
    const tags = data.prompt_tags
        ? data.prompt_tags
            .map((pt: any) => pt?.tags)
            .filter((t: any): t is Pick<Tag, 'id' | 'name'> => t !== null && t !== undefined)
        : [];
    const author = data.users?.display_name || data.users?.username || t('prompt.unknown_author');
    
    return {
        id: data.id,
        user_id: data.user_id || '',
        title: data.title || t('prompt.untitled'),
        content: content,
        description: content.length > 150 ? content.substring(0, 150) + '...' : content,
        is_public: Boolean(data.is_public),
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
        tags: tags,
        author: author,
    };
}

/**
 * Transform Supabase Prompt type to PromptUI format.
 * Used when we already have a typed Prompt object.
 */
export function transformPromptToUI(
    prompt: Prompt,
    t: TFunction
): PromptUI {
    const content = prompt.prompt_contents?.body || '';
    const tags = prompt.prompt_tags
        ? prompt.prompt_tags
            .map(pt => pt.tags)
            .filter((t): t is Pick<Tag, 'id' | 'name'> => t !== null)
        : [];
    const author = prompt.users?.display_name || prompt.users?.username || t('prompt.unknown_author');
    
    return {
        id: prompt.id,
        user_id: prompt.user_id,
        title: prompt.title || t('prompt.untitled'),
        content: content,
        description: content.length > 150 ? content.substring(0, 150) + '...' : content,
        is_public: prompt.is_public,
        created_at: prompt.created_at,
        updated_at: prompt.updated_at || prompt.created_at,
        tags: tags,
        author: author,
    };
}

/**
 * Calculate tag counts from an array of prompts
 */
export function calculateTagCounts(
    prompts: PromptUI[]
): Array<{ name: string; count: number }> {
    const tagCounts: Record<string, number> = {};
    
    prompts.forEach(prompt => {
        prompt.tags.forEach(tag => {
            tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
        });
    });
    
    return Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}
