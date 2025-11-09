import { useState, useEffect, useCallback, useMemo } from 'react';
import { TagService } from '@/features/tags/services/tag-service';
import { trackEvent } from '@/lib/analytics';
import type { Prompt } from '@/lib/storage';
import type { PromptWithTags } from '@/shared/types/prompts';

interface UsePromptTagsOptions {
  /**
   * Enable optimistic rendering - show prompts immediately, load tags in background
   * @default true
   */
  optimistic?: boolean;
  /**
   * Enable fallback to individual loading if batch loading fails
   * @default true
   */
  enableFallback?: boolean;
}

interface UsePromptTagsReturn {
  /**
   * Prompts with tags loaded
   */
  promptsWithTags: PromptWithTags[];
  /**
   * All unique tag names across all prompts
   */
  allTags: string[];
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error state
   */
  error: Error | null;
  /**
   * Manually reload tags
   */
  reload: () => Promise<void>;
}

/**
 * Custom hook for loading tags for multiple prompts efficiently
 * Uses batch loading to avoid N+1 query problem
 * 
 * @param prompts - Array of prompts to load tags for
 * @param options - Configuration options
 * @returns Object with promptsWithTags, allTags, loading state, and reload function
 * 
 * @example
 * const { promptsWithTags, allTags, isLoading } = usePromptTags(prompts);
 */
export function usePromptTags(
  prompts: Prompt[],
  options: UsePromptTagsOptions = {}
): UsePromptTagsReturn {
  const { optimistic = true, enableFallback = true } = options;

  const [promptsWithTags, setPromptsWithTags] = useState<PromptWithTags[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load tags for all prompts using batch loading
   */
  const loadTags = useCallback(async () => {
    // Handle empty prompts
    if (!prompts || prompts.length === 0) {
      setPromptsWithTags([]);
      setAllTags([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Optimistic rendering: show prompts immediately without tags
    if (optimistic) {
      const promptsWithoutTags: PromptWithTags[] = prompts.map(p => ({
        ...p,
        tags: []
      }));
      setPromptsWithTags(promptsWithoutTags);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extract prompt IDs
      const promptIds = prompts.map(p => p.id).filter(Boolean);

      if (promptIds.length === 0) {
        setPromptsWithTags(prompts.map(p => ({ ...p, tags: [] })));
        setAllTags([]);
        setIsLoading(false);
        return;
      }

      // Performance monitoring: track batch loading
      const startTime = performance.now();
      
      // Batch load all tags in one query
      const tagsMap = await TagService.getPromptsTagsBatch(promptIds);
      
      const loadTime = performance.now() - startTime;
      
      // Track performance metrics
      trackEvent('tag_batch_load', {
        prompt_count: promptIds.length,
        load_time_ms: Math.round(loadTime),
        query_count: 1 // Single batch query
      });

      // Map tags to prompts
      const promptsWithTagsData: PromptWithTags[] = prompts.map(prompt => ({
        ...prompt,
        tags: tagsMap.get(prompt.id) || []
      }));

      // Extract all unique tag names
      const tagSet = new Set<string>();
      promptsWithTagsData.forEach(prompt => {
        prompt.tags.forEach(tag => tagSet.add(tag.name));
      });

      setPromptsWithTags(promptsWithTagsData);
      setAllTags(Array.from(tagSet));
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load tags');
      console.error('Failed to load tags in batch:', error);

      // Fallback to individual loading if enabled
      if (enableFallback) {
        try {
          console.warn('Falling back to individual tag loading');
          const fallbackStartTime = performance.now();
          const promptsWithTagsData: PromptWithTags[] = [];
          const tagSet = new Set<string>();

          // Load tags individually (slower but more resilient)
          for (const prompt of prompts) {
            try {
              const tags = await TagService.getPromptTags(prompt.id);
              promptsWithTagsData.push({ ...prompt, tags });
              tags.forEach(tag => tagSet.add(tag.name));
            } catch (tagError) {
              console.warn(`Failed to load tags for prompt ${prompt.id}:`, tagError);
              promptsWithTagsData.push({ ...prompt, tags: [] });
            }
          }
          
          const fallbackTime = performance.now() - fallbackStartTime;
          
          // Track fallback performance
          trackEvent('tag_fallback_load', {
            prompt_count: prompts.length,
            load_time_ms: Math.round(fallbackTime),
            query_count: prompts.length // N queries in fallback
          });

          setPromptsWithTags(promptsWithTagsData);
          setAllTags(Array.from(tagSet));
          setError(null);
        } catch (fallbackError) {
          console.error('Fallback loading also failed:', fallbackError);
          // Final fallback: prompts without tags
          setPromptsWithTags(prompts.map(p => ({ ...p, tags: [] })));
          setAllTags([]);
          setError(error);
        }
      } else {
        // No fallback: use prompts without tags
        setPromptsWithTags(prompts.map(p => ({ ...p, tags: [] })));
        setAllTags([]);
        setError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompts, optimistic, enableFallback]);

  // Memoize prompt IDs to detect changes
  const promptIds = useMemo(
    () => prompts.map(p => p.id).filter(Boolean).join(','),
    [prompts]
  );

  // Load tags when prompts change
  useEffect(() => {
    loadTags();
  }, [loadTags, promptIds]);

  // Memoize reload function
  const reload = useCallback(async () => {
    await loadTags();
  }, [loadTags]);

  return {
    promptsWithTags,
    allTags,
    isLoading,
    error,
    reload
  };
}

