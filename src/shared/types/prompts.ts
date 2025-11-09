import { Prompt, Tag } from '@/lib/storage';

/**
 * Prompt with tags interface
 * Consolidated type definition used across the application
 */
export interface PromptWithTags extends Prompt {
  tags: Tag[];
}

