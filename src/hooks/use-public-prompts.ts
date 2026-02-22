import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '@/lib/query-keys';
import { usePromptRepository } from './use-prompt-repository';
import { isValidUUID } from '@/lib/utils';

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
    const repository = usePromptRepository();

    // Normalize tag to lowercase for case-insensitive matching and consistent cache keys
    const normalizedTag = tag ? tag.toLowerCase() : null;

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: queryKeys.publicPrompts.list({ tag: normalizedTag, page, pageSize }),
        queryFn: async () => {
            const result = await repository.searchPublicPrompts({
                tag: normalizedTag,
                page,
                pageSize,
            }, t);

            // Note: Tag counts are now fetched separately via usePublicTagCounts hook
            // for accurate counts across all prompts, not just current page
            return {
                ...result,
                tags: [], // Deprecated - use usePublicTagCounts instead
            };
        },
        enabled,
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // Clean up after 5 minutes of inactivity
        placeholderData: keepPreviousData,
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
 * Hook for fetching accurate tag counts across all public prompts
 * This is separate from the paginated prompts query to ensure accuracy
 */
export function usePublicTagCounts() {
    const repository = usePromptRepository();

    const { data, isLoading, error } = useQuery({
        queryKey: [...queryKeys.publicPrompts.all, 'tag-counts'],
        queryFn: () => repository.getPublicTagCounts(),
        staleTime: 5 * 60 * 1000, // 5 minutes - tag counts don't change frequently
        gcTime: 10 * 60 * 1000, // Clean up after 10 minutes
    });

    return {
        tagCounts: data || [],
        isLoading,
        error,
    };
}

/**
 * Hook for fetching a single public prompt by ID.
 * Uses React Query for caching and avoids race conditions.
 * Validates UUID before fetching.
 */
export function usePublicPromptById(id: string | undefined) {
    const { t } = useTranslation();
    const repository = usePromptRepository();

    const { data, isLoading, error, isError } = useQuery({
        queryKey: queryKeys.publicPrompts.detail(id ?? ''),
        queryFn: async () => {
            if (!id || !isValidUUID(id)) {
                throw new Error(t('public_view.not_found_title'));
            }
            try {
                const prompt = await repository.getPromptById(id, t);
                if (!prompt) throw new Error(t('public_view.not_found_title'));
                if (!prompt.is_public) throw new Error(t('public_view.private_error'));
                return prompt;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg === t('public_view.private_error')) throw err;
                if (msg.includes('PGRST116') || msg.includes('no rows') || msg.includes('JSON object requested')) {
                    throw new Error(t('public_view.not_found_title'));
                }
                throw err;
            }
        },
        enabled: !!id && isValidUUID(id),
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        prompt: data ?? null,
        isLoading,
        error: isError ? (error instanceof Error ? error.message : String(error)) : null,
        isError,
    };
}

/**
 * Hook for fetching recent public prompts (for sidebars, etc.)
 */
export function useRecentPublicPrompts(limit: number = 7) {
    const { t } = useTranslation();
    const repository = usePromptRepository();

    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.publicPrompts.recent(limit),
        queryFn: () => repository.getRecentPublicPrompts(limit, t),
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // Clean up after 5 minutes of inactivity
    });

    return {
        prompts: data || [],
        isLoading,
        error,
    };
}
