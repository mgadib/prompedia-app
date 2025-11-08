import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { SupabaseService } from '@/lib/supabase-service';
import { storageManager } from '@/lib/storage-manager';
import { useAuth } from './useAuth';
import type { Prompt } from '@/lib/storage';

/**
 * React Query hook untuk load user prompts dengan caching dan deduplication
 */
export function useUserPrompts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['prompts', 'user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await storageManager.getPrompts();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 menit untuk user prompts
    gcTime: 15 * 60 * 1000, // 15 menit cache
  });
}

/**
 * React Query hook untuk load public prompts dengan caching dan deduplication
 */
export function usePublicPrompts(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['prompts', 'public', options?.limit, options?.offset],
    queryFn: () => SupabaseService.getPublicPrompts(options),
    staleTime: 10 * 60 * 1000, // 10 menit untuk public prompts (lebih jarang berubah)
    gcTime: 30 * 60 * 1000, // 30 menit cache
  });
}

/**
 * Hook untuk invalidate prompts cache setelah mutation
 */
export function useInvalidatePrompts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return {
    invalidateUserPrompts: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'user', user?.id] });
    },
    invalidatePublicPrompts: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'public'] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  };
}

/**
 * Prefetch public prompts (useful for navigation prediction)
 */
export function usePrefetchPublicPrompts() {
  const queryClient = useQueryClient();
  
  return (options?: { limit?: number; offset?: number }) => {
    queryClient.prefetchQuery({
      queryKey: ['prompts', 'public', options?.limit, options?.offset],
      queryFn: () => SupabaseService.getPublicPrompts(options),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * React Query mutation untuk create prompt dengan optimistic updates
 */
export function useCreatePrompt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const invalidate = useInvalidatePrompts();
  
  return useMutation({
    mutationFn: async (prompt: Prompt) => {
      await storageManager.savePrompt(prompt);
      return prompt;
    },
    onMutate: async (newPrompt) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['prompts', 'user', user?.id] });
      
      // Snapshot previous value
      const previousPrompts = queryClient.getQueryData<Prompt[]>(['prompts', 'user', user?.id]);
      
      // Optimistically update
      if (previousPrompts && user) {
        queryClient.setQueryData<Prompt[]>(
          ['prompts', 'user', user.id],
          [...previousPrompts, newPrompt]
        );
      }
      
      return { previousPrompts };
    },
    onError: (err, newPrompt, context) => {
      // Rollback on error
      if (context?.previousPrompts && user) {
        queryClient.setQueryData(['prompts', 'user', user.id], context.previousPrompts);
      }
    },
    onSettled: (data) => {
      // Invalidate to refetch
      invalidate.invalidateUserPrompts();
      if (data?.is_public) {
        invalidate.invalidatePublicPrompts();
      }
    },
  });
}

/**
 * React Query mutation untuk update prompt dengan optimistic updates
 */
export function useUpdatePrompt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const invalidate = useInvalidatePrompts();
  
  return useMutation({
    mutationFn: async (prompt: Prompt) => {
      await storageManager.savePrompt(prompt);
      return prompt;
    },
    onMutate: async (updatedPrompt) => {
      await queryClient.cancelQueries({ queryKey: ['prompts', 'user', user?.id] });
      
      const previousPrompts = queryClient.getQueryData<Prompt[]>(['prompts', 'user', user?.id]);
      
      if (previousPrompts && user) {
        queryClient.setQueryData<Prompt[]>(
          ['prompts', 'user', user.id],
          previousPrompts.map(p => p.id === updatedPrompt.id ? updatedPrompt : p)
        );
      }
      
      return { previousPrompts };
    },
    onError: (err, updatedPrompt, context) => {
      if (context?.previousPrompts && user) {
        queryClient.setQueryData(['prompts', 'user', user.id], context.previousPrompts);
      }
    },
    onSettled: (data) => {
      invalidate.invalidateUserPrompts();
      if (data?.is_public) {
        invalidate.invalidatePublicPrompts();
      }
    },
  });
}

/**
 * React Query mutation untuk delete prompt dengan optimistic updates
 */
export function useDeletePrompt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const invalidate = useInvalidatePrompts();
  
  return useMutation({
    mutationFn: async (promptId: string) => {
      await storageManager.deletePrompt(promptId);
      return promptId;
    },
    onMutate: async (promptId) => {
      await queryClient.cancelQueries({ queryKey: ['prompts', 'user', user?.id] });
      
      const previousPrompts = queryClient.getQueryData<Prompt[]>(['prompts', 'user', user?.id]);
      const promptToDelete = previousPrompts?.find(p => p.id === promptId);
      
      if (previousPrompts && user) {
        queryClient.setQueryData<Prompt[]>(
          ['prompts', 'user', user.id],
          previousPrompts.filter(p => p.id !== promptId)
        );
      }
      
      return { previousPrompts, promptToDelete };
    },
    onError: (err, promptId, context) => {
      if (context?.previousPrompts && user) {
        queryClient.setQueryData(['prompts', 'user', user.id], context.previousPrompts);
      }
    },
    onSettled: (data, error, promptId, context) => {
      invalidate.invalidateUserPrompts();
      if (context?.promptToDelete?.is_public) {
        invalidate.invalidatePublicPrompts();
      }
    },
  });
}

