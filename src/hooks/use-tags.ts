import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/query-keys';

/**
 * Hook for fetching user tags with React Query.
 * Tags are cached and automatically invalidated when tags are created/deleted.
 */
export function useTags(userId: string | undefined) {
    return useQuery({
        queryKey: userId ? queryKeys.tags.list(userId) : queryKeys.tags.all,
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', userId)
                .order('name');

            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes - tags don't change frequently
    });
}
