import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { PromptUI, UsePromptsOptions } from '@/types/prompts';
import { transformSupabasePromptToUI } from '@/lib/prompt-transformers';
import { queryKeys } from '@/lib/query-keys';

// Re-export for backward compatibility
export type { PromptUI } from '@/types/prompts';

export const usePrompts = ({
    userId,
    page = 1,
    pageSize = 10,
    filterText = '',
    filterTag = '',
    visibility = 'all',
    enabled = true
}: UsePromptsOptions) => {
    const { t } = useTranslation();

    return useQuery({
        queryKey: queryKeys.prompts.list(userId, { page, pageSize, filterText, filterTag, visibility }),
        queryFn: async () => {
            if (!userId) return { prompts: [], total: 0 };

            // Use RPC function for comprehensive search across title, body, and tags
            const { data, error } = await supabase.rpc('search_prompts', {
                p_user_id: userId,
                p_search_text: filterText || null,
                p_tag_filter: filterTag || null,
                p_visibility: visibility,
                p_page: page,
                p_page_size: pageSize
            });

            if (error) throw error;

            // Handle empty results
            if (!data || data.length === 0) {
                return { prompts: [], total: 0 };
            }

            // Extract total count from first row (all rows have same total_count)
            interface RPCRowWithCount {
                total_count?: number;
            }
            const totalCount = (data[0] as RPCRowWithCount)?.total_count || 0;

            // Transform data from RPC function format to PromptUI format
            const formattedPrompts: PromptUI[] = data.map((row) => 
                transformSupabasePromptToUI(row, t)
            );

            return { prompts: formattedPrompts, total: totalCount };
        },
        enabled: enabled && !!userId,
        staleTime: 60 * 1000, // 1 minute
    });
};
