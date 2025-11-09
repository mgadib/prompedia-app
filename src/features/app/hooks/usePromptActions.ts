import { useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { storage } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { sanitizePrompt, copyPrompt, createNewPrompt } from '@/features/prompts/utils/prompt-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { rateLimitingService } from '@/shared/utils/rate-limiting';
import type { User } from '@supabase/supabase-js';
import type { PromptWithTags } from '@/shared/types/prompts';

interface UsePromptActionsParams {
  currentPrompt: Prompt | null;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  setShowEditor: (show: boolean) => void;
  setAllPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
  setAppIsPlaygroundActive: (active: boolean | null) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  loadAllPrompts: () => Promise<void>;
  user: User | null;
  setShowAuthModal: (show: boolean) => void;
}

interface UsePromptActionsReturn {
  handlePromptChange: (prompt: Prompt) => void;
  handleSelectPrompt: (prompt: PromptWithTags) => void;
  handleEditPrompt: (prompt: PromptWithTags) => void;
  handleDeletePrompt: (promptId: string) => Promise<void>;
  handleCopyPrompt: (prompt: PromptWithTags) => Promise<void>;
  handleUsePrompt: (prompt: PromptWithTags) => void;
  handleNewPrompt: () => Promise<void>;
}

export function usePromptActions({
  currentPrompt,
  setCurrentPrompt,
  setShowEditor,
  setAllPrompts,
  setAppIsPlaygroundActive,
  setIsTransitioning,
  loadAllPrompts,
  user,
  setShowAuthModal,
}: UsePromptActionsParams): UsePromptActionsReturn {
  const { t } = useTranslation();

  const handlePromptChange = useCallback((prompt: Prompt) => {
    setCurrentPrompt(prompt);
    storage.setCurrentPrompt(prompt.id);
    
    setAllPrompts(prevPrompts => {
      const existingIndex = prevPrompts.findIndex(p => p.id === prompt.id);
      if (existingIndex >= 0) {
        const updatedPrompts = [...prevPrompts];
        updatedPrompts[existingIndex] = prompt;
        return updatedPrompts;
      } else {
        return [...prevPrompts, prompt];
      }
    });
  }, [setCurrentPrompt, setAllPrompts]);

  const handleSelectPrompt = useCallback((prompt: PromptWithTags) => {
    setIsTransitioning(true);
    const sanitizedPrompt = sanitizePrompt(prompt);
    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
    setAppIsPlaygroundActive(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [setCurrentPrompt, setShowEditor, setAppIsPlaygroundActive, setIsTransitioning]);

  const handleEditPrompt = useCallback((prompt: PromptWithTags) => {
    setIsTransitioning(true);
    const sanitizedPrompt = sanitizePrompt(prompt, undefined, undefined);
    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
    setAppIsPlaygroundActive(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [setCurrentPrompt, setShowEditor, setAppIsPlaygroundActive, setIsTransitioning]);

  const handleDeletePrompt = useCallback(async (promptId: string) => {
    try {
      await storageManager.deletePrompt(promptId);
      if (currentPrompt?.id === promptId) {
        setCurrentPrompt(null);
        setShowEditor(false);
        setAppIsPlaygroundActive(false);
      }
      await loadAllPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      toast.error(t('errors:prompt.deleteFailed'));
      throw error;
    }
  }, [currentPrompt, setCurrentPrompt, setShowEditor, setAppIsPlaygroundActive, loadAllPrompts, t]);

  const handleCopyPrompt = useCallback(async (prompt: PromptWithTags) => {
    const currentUser = await supabase.auth.getUser().then(({ data }) => data.user);

    if (!currentUser) {
      toast.error(t('errors:actions.signInToCopy'));
      return;
    }

    try {
      const rateLimitCheck = await rateLimitingService.canMakeAICall(currentUser);
      if (!rateLimitCheck.allowed) {
        toast.error(t('errors:usage.waitBeforeCopying'));
        return;
      }

      if (rateLimitCheck.usage.remaining <= 3) {
        if (currentUser) {
          toast.warning(t('common:warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining }));
        } else {
          toast.warning(t('common:warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining }));
        }
      }

      const sanitizedPrompt = sanitizePrompt(prompt);
      const copiedPrompt = copyPrompt(sanitizedPrompt, currentUser.id);

      await storageManager.savePrompt(copiedPrompt);
      handlePromptChange(copiedPrompt);
      toast.success(t('success:prompt.copiedSuccessfully'));

      await rateLimitingService.incrementUsage(currentUser);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      toast.error(t('errors:prompt.copyFailed'));
    }
  }, [handlePromptChange, t]);

  const handleUsePrompt = useCallback((prompt: PromptWithTags) => {
    if (!user) {
      toast.warning(t('common:warnings.signInForAI'));
    }

    setIsTransitioning(true);
    const sanitizedPrompt = sanitizePrompt(prompt);
    setCurrentPrompt(sanitizedPrompt);
    storage.setCurrentPrompt(sanitizedPrompt.id);
    setShowEditor(true);
    setAppIsPlaygroundActive(true);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [user, setCurrentPrompt, setShowEditor, setAppIsPlaygroundActive, setIsTransitioning, t]);

  const handleNewPrompt = useCallback(async () => {
    try {
      const rateLimitCheck = await rateLimitingService.canMakeAICall(user);

      if (!rateLimitCheck.allowed) {
        const limitType = user ? t('errors:usage.dailyLimit') : t('errors:usage.guestLimit');
        toast.error(
          t('errors:usage.limitReached', { 
            type: limitType, 
            error: rateLimitCheck.error || '' 
          })
        );
        if (!user) {
          setShowAuthModal(true);
        }
        return;
      }

      if (rateLimitCheck.usage.remaining <= 3) {
        if (user) {
          toast.warning(t('common:warnings.remainingDailyCalls', { count: rateLimitCheck.usage.remaining }));
        } else {
          toast.warning(t('common:warnings.remainingCallsWithSignIn', { count: rateLimitCheck.usage.remaining }));
        }
      }
    } catch (error) {
      console.error('Rate limit check failed:', error);
      toast.error(t('errors:usage.checkFailed'));
      return;
    }

    setIsTransitioning(true);
    const newPrompt = createNewPrompt(user?.id);
    setCurrentPrompt(newPrompt);
    storage.setCurrentPrompt(newPrompt.id);
    setShowEditor(true);
    setAppIsPlaygroundActive(true);
    storage.clearCurrentPrompt();
    storage.setCurrentPrompt(newPrompt.id);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [user, setCurrentPrompt, setShowEditor, setAppIsPlaygroundActive, setIsTransitioning, setShowAuthModal, t]);

  return {
    handlePromptChange,
    handleSelectPrompt,
    handleEditPrompt,
    handleDeletePrompt,
    handleCopyPrompt,
    handleUsePrompt,
    handleNewPrompt,
  };
}

