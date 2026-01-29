import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Share2, Trash2 } from 'lucide-react';
import { PromptUI } from '@/types/prompts';
import { Button } from '@/components/ui/button';
import { TagChipStatic } from '@/components/ui/tag-chip';
import { StatusBadge } from '@/components/ui/status-badge';
import { MarkdownPreview } from '@/components/editor/MarkdownPreview';
import { formatDate } from '@/lib/date-utils';

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

    // Focus management
    useEffect(() => {
        // Store the previously focused element
        previousFocusRef.current = document.activeElement as HTMLElement;
        
        // Focus the modal content
        if (modalRef.current) {
            const firstFocusable = modalRef.current.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement;
            firstFocusable?.focus();
        }

        // Handle Escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            // Restore focus to previously focused element
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm modal-backdrop" 
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                className="w-full max-w-[42rem] bg-card border border-border rounded shadow-lg flex flex-col max-h-[85vh] modal-content" 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-border">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 id="modal-title" className="text-base font-semibold text-foreground flex-1">{prompt.title}</h3>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-shrink-0" 
                            onClick={onClose}
                            aria-label={t('actions.close')}
                        >
                            {t('actions.close')}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {prompt.tags && prompt.tags.length > 0 && (
                            <>
                                {prompt.tags.map(tag => (
                                    <TagChipStatic key={tag.id} variant="default" size="sm">
                                        {tag.name}
                                    </TagChipStatic>
                                ))}
                                <span className="text-xs text-muted-foreground/40">•</span>
                            </>
                        )}
                        <StatusBadge variant={prompt.is_public ? 'public' : 'private'} size="sm">
                            {prompt.is_public ? t('prompt.public') : t('prompt.private')}
                        </StatusBadge>
                        <span className="text-xs text-muted-foreground/40">•</span>
                        <span className="text-xs text-muted-foreground">
                            {formatDate(prompt.created_at, i18n.language)}
                        </span>
                        <span className="text-xs text-muted-foreground/40">•</span>
                        <StatusBadge variant="date" size="sm">
                            @{prompt.author}
                        </StatusBadge>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                    <MarkdownPreview content={prompt.content} className="text-sm" />
                </div>

                {/* Actions */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-border flex justify-end gap-2">
                    {isOwner && onEdit && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onEdit(prompt)}
                            className="hover:bg-secondary hover:border-primary/20"
                            aria-label={t('actions.edit')}
                        >
                            {t('actions.edit')}
                        </Button>
                    )}
                    {prompt.is_public && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleShare}
                            className="gap-2 hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                            aria-label={t('actions.share', 'Share')}
                        >
                            <Share2 className="w-4 h-4" aria-hidden="true" />
                            <span>{t('actions.share', 'Share')}</span>
                        </Button>
                    )}
                    <Button 
                        variant="brand" 
                        size="sm" 
                        onClick={() => onCopy(prompt.content)}
                        className="gap-2 hover:bg-action-hover"
                        aria-label={t('actions.copy')}
                    >
                        <Copy className="w-4 h-4" aria-hidden="true" />
                        <span>{t('actions.copy')}</span>
                    </Button>
                    {isOwner && onDelete && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => onDelete(prompt.id)}
                            className="gap-2 hover:bg-destructive/90"
                            aria-label={t('actions.delete')}
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span>{t('actions.delete')}</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
