import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { PromptUI, TagWithCount } from '@/types/prompts';
import { transformSupabasePromptToUI, calculateTagCounts } from '@/lib/prompt-transformers';
import { queryKeys } from '@/lib/query-keys';

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
        queryKey: queryKeys.publicPrompts.list({ tag, page, pageSize }),
        queryFn: async () => {
            // Use RPC function for server-side filtering and pagination
            const { data: rpcData, error: rpcError } = await supabase.rpc('search_public_prompts', {
                p_tag_filter: tag || null,
                p_page: page,
                p_page_size: pageSize
            });

            if (rpcError) throw rpcError;

            // Handle empty results
            if (!rpcData || rpcData.length === 0) {
                return { prompts: [], tags: [], total: 0 };
            }

            // Extract total count from first row (all rows have same total_count)
            interface RPCRowWithCount {
                total_count?: number;
            }
            const totalCount = (rpcData[0] as RPCRowWithCount)?.total_count || 0;

            // Transform data from RPC function format to PromptUI format
            const formattedPrompts: PromptUI[] = rpcData.map((row) => 
                transformSupabasePromptToUI(row, t)
            );

            // Calculate tag counts from current page prompts
            // Note: For accurate tag counts across all prompts, we'd need a separate query
            // For now, we calculate from the current page which is acceptable for most use cases
            const tagCounts = calculateTagCounts(formattedPrompts);

            return {
                prompts: formattedPrompts,
                tags: tagCounts,
                total: totalCount,
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
        queryKey: queryKeys.publicPrompts.recent(limit),
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
