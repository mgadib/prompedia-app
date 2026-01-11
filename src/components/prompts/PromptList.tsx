import React, { memo } from 'react';
import { PromptCard, PromptCardHeader, PromptCardTitle, PromptCardFooter, PromptCardActions } from '@/components/ui/prompt-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { Button } from '@/components/ui/button';
import { PromptCardSkeleton } from '@/components/ui/skeleton';
import { Share2, Copy, Trash2, Loader2, FileText, Search } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/date-utils';

// Reuse interface or import from types if we move it
interface PromptUI {
    id: string;
    title: string;
    content: string;
    description: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    tags: { id: string; name: string }[];
    author: string;
    user_id: string;
}

interface PromptListProps {
    prompts: PromptUI[];
    isLoading?: boolean;
    editingId: string | null;
    onSelectPrompt: (prompt: PromptUI) => void;
    onCopy: (text: string) => void;
    onDeleteClick: (id: string) => void;
    onShare: (id: string) => void;
    // Pagination
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    currentUserId?: string;
}

export const PromptList: React.FC<PromptListProps> = memo(({
    prompts,
    isLoading,
    editingId,
    onSelectPrompt,
    onCopy,
    onDeleteClick,
    onShare,
    currentPage,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    currentUserId,
}) => {
    const { t, i18n } = useTranslation();

    if (isLoading) {
        return (
            <div className="grid gap-5">
                {[1, 2, 3].map((i) => (
                    <PromptCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (prompts.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-base font-semibold text-foreground">{t('list.no_match')}</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            {t('list.empty', 'No prompts saved yet. Create your first prompt to get started!')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-5">
            {prompts.map(prompt => (
                <PromptCard
                    key={prompt.id}
                    variant={editingId === prompt.id ? 'selected' : prompt.is_public ? 'public' : 'private'}
                    onClick={() => onSelectPrompt(prompt)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectPrompt(prompt);
                        }
                    }}
                    aria-label={`${prompt.title} - ${prompt.is_public ? t('prompt.public') : t('prompt.private')}`}
                >
                    <PromptCardHeader>
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                            <PromptCardTitle className="truncate">{prompt.title}</PromptCardTitle>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge variant={prompt.is_public ? 'public' : 'private'} size="sm" className="opacity-70">
                                {prompt.is_public ? t('prompt.public') : t('prompt.private')}
                            </StatusBadge>
                            <span className="text-xs text-muted-foreground/50 font-normal whitespace-nowrap">
                                {formatDate(prompt.created_at, i18n.language)}
                            </span>
                        </div>
                    </PromptCardHeader>

                    <PromptCardFooter>
                        <div className="flex items-center gap-2 flex-wrap opacity-60">
                            {prompt.tags.map((tag, i) => (
                                <TagChipStatic key={i} variant="muted" size="default">
                                    {tag.name}
                                </TagChipStatic>
                            ))}
                        </div>

                        <PromptCardActions onClick={e => e.stopPropagation()}>
                            {prompt.is_public && (
                                <Button
                                    variant="action"
                                    size="sm"
                                    className="opacity-40 hover:opacity-100 hover:bg-accent/10 hover:text-accent gap-2"
                                    onClick={() => onShare(prompt.id)}
                                    title={t('actions.share', 'Share')}
                                    aria-label={t('actions.share', 'Share')}
                                >
                                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span className="text-xs">{t('actions.share', 'Share')}</span>
                                </Button>
                            )}
                            <Button
                                variant="action"
                                size="sm"
                                className="opacity-40 hover:opacity-100 hover:bg-primary/10 hover:text-primary gap-2"
                                onClick={() => onCopy(prompt.content)}
                                title={t('actions.copy')}
                                aria-label={t('actions.copy')}
                            >
                                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                <span className="text-xs">{t('actions.copy')}</span>
                            </Button>
                            {currentUserId === prompt.user_id && (
                                <Button
                                    variant="action"
                                    size="sm"
                                    className="opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive gap-2"
                                    onClick={() => onDeleteClick(prompt.id)}
                                    title={t('actions.delete')}
                                    aria-label={t('actions.delete')}
                                >
                                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span className="text-xs">{t('actions.delete')}</span>
                                </Button>
                            )}
                        </PromptCardActions>
                    </PromptCardFooter>
                </PromptCard>
            ))}

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                        {t('list.showing', { start: Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1), end: Math.min(totalItems, currentPage * itemsPerPage), total: totalItems })}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{t('list.show')}</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); }}
                                className="text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-foreground font-medium cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm px-2 py-1"
                                aria-label={t('list.previous')}
                            >
                                {t('list.previous')}
                            </button>
                            <button
                                onClick={() => onPageChange(Math.min(Math.ceil(totalItems / itemsPerPage), currentPage + 1))}
                                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-fast ease-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm px-2 py-1"
                                aria-label={t('list.next')}
                            >
                                {t('list.next')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
