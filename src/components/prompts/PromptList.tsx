import React, { memo, useMemo } from 'react';
import { PromptCard, PromptCardHeader, PromptCardTitle, PromptCardDescription, PromptCardFooter, PromptCardActions } from '@/components/ui/prompt-card';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { Button } from '@/components/ui/button';
import { PromptCardSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { Share2, Copy, Trash2, FileText, Check, Globe, Lock, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { formatDate } from '@/lib/date-utils';
import { PromptUI } from '@/types/prompts';
import { stripMarkdownToPlainText } from '@/lib/utils';

/** Translation strings passed to PromptItem to avoid passing t() and breaking memo */
interface PromptItemLabels {
    publicLabel: string;
    privateLabel: string;
    shareLabel: string;
    copyLabel: string;
    deleteLabel: string;
}

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

/**
 * Optimized Individual Prompt Item to prevent unnecessary re-renders in the list.
 * Receives translation strings (labels) instead of t() to keep props stable for memo.
 */
const PromptItem = memo(({
    prompt,
    index,
    editingId,
    onSelectPrompt,
    onCopy,
    onDeleteClick,
    onShare,
    currentUserId,
    copiedId,
    sharedId,
    itemsPerPage,
    labels,
    language
}: {
    prompt: PromptUI;
    index: number;
    editingId: string | null;
    onSelectPrompt: (prompt: PromptUI) => void;
    onCopy: (text: string, id?: string) => void;
    onDeleteClick: (id: string) => void;
    onShare: (id: string) => void;
    currentUserId?: string;
    copiedId?: string | null;
    sharedId?: string | null;
    itemsPerPage: number;
    labels: PromptItemLabels;
    language: string;
}) => {
    const handleClick = React.useCallback(() => {
        onSelectPrompt(prompt);
    }, [onSelectPrompt, prompt]);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectPrompt(prompt);
        }
    }, [onSelectPrompt, prompt]);

    const handleShareClick = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onShare(prompt.id);
    }, [onShare, prompt.id]);

    const handleCopyClick = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy(prompt.content, prompt.id);
    }, [onCopy, prompt.content, prompt.id]);

    const handleDeleteClickAction = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteClick(prompt.id);
    }, [onDeleteClick, prompt.id]);

    const stopPropagation = React.useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const style = React.useMemo(() => ({
        animationDelay: `${(index % itemsPerPage) * 60}ms`,
        opacity: 0,
        animationFillMode: 'forwards'
    } as React.CSSProperties), [index, itemsPerPage]);

    return (
        <PromptCard
            variant={editingId === prompt.id ? 'selected' : prompt.is_public ? 'public' : 'private'}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`${prompt.title} - ${prompt.is_public ? labels.publicLabel : labels.privateLabel}`}
            className="animate-fade-in-up"
            style={style}
        >
            <PromptCardHeader>
                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${editingId === prompt.id
                        ? 'bg-primary/15'
                        : prompt.is_public
                            ? 'bg-green-500/10'
                            : 'bg-muted'
                        }`}>
                        {prompt.is_public
                            ? <Globe className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            : <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        }
                    </div>
                    <PromptCardTitle className="truncate">{prompt.title}</PromptCardTitle>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-muted-foreground/50">
                        <Clock className="w-3 h-3" />
                        <span className="text-[13px] font-medium whitespace-nowrap">
                            {formatDate(prompt.created_at, language)}
                        </span>
                    </div>
                </div>
            </PromptCardHeader>

            <PromptCardDescription className="mb-1 line-clamp-2">
                {stripMarkdownToPlainText(prompt.content)}
            </PromptCardDescription>

            <PromptCardFooter>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {prompt.tags.length > 0 ? (
                        prompt.tags.slice(0, 4).map((tag) => (
                            <TagChipStatic key={tag.id} variant="muted" size="default">
                                {tag.name}
                            </TagChipStatic>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground/40 italic">No tags</span>
                    )}
                    {prompt.tags.length > 4 && (
                        <span className="text-[13px] text-muted-foreground/50 font-medium">+{prompt.tags.length - 4}</span>
                    )}
                </div>

                <PromptCardActions onClick={stopPropagation}>
                    {prompt.is_public && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2.5 rounded-lg gap-1.5 text-xs transition-all ${sharedId === prompt.id
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
                                }`}
                            onClick={handleShareClick}
                            title={labels.shareLabel}
                            aria-label={labels.shareLabel}
                        >
                            {sharedId === prompt.id ? (
                                <Check className="w-3 h-3" aria-hidden="true" />
                            ) : (
                                <Share2 className="w-3 h-3" aria-hidden="true" />
                            )}
                            <span>{labels.shareLabel}</span>
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2.5 rounded-lg gap-1.5 text-xs transition-all ${copiedId === prompt.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            }`}
                        onClick={handleCopyClick}
                        title={labels.copyLabel}
                        aria-label={labels.copyLabel}
                    >
                        {copiedId === prompt.id ? (
                            <Check className="w-3 h-3" aria-hidden="true" />
                        ) : (
                            <Copy className="w-3 h-3" aria-hidden="true" />
                        )}
                        <span>{labels.copyLabel}</span>
                    </Button>
                    {currentUserId === prompt.user_id && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 rounded-lg gap-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                            onClick={handleDeleteClickAction}
                            title={labels.deleteLabel}
                            aria-label={labels.deleteLabel}
                        >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                            <span>{labels.deleteLabel}</span>
                        </Button>
                    )}
                </PromptCardActions>
            </PromptCardFooter>
        </PromptCard>
    );
});

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

    const labels = useMemo<PromptItemLabels>(() => ({
        publicLabel: t('prompt.public'),
        privateLabel: t('prompt.private'),
        shareLabel: t('actions.share', 'Share'),
        copyLabel: t('actions.copy'),
        deleteLabel: t('actions.delete'),
    }), [i18n.language]);

    if (isLoading) {
        const skeletonCount = Math.max(5, Math.min(itemsPerPage, 10));
        return (
            <div className="grid gap-5 min-h-[400px]">
                {Array.from({ length: skeletonCount }, (_, i) => (
                    <PromptCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (prompts.length === 0) {
        return (
            <div className="text-center py-24 px-4 bg-muted/20 rounded-3xl border border-dashed border-border/70 animate-fade-in">
                <div className="flex flex-col items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-border flex items-center justify-center shadow-inner">
                        <FileText className="w-9 h-9 text-primary/60" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-black text-foreground italic uppercase tracking-tight">{t('list.no_match')}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium leading-relaxed">
                            {t('list.empty')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {prompts.map((prompt, index) => (
                <PromptItem
                    key={prompt.id}
                    prompt={prompt}
                    index={index}
                    editingId={editingId}
                    onSelectPrompt={onSelectPrompt}
                    onCopy={onCopy}
                    onDeleteClick={onDeleteClick}
                    onShare={onShare}
                    currentUserId={currentUserId}
                    copiedId={copiedId}
                    sharedId={sharedId}
                    itemsPerPage={itemsPerPage}
                    labels={labels}
                    language={i18n.language}
                />
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
