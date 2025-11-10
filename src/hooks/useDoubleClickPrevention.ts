import { useRef, useCallback } from 'react';

/**
 * Custom hook untuk mencegah double-click pada button/action
 * @param callback - Function yang akan dipanggil saat click
 * @param delay - Minimum delay antara clicks dalam milliseconds (default: 500ms)
 * @returns Debounced callback function
 */
export function useDoubleClickPrevention<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const lastClickTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime.current;

      // Jika masih dalam delay atau sedang processing, ignore click
      if (timeSinceLastClick < delay || isProcessing.current) {
        return;
      }

      lastClickTime.current = now;
      isProcessing.current = true;

      // Execute callback
      const result = callback(...args);

      // Reset processing flag setelah delay
      setTimeout(() => {
        isProcessing.current = false;
      }, delay);

      return result;
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}

