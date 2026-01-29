import { describe, it, expect } from 'vitest';
import { shouldRetryQuery, queryRetryDelay } from '../query-retry';

describe('query-retry', () => {
  describe('shouldRetryQuery', () => {
    it('retries rate limit (429) up to 3 times', () => {
      expect(shouldRetryQuery(0, { status: 429 })).toBe(true);
      expect(shouldRetryQuery(2, { status: 429 })).toBe(true);
      expect(shouldRetryQuery(3, { status: 429 })).toBe(false);
    });
    it('does not retry 4xx (except 429)', () => {
      expect(shouldRetryQuery(0, { status: 400 })).toBe(false);
      expect(shouldRetryQuery(0, { status: 404 })).toBe(false);
    });
    it('retries other errors (e.g. 5xx) up to 2 times', () => {
      expect(shouldRetryQuery(0, { status: 500 })).toBe(true);
      expect(shouldRetryQuery(1, { status: 500 })).toBe(true);
      expect(shouldRetryQuery(2, { status: 500 })).toBe(false);
    });
    it('retries when error has no status (e.g. network)', () => {
      expect(shouldRetryQuery(0, new Error('Network error'))).toBe(true);
      expect(shouldRetryQuery(2, new Error('Network error'))).toBe(false);
    });
  });

  describe('queryRetryDelay', () => {
    it('returns exponential delay capped at 30s', () => {
      expect(queryRetryDelay(0)).toBe(1000);
      expect(queryRetryDelay(1)).toBe(2000);
      expect(queryRetryDelay(2)).toBe(4000);
      expect(queryRetryDelay(10)).toBe(30_000);
    });
  });
});
