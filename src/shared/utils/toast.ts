import { toast as sonnerToast } from 'sonner';
import { getErrorMessage, getSuccessMessage, getCommonMessage } from '@/lib/i18n-helpers';
import type { I18nOptions } from '@/shared/types/api';

/**
 * Sonner toast options (excluding message)
 */
type SonnerToastOptions = {
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  description?: string;
  duration?: number;
  id?: string | number;
  onDismiss?: (toastId: string | number) => void;
  onAutoClose?: (toastId: string | number) => void;
  unstyled?: boolean;
  className?: string;
  classNames?: {
    toast?: string;
    title?: string;
    description?: string;
    actionButton?: string;
    cancelButton?: string;
    closeButton?: string;
    loader?: string;
  };
  style?: React.CSSProperties;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

/**
 * Combined options for toast - includes both i18n interpolation options and sonner options
 */
type ToastOptions = I18nOptions & SonnerToastOptions;

/**
 * Translation key pattern - keys typically use dots for nesting and don't contain spaces
 * Examples: 'prompt.deleted', 'errors.auth.loginFailed', 'warnings.remainingCalls'
 */
const TRANSLATION_KEY_PATTERN = /^[a-zA-Z0-9._:]+$/;

/**
 * Check if a string looks like a translation key
 * Translation keys:
 * - Use dots for nesting (e.g., 'prompt.deleted')
 * - May contain colons for namespace (e.g., 'success:prompt.deleted')
 * - Don't contain spaces (unless it's a special case)
 * - Match the key pattern
 */
function looksLikeTranslationKey(str: string): boolean {
  // Empty string is not a key
  if (!str || str.trim().length === 0) {
    return false;
  }
  
  // If it contains namespace separator (:), it's definitely a key
  if (str.includes(':')) {
    return true;
  }
  
  // If it matches the key pattern (dots, alphanumeric, underscores) and has no spaces, it's likely a key
  if (TRANSLATION_KEY_PATTERN.test(str) && !str.includes(' ')) {
    return true;
  }
  
  // If it has spaces, it's likely already translated (unless it's a very specific key format)
  // Most translation keys don't have spaces
  if (str.includes(' ')) {
    return false;
  }
  
  // Default: if it matches key pattern, treat as key
  return TRANSLATION_KEY_PATTERN.test(str);
}

/**
 * Extract translation key from a string, handling namespace prefixes
 * 
 * @param str - The string to extract key from
 * @param namespace - The default namespace to use if not specified in the string
 * @returns The translation key without namespace prefix
 */
function getTranslationKey(str: string, _namespace: 'errors' | 'success' | 'common'): string {
  // If it contains namespace separator, extract key after namespace
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length > 1) {
      // Return the key part after namespace (e.g., 'success:prompt.deleted' -> 'prompt.deleted')
      return parts.slice(1).join(':');
    }
  }
  
  // Return as-is if it looks like a key
  return str;
}

/**
 * Check if a string is already translated (not a translation key)
 * 
 * This function uses heuristics to determine if a string is:
 * - Already translated (contains spaces, doesn't match key pattern)
 * - A translation key (matches key pattern, no spaces, uses dots)
 */
function isAlreadyTranslated(str: string): boolean {
  // Empty string is not translated
  if (!str || str.trim().length === 0) {
    return false;
  }
  
  // If it contains namespace separator, it's definitely a key (not translated)
  if (str.includes(':')) {
    return false;
  }
  
  // If it looks like a translation key, it's not translated yet
  if (looksLikeTranslationKey(str)) {
    return false;
  }
  
  // If it has spaces and doesn't match key pattern, it's likely already translated
  // Most translation keys don't have spaces
  if (str.includes(' ')) {
    return true;
  }
  
  // Default: if it doesn't look like a key, assume it's already translated
  // This is a conservative approach - better to translate a key twice than to show a key to users
  return true;
}

/**
 * Extract i18n options from combined options
 */
function extractI18nOptions(options?: ToastOptions): I18nOptions | undefined {
  if (!options) return undefined;
  
  const { action, cancel, description, duration, id, onDismiss, onAutoClose, unstyled, className, classNames, style, position, ...i18nOptions } = options;
  
  // Return only i18n-related options (interpolation values)
  return Object.keys(i18nOptions).length > 0 ? i18nOptions : undefined;
}

/**
 * Extract sonner options from combined options
 */
function extractSonnerOptions(options?: ToastOptions): SonnerToastOptions | undefined {
  if (!options) return undefined;
  
  const { action, cancel, description, duration, id, onDismiss, onAutoClose, unstyled, className, classNames, style, position } = options;
  
  const sonnerOpts: SonnerToastOptions = {};
  if (action) sonnerOpts.action = action;
  if (cancel) sonnerOpts.cancel = cancel;
  if (description) sonnerOpts.description = description;
  if (duration !== undefined) sonnerOpts.duration = duration;
  if (id !== undefined) sonnerOpts.id = id;
  if (onDismiss) sonnerOpts.onDismiss = onDismiss;
  if (onAutoClose) sonnerOpts.onAutoClose = onAutoClose;
  if (unstyled !== undefined) sonnerOpts.unstyled = unstyled;
  if (className) sonnerOpts.className = className;
  if (classNames) sonnerOpts.classNames = classNames;
  if (style) sonnerOpts.style = style;
  if (position) sonnerOpts.position = position;
  
  return Object.keys(sonnerOpts).length > 0 ? sonnerOpts : undefined;
}

/**
 * Standardized toast notification utilities
 * Consolidates toast patterns across the application
 * 
 * Usage:
 * - toast.success('prompt.deleted', { action: {...} }) - key without prefix, helper adds 'success:' prefix
 * - toast.error('prompt.notFound') - key without prefix, helper adds 'errors:' prefix
 * - toast.warning('warnings.remainingDailyCalls', { count: 5 }) - with interpolation
 */
export const toast = {
  /**
   * Show error toast
   * @param message - i18n key without 'errors:' prefix, or already translated string
   * @param options - Combined i18n and sonner options
   */
  error: (message: string, options?: ToastOptions) => {
    const i18nOpts = extractI18nOptions(options);
    const sonnerOpts = extractSonnerOptions(options);
    
    // If already translated, use as-is; otherwise treat as key and translate
    const translatedMessage = isAlreadyTranslated(message)
      ? message
      : getErrorMessage(getTranslationKey(message, 'errors'), i18nOpts);
    
    return sonnerToast.error(translatedMessage, sonnerOpts as any);
  },

  /**
   * Show success toast
   * @param message - i18n key without 'success:' prefix, or already translated string
   * @param options - Combined i18n and sonner options
   */
  success: (message: string, options?: ToastOptions) => {
    const i18nOpts = extractI18nOptions(options);
    const sonnerOpts = extractSonnerOptions(options);
    
    const translatedMessage = isAlreadyTranslated(message)
      ? message
      : getSuccessMessage(getTranslationKey(message, 'success'), i18nOpts);
    
    return sonnerToast.success(translatedMessage, sonnerOpts as any);
  },

  /**
   * Show info toast
   * @param message - i18n key without 'common:' prefix, or already translated string
   * @param options - Combined i18n and sonner options
   */
  info: (message: string, options?: ToastOptions) => {
    const i18nOpts = extractI18nOptions(options);
    const sonnerOpts = extractSonnerOptions(options);
    
    const translatedMessage = isAlreadyTranslated(message)
      ? message
      : getCommonMessage(getTranslationKey(message, 'common'), i18nOpts);
    
    return sonnerToast.info(translatedMessage, sonnerOpts as any);
  },

  /**
   * Show warning toast
   * @param message - i18n key without 'common:' prefix, or already translated string
   * @param options - Combined i18n and sonner options
   */
  warning: (message: string, options?: ToastOptions) => {
    const i18nOpts = extractI18nOptions(options);
    const sonnerOpts = extractSonnerOptions(options);
    
    const translatedMessage = isAlreadyTranslated(message)
      ? message
      : getCommonMessage(getTranslationKey(message, 'common'), i18nOpts);
    
    return sonnerToast.warning(translatedMessage, sonnerOpts as any);
  },

  /**
   * Show loading toast
   * @param message - i18n key without 'common:' prefix, or already translated string
   * @param options - Combined i18n and sonner options
   */
  loading: (message: string, options?: ToastOptions) => {
    const i18nOpts = extractI18nOptions(options);
    const sonnerOpts = extractSonnerOptions(options);
    
    const translatedMessage = isAlreadyTranslated(message)
      ? message
      : getCommonMessage(getTranslationKey(message, 'common'), i18nOpts);
    
    return sonnerToast.loading(translatedMessage, sonnerOpts as any);
  },

  /**
   * Show promise toast
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options?: ToastOptions
  ) => {
    const i18nOpts = extractI18nOptions(options);
    const sonnerOpts = extractSonnerOptions(options);
    
    return sonnerToast.promise(
      promise, 
      {
        loading: isAlreadyTranslated(loading)
          ? loading
          : getCommonMessage(getTranslationKey(loading, 'common'), i18nOpts),
        success: typeof success === 'function' 
          ? (data: T) => {
              const msg = success(data);
              return isAlreadyTranslated(msg) 
                ? msg 
                : getCommonMessage(getTranslationKey(msg, 'common'), i18nOpts);
            }
          : (isAlreadyTranslated(success) 
              ? success 
              : getCommonMessage(getTranslationKey(success, 'common'), i18nOpts)),
        error: typeof error === 'function'
          ? (err: unknown) => {
              const msg = error(err);
              return isAlreadyTranslated(msg)
                ? msg
                : getErrorMessage(getTranslationKey(msg, 'errors'), i18nOpts);
            }
          : (isAlreadyTranslated(error)
              ? error
              : getErrorMessage(getTranslationKey(error, 'errors'), i18nOpts)),
        ...(sonnerOpts || {})
      } as any
    );
  },
};

