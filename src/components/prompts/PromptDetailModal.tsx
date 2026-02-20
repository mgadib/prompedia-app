import React, { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Share2, Trash2, Edit3, X, Clock, User, Calendar, Globe } from 'lucide-react';
import { PromptUI } from '@/types/prompts';
import { Button } from '@/components/ui/button';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { StatusBadge } from '@/components/ui/status-badge';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { formatDate } from '@/lib/date-utils';
import { stripMarkdownToPlainText } from '@/lib/utils';

interface PromptDetailModalProps {
    prompt: PromptUI;
    currentUserId?: string | null;
    onClose: () => void;
    onEdit?: (prompt: PromptUI) => void;
    onCopy: (text: string) => void;
    onShare?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
    prompt,
    currentUserId,
    onClose,
    onEdit,
    onCopy,
    onShare,
    onDelete,
}) => {
    const { t, i18n } = useTranslation();
    const isOwner = currentUserId === prompt.user_id;
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const readingTime = useMemo(() => {
        const words = stripMarkdownToPlainText(prompt.content).split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return minutes;
    }, [prompt.content]);

    // Focus management
    useEffect(() => {
        previousFocusRef.current = document.activeElement as HTMLElement;
        if (modalRef.current) {
            const firstFocusable = modalRef.current.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement;
            firstFocusable?.focus();
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
            previousFocusRef.current?.focus();
        };
    }, [onClose]);

    const handleShare = async () => {
        if (onShare) {
            onShare(prompt.id);
        } else {
            const url = `${window.location.origin}/share/${prompt.id}`;
            await navigator.clipboard.writeText(url);
            onCopy(t('toast.link_copied', 'Link copied to clipboard'));
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header with Title & Meta */}
                <div className="relative p-6 sm:p-8 border-b border-border bg-gradient-to-b from-secondary/30 to-card">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                        aria-label={t('actions.close')}
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>

                    <div className="pr-10">
                        <div className="flex items-center gap-2 mb-3">
                            <StatusBadge variant={prompt.is_public ? 'public' : 'private'} size="sm">
                                {prompt.is_public ? t('prompt.public') : t('prompt.private')}
                            </StatusBadge>
                            {prompt.is_public && (
                                <div className="flex items-center gap-1 text-[11px] font-bold text-violet-500 uppercase tracking-wider">
                                    <Globe className="w-3 h-3" />
                                    {t('prompt.community', 'Community')}
                                </div>
                            )}
                        </div>
                        <h3 id="modal-title" className="text-2xl sm:text-3xl font-black text-foreground mb-4 leading-tight">
                            {prompt.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-medium">
                                <User className="w-3.5 h-3.5" />
                                <span className="text-foreground">@{prompt.author}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(prompt.created_at, i18n.language)}
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {readingTime} min read
                            </div>
                        </div>

                        {prompt.tags && prompt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-5">
                                {prompt.tags.map(tag => (
                                    <TagChipStatic key={tag.id} variant="muted" size="sm" className="bg-muted/50 font-medium">
                                        #{tag.name}
                                    </TagChipStatic>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-card">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownPreview content={prompt.content} className="text-sm text-card-foreground leading-relaxed" />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 sm:px-8 sm:py-6 border-t border-border bg-secondary/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {isOwner && onDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete(prompt.id)}
                                className="h-10 px-4 gap-2 opacity-80 hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('actions.delete')}</span>
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto h-10">
                        {isOwner && onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(prompt)}
                                className="flex-1 sm:flex-none h-full px-5 gap-2 font-bold hover:bg-secondary"
                            >
                                <Edit3 className="w-4 h-4" />
                                {t('actions.edit')}
                            </Button>
                        )}
                        {prompt.is_public && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                                className="flex-1 sm:flex-none h-full px-5 gap-2 font-bold transition-all border-violet-500/20 text-violet-600 hover:bg-violet-500 hover:text-white hover:border-violet-500"
                            >
                                <Share2 className="w-4 h-4" />
                                {t('actions.share', 'Share')}
                            </Button>
                        )}
                        <Button
                            variant="brand"
                            size="sm"
                            onClick={() => onCopy(prompt.content)}
                            className="flex-[2] sm:flex-none h-full px-6 gap-2 font-black shadow-lg shadow-primary/20"
                        >
                            <Copy className="w-4 h-4" />
                            {t('actions.copy')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
