import { useState, useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { sanitizePrompt, createNewPrompt } from '@/features/prompts/utils/prompt-utils';
import { toast } from '@/shared/utils/toast';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for managing prompt operations
 * Extracts prompt CRUD logic from components
 */
export function usePromptManagement() {
  const { t } = useTranslation();
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  const loadAllPrompts = useCallback(async () => {
    try {
      setIsLoadingPrompts(true);
      const prompts = await storageManager.getPrompts();
      setAllPrompts(prompts || []);
    } catch (error) {
      console.error('Failed to load prompts:', error);
      setAllPrompts([]);
    } finally {
      setIsLoadingPrompts(false);
    }
  }, []);

  const handlePromptChange = useCallback((prompt: Prompt) => {
    setCurrentPrompt(prompt);
    
    // Update array allPrompts to reflect changes
    setAllPrompts(prevPrompts => {
      const existingIndex = prevPrompts.findIndex(p => p.id === prompt.id);
      if (existingIndex >= 0) {
        // Update existing prompt
        const updatedPrompts = [...prevPrompts];
        updatedPrompts[existingIndex] = prompt;
        return updatedPrompts;
      } else {
        // Add new prompt
        return [...prevPrompts, prompt];
      }
    });
  }, []);

  const handleDeletePrompt = useCallback(async (promptId: string) => {
    try {
      await storageManager.deletePrompt(promptId);
      if (currentPrompt?.id === promptId) {
        setCurrentPrompt(null);
      }
      // Reload prompts after successful deletion
      await loadAllPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error('prompt.deleteFailed');
      throw error;
    }
  }, [currentPrompt?.id, loadAllPrompts, t]);

  const handleNewPrompt = useCallback((userId?: string | null) => {
    const newPrompt = createNewPrompt(userId);
    setCurrentPrompt(newPrompt);
    return newPrompt;
  }, []);

  const handleSelectPrompt = useCallback((prompt: Prompt) => {
    const sanitized = sanitizePrompt(prompt);
    setCurrentPrompt(sanitized);
    return sanitized;
  }, []);

  return {
    currentPrompt,
    setCurrentPrompt,
    allPrompts,
    setAllPrompts,
    isLoadingPrompts,
    loadAllPrompts,
    handlePromptChange,
    handleDeletePrompt,
    handleNewPrompt,
    handleSelectPrompt,
  };
}

