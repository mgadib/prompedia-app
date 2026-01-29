/**
 * Hook to get prompt repository instance
 * Allows dependency injection for testing
 */

import { promptRepository, PromptRepository } from '@/repositories/prompt-repository';
import { useMemo } from 'react';

/**
 * Hook to access prompt repository
 * In tests, this can be mocked by providing a custom repository
 */
export function usePromptRepository(): PromptRepository {
    // In the future, this could use React Context to allow dependency injection
    // For now, return the default repository instance
    return useMemo(() => promptRepository, []);
}
