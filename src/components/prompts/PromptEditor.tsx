import React, { memo, lazy, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { stripMarkdownToPlainText } from '@/lib/utils';

const MarkdownEditor = lazy(() =>
    import('@/components/editor').then((m) => ({ default: m.MarkdownEditor }))
);
// import { StatusBadge } from '@/components/ui/status-badge';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Edit3, Globe, Lock } from 'lucide-react';

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

    const stats = useMemo(() => {
        const plainText = stripMarkdownToPlainText(content);
        const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
        const chars = plainText.length;
        return { words, chars };
    }, [content]);

    return (
        <div className={`mb-6 bg-card border ${isEditing ? 'border-primary/40 shadow-md' : 'border-border shadow-sm'} rounded-xl p-4 sm:p-6 animate-fade-in`}>
            {/* Editor Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${isEditing ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'} flex items-center justify-center`}>
                        {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground">
                            {isEditing ? t('prompt.edit_title', 'Edit Prompt') : t('prompt.new_title', 'New Prompt')}
                        </h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                            {isEditing ? 'Draft Mode' : 'Ready to Create'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/30">
                    <span className="text-foreground">{stats.words}</span> {t('editor.words', 'words')}
                    <span className="mx-1 text-border">|</span>
                    <span className="text-foreground">{stats.chars}</span> {t('editor.chars', 'chars')}
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={t('prompt.title_placeholder')}
                    className="flex-1 py-1.5 bg-transparent text-lg font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                    autoFocus={!isEditing}
                />
            </div>

            <Suspense fallback={
                <div className="min-h-[220px] flex items-center justify-center border border-border rounded-xl bg-muted/20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                </div>
            }>
                <div className="border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <MarkdownEditor
                        value={content}
                        onChange={setContent}
                        placeholder={t('prompt.content_placeholder')}
                        minHeight="220px"
                    />
                </div>
            </Suspense>

            <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={e => setTagsInput(e.target.value)}
                            placeholder={t('prompt.tags_placeholder')}
                            className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div
                            className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-lg border border-border/50 cursor-pointer group hover:bg-muted/60 transition-colors"
                            onClick={() => setIsPublic(!isPublic)}
                        >
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${isPublic ? 'bg-green-500 text-white shadow-sm' : 'bg-background text-muted-foreground shadow-none'}`}>
                                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </div>
                            <span className={`text-xs font-bold px-1 transition-colors ${isPublic ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {isPublic ? t('prompt.public') : t('prompt.private')}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditing && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onCancel}
                                    className="text-xs h-9 px-4"
                                >
                                    {t('prompt.cancel_edit')}
                                </Button>
                            )}
                            <Button
                                variant="brand"
                                size="default"
                                onClick={onSave}
                                disabled={!content.trim() || saving}
                                className="h-9 px-6 font-bold"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        <span>{t('prompt.saving')}</span>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {isEditing ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                        {isEditing ? t('prompt.update') : t('prompt.save')}
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PromptEditor = memo(PromptEditorComponent);
