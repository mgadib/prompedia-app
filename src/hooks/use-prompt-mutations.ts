import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Tables } from '@/integrations/supabase/types';

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

            return { id: promptId };
        },
        onSuccess: () => {
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['prompts'] });
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['public-prompts'] });
        },
    });

    /**
     * Delete a prompt
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
            return { id };
        },
        onSuccess: () => {
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['prompts'] });
            queryClient.invalidateQueries({ queryKey: ['public-prompts'] });
        },
    });

    /**
     * Load user tags
     */
    const loadTags = async (userId: string): Promise<Tables<'tags'>[]> => {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (error) throw error;
        return data || [];
    };

    return {
        savePrompt,
        deletePrompt,
        loadTags,
    };
}
