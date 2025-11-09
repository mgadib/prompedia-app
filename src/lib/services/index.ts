/**
 * Service Layer - Instance-based services for dependency injection
 * 
 * These services replace static class methods for better testability and flexibility.
 * All services accept a SupabaseClient in the constructor for dependency injection.
 * 
 * @example
 * ```ts
 * // Use default singleton instance
 * import { promptService } from '@/lib/services';
 * const prompts = await promptService.getPrompts();
 * 
 * // Or create instance with custom client (for testing)
 * import { PromptService } from '@/lib/services';
 * const service = new PromptService(mockClient);
 * ```
 */

export { PromptService, promptService } from './prompt-service';
export { AuthService, authService } from './auth-service';
export { TagServiceInstance, tagServiceInstance } from './tag-service-instance';

