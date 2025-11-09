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

    // Check if all namespaces are already loaded
    const allLoaded = namespaces.every(ns => 
      i18n.hasResourceBundle(i18n.language || 'en', ns)
    );

    if (allLoaded) {
      setIsReady(true);
      setIsLoading(false);
      return;
    }

    // Load missing namespaces
    const loadNamespaces = async () => {
      setIsLoading(showLoading);
      setError(null);

      try {
        await ensureNamespacesLoaded(namespaces, i18n.language || 'en');
        setIsReady(true);
        setIsLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load translation namespaces');
        console.error('[useTranslationReady] Error loading namespaces:', error);
        setError(error);
        setIsLoading(false);
        // Still set ready to true to prevent infinite loading
        // The component can handle the error state
        setIsReady(true);
      }
    };

    loadNamespaces();
  }, [namespaces, i18n.language, showLoading, i18n]);

  // Reset ready state when language changes
  useEffect(() => {
    setIsReady(false);
  }, [i18n.language]);

  return { isReady, isLoading, error };
}

