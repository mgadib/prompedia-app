import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PromptUI, UsePromptsOptions } from '@/types/prompts';
import { queryKeys } from '@/lib/query-keys';
import { usePromptRepository } from './use-prompt-repository';

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
    const repository = usePromptRepository();

    // Normalize filterTag to lowercase for case-insensitive matching and consistent cache keys
    const normalizedFilterTag = filterTag ? filterTag.toLowerCase() : '';

    return useQuery({
        queryKey: queryKeys.prompts.list(userId, { page, pageSize, filterText, filterTag: normalizedFilterTag, visibility }),
        queryFn: async () => {
            if (!userId) return { prompts: [], total: 0 };

            return repository.searchPrompts({
                userId,
                page,
                pageSize,
                filterText,
                filterTag: normalizedFilterTag,
                visibility,
            }, t);
        },
        enabled: enabled && !!userId,
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // Clean up after 5 minutes of inactivity
    });
};
