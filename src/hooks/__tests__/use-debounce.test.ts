/**
 * Unit tests for use-debounce hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 300 });
    expect(result.current).toBe('initial'); // Still initial

    // Fast forward time
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should cancel previous debounce on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 300 },
      }
    );

    rerender({ value: 'second', delay: 300 });
    vi.advanceTimersByTime(150); // Halfway through delay

    rerender({ value: 'third', delay: 300 });
    vi.advanceTimersByTime(150); // Still not enough

    vi.advanceTimersByTime(150); // Complete delay from last change
    await waitFor(() => {
      expect(result.current).toBe('third'); // Should be last value, not first or second
    });
  });
});
