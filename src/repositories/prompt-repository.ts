/**
 * Prompt Repository
 * 
 * Abstracts Supabase API calls for prompts to improve testability and separation of concerns.
 * This layer allows us to mock database operations in tests and swap implementations if needed.
 */

import { supabase } from '@/integrations/supabase/client';
import { PromptUI, Prompt } from '@/types/prompts';
import { transformSupabasePromptToUI, SupabaseRPCRow } from '@/lib/prompt-transformers';
import { TFunction } from 'i18next';
import { trackApiResponseTime } from '@/lib/performance-monitor';
import { logError } from '@/lib/logger';
import { sanitizeSearchInput, sanitizeTagInput } from '@/lib/text-utils';

export interface SearchPromptsFilters {
    userId: string;
    page?: number;
    pageSize?: number;
    filterText?: string;
    filterTag?: string;
    visibility?: 'all' | 'public' | 'private';
}

export interface SearchPublicPromptsFilters {
    tag?: string | null;
    page?: number;
    pageSize?: number;
}

export interface RPCRowWithCount {
    total_count?: number;
}

function isRPCRowWithCount(row: unknown): row is RPCRowWithCount {
    return row !== null && typeof row === 'object' && 'total_count' in row;
}

export interface PromptRepository {
    searchPrompts(filters: SearchPromptsFilters, t: TFunction): Promise<{ prompts: PromptUI[]; total: number }>;
    searchPublicPrompts(filters: SearchPublicPromptsFilters, t: TFunction): Promise<{ prompts: PromptUI[]; total: number }>;
    getPublicTagCounts(): Promise<Array<{ name: string; count: number }>>;
    getRecentPublicPrompts(limit: number, t: TFunction): Promise<Array<{ id: string; title: string; author: string }>>;
    getPromptById(id: string, t: TFunction): Promise<PromptUI | null>;
}

/**
 * Supabase implementation of PromptRepository
 */
export class SupabasePromptRepository implements PromptRepository {
    async searchPrompts(
        filters: SearchPromptsFilters,
        t: TFunction
    ): Promise<{ prompts: PromptUI[]; total: number }> {
        const { userId, page = 1, pageSize = 10, filterText = '', filterTag = '', visibility = 'all' } = filters;

        const startTime = performance.now();
        const sanitizedSearch = sanitizeSearchInput(filterText);
        const sanitizedTag = sanitizeTagInput(filterTag);

        // Use type assertion for RPC name because generated types may be missing these functions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('search_prompts', {
            p_user_id: userId,
            p_search_text: sanitizedSearch || null,
            p_tag_filter: sanitizedTag || null,
            p_visibility: visibility,
            p_page: page,
            p_page_size: pageSize
        }) as { data: SupabaseRPCRow[] | null; error: unknown };

        const duration = performance.now() - startTime;

        trackApiResponseTime('search_prompts', 'RPC', duration, error ? undefined : 200);

        if (error) {
            logError(error, { context: 'searchPrompts', filters });
            throw error;
        }

        if (!data || data.length === 0) {
            return { prompts: [], total: 0 };
        }

        const totalCount = isRPCRowWithCount(data[0]) ? Number((data[0] as { total_count?: number | string }).total_count ?? 0) : 0;

        const formattedPrompts: PromptUI[] = data.map((row) =>
            transformSupabasePromptToUI(row, t)
        );

        return { prompts: formattedPrompts, total: totalCount };
    }

    async searchPublicPrompts(
        filters: SearchPublicPromptsFilters,
        t: TFunction
    ): Promise<{ prompts: PromptUI[]; total: number }> {
        const { tag = null, page = 1, pageSize = 10 } = filters;

        const startTime = performance.now();
        const sanitizedTag = sanitizeTagInput(tag);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('search_public_prompts', {
            p_tag_filter: sanitizedTag || null,
            p_page: page,
            p_page_size: pageSize
        }) as { data: SupabaseRPCRow[] | null; error: unknown };

        const duration = performance.now() - startTime;

        trackApiResponseTime('search_public_prompts', 'RPC', duration, rpcError ? undefined : 200);

        if (rpcError) {
            logError(rpcError, { context: 'searchPublicPrompts', filters });
            throw rpcError;
        }

        if (!rpcData || rpcData.length === 0) {
            return { prompts: [], total: 0 };
        }

        const totalCount = isRPCRowWithCount(rpcData[0]) ? Number((rpcData[0] as { total_count?: number | string }).total_count ?? 0) : 0;

        const formattedPrompts: PromptUI[] = rpcData.map((row) =>
            transformSupabasePromptToUI(row, t)
        );

        return { prompts: formattedPrompts, total: totalCount };
    }

    async getPublicTagCounts(): Promise<Array<{ name: string; count: number }>> {
        const startTime = performance.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.rpc as any)('get_public_tag_counts') as { data: Array<{ name: string; count: number | string }> | null; error: unknown };
        const duration = performance.now() - startTime;

        trackApiResponseTime('get_public_tag_counts', 'RPC', duration, error ? undefined : 200);

        if (error) {
            logError(error, { context: 'getPublicTagCounts' });
            throw error;
        }

        if (!data || !Array.isArray(data)) return [];

        return data.map((row) => ({
            name: String(row.name || ''),
            count: typeof row.count === 'number' ? row.count : Number(row.count || 0),
        }));
    }

    async getRecentPublicPrompts(
        limit: number,
        t: TFunction
    ): Promise<Array<{ id: string; title: string; author: string }>> {
        const { data: promptsData, error: queryError } = await supabase
            .from('prompts')
            .select('id, title, users(username, display_name)')
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (queryError) {
            logError(queryError, { context: 'getRecentPublicPrompts', limit });
            throw queryError;
        }
        if (!promptsData) return [];

        return promptsData.map(p => ({
            id: p.id,
            title: p.title || t('prompt.untitled'),
            author: p.users?.display_name || p.users?.username || t('prompt.unknown_author'),
        }));
    }

    async getPromptById(id: string, t: TFunction): Promise<PromptUI | null> {
        const { data, error } = await supabase
            .from('prompts')
            .select('*, prompt_contents(body), prompt_tags(tags(id, name)), users(username, display_name)')
            .eq('id', id)
            .single();

        if (error) {
            logError(error, { context: 'getPromptById', id });
            throw error;
        }
        if (!data) return null;

        if (!isPromptShape(data)) {
            logError(new Error('Invalid prompt shape from getPromptById'), {
                context: 'getPromptById',
                id,
            });
            return null;
        }

        return transformSupabasePromptToUI(data, t);
    }
}

function isPromptShape(row: unknown): row is Prompt {
    if (!row || typeof row !== 'object') return false;
    const o = row as Record<string, unknown>;
    return (
        typeof o.id === 'string' &&
        typeof o.user_id === 'string' &&
        typeof o.title === 'string' &&
        typeof o.is_public === 'boolean' &&
        typeof o.created_at === 'string' &&
        typeof o.updated_at === 'string'
    );
}

/**
 * Default repository instance
 * Can be swapped for testing or different implementations
 */
export const promptRepository: PromptRepository = new SupabasePromptRepository();
