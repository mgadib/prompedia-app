import { describe, it, expect, vi } from 'vitest';
import {
  ERROR_CODES,
  isRateLimitError,
  handleSupabaseError,
  isErrorCode,
  extractErrorMessage,
} from '../error-handler';

const t = vi.fn((key: string, fallback?: string) => fallback ?? key);

describe('error-handler', () => {
  describe('ERROR_CODES', () => {
    it('exports CONTENT_REQUIRED and VALIDATION_FAILED', () => {
      expect(ERROR_CODES.CONTENT_REQUIRED).toBe('CONTENT_REQUIRED');
      expect(ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    });
  });

  describe('isRateLimitError', () => {
    it('returns true for object with status 429', () => {
      expect(isRateLimitError({ status: 429 })).toBe(true);
    });
    it('returns false for object with status 400', () => {
      expect(isRateLimitError({ status: 400 })).toBe(false);
    });
    it('returns true when message contains "rate limit"', () => {
      expect(isRateLimitError({ message: 'Rate limit exceeded' })).toBe(true);
      expect(isRateLimitError({ message: 'RATE LIMIT' })).toBe(true);
    });
    it('returns false for null or non-object', () => {
      expect(isRateLimitError(null)).toBe(false);
      expect(isRateLimitError('error')).toBe(false);
    });
  });

  describe('handleSupabaseError', () => {
    it('returns generic message for null/undefined', () => {
      expect(handleSupabaseError(null, t)).toBe('An error occurred. Please try again.');
    });
    it('returns rate limited message for 429', () => {
      expect(handleSupabaseError({ status: 429 }, t)).toBe(
        'Too many attempts. Please try again later.'
      );
    });
    it('maps Invalid login credentials', () => {
      expect(handleSupabaseError({ message: 'Invalid login credentials' }, t)).toBe(
        'Invalid email or password'
      );
    });
    it('returns message as-is when no mapping', () => {
      expect(handleSupabaseError({ message: 'Custom error' }, t)).toBe('Custom error');
    });
  });

  describe('isErrorCode', () => {
    it('returns true when error message equals code', () => {
      expect(isErrorCode(new Error('CONTENT_REQUIRED'), 'CONTENT_REQUIRED')).toBe(true);
    });
    it('returns false when error message differs', () => {
      expect(isErrorCode(new Error('CONTENT_REQUIRED'), 'VALIDATION_FAILED')).toBe(false);
    });
  });

  describe('extractErrorMessage', () => {
    it('returns Error.message for Error instance', () => {
      expect(extractErrorMessage(new Error('foo'))).toBe('foo');
    });
    it('returns message property for object with message', () => {
      expect(extractErrorMessage({ message: 'bar' })).toBe('bar');
    });
    it('returns string for primitive', () => {
      expect(extractErrorMessage('baz')).toBe('baz');
    });
    it('returns "Unknown error" for null/undefined', () => {
      expect(extractErrorMessage(null)).toBe('Unknown error');
    });
  });
});
