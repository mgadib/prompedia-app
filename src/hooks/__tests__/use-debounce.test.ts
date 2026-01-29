/**
 * Unit tests for use-debounce hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    act(() => {
      rerender({ value: 'updated', delay: 300 });
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous debounce on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 300 },
      }
    );

    act(() => {
      rerender({ value: 'second', delay: 300 });
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    act(() => {
      rerender({ value: 'third', delay: 300 });
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current).toBe('third');
  });
});
