import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ensureNamespacesLoaded } from '@/lib/i18n-utils';

interface UseTranslationReadyOptions {
  /**
   * Namespaces to wait for before considering translations ready
   */
  namespaces?: string[];
  /**
   * Whether to show loading state while namespaces are being loaded
   */
  showLoading?: boolean;
}

interface UseTranslationReadyResult {
  /**
   * Whether the required namespaces are loaded and ready
   */
  isReady: boolean;
  /**
   * Whether namespaces are currently being loaded
   */
  isLoading: boolean;
  /**
   * Any error that occurred during loading
   */
  error: Error | null;
}

/**
 * Hook to wait for translation namespaces to be loaded before rendering
 * 
 * @example
 * ```tsx
 * const { isReady, isLoading } = useTranslationReady({ namespaces: ['library', 'auth'] });
 * 
 * if (!isReady) {
 *   return <LoadingSpinner />;
 * }
 * 
 * return <ComponentThatUsesTranslations />;
 * ```
 */
// Cache untuk track failed loading attempts per namespace (mencegah infinite retry)
const failedLoadingAttempts = new Map<string, number>();
const MAX_RETRY_ATTEMPTS = 2; // Maximum retry attempts sebelum give up

export function useTranslationReady(
  options: UseTranslationReadyOptions = {}
): UseTranslationReadyResult {
  const { namespaces = [], showLoading = true } = options;
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no namespaces specified, consider ready immediately
    if (namespaces.length === 0) {
      setIsReady(true);
      return;
    }

    const language = i18n.language || 'en';
    
    // Check if all namespaces are already loaded
    const allLoaded = namespaces.every(ns => 
      i18n.hasResourceBundle(language, ns)
    );

    if (allLoaded) {
      setIsReady(true);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check if any namespace has exceeded max retry attempts
    const hasFailedNamespaces = namespaces.some(ns => {
      const key = `${language}:${ns}`;
      const attempts = failedLoadingAttempts.get(key) || 0;
      return attempts >= MAX_RETRY_ATTEMPTS;
    });

    // If we have failed namespaces, set ready immediately to prevent infinite loop
    if (hasFailedNamespaces) {
      setIsReady(true);
      setIsLoading(false);
      setError(new Error('Some translation namespaces failed to load'));
      return;
    }

    // Load missing namespaces
    const loadNamespaces = async () => {
      setIsLoading(showLoading);
      setError(null);

      try {
        await ensureNamespacesLoaded(namespaces, language);
        
        // Check if all namespaces are now loaded
        const allNowLoaded = namespaces.every(ns => 
          i18n.hasResourceBundle(language, ns)
        );
        
        if (allNowLoaded) {
          // Reset failed attempts on success
          namespaces.forEach(ns => {
            const key = `${language}:${ns}`;
            failedLoadingAttempts.delete(key);
          });
        } else {
          // Some namespaces failed to load, increment attempt counter
          namespaces.forEach(ns => {
            if (!i18n.hasResourceBundle(language, ns)) {
              const key = `${language}:${ns}`;
              const attempts = (failedLoadingAttempts.get(key) || 0) + 1;
              failedLoadingAttempts.set(key, attempts);
            }
          });
        }
        
        setIsReady(true);
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load translation namespaces');
        
        // Increment failed attempts for all namespaces
        namespaces.forEach(ns => {
          const key = `${language}:${ns}`;
          const attempts = (failedLoadingAttempts.get(key) || 0) + 1;
          failedLoadingAttempts.set(key, attempts);
        });
        
        // Only log error if not exceeded max attempts (to prevent spam)
        const maxAttemptsReached = namespaces.some(ns => {
          const key = `${language}:${ns}`;
          return (failedLoadingAttempts.get(key) || 0) >= MAX_RETRY_ATTEMPTS;
        });
        
        if (!maxAttemptsReached) {
          console.error('[useTranslationReady] Error loading namespaces:', error);
        }
        
        setError(error);
        setIsLoading(false);
        // Still set ready to true to prevent infinite loading
        // The component can handle the error state
        setIsReady(true);
      }
    };

    loadNamespaces();
  }, [namespaces, i18n.language, showLoading]);

  // Reset ready state when language changes
  useEffect(() => {
    setIsReady(false);
  }, [i18n.language]);

  return { isReady, isLoading, error };
}

