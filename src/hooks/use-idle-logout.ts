import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseIdleLogoutOptions {
    timeoutMs?: number;
    onLogout?: () => void;
    enabled?: boolean;
}

/**
 * Hook untuk auto-logout setelah periode tidak aktif
 * Default: 27 menit (1620000 ms)
 */
export const useIdleLogout = ({
    timeoutMs = 27 * 60 * 1000, // 27 minutes
    onLogout,
    enabled = true,
}: UseIdleLogoutOptions = {}) => {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    const logout = useCallback(async () => {
        // Use local scope to avoid 403 on global signout
        await supabase.auth.signOut({ scope: 'local' });
        onLogout?.();
    }, [onLogout]);

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (enabled) {
            timeoutRef.current = setTimeout(() => {
                logout();
            }, timeoutMs);
        }
    }, [enabled, timeoutMs, logout]);

    useEffect(() => {
        if (!enabled) return;

        // Events yang menandakan aktivitas user
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
            'focus',
        ];

        // Handler untuk reset timer saat ada aktivitas
        const handleActivity = () => {
            resetTimer();
        };

        // Pasang event listeners
        activityEvents.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Mulai timer pertama kali
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            activityEvents.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [enabled, resetTimer]);

    return {
        resetTimer,
        lastActivity: lastActivityRef.current,
    };
};
