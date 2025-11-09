import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { storageManager } from '@/lib/storage-manager';
import { promptService } from '@/features/prompts/services/prompt-service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/shared/utils/toast';
import { useTranslation } from 'react-i18next';

interface UsePromptLoadingReturn {
  allPrompts: Prompt[];
  setAllPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
  publicPrompts: Prompt[];
  setPublicPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
  isLoadingPrompts: boolean;
  loadAllPrompts: () => Promise<void>;
  loadPublicPrompts: () => Promise<void>;
}

export function usePromptLoading(_user: { id: string } | null | undefined): UsePromptLoadingReturn {
  const { t } = useTranslation();
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([]);
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

  const loadPublicPrompts = useCallback(async () => {
    try {
      console.log('Loading public prompts...');
      const publicPromptsData = await promptService.getPublicPrompts();
      console.log('Public prompts loaded:', publicPromptsData.length);
      setPublicPrompts(publicPromptsData);
    } catch (error) {
      console.error('Failed to load public prompts:', error);
      toast.error('library.loadFailed');
      setPublicPrompts([]);
    }
  }, [t]);

  // Reload prompts when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          try {
            setIsLoadingPrompts(true);
            const prompts = await storageManager.getPrompts();
            setAllPrompts(prompts || []);
            const publicPromptsData = await promptService.getPublicPrompts();
            setPublicPrompts(publicPromptsData);
          } catch (error) {
            console.error('Failed to reload prompts after auth change:', error);
          } finally {
            setIsLoadingPrompts(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    allPrompts,
    setAllPrompts,
    publicPrompts,
    setPublicPrompts,
    isLoadingPrompts,
    loadAllPrompts,
    loadPublicPrompts,
  };
}

