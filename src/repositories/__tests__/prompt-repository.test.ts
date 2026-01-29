/**
 * Integration-style tests for PromptRepository using a mock Supabase client.
 * Verifies repository calls correct RPCs and transforms data shape.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabasePromptRepository } from '../prompt-repository';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (table: string) => mockFrom(table),
  },
}));

vi.mock('@/lib/performance-monitor', () => ({
  trackApiResponseTime: vi.fn(),
}));

const t = vi.fn((key: string, fallback?: string) => fallback ?? key);

describe('SupabasePromptRepository', () => {
  let repo: SupabasePromptRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new SupabasePromptRepository();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  describe('searchPrompts', () => {
    it('calls search_prompts RPC with normalized params', async () => {
      mockRpc.mockResolvedValue({
        data: [{ id: '1', user_id: 'u1', title: 'T', is_public: false, created_at: '', updated_at: '', total_count: 0 }],
        error: null,
      });
      await repo.searchPrompts(
        { userId: 'u1', page: 1, pageSize: 10, filterText: 'x', filterTag: 'Tag', visibility: 'all' },
        t
      );
      expect(mockRpc).toHaveBeenCalledWith('search_prompts', {
        p_user_id: 'u1',
        p_search_text: 'x',
        p_tag_filter: 'Tag',
        p_visibility: 'all',
        p_page: 1,
        p_page_size: 10,
      });
    });
    it('returns prompts and total from RPC response', async () => {
      mockRpc.mockResolvedValue({
        data: [
          { id: '1', user_id: 'u1', title: 'Title', is_public: true, created_at: '2025-01-01', updated_at: '2025-01-01', total_count: 1 },
        ],
        error: null,
      });
      const result = await repo.searchPrompts({ userId: 'u1' }, t);
      expect(result.prompts).toHaveLength(1);
      expect(result.total).toBe(1);
    });
    it('throws when RPC returns error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });
      await expect(repo.searchPrompts({ userId: 'u1' }, t)).rejects.toMatchObject({ message: 'RPC failed' });
    });
  });

  describe('searchPublicPrompts', () => {
    it('calls search_public_prompts RPC', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      await repo.searchPublicPrompts({ tag: 'x', page: 1, pageSize: 10 }, t);
      expect(mockRpc).toHaveBeenCalledWith('search_public_prompts', {
        p_tag_filter: 'x',
        p_page: 1,
        p_page_size: 10,
      });
    });
  });
});
