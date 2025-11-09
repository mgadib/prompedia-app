import { useState, useEffect } from 'react';
import { TagService } from '@/features/tags/services/tag-service';

interface UsePromptTagsReturn {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  loadPromptTags: (promptId: string) => Promise<void>;
}

export function usePromptTags(currentPromptId?: string): UsePromptTagsReturn {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Memuat tag untuk sebuah prompt
  const loadPromptTags = async (promptId: string) => {
    try {
      const tags = await TagService.getPromptTags(promptId);
      setSelectedTags(tags.map(tag => tag.name));
    } catch (error) {
      console.error('Failed to load prompt tags:', error);
      setSelectedTags([]);
    }
  };

  // Auto-load tags when prompt changes
  useEffect(() => {
    if (currentPromptId) {
      loadPromptTags(currentPromptId);
    } else {
      setSelectedTags([]);
    }
  }, [currentPromptId]);

  return {
    selectedTags,
    setSelectedTags,
    loadPromptTags,
  };
}

