import i18n from './i18n';

// Track logged errors untuk mencegah spam
const loggedNamespaceErrors = new Set<string>();

/**
 * Ensure a namespace is loaded for the current language
 * Returns a promise that resolves when the namespace is loaded
 * Improved: handles failed namespaces gracefully without throwing
 */
export async function ensureNamespaceLoaded(namespace: string, language?: string): Promise<void> {
  const lng = language || i18n.language || 'en';
  
  // If namespace is already loaded, return immediately
  if (i18n.hasResourceBundle(lng, namespace)) {
    return;
  }
  
  // Load the namespace
  try {
    await i18n.loadNamespaces(namespace);
    
    // Verify it was loaded
    if (!i18n.hasResourceBundle(lng, namespace)) {
      // Check if this is a known failed namespace (empty object was returned)
      // In this case, don't throw - just log once and return
      const errorKey = `${lng}:${namespace}`;
      if (!loggedNamespaceErrors.has(errorKey)) {
        loggedNamespaceErrors.add(errorKey);
        console.warn(`[i18n-utils] Namespace ${namespace} for language ${lng} failed to load or returned empty. This may be expected if the file doesn't exist.`);
      }
      // Don't throw - allow component to continue with empty translations
      return;
    }
  } catch (error) {
    // Only log error once per namespace
    const errorKey = `${lng}:${namespace}`;
    if (!loggedNamespaceErrors.has(errorKey)) {
      loggedNamespaceErrors.add(errorKey);
      console.error(`[i18n-utils] Error ensuring namespace ${namespace} is loaded:`, error);
    }
    // Don't throw - allow component to continue even if translation fails
    // This prevents infinite retry loops
    return;
  }
}

/**
 * Ensure multiple namespaces are loaded
 */
export async function ensureNamespacesLoaded(namespaces: string[], language?: string): Promise<void> {
  await Promise.all(namespaces.map(ns => ensureNamespaceLoaded(ns, language)));
}

/**
 * Check if a namespace is loaded for the current language
 */
export function isNamespaceLoaded(namespace: string, language?: string): boolean {
  const lng = language || i18n.language || 'en';
  return i18n.hasResourceBundle(lng, namespace);
}

/**
 * Check if multiple namespaces are loaded
 */
export function areNamespacesLoaded(namespaces: string[], language?: string): boolean {
  return namespaces.every(ns => isNamespaceLoaded(ns, language));
}

