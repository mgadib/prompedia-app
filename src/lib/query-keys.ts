/**
 * Centralized query key factory for type-safe query key management.
 * This ensures consistency across the application and makes cache invalidation easier.
 */

/**
 * Base query keys
 */
export const queryKeys = {
  /**
   * Prompt-related query keys
   */
  prompts: {
    all: ['prompts'] as const,
    lists: () => [...queryKeys.prompts.all, 'list'] as const,
    list: (userId?: string, filters?: {
      page?: number;
      pageSize?: number;
      filterText?: string;
      filterTag?: string;
      visibility?: 'all' | 'public' | 'private';
    }) => {
      if (!userId) return [...queryKeys.prompts.lists(), 'all'] as const;
      // Normalize filterTag to lowercase for consistent cache keys
      const normalizedFilterTag = filters?.filterTag ? filters.filterTag.toLowerCase() : '';
      return [
        ...queryKeys.prompts.lists(),
        userId,
        filters?.page || 1,
        filters?.pageSize || 10,
        filters?.filterText || '',
        normalizedFilterTag,
        filters?.visibility || 'all',
      ] as const;
    },
    details: () => [...queryKeys.prompts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.prompts.details(), id] as const,
  },

  /**
   * Public prompt-related query keys
   */
  publicPrompts: {
    all: ['public-prompts'] as const,
    lists: () => [...queryKeys.publicPrompts.all, 'list'] as const,
    list: (filters?: {
      tag?: string | null;
      page?: number;
      pageSize?: number;
    }) => {
      // Normalize tag to lowercase for consistent cache keys
      const normalizedTag = filters?.tag ? filters.tag.toLowerCase() : null;
      return [
        ...queryKeys.publicPrompts.lists(),
        normalizedTag,
        filters?.page || 1,
        filters?.pageSize || 10,
      ] as const;
    },
    recent: (limit?: number) => [
      ...queryKeys.publicPrompts.all,
      'recent',
      limit || 7,
    ] as const,
  },

  /**
   * Tag-related query keys
   */
  tags: {
    all: ['tags'] as const,
    lists: () => [...queryKeys.tags.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.tags.lists(), userId] as const,
    details: () => [...queryKeys.tags.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tags.details(), id] as const,
  },

  /**
   * User-related query keys
   */
  users: {
    all: ['users'] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },
} as const;

/**
 * Helper function to invalidate all prompts queries for a user
 */
export function invalidatePromptsQueries(userId?: string) {
  if (userId) {
    return {
      queryKey: queryKeys.prompts.list(userId),
      exact: false, // Invalidate all queries that start with this key
    };
  }
  return {
    queryKey: queryKeys.prompts.all,
    exact: false,
  };
}

/**
 * Helper function to invalidate all public prompts queries
 */
export function invalidatePublicPromptsQueries() {
  return {
    queryKey: queryKeys.publicPrompts.all,
    exact: false,
  };
}

/**
 * Helper function to invalidate all tag queries for a user
 */
export function invalidateTagsQueries(userId: string) {
  return {
    queryKey: queryKeys.tags.list(userId),
    exact: false,
  };
}
