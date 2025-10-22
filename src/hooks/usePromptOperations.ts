import { useState, useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { setCurrentPrompt } from '@/lib/storage';
import { toast } from 'sonner';

/**
 * Custom hook for managing prompt operations
 * Encapsulates CRUD operations and business logic for prompts
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

  const createPrompt = useCallback(async (promptData: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const newPrompt: Prompt = {
        ...promptData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await storageManager.savePrompt(newPrompt);
      setCurrentPrompt(newPrompt.id);
      
      toast.success('Prompt berhasil dibuat');
      return newPrompt;
    } catch (err) {
      handleError(err, 'Gagal membuat prompt');
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
        ...updates,
        id: promptId,
        updated_at: new Date().toISOString()
      } as Prompt;

      await storageManager.savePrompt(updatedPrompt);
      
      toast.success('Prompt berhasil diperbarui');
      return updatedPrompt;
    } catch (err) {
      handleError(err, 'Gagal memperbarui prompt');
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
      
      toast.success('Prompt berhasil dihapus');
    } catch (err) {
      handleError(err, 'Gagal menghapus prompt');
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false // Copies are private by default
      };

      await storageManager.savePrompt(copiedPrompt);
      
      toast.success('Prompt berhasil disalin');
      return copiedPrompt;
    } catch (err) {
      handleError(err, 'Gagal menyalin prompt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const duplicatePrompt = useCallback(async (promptId: string, newTitle?: string) => {
    try {
      setLoading(true);
      setError(null);

      // This would need to be implemented with actual data fetching
      // For now, this is a placeholder structure
      const duplicatedPrompt: Prompt = {
        id: crypto.randomUUID(),
        title: newTitle || `Duplicated Prompt`,
        content: '',
        model: 'gpt-4',
        mode: 'meta-prompt',
        tags: [],
        is_public: false,
        user_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await storageManager.savePrompt(duplicatedPrompt);
      
      toast.success('Prompt berhasil diduplikasi');
      return duplicatedPrompt;
    } catch (err) {
      handleError(err, 'Gagal menduplikasi prompt');
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