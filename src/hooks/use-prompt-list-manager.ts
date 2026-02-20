import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { usePublicPrompts, usePublicTagCounts } from '@/hooks/use-public-prompts';
import { usePrompts } from '@/hooks/use-prompts';
import { usePromptMutations } from '@/hooks/use-prompt-mutations';
import { usePreventDoubleClick } from '@/hooks/use-prevent-double-click';
import { User } from '@supabase/supabase-js';
import { PromptUI } from '@/types/prompts';
import { extractErrorMessage } from '@/lib/error-handler';
import { logError } from '@/lib/logger';

export function usePromptListManager(user: User | null) {
    const { t } = useTranslation();

    // Private Prompts State
    const [searchText, setSearchText] = useState('');
    const debouncedSearchText = useDebounce(searchText, 300);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Public Prompts State (for landing page)
    const [selectedPublicTag, setSelectedPublicTag] = useState<string | null>(null);
    const [publicCurrentPage, setPublicCurrentPage] = useState(1);
    const [publicItemsPerPage, setPublicItemsPerPage] = useState(10);

    const {
        prompts: publicPrompts,
        isLoading: publicLoading,
        total: publicTotal,
    } = usePublicPrompts({
        tag: selectedPublicTag,
        page: publicCurrentPage,
        pageSize: publicItemsPerPage,
        enabled: !user,
    });
    const { tagCounts: publicTags } = usePublicTagCounts();

    const {
        data: promptsData,
        isLoading: isPromptsLoading,
    } = usePrompts({
        userId: user?.id,
        page: currentPage,
        pageSize: itemsPerPage,
        filterText: debouncedSearchText,
        filterTag: selectedTag || '',
        visibility: visibilityFilter,
        enabled: !!user,
    });

    const prompts = promptsData?.prompts || [];
    const totalItems = promptsData?.total || 0;

    const [selectedPrompt, setSelectedPrompt] = useState<PromptUI | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [sharedId, setSharedId] = useState<string | null>(null);

    const { deletePrompt } = usePromptMutations();

    const handleCopy = usePreventDoubleClick(
        useCallback(async (text: string, id?: string) => {
            await navigator.clipboard.writeText(text);
            toast.success(t('toast.copied'));
            if (id) {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            }
        }, [t]),
        500
    ) as (text: string, id?: string) => Promise<void>;

    const handleShare = usePreventDoubleClick(
        useCallback(async (id: string) => {
            const url = `${window.location.origin}/share/${id}`;
            await navigator.clipboard.writeText(url);
            toast.success(t('toast.link_copied', 'Link copied to clipboard'));
            setSharedId(id);
            setTimeout(() => setSharedId(null), 2000);
        }, [t]),
        500
    ) as (id: string) => Promise<void>;

    const handleFilterByTag = useCallback((tag: string) => {
        const normalizedTag = tag.toLowerCase();
        const normalizedSelectedTag = selectedTag?.toLowerCase();
        setSelectedTag(normalizedTag === normalizedSelectedTag ? null : tag);
    }, [selectedTag]);

    const performDelete = useCallback(async (id: string | null) => {
        if (!user || !id) return;
        try {
            await deletePrompt.mutateAsync({ id, userId: user.id });
            toast.success(t('toast.deleted'));
            if (selectedPrompt?.id === id) setSelectedPrompt(null);
        } catch (err) {
            logError(err instanceof Error ? err : new Error(extractErrorMessage(err)), {
                context: 'deletePrompt',
                promptId: id,
                userId: user?.id,
            });
            toast.error(t('toast.delete_failed'));
        }
    }, [user, selectedPrompt?.id, deletePrompt.mutateAsync, t]);

    return {
        searchText,
        setSearchText,
        selectedTag,
        setSelectedTag,
        visibilityFilter,
        setVisibilityFilter,
        itemsPerPage,
        setItemsPerPage,
        currentPage,
        setCurrentPage,
        publicPrompts,
        publicLoading,
        publicTags,
        selectedPublicTag,
        setSelectedPublicTag,
        publicCurrentPage,
        setPublicCurrentPage,
        publicItemsPerPage,
        setPublicItemsPerPage,
        publicTotal,
        prompts,
        isPromptsLoading,
        totalItems,
        selectedPrompt,
        setSelectedPrompt,
        confirmDeleteId,
        setConfirmDeleteId,
        copiedId,
        sharedId,
        handleCopy,
        handleShare,
        handleFilterByTag,
        performDelete,
    };
}
