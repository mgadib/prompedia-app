import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { PromptUI } from '@/types/prompts';
import { queryKeys, invalidatePromptsQueries, invalidatePublicPromptsQueries, invalidateTagsQueries } from '@/lib/query-keys';

interface SavePromptData {
    id?: string | null;
    title: string;
    content: string;
    tagsInput: string;
    isPublic: boolean;
    userId: string;
}

interface DeletePromptData {
    id: string;
    userId: string;
}

/**
 * Hook for prompt CRUD mutations using React Query.
 * Extracted from PromptNotes to provide reusable mutation logic.
 */
export function usePromptMutations() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    /**
     * Save or update a prompt
     * Uses optimistic updates for better perceived performance
     */
    const savePrompt = useMutation({
        mutationFn: async (data: SavePromptData) => {
            const { id, title, content, tagsInput, isPublic, userId } = data;
            
            if (!content.trim()) {
                throw new Error('Content is required');
            }

            const promptTitle = title.trim() || content.trim().slice(0, 50);
            const now = new Date().toISOString();
            let promptId = id;

            // Update existing prompt or create new one
            if (promptId) {
                const { error } = await supabase
                    .from('prompts')
                    .update({ 
                        title: promptTitle, 
                        is_public: isPublic, 
                        updated_at: now 
                    })
                    .eq('id', promptId)
                    .eq('user_id', userId);
                
                if (error) throw error;

                const { error: contentError } = await supabase
                    .from('prompt_contents')
                    .upsert({ 
                        prompt_id: promptId, 
                        body: content.trim() 
                    });
                
                if (contentError) throw contentError;
            } else {
                const newId = crypto.randomUUID();
                const { error } = await supabase
                    .from('prompts')
                    .insert({ 
                        id: newId, 
                        user_id: userId, 
                        title: promptTitle, 
                        is_public: isPublic 
                    });
                
                if (error) throw error;

                const { error: contentError } = await supabase
                    .from('prompt_contents')
                    .insert({ 
                        prompt_id: newId, 
                        body: content.trim() 
                    });
                
                if (contentError) throw contentError;
                promptId = newId;
            }

            // Handle tags
            const tagNames = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
            const uniqueTagNames = [...new Set(tagNames)];

            if (uniqueTagNames.length > 0 && promptId) {
                // Get or create tags
                const { data: existingTags } = await supabase
                    .from('tags')
                    .select('id, name')
                    .eq('user_id', userId)
                    .in('name', uniqueTagNames);

                const existingTagMap = new Map(existingTags?.map(t => [t.name, t.id]) || []);
                const missingTags = uniqueTagNames.filter(name => !existingTagMap.has(name));

                const tagIdsToLink: string[] = [];

                // Create missing tags
                if (missingTags.length > 0) {
                    const { data: created } = await supabase
                        .from('tags')
                        .insert(missingTags.map(name => ({ name, user_id: userId })))
                        .select('id, name');
                    
                    created?.forEach(t => tagIdsToLink.push(t.id));
                }

                // Add existing tag IDs
                existingTagMap.forEach(id => tagIdsToLink.push(id));

                // Update prompt_tags
                await supabase
                    .from('prompt_tags')
                    .delete()
                    .eq('prompt_id', promptId);

                if (tagIdsToLink.length > 0) {
                    await supabase
                        .from('prompt_tags')
                        .insert(tagIdsToLink.map(tag_id => ({ 
                            prompt_id: promptId, 
                            tag_id 
                        })));
                }
            } else if (promptId) {
                // Remove all tags if tagsInput is empty
                await supabase
                    .from('prompt_tags')
                    .delete()
                    .eq('prompt_id', promptId);
            }

            return { id: promptId, userId, title: promptTitle, content: content.trim(), tagsInput, isPublic };
        },
        onMutate: async (data) => {
            // Cancel outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries(invalidatePromptsQueries(data.userId));

            // Snapshot previous value for rollback
            const previousQueries = queryClient.getQueriesData({
                queryKey: queryKeys.prompts.list(data.userId),
            });

            // Optimistically update the cache
            if (data.id) {
                // Update existing prompt
                queryClient.setQueriesData<{ prompts: PromptUI[]; total: number }>(
                    { queryKey: queryKeys.prompts.list(data.userId), exact: false },
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            prompts: old.prompts.map((p) =>
                                p.id === data.id
                                    ? {
                                          ...p,
                                          title: data.title.trim() || data.content.trim().slice(0, 50),
                                          content: data.content.trim(),
                                          is_public: data.isPublic,
                                          updated_at: new Date().toISOString(),
                                          tags: data.tagsInput
                                              .split(',')
                                              .map((t) => t.trim())
                                              .filter(Boolean)
                                              .map((name) => ({ id: '', name })),
                                      }
                                    : p
                            ),
                        };
                    }
                );
            } else {
                // Add new prompt optimistically
                const newPrompt: PromptUI = {
                    id: crypto.randomUUID(),
                    user_id: data.userId,
                    title: data.title.trim() || data.content.trim().slice(0, 50),
                    content: data.content.trim(),
                    description: data.content.trim().length > 150 
                        ? data.content.trim().substring(0, 150) + '...' 
                        : data.content.trim(),
                    is_public: data.isPublic,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    tags: data.tagsInput
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((name) => ({ id: '', name })),
                    author: '',
                };

                queryClient.setQueriesData<{ prompts: PromptUI[]; total: number }>(
                    { queryKey: queryKeys.prompts.list(data.userId), exact: false },
                    (old) => {
                        if (!old) return { prompts: [newPrompt], total: 1 };
                        return {
                            prompts: [newPrompt, ...old.prompts],
                            total: old.total + 1,
                        };
                    }
                );
            }

            return { previousQueries };
        },
        onError: (err, mutationData, context) => {
            // Rollback on error
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, previousData]) => {
                    queryClient.setQueryData(queryKey, previousData);
                });
            }
        },
        onSuccess: (data) => {
            // Granular invalidation - only invalidate queries for the specific user
            queryClient.invalidateQueries(invalidatePromptsQueries(data.userId));
            // Invalidate tags since new tags might have been created
            queryClient.invalidateQueries(invalidateTagsQueries(data.userId));
            // Invalidate public prompts if the prompt is public
            queryClient.invalidateQueries(invalidatePublicPromptsQueries());
        },
    });

    /**
     * Delete a prompt
     * Uses optimistic updates for better perceived performance
     */
    const deletePrompt = useMutation({
        mutationFn: async (data: DeletePromptData) => {
            const { id, userId } = data;
            
            const { error } = await supabase
                .from('prompts')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            
            if (error) throw error;
            return { id, userId };
        },
        onMutate: async (data) => {
            // Cancel outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries(invalidatePromptsQueries(data.userId));

            // Snapshot previous value for rollback
            const previousQueries = queryClient.getQueriesData({
                queryKey: queryKeys.prompts.list(data.userId),
            });

            // Optimistically remove the prompt from cache
            queryClient.setQueriesData<{ prompts: PromptUI[]; total: number }>(
                { queryKey: queryKeys.prompts.list(data.userId), exact: false },
                (old) => {
                    if (!old) return old;
                    return {
                        prompts: old.prompts.filter((p) => p.id !== data.id),
                        total: Math.max(0, old.total - 1),
                    };
                }
            );

            return { previousQueries };
        },
        onError: (err, mutationData, context) => {
            // Rollback on error
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, previousData]) => {
                    queryClient.setQueryData(queryKey, previousData);
                });
            }
        },
        onSuccess: (data) => {
            // Granular invalidation - only invalidate queries for the specific user
            queryClient.invalidateQueries(invalidatePromptsQueries(data.userId));
            // Invalidate public prompts in case deleted prompt was public
            queryClient.invalidateQueries(invalidatePublicPromptsQueries());
        },
    });

    return {
        savePrompt,
        deletePrompt,
    };
}
