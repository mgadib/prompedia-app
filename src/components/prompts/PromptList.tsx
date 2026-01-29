import React, { memo } from 'react';
import { PromptCard, PromptCardHeader, PromptCardTitle, PromptCardFooter, PromptCardActions } from '@/components/ui/prompt-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { Button } from '@/components/ui/button';
import { PromptCardSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Share2, Copy, Trash2, Loader2, FileText, Search, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/date-utils';
import { PromptUI } from '@/types/prompts';

interface PromptListProps {
    prompts: PromptUI[];
    isLoading?: boolean;
    editingId: string | null;
    onSelectPrompt: (prompt: PromptUI) => void;
    onCopy: (text: string, id?: string) => void;
    onDeleteClick: (id: string) => void;
    onShare: (id: string) => void;
    // Pagination
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
    currentUserId?: string;
    copiedId?: string | null;
    sharedId?: string | null;
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
    copiedId,
    sharedId,
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
            {prompts.map((prompt, index) => (
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
                    className="list-item-enter"
                    style={{ animationDelay: `${index * 20}ms` }}
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
                                    className={`gap-2 transition-all duration-fast ${
                                        sharedId === prompt.id
                                            ? 'opacity-100 bg-accent/20 text-accent'
                                            : 'opacity-40 hover:opacity-100 hover:bg-accent/10 hover:text-accent'
                                    }`}
                                    onClick={() => onShare(prompt.id)}
                                    title={t('actions.share', 'Share')}
                                    aria-label={t('actions.share', 'Share')}
                                >
                                    {sharedId === prompt.id ? (
                                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                    ) : (
                                        <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    )}
                                    <span className="text-xs">{t('actions.share', 'Share')}</span>
                                </Button>
                            )}
                            <Button
                                variant="action"
                                size="sm"
                                className={`gap-2 transition-all duration-fast ${
                                    copiedId === prompt.id
                                        ? 'opacity-100 bg-primary/20 text-primary'
                                        : 'opacity-40 hover:opacity-100 hover:bg-primary/10 hover:text-primary'
                                }`}
                                onClick={() => onCopy(prompt.content, prompt.id)}
                                title={t('actions.copy')}
                                aria-label={t('actions.copy')}
                            >
                                {copiedId === prompt.id ? (
                                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
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
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalItems / itemsPerPage)}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                    itemsPerPageOptions={[10, 25, 50, 100]}
                    showItemsPerPage={true}
                    showPageNumbers={true}
                    className="mt-6"
                />
            )}
        </div>
    );
});
