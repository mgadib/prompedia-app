/**
 * Unit tests for prompt-transformers utility
 */

import { describe, it, expect } from 'vitest';
import { transformSupabasePromptToUI, calculateTagCounts } from '../prompt-transformers';
import type { PromptUI } from '@/types/prompts';

// Mock translation function
const mockT = (key: string, fallback?: string) => fallback || key;

describe('prompt-transformers', () => {
  describe('transformSupabasePromptToUI', () => {
    it('should transform RPC row to PromptUI format', () => {
      const mockRow = {
        id: '123',
        user_id: 'user-123',
        title: 'Test Prompt',
        is_public: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        prompt_contents: { body: 'Test content' },
        prompt_tags: [
          { tags: { id: 'tag-1', name: 'test' } },
          { tags: { id: 'tag-2', name: 'example' } },
        ],
        users: { username: 'testuser', display_name: 'Test User' },
      };

      const result = transformSupabasePromptToUI(mockRow as Parameters<typeof transformSupabasePromptToUI>[0], mockT);

      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Prompt');
      expect(result.content).toBe('Test content');
      expect(result.is_public).toBe(true);
      expect(result.tags).toHaveLength(2);
      expect(result.tags[0].name).toBe('test');
      expect(result.author).toBe('Test User');
    });

    it('should handle missing optional fields', () => {
      const mockRow = {
        id: '123',
        user_id: 'user-123',
        title: '',
        is_public: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: null,
        prompt_contents: null,
        prompt_tags: [],
        users: null,
      };

      const result = transformSupabasePromptToUI(mockRow as Parameters<typeof transformSupabasePromptToUI>[0], mockT);

      expect(result.title).toBe('prompt.untitled');
      expect(result.content).toBe('');
      expect(result.tags).toHaveLength(0);
      expect(result.author).toBe('prompt.unknown_author');
      expect(result.updated_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('calculateTagCounts', () => {
    it('should calculate tag counts correctly', () => {
      const prompts: PromptUI[] = [
        {
          id: '1',
          user_id: 'user-1',
          title: 'Prompt 1',
          content: 'Content 1',
          description: 'Desc 1',
          is_public: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          tags: [
            { id: 'tag-1', name: 'test' },
            { id: 'tag-2', name: 'example' },
          ],
          author: 'User 1',
        },
        {
          id: '2',
          user_id: 'user-1',
          title: 'Prompt 2',
          content: 'Content 2',
          description: 'Desc 2',
          is_public: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          tags: [
            { id: 'tag-1', name: 'test' },
            { id: 'tag-3', name: 'demo' },
          ],
          author: 'User 1',
        },
      ];

      const result = calculateTagCounts(prompts);

      expect(result).toHaveLength(3);
      expect(result.find(t => t.name === 'test')?.count).toBe(2);
      expect(result.find(t => t.name === 'example')?.count).toBe(1);
      expect(result.find(t => t.name === 'demo')?.count).toBe(1);
      // Should be sorted by count descending
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });

    it('should handle empty prompts array', () => {
      const result = calculateTagCounts([]);
      expect(result).toHaveLength(0);
    });
  });
});
