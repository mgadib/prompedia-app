import { useRef, useCallback, useState } from 'react';

/**
 * Hook to prevent double-click on async actions
 * Returns a wrapped function that prevents multiple simultaneous calls
 */
export function usePreventDoubleClick<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    delay: number = 500
): T {
    const isExecuting = useRef(false);

    return useCallback(
        async (...args: Parameters<T>) => {
            if (isExecuting.current) {
                return;
            }

            isExecuting.current = true;
            try {
                return await fn(...args);
            } finally {
                setTimeout(() => {
                    isExecuting.current = false;
                }, delay);
            }
        },
        [fn, delay]
    ) as T;
}

/**
 * Hook to prevent double-click with immediate visual feedback
 * Returns a state indicating if action is executing
 */
export function useAsyncAction<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    delay: number = 500
): [T, boolean] {
    const isExecuting = useRef(false);
    const [isPending, setIsPending] = useState(false);

    const wrappedFn = useCallback(
        async (...args: Parameters<T>) => {
            if (isExecuting.current) {
                return;
            }

            isExecuting.current = true;
            setIsPending(true);
            try {
                return await fn(...args);
            } finally {
                setTimeout(() => {
                    isExecuting.current = false;
                    setIsPending(false);
                }, delay);
            }
        },
        [fn, delay]
    ) as T;

    return [wrappedFn, isPending];
}
