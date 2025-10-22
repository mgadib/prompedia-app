import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setUser, clearUser } from '@/lib/storage';

/**
 * Custom hook for managing authentication state and operations
 * Follows Single Responsibility Principle by isolating auth logic
 */
export const useAuth = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          setUserState(session?.user ?? null);
          if (session?.user) {
            setUser(session.user);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setUserState(session?.user ?? null);
          if (session?.user) {
            setUser(session.user);
          } else {
            clearUser();
          }
          setError(null);
        } catch (err) {
          console.error('Auth state change error:', err);
          setError('Authentication error occurred');
        }
      }
    );

    return () => subscription.unsubscribe();
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
      setError('Failed to logout');
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