import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { handleSupabaseError, isRateLimitError } from '@/lib/error-handler';

/**
 * Authentication hook that manages user session and auth operations.
 * Extracted from PromptNotes to provide reusable auth logic.
 */
export function useAuth() {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Check initial session and listen for auth changes
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setError('');
        });

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Login with email and password
     */
    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setError('');
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
            
            if (authError) {
                const errorMessage = handleSupabaseError(authError, t);
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
            
            return { success: true };
        } catch (err) {
            const errorMessage = handleSupabaseError(err, t);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [t]);

    /**
     * Register new user with email and password
     */
    const register = useCallback(async (
        email: string,
        password: string,
        displayName?: string
    ): Promise<{ success: boolean; error?: string }> => {
        setError('');
        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName || '',
                        username: email.split('@')[0]
                    }
                }
            });
            
            if (authError) {
                const errorMessage = handleSupabaseError(authError, t);
                setError(errorMessage);
                return { success: false, error: errorMessage };
            }
            
            return { success: true };
        } catch (err) {
            const errorMessage = handleSupabaseError(err, t);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, [t]);

    /**
     * Logout current user
     */
    const logout = useCallback(async (): Promise<void> => {
        // Use local scope to avoid 403 on global signout when session is invalid
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
        setError('');
    }, []);

    /**
     * Clear error message
     */
    const clearError = useCallback(() => {
        setError('');
    }, []);

    return {
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user,
    };
}
