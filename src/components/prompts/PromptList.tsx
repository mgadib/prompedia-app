import React, { memo } from 'react';
import { PromptCard, PromptCardHeader, PromptCardTitle, PromptCardFooter, PromptCardActions } from '@/components/ui/prompt-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Trash2 } from "lucide-react";
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
        return <div className="text-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;
    }

    if (prompts.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground text-body">
                {t('list.no_match')}
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {prompts.map(prompt => (
                <PromptCard
                    key={prompt.id}
                    variant={editingId === prompt.id ? 'selected' : prompt.is_public ? 'public' : 'private'}
                    onClick={() => onSelectPrompt(prompt)}
                >
                    <PromptCardHeader>
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                            <PromptCardTitle className="truncate">{prompt.title}</PromptCardTitle>
                            <span className="text-2xs text-muted-foreground/50 font-normal whitespace-nowrap pt-0.5">
                                {formatDate(prompt.created_at, i18n.language)}
                            </span>
                        </div>
                        <StatusBadge variant={prompt.is_public ? 'public' : 'private'} size="sm" className="flex-shrink-0 opacity-70">
                            {prompt.is_public ? t('prompt.public') : t('prompt.private')}
                        </StatusBadge>
                    </PromptCardHeader>

                    <PromptCardFooter>
                        <div className="flex items-center gap-2 flex-wrap opacity-60">
                            {prompt.tags.map((tag, i) => (
                                <TagChipStatic key={i} variant="muted" size="sm">
                                    {tag.name}
                                </TagChipStatic>
                            ))}
                        </div>

                        <PromptCardActions onClick={e => e.stopPropagation()}>
                            {prompt.is_public && (
                                <Button
                                    variant="action"
                                    size="inline"
                                    className="opacity-40 hover:opacity-100"
                                    onClick={() => onShare(prompt.id)}
                                    title={t('actions.share', 'Share')}
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="action"
                                size="inline"
                                className="opacity-40 hover:opacity-100"
                                onClick={() => onCopy(prompt.content)}
                                title={t('actions.copy')}
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </Button>
                            {currentUserId === prompt.user_id && (
                                <Button
                                    variant="action"
                                    size="inline"
                                    className="opacity-40 hover:opacity-100 hover:text-destructive"
                                    onClick={() => onDeleteClick(prompt.id)}
                                    title={t('actions.delete')}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                                className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                {t('list.previous')}
                            </button>
                            <button
                                onClick={() => onPageChange(Math.min(Math.ceil(totalItems / itemsPerPage), currentPage + 1))}
                                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                                className="text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
