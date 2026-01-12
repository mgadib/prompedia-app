import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { PromptUI, TagWithCount } from '@/types/prompts';
import { transformSupabaseSelectToUI, calculateTagCounts } from '@/lib/prompt-transformers';

interface UsePublicPromptsOptions {
    tag?: string | null;
    page?: number;
    pageSize?: number;
    enabled?: boolean;
}

/**
 * Hook for fetching public prompts with React Query.
 * Replaces manual fetching in PromptNotes component.
 */
export function usePublicPrompts({
    tag = null,
    page = 1,
    pageSize = 10,
    enabled = true,
}: UsePublicPromptsOptions = {}) {
    const { t } = useTranslation();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['public-prompts', tag, page, pageSize],
        queryFn: async () => {
            const query = supabase
                .from('prompts')
                .select('id, title, created_at, is_public, user_id, prompt_tags(tags(id, name)), users(username, display_name), prompt_contents(body)')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            // Apply tag filter if provided
            if (tag) {
                // Note: This requires a join through prompt_tags, which Supabase handles via the select
                // For now, we'll filter client-side after fetching
                // A more efficient approach would be to use an RPC function similar to search_prompts
            }

            const { data: promptsData, error: queryError } = await query.limit(pageSize * page);

            if (queryError) throw queryError;
            if (!promptsData) return { prompts: [], tags: [], total: 0 };

            // Transform to PromptUI format
            const formattedPrompts: PromptUI[] = promptsData.map((p) => 
                transformSupabaseSelectToUI(p, t)
            );

            // Filter by tag if provided (client-side for now)
            const filteredPrompts = tag
                ? formattedPrompts.filter(p => 
                    p.tags.some(t => t.name.toLowerCase() === tag.toLowerCase())
                )
                : formattedPrompts;

            // Paginate
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedPrompts = filteredPrompts.slice(startIndex, endIndex);

            // Calculate tag counts from all prompts (not just current page)
            const tagCounts = calculateTagCounts(formattedPrompts);

            return {
                prompts: paginatedPrompts,
                tags: tagCounts,
                total: filteredPrompts.length,
            };
        },
        enabled,
        staleTime: 60 * 1000, // 1 minute
    });

    return {
        prompts: data?.prompts || [],
        tags: data?.tags || [],
        total: data?.total || 0,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook for fetching recent public prompts (for sidebars, etc.)
 */
export function useRecentPublicPrompts(limit: number = 7) {
    const { t } = useTranslation();

    const { data, isLoading, error } = useQuery({
        queryKey: ['recent-public-prompts', limit],
        queryFn: async () => {
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
        },
        staleTime: 60 * 1000, // 1 minute
    });

    return {
        prompts: data || [],
        isLoading,
        error,
    };
}
