import { useState, useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { setCurrentPrompt } from '@/lib/storage';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';

/**
 * Custom hook untuk mengelola operasi prompt
 * Mengenkapsulasi operasi CRUD dan business logic untuk prompt
 */
export const usePromptOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    setError(errorMessage);
    toast.error(errorMessage);
    console.error(defaultMessage, error);
  }, []);

  const createPrompt = useCallback(async (promptData: Omit<Prompt, 'id'>) => {
    try {
      setLoading(true);
      setError(null);

      const newPrompt: Prompt = {
        ...promptData,
        id: crypto.randomUUID(),
      };

      await storageManager.savePrompt(newPrompt);
      setCurrentPrompt(newPrompt.id);
      
      toast.success(i18n.t('success:prompt.promptCreated'));
      return newPrompt;
    } catch (err) {
      handleError(err, i18n.t('errors:promptOperations.promptCreateFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updatePrompt = useCallback(async (promptId: string, updates: Partial<Prompt>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedPrompt: Prompt = {
        id: promptId,
        title: updates.title || '',
        content: updates.content || '',
        model: updates.model || '',
        mode: updates.mode || 'normal',
        color: updates.color || '#3b82f6',
        is_public: updates.is_public || false,
        is_featured: updates.is_featured || false,
        user_id: updates.user_id,
        description: updates.description,
        original_prompt_id: updates.original_prompt_id,
      };

      await storageManager.savePrompt(updatedPrompt);
      
      toast.success(i18n.t('success:prompt.promptUpdated'));
      return updatedPrompt;
    } catch (err) {
      handleError(err, i18n.t('errors:promptOperations.promptUpdateFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const removePrompt = useCallback(async (promptId: string) => {
    try {
      setLoading(true);
      setError(null);

      await storageManager.deletePrompt(promptId);
      
      toast.success(i18n.t('success:prompt.promptRemoved'));
    } catch (err) {
      handleError(err, i18n.t('errors:promptOperations.promptRemoveFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const copyPrompt = useCallback(async (originalPrompt: Prompt) => {
    try {
      setLoading(true);
      setError(null);

      const copiedPrompt: Prompt = {
        ...originalPrompt,
        id: crypto.randomUUID(),
        title: `${originalPrompt.title} (Copy)`,
        is_public: false // Salinan bersifat private secara default
      };

      await storageManager.savePrompt(copiedPrompt);
      
      toast.success(i18n.t('success:prompt.promptCopied'));
      return copiedPrompt;
    } catch (err) {
      handleError(err, i18n.t('errors:promptOperations.promptCopyFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const duplicatePrompt = useCallback(async (promptId: string, newTitle?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Ini perlu diimplementasikan dengan pengambilan data yang sebenarnya
      // Untuk saat ini, ini adalah struktur placeholder
      const duplicatedPrompt: Prompt = {
        id: crypto.randomUUID(),
        title: newTitle || `Duplicated Prompt`,
        content: '',
        model: 'gpt-4',
        mode: 'meta-prompt',
        color: '#3b82f6',
        is_public: false,
        is_featured: false,
        user_id: '',
      };

      await storageManager.savePrompt(duplicatedPrompt);
      
      toast.success(i18n.t('success:prompt.promptDuplicated'));
      return duplicatedPrompt;
    } catch (err) {
      handleError(err, i18n.t('errors:promptOperations.promptDuplicateFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    createPrompt,
    updatePrompt,
    removePrompt,
    copyPrompt,
    duplicatePrompt,
    clearError: () => setError(null)
  };
};