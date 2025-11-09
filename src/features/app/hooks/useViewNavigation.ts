import { useCallback } from 'react';
import { Prompt } from '@/lib/storage';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { User } from '@supabase/supabase-js';

interface UseViewNavigationParams {
  activeView: 'my-library' | 'public-library';
  setActiveView: (view: 'my-library' | 'public-library') => void;
  showEditor: boolean;
  setShowEditor: (show: boolean) => void;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  setAppActiveView: (view: 'my-library' | 'public-library' | null) => void;
  setAppIsPlaygroundActive: (active: boolean | null) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  user: User | null;
}

interface UseViewNavigationReturn {
  handleViewChange: (view: 'my-library' | 'public-library') => void;
}

export function useViewNavigation({
  activeView,
  setActiveView,
  showEditor,
  setShowEditor,
  setCurrentPrompt,
  setAppActiveView,
  setAppIsPlaygroundActive,
  setIsTransitioning,
  user,
}: UseViewNavigationParams): UseViewNavigationReturn {
  const { t } = useTranslation();

  const handleViewChange = useCallback((view: 'my-library' | 'public-library') => {
    try {
      if (!user && view === 'my-library') {
        toast.error(t('errors:actions.signInToAccessLibrary'));
        return;
      }

      if (activeView === view && !showEditor) {
        setAppActiveView(view);
        setAppIsPlaygroundActive(false);
        return;
      }

      setIsTransitioning(true);
      setCurrentPrompt(null);
      storage.clearCurrentPrompt();
      setActiveView(view);
      setShowEditor(false);
      setAppActiveView(view);
      setAppIsPlaygroundActive(false);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    } catch (error) {
      console.error('Failed to change view:', error);
      toast.error(t('errors:library.switchViewFailed'));
      setIsTransitioning(false);
    }
  }, [activeView, showEditor, user, setActiveView, setShowEditor, setCurrentPrompt, setAppActiveView, setAppIsPlaygroundActive, setIsTransitioning, t]);

  return {
    handleViewChange,
  };
}

