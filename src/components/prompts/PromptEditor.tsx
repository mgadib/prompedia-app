import React, { memo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';

const MarkdownEditor = lazy(() =>
  import('@/components/editor').then((m) => ({ default: m.MarkdownEditor }))
);
import { StatusBadge } from '@/components/ui/status-badge';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface PromptEditorProps {
    title: string;
    setTitle: (title: string) => void;
    content: string;
    setContent: (content: string) => void;
    tagsInput: string;
    setTagsInput: (tags: string) => void;
    isPublic: boolean;
    setIsPublic: (isPublic: boolean) => void;
    onSave: () => void;
    onCancel: () => void;
    isEditing: boolean;
    saving: boolean;
}

const PromptEditorComponent: React.FC<PromptEditorProps> = ({
    title,
    setTitle,
    content,
    setContent,
    tagsInput,
    setTagsInput,
    isPublic,
    setIsPublic,
    onSave,
    onCancel,
    isEditing,
    saving,
}) => {
    const { t } = useTranslation();

    return (
        <div className="mb-4 sm:mb-6 bg-card border border-border rounded shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={t('prompt.title_placeholder')}
                    className="flex-1 py-1.5 bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <StatusBadge variant={isPublic ? 'public' : 'private'} size="sm">
                    {isPublic ? t('prompt.public') : t('prompt.private')}
                </StatusBadge>
            </div>

            <Suspense fallback={
                <div className="min-h-[200px] flex items-center justify-center border border-border rounded bg-muted/30">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            }>
                <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder={t('prompt.content_placeholder')}
                    minHeight="200px"
                />
            </Suspense>

            <div className="mt-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={e => setTagsInput(e.target.value)}
                            placeholder={t('prompt.tags_placeholder')}
                            className="w-full px-3 py-2 bg-transparent border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all duration-fast"
                        />
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                className="rounded border-border text-green-600 focus:ring-2 focus:ring-green-600 focus:ring-offset-1 h-4 w-4 accent-green-600 cursor-pointer transition-all duration-fast"
                            />
                            {isPublic ? (
                                <StatusBadge variant="public" size="sm" className="cursor-pointer">{t('prompt.public')}</StatusBadge>
                            ) : (
                                <span className="text-body text-muted-foreground select-none whitespace-nowrap group-hover:text-foreground transition-colors duration-fast">
                                    {t('prompt.public')}
                                </span>
                            )}
                        </label>
                        <Button
                            variant="brand"
                            size="sm"
                            onClick={onSave}
                            disabled={!content.trim() || saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t('prompt.saving')}</span>
                                </>
                            ) : isEditing ? (
                                t('prompt.update')
                            ) : (
                                t('prompt.save')
                            )}
                        </Button>
                    </div>
                </div>
                {isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                    >
                        {t('prompt.cancel_edit')}
                    </Button>
                )}
            </div>
        </div>
    );
};

export const PromptEditor = memo(PromptEditorComponent);
