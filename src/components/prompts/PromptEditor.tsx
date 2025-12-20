import React from 'react';
import { MarkdownEditor } from '@/components/editor';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useTranslation } from 'react-i18next';

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

export const PromptEditor: React.FC<PromptEditorProps> = ({
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
        <div className="mb-6 bg-card border border-border rounded-sm p-4">
            <div className="flex items-center gap-2 mb-3">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={t('prompt.title_placeholder')}
                    className="flex-1 py-1 bg-transparent text-base font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <StatusBadge variant={isPublic ? 'public' : 'private'} size="sm">
                    {isPublic ? t('prompt.public') : t('prompt.private')}
                </StatusBadge>
            </div>

            <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder={t('prompt.content_placeholder')}
                minHeight="200px"
            />

            <div className="mt-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={e => setTagsInput(e.target.value)}
                            placeholder={t('prompt.tags_placeholder')}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                className="rounded border-border text-brand focus:ring-brand h-4 w-4 accent-brand cursor-pointer"
                            />
                            <span className="text-body text-muted-foreground select-none whitespace-nowrap group-hover:text-foreground transition-colors">
                                {t('prompt.public')}
                            </span>
                        </label>
                        <Button
                            variant="brand"
                            size="sm"
                            onClick={onSave}
                            disabled={!content.trim() || saving}
                        >
                            {saving ? t('prompt.saving') : isEditing ? t('prompt.update') : t('prompt.save')}
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
