import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { queryKeys } from '@/lib/query-keys';

/**
 * Hook for fetching global tags with React Query.
 * Tags are shared across all users; cached and invalidated when tags are created/deleted.
 */
export function useTags(userId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.tags.all,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes - tags don't change frequently
        gcTime: 10 * 60 * 1000, // Clean up after 10 minutes of inactivity (tags are relatively stable)
    });
}
