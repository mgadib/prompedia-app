import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePromptMutations } from '@/hooks/use-prompt-mutations';
import { useFormPersistence } from '@/hooks/use-form-persistence';
import { usePreventDoubleClick } from '@/hooks/use-prevent-double-click';
import { PromptUI } from '@/types/prompts';
import { extractErrorMessage, isErrorCode, ERROR_CODES } from '@/lib/error-handler';
import { logError } from '@/lib/logger';

export function usePromptEditor(user: User | null, searchInputRef: React.RefObject<HTMLInputElement>) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { savePrompt } = usePromptMutations();

    const { clearDraft } = useFormPersistence(
        title,
        content,
        tagsInput,
        isPublic,
        (draft) => {
            if (!editingId) {
                setTitle(draft.title);
                setContent(draft.content);
                setTagsInput(draft.tagsInput);
                setIsPublic(draft.isPublic);
            }
        },
        !editingId && !!user
    );

    const handleSave = usePreventDoubleClick(
        useCallback(async () => {
            if (!user || !content.trim()) return;
            try {
                await savePrompt.mutateAsync({
                    id: editingId,
                    title,
                    content,
                    tagsInput,
                    isPublic,
                    userId: user.id,
                });
                toast.success(t('toast.saved'));
                clearDraft();
                setTitle('');
                setContent('');
                setTagsInput('');
                setIsPublic(false);
                setEditingId(null);
            } catch (err) {
                logError(err instanceof Error ? err : new Error(extractErrorMessage(err)), {
                    context: 'savePrompt',
                    userId: user?.id,
                    editingId,
                });
                if (isErrorCode(err, ERROR_CODES.CONTENT_REQUIRED)) {
                    toast.error(t('prompt.error.content_required'));
                } else if (isErrorCode(err, ERROR_CODES.VALIDATION_FAILED)) {
                    toast.error(t('prompt.error.validation_failed'));
                } else {
                    toast.error(t('toast.save_failed'));
                }
            }
        }, [user, title, content, tagsInput, isPublic, editingId, savePrompt.mutateAsync, t, clearDraft]),
        1000
    );

    const handleEdit = useCallback((prompt: PromptUI) => {
        setTitle(prompt.title);
        setContent(prompt.content);
        setTagsInput(prompt.tags.map(t => t.name).join(', '));
        setIsPublic(Boolean(prompt.is_public));
        setEditingId(prompt.id);
    }, []);

    const handleNewPrompt = useCallback(() => {
        setTitle('');
        setContent('');
        setTagsInput('');
        setIsPublic(false);
        setEditingId(null);
        searchInputRef.current?.focus();
    }, [searchInputRef]);

    const onCancelEdit = useCallback(() => {
        if (!editingId) clearDraft();
        setTitle('');
        setContent('');
        setTagsInput('');
        setIsPublic(false);
        setEditingId(null);
    }, [editingId, clearDraft]);

    return {
        title,
        setTitle,
        content,
        setContent,
        tagsInput,
        setTagsInput,
        isPublic,
        setIsPublic,
        editingId,
        setEditingId,
        handleSave,
        handleEdit,
        handleNewPrompt,
        onCancelEdit,
        savePrompt,
    };
}
