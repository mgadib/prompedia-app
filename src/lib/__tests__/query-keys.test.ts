import { describe, it, expect } from 'vitest';
import { queryKeys, invalidatePromptsQueries, invalidatePublicPromptsQueries, invalidateTagsQueries } from '../query-keys';

describe('query-keys', () => {
  describe('queryKeys.prompts', () => {
    it('list without userId returns lists + "all"', () => {
      const key = queryKeys.prompts.list();
      expect(key).toEqual(['prompts', 'list', 'all']);
    });
    it('list with userId and filters normalizes filterTag to lowercase', () => {
      const key = queryKeys.prompts.list('user-1', { filterTag: 'TagName', page: 2 });
      expect(key).toContain('tagname');
      expect(key).toContain(2);
    });
    it('detail(id) returns detail key with id', () => {
      expect(queryKeys.prompts.detail('id-1')).toEqual(['prompts', 'detail', 'id-1']);
    });
  });

  describe('queryKeys.publicPrompts', () => {
    it('list normalizes tag to lowercase', () => {
      const key = queryKeys.publicPrompts.list({ tag: 'PublicTag' });
      expect(key).toContain('publictag');
    });
    it('recent(5) includes limit', () => {
      expect(queryKeys.publicPrompts.recent(5)).toContain(5);
    });
  });

  describe('invalidatePromptsQueries', () => {
    it('with userId returns queryKey and exact: false', () => {
      const result = invalidatePromptsQueries('user-1');
      expect(result.exact).toBe(false);
      expect(result.queryKey[0]).toBe('prompts');
    });
    it('without userId returns prompts.all scope', () => {
      const result = invalidatePromptsQueries();
      expect(result.queryKey).toEqual(['prompts']);
    });
  });

  describe('invalidatePublicPromptsQueries', () => {
    it('returns queryKey with public-prompts and exact: false', () => {
      const result = invalidatePublicPromptsQueries();
      expect(result.queryKey).toEqual(['public-prompts']);
      expect(result.exact).toBe(false);
    });
  });

  describe('invalidateTagsQueries', () => {
    it('returns queryKey with tags and exact: false', () => {
      const result = invalidateTagsQueries();
      expect(result.queryKey).toEqual(['tags']);
      expect(result.exact).toBe(false);
    });
  });
});
