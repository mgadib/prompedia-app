import { useState, useCallback, useMemo } from 'react';
import { Prompt, Tag } from '@/lib/storage';
import type { User } from '@supabase/supabase-js';

interface PromptWithTags extends Prompt {
  tags: Tag[];
}

/**
 * Custom hook for managing library view state
 * Handles view switching and prompt filtering
 */
export function useLibraryView(user: User | null) {
  const [activeView, setActiveView] = useState<'my-library' | 'public-library'>('public-library');
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  const myPrompts = useMemo(() => {
    // This will be set by parent component via allPrompts
    return [];
  }, []);

  const myPromptsWithTags: PromptWithTags[] = useMemo(() =>
    myPrompts.map(prompt => ({
      ...prompt,
      tags: [] // Tags will be loaded separately in MyLibrary component
    })),
    [myPrompts]
  );

  const publicPromptsWithTags: PromptWithTags[] = useMemo(() =>
    publicPrompts.map(prompt => ({
      ...prompt,
      tags: [] // Tags will be loaded separately in PublicLibrary component
    })),
    [publicPrompts]
  );

  const handleViewChange = useCallback((view: 'my-library' | 'public-library') => {
    // User guest cannot access private library
    if (!user && view === 'my-library') {
      return false;
    }
    setActiveView(view);
    return true;
  }, [user]);

  return {
    activeView,
    setActiveView,
    publicPrompts,
    setPublicPrompts,
    isLoadingPrompts,
    setIsLoadingPrompts,
    myPromptsWithTags,
    publicPromptsWithTags,
    handleViewChange,
  };
}

