/**
 * Prompt Repository
 * 
 * Abstracts Supabase API calls for prompts to improve testability and separation of concerns.
 * This layer allows us to mock database operations in tests and swap implementations if needed.
 */

import { supabase } from '@/integrations/supabase/client';
import { PromptUI, UsePromptsOptions } from '@/types/prompts';
import { transformSupabasePromptToUI } from '@/lib/prompt-transformers';
import { TFunction } from 'i18next';
import { trackApiResponseTime } from '@/lib/performance-monitor';

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
        const { data, error } = await supabase.rpc('search_prompts', {
            p_user_id: userId,
            p_search_text: filterText || null,
            p_tag_filter: filterTag || null,
            p_visibility: visibility,
            p_page: page,
            p_page_size: pageSize
        });
        const duration = performance.now() - startTime;

        trackApiResponseTime('search_prompts', 'RPC', duration, error ? undefined : 200);

        if (error) throw error;

        if (!data || data.length === 0) {
            return { prompts: [], total: 0 };
        }

        interface RPCRowWithCount {
            total_count?: number;
        }
        const totalCount = (data[0] as RPCRowWithCount)?.total_count || 0;

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
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_public_prompts', {
            p_tag_filter: tag || null,
            p_page: page,
            p_page_size: pageSize
        });
        const duration = performance.now() - startTime;

        trackApiResponseTime('search_public_prompts', 'RPC', duration, rpcError ? undefined : 200);

        if (rpcError) throw rpcError;

        if (!rpcData || rpcData.length === 0) {
            return { prompts: [], total: 0 };
        }

        interface RPCRowWithCount {
            total_count?: number;
        }
        const totalCount = (rpcData[0] as RPCRowWithCount)?.total_count || 0;

        const formattedPrompts: PromptUI[] = rpcData.map((row) => 
            transformSupabasePromptToUI(row, t)
        );

        return { prompts: formattedPrompts, total: totalCount };
    }

    async getPublicTagCounts(): Promise<Array<{ name: string; count: number }>> {
        const { data: promptsData, error: queryError } = await supabase
            .from('prompts')
            .select('id, prompt_tags(tags(id, name))')
            .eq('is_public', true);

        if (queryError) throw queryError;
        if (!promptsData) return [];

        // Use lowercase names as keys for case-insensitive counting
        const tagCounts: Record<string, { name: string; count: number }> = {};
        
        promptsData.forEach((prompt) => {
            const promptTags = prompt.prompt_tags as Array<{ tags: { id: string; name: string } | null }> | null;
            if (promptTags) {
                promptTags.forEach((pt) => {
                    const tag = pt?.tags;
                    if (tag?.name) {
                        const lowerName = tag.name.toLowerCase();
                        if (!tagCounts[lowerName]) {
                            // Store the first encountered case variant as the display name
                            tagCounts[lowerName] = { name: tag.name, count: 0 };
                        }
                        tagCounts[lowerName].count += 1;
                    }
                });
            }
        });

        return Object.values(tagCounts)
            .sort((a, b) => b.count - a.count);
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

        if (queryError) throw queryError;
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

        if (error) throw error;
        if (!data) return null;

        // Import here to avoid circular dependency
        const { transformPromptToUI } = await import('@/lib/prompt-transformers');
        return transformPromptToUI(data as any, t);
    }
}

/**
 * Default repository instance
 * Can be swapped for testing or different implementations
 */
export const promptRepository: PromptRepository = new SupabasePromptRepository();
