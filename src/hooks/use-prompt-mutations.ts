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
 * Upsert prompt metadata (create or update)
 */
async function upsertPrompt(
    promptId: string | null | undefined,
    userId: string,
    title: string,
    isPublic: boolean
): Promise<string> {
    const promptTitle = title.trim();
    const now = new Date().toISOString();

    if (promptId) {
        // Update existing prompt
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
        return promptId;
    } else {
        // Create new prompt
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
        return newId;
    }
}

/**
 * Sync prompt content (body)
 */
async function syncPromptContent(promptId: string, content: string): Promise<void> {
    const { error } = await supabase
        .from('prompt_contents')
        .upsert({ 
            prompt_id: promptId, 
            body: content.trim() 
        });
    
    if (error) throw error;
}

/**
 * Sync prompt tags (create missing tags and link to prompt)
 * Tags are normalized to lowercase for case-insensitive matching
 */
async function syncPromptTags(
    promptId: string,
    tagsInput: string,
    userId: string
): Promise<void> {
    // Normalize tag names to lowercase for case-insensitive matching
    const tagNames = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
    const uniqueTagNames = [...new Set(tagNames)];

    // Remove all existing tags for this prompt
    await supabase
        .from('prompt_tags')
        .delete()
        .eq('prompt_id', promptId);

    if (uniqueTagNames.length === 0) {
        return; // No tags to add
    }

    // Get all user tags and create a case-insensitive lookup map
    const { data: allUserTags } = await supabase
        .from('tags')
        .select('id, name')
        .eq('user_id', userId);

    // Create case-insensitive map: lowercase name -> tag id
    const existingTagMap = new Map<string, string>();
    allUserTags?.forEach(tag => {
        const lowerName = tag.name.toLowerCase();
        if (!existingTagMap.has(lowerName)) {
            existingTagMap.set(lowerName, tag.id);
        }
    });

    // Find missing tags (case-insensitive)
    const missingTags = uniqueTagNames.filter(name => !existingTagMap.has(name));
    const tagIdsToLink: string[] = [];

    // Create missing tags (store in lowercase)
    if (missingTags.length > 0) {
        const { data: created } = await supabase
            .from('tags')
            .insert(missingTags.map(name => ({ name, user_id: userId })))
            .select('id, name');
        
        created?.forEach(t => tagIdsToLink.push(t.id));
    }

    // Add existing tag IDs (from case-insensitive lookup)
    uniqueTagNames.forEach(lowerName => {
        const tagId = existingTagMap.get(lowerName);
        if (tagId) {
            tagIdsToLink.push(tagId);
        }
    });

    // Link tags to prompt
    if (tagIdsToLink.length > 0) {
        const { error } = await supabase
            .from('prompt_tags')
            .insert(tagIdsToLink.map(tag_id => ({ 
                prompt_id: promptId, 
                tag_id 
            })));
        
        if (error) throw error;
    }
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

            // Generate title from content if not provided
            const promptTitle = title.trim() || content.trim().slice(0, 50);

            // Upsert prompt metadata (create or update)
            const promptId = await upsertPrompt(id, userId, promptTitle, isPublic);

            // Sync prompt content
            await syncPromptContent(promptId, content);

            // Sync tags
            await syncPromptTags(promptId, tagsInput, userId);

            return { 
                id: promptId, 
                userId, 
                title: promptTitle, 
                content: content.trim(), 
                tagsInput, 
                isPublic 
            };
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
