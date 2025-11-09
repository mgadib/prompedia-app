import { useMemo } from 'react';
import type { PromptWithTags } from '@/shared/types/prompts';

interface UsePromptFilterOptions {
  prompts: PromptWithTags[];
  searchTerm: string;
  selectedTag?: string;
}

/**
 * Shared hook for filtering prompts
 * Consolidates duplicate filtering logic from MyLibrary and PublicLibrary
 */
export function usePromptFilter({ prompts, searchTerm, selectedTag }: UsePromptFilterOptions) {
  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch = searchTerm === '' || 
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesTag = !selectedTag || prompt.tags.some(tag => tag.name === selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [prompts, searchTerm, selectedTag]);

  return { filteredPrompts };
}

