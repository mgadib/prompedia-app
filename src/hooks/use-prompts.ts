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

            // Start building the query
            let query = supabase
                .from('prompts')
                .select('*, prompt_contents(body), prompt_tags(tags(id, name)), users(username, display_name)', { count: 'exact' });

            // Apply User Filter (Own prompts)
            query = query.eq('user_id', userId);

            // Apply Visibility Filter
            if (visibility === 'public') {
                query = query.eq('is_public', true);
            } else if (visibility === 'private') {
                query = query.eq('is_public', false);
            }

            // Apply Tag Filter efficiently
            if (filterTag) {
                // This is tricky in Supabase without a join table filter on the main query
                // We use the simpler approach: filter referencing the join
                // Note: .not('prompt_tags', 'is', null) isn't quite right for inner join logic in PostgREST
                // Better approach with PostgREST is usually !inner join but JS client makes it subtle.
                // For now, to keep it reliable without complex joins, we might have to filter client side OR use a better RPC.
                // However, let's try the standard approach:
                // We can't easily filter by tag name on the top level resource in standard PostgREST without embedding modification.
                // So for standard pagination with tag filtering, we often need an RPC or modifying the query strategies.

                // FALLBACK: If a tag is selected, we might search differently.
                // But for the sake of "Server Side Pagination", we should try to use text search on tags if possible
                // or just accept we might need to filter after fetch if we don't write an RPC.
                // Given the constraints, let's implement RPC-less filtering if possible, or fall back to client side filtering behavior IF complex.
                // actually, let's use the text search on the prompt body/title as that is straightforward.
            }

            if (filterText) {
                // Using the specific search index/column
                query = query.textSearch('title', filterText, { type: 'websearch', config: 'english' });
                // OR simpler ilike for now to match behavior
                // query = query.or(`title.ilike.%${filterText}%,prompt_contents.body.ilike.%${filterText}%`); 
                // Note: prompt_contents.body is on a joined table, standard filtering won't work easily on it from parent.
            }

            // Server-side ordering
            query = query.order('created_at', { ascending: false });

            // Apply Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            // Transform data
            const promptsData = data as unknown as Prompt[];
            const formattedPrompts: PromptUI[] = promptsData.map(p => {
                const content = p.prompt_contents?.body || '';
                return {
                    id: p.id,
                    user_id: p.user_id || '',
                    title: p.title || t('prompt.untitled'),
                    content: content,
                    description: content.length > 150 ? content.substring(0, 150) + '...' : content,
                    is_public: Boolean(p.is_public),
                    created_at: p.created_at,
                    updated_at: p.updated_at || p.created_at,
                    tags: p.prompt_tags
                        ? p.prompt_tags
                            .map(pt => pt.tags)
                            .filter((t): t is Pick<Tag, 'id' | 'name'> => t !== null)
                        : [],
                    author: p.users?.display_name || p.users?.username || t('prompt.unknown_author')
                };
            });

            // Client-side filtering fallback for things difficult to do server-side without RPC (like tag array filtering or deep join filtering)
            // IF we did not filter by tag server-side.
            let result = formattedPrompts;
            if (filterTag) {
                result = result.filter(p => p.tags.some(t => t.name === filterTag));
            }
            if (filterText && !filterText.includes(':')) { // simple text filter
                const term = filterText.toLowerCase();
                result = result.filter(p =>
                    p.title.toLowerCase().includes(term) ||
                    p.content.toLowerCase().includes(term) ||
                    p.tags.some(t => t.name.toLowerCase().includes(term))
                );
            }

            return { prompts: result, total: count || 0 };
        },
        enabled: enabled && !!userId,
        staleTime: 60 * 1000, // 1 minute
    });
};
