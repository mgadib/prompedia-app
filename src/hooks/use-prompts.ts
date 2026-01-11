import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Tables } from '@/integrations/supabase/types';

// Define types local to the hook or import from shared
interface Tag extends Tables<'tags'> { }

interface Prompt extends Tables<'prompts'> {
    prompt_contents: { body: string } | null;
    prompt_tags: { tags: Pick<Tag, 'id' | 'name'> | null }[];
    users: {
        username: string;
        display_name: string | null;
    } | null;
}

export interface PromptUI {
    id: string;
    title: string;
    content: string;
    description: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    tags: Pick<Tag, 'id' | 'name'>[];
    author: string;
    user_id: string;
}

interface UsePromptsOptions {
    userId?: string;
    page?: number;
    pageSize?: number;
    filterText?: string;
    filterTag?: string;
    visibility?: 'all' | 'public' | 'private';
    enabled?: boolean;
}

export const usePrompts = ({
    userId,
    page = 1,
    pageSize = 10,
    filterText = '',
    filterTag = '',
    visibility = 'all',
    enabled = true
}: UsePromptsOptions) => {
    const { t } = useTranslation();

    return useQuery({
        queryKey: ['prompts', userId, page, pageSize, filterText, filterTag, visibility],
        queryFn: async () => {
            if (!userId) return { prompts: [], total: 0 };

            // Use RPC function for comprehensive search across title, body, and tags
            const { data, error } = await supabase.rpc('search_prompts', {
                p_user_id: userId,
                p_search_text: filterText || null,
                p_tag_filter: filterTag || null,
                p_visibility: visibility,
                p_page: page,
                p_page_size: pageSize
            });

            if (error) throw error;

            // Handle empty results
            if (!data || data.length === 0) {
                return { prompts: [], total: 0 };
            }

            // Extract total count from first row (all rows have same total_count)
            const totalCount = (data[0] as any).total_count || 0;

            // Transform data from RPC function format to PromptUI format
            // Supabase RPC returns JSONB as objects directly, not strings
            const formattedPrompts: PromptUI[] = data.map((row: any) => {
                // Handle prompt_contents - Supabase returns JSONB as object
                let promptContents: { body: string } | null = null;
                if (row.prompt_contents) {
                    if (typeof row.prompt_contents === 'string') {
                        // Handle edge case where it might be string
                        try {
                            promptContents = row.prompt_contents === 'null' ? null : JSON.parse(row.prompt_contents);
                        } catch {
                            promptContents = null;
                        }
                    } else if (typeof row.prompt_contents === 'object' && row.prompt_contents !== null) {
                        promptContents = row.prompt_contents;
                    }
                }

                // Handle prompt_tags - Supabase returns JSONB array as array directly
                let promptTags: any[] = [];
                if (row.prompt_tags) {
                    if (Array.isArray(row.prompt_tags)) {
                        promptTags = row.prompt_tags;
                    } else if (typeof row.prompt_tags === 'string') {
                        try {
                            promptTags = JSON.parse(row.prompt_tags);
                        } catch {
                            promptTags = [];
                        }
                    }
                }

                // Handle users - Supabase returns JSONB as object
                let users: { username: string; display_name: string | null } | null = null;
                if (row.users) {
                    if (typeof row.users === 'string') {
                        try {
                            users = row.users === 'null' ? null : JSON.parse(row.users);
                        } catch {
                            users = null;
                        }
                    } else if (typeof row.users === 'object' && row.users !== null) {
                        users = row.users;
                    }
                }

                const content = promptContents?.body || '';
                return {
                    id: row.id,
                    user_id: row.user_id || '',
                    title: row.title || t('prompt.untitled'),
                    content: content,
                    description: content.length > 150 ? content.substring(0, 150) + '...' : content,
                    is_public: Boolean(row.is_public),
                    created_at: row.created_at,
                    updated_at: row.updated_at || row.created_at,
                    tags: promptTags
                        .map((pt: any) => pt?.tags)
                        .filter((t: any): t is Pick<Tag, 'id' | 'name'> => t !== null && t !== undefined),
                    author: users?.display_name || users?.username || t('prompt.unknown_author')
                };
            });

            return { prompts: formattedPrompts, total: totalCount };
        },
        enabled: enabled && !!userId,
        staleTime: 60 * 1000, // 1 minute
    });
};
