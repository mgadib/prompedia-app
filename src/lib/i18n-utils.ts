import i18n from './i18n';

/**
 * Ensure a namespace is loaded for the current language
 * Returns a promise that resolves when the namespace is loaded
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
      throw new Error(`Failed to load namespace: ${namespace} for language: ${lng}`);
    }
  } catch (error) {
    console.error(`Error ensuring namespace ${namespace} is loaded:`, error);
    throw error;
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

