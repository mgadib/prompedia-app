/**
 * Unit tests for usePromptMutations hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePromptMutations } from '../use-prompt-mutations';
import { ERROR_CODES } from '@/lib/error-handler';
import { queryKeys } from '@/lib/query-keys';

const USER_ID = '00000000-0000-1000-8000-000000000001';
const PROMPT_ID = '00000000-0000-1000-8000-000000000002';

const mockFrom = vi.fn();

function createChain(resolveWith: { error: unknown } = { error: null }) {
  const chain = {
    update: vi.fn(function (this: typeof chain) { return this; }),
    insert: vi.fn(function (this: typeof chain) { return this; }),
    delete: vi.fn(function (this: typeof chain) { return this; }),
    upsert: vi.fn(function (this: typeof chain) { return this; }),
    select: vi.fn(function (this: typeof chain) { return this; }),
    eq: vi.fn(function (this: typeof chain) { return this; }),
    single: vi.fn(function (this: typeof chain) { return Promise.resolve({ data: null, error: null }); }),
    then(resolve: (v: { error: unknown }) => void) {
      return Promise.resolve(resolveWith).then(resolve);
    },
  };
  return chain;
}

declare global {
  var __chainResolveValue: { error: unknown };
}
globalThis.__chainResolveValue = { error: null };

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (_table: string) => {
      mockFrom(_table);
      return createChain(globalThis.__chainResolveValue ?? { error: null });
    },
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('usePromptMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__chainResolveValue = { error: null };
  });

  describe('savePrompt', () => {
    it('should save new prompt with content and invalidate queries', async () => {
      const { result } = renderHook(() => usePromptMutations(), {
        wrapper: createWrapper(),
      });

      let resolved: unknown;
      await act(async () => {
        resolved = await result.current.savePrompt.mutateAsync({
          title: 'My Title',
          content: 'Prompt content here',
          tagsInput: 'tag1, tag2',
          isPublic: true,
          userId: USER_ID,
        });
      });

      await waitFor(() => {
        expect(result.current.savePrompt.isSuccess).toBe(true);
      });

      expect(resolved).toMatchObject({
        userId: USER_ID,
        title: 'My Title',
        content: 'Prompt content here',
        isPublic: true,
      });
      expect((resolved as { id: string }).id).toBeDefined();
    });

    it('should throw CONTENT_REQUIRED when content is empty', async () => {
      const { result } = renderHook(() => usePromptMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.savePrompt.mutateAsync({
            title: 'Title',
            content: '',
            tagsInput: '',
            isPublic: false,
            userId: 'user-1',
          });
        })
      ).rejects.toThrow(ERROR_CODES.CONTENT_REQUIRED);
    });

    it('should throw VALIDATION_FAILED for invalid data', async () => {
      const { result } = renderHook(() => usePromptMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.savePrompt.mutateAsync({
            title: 'Title',
            content: 'Body',
            tagsInput: '',
            isPublic: false,
            userId: 'not-a-valid-uuid',
          });
        })
      ).rejects.toThrow(ERROR_CODES.VALIDATION_FAILED);
    });
  });

  describe('deletePrompt', () => {
    it('should delete prompt and invalidate queries', async () => {
      const { result } = renderHook(() => usePromptMutations(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deletePrompt.mutateAsync({
          id: PROMPT_ID,
          userId: USER_ID,
        });
      });

      await waitFor(() => {
        expect(result.current.deletePrompt.isSuccess).toBe(true);
      });

      expect(mockFrom).toHaveBeenCalledWith('prompts');
    });

    it('should throw VALIDATION_FAILED for invalid delete data', async () => {
      const { result } = renderHook(() => usePromptMutations(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.deletePrompt.mutateAsync({
            id: 'not-uuid',
            userId: USER_ID,
          });
        })
      ).rejects.toThrow(ERROR_CODES.VALIDATION_FAILED);
    });

    it('should rollback optimistic update on delete error', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
      });
      const initialData = {
        prompts: [{
          id: PROMPT_ID,
          user_id: USER_ID,
          title: 'P1',
          content: '',
          description: '',
          is_public: false,
          created_at: '',
          updated_at: '',
          tags: [],
          author: '',
        }],
        total: 1,
      };
      const listKey = queryKeys.prompts.list(USER_ID);
      queryClient.setQueryData(listKey, initialData);

      const Wrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(() => usePromptMutations(), {
        wrapper: Wrapper,
      });

      globalThis.__chainResolveValue = { error: { message: 'Delete failed' } };

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.deletePrompt.mutateAsync({
            id: PROMPT_ID,
            userId: USER_ID,
          });
        } catch (e) {
          caught = e;
        }
      });

      expect(caught).toMatchObject({ message: 'Delete failed' });

      await waitFor(() => {
        expect(result.current.deletePrompt.isError).toBe(true);
      });

      const rollbackData = queryClient.getQueryData(listKey);
      expect(rollbackData).toEqual(initialData);
    });
  });
});
