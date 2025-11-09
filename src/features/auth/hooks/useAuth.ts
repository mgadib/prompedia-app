import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearUser } from '@/lib/storage';
import { authManager } from '@/lib/auth-manager';
import { getErrorMessage } from '@/lib/i18n-helpers';

/**
 * Custom hook untuk mengelola state dan operasi autentikasi
 * OPTIMIZED: Menggunakan shared AuthManager untuk mengurangi duplicate getSession() calls
 */
export const useAuth = () => {
  const [user, setUserState] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // OPTIMIZED: Use cached user immediately for faster initial render
    const cachedUser = authManager.getCachedUser();
    if (cachedUser) {
      setUserState(cachedUser);
      setLoading(false);
    }

    // Get initial session dengan caching
    const getInitialSession = async () => {
      try {
        const session = await authManager.getSession();
        if (session?.user) {
          setUserState(session.user);
        } else {
          setUserState(null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(getErrorMessage('auth.unexpectedError'));
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // OPTIMIZED: Use shared auth state change listener
    const unsubscribe = authManager.onAuthStateChange((newUser) => {
      try {
        setUserState(newUser);
        if (!newUser) {
          clearUser();
        }
        setError(null);
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(getErrorMessage('auth.authenticationError'));
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        throw error;
      }
      clearUser();
      setUserState(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(getErrorMessage('auth.logoutFailedGeneric'));
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    logout,
    isAuthenticated: !!user
  };
};