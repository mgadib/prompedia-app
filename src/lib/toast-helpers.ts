import { toast } from 'sonner';
import i18n from './i18n';

/**
 * Helper functions for showing toast messages with i18n translation
 * These functions ensure consistent toast usage throughout the application
 */

/**
 * Show success toast with translation
 */
export const showSuccessToast = (key: string, options?: Record<string, unknown>) => {
  const message = i18n.t(key, options);
  toast.success(message, { duration: 1777 });
};

/**
 * Show error toast with translation
 */
export const showErrorToast = (key: string, options?: Record<string, unknown>) => {
  const message = i18n.t(key, options);
  toast.error(message, { duration: 1777 });
};

/**
 * Show warning toast with translation
 */
export const showWarningToast = (key: string, options?: Record<string, unknown>) => {
  const message = i18n.t(key, options);
  toast.warning(message, { duration: 1777 });
};

/**
 * Show info toast with translation
 */
export const showInfoToast = (key: string, options?: Record<string, unknown>) => {
  const message = i18n.t(key, options);
  toast.info(message, { duration: 1777 });
};

/**
 * Show loading toast with translation
 */
export const showLoadingToast = (key: string, options?: Record<string, unknown>) => {
  const message = i18n.t(key, options);
  return toast.loading(message, { duration: 1777 });
};

/**
 * Show error toast with fallback to error message if translation key fails
 * Useful when error messages come from external sources
 */
export const showErrorToastWithFallback = (
  translationKey: string,
  error: unknown,
  fallbackKey?: string
) => {
  let message: string;
  
  if (error instanceof Error && error.message) {
    // Try to use the error message if it's a known error type
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
      message = i18n.t('errors:actions.serviceLimitReached');
    } else if (errorMsg.includes('api key') || errorMsg.includes('401')) {
      message = i18n.t('errors:actions.apiAuthFailed');
    } else if (errorMsg.includes('timeout')) {
      message = i18n.t('errors:actions.requestTimeout');
    } else {
      // Use translation key, fallback to error message if translation fails
      try {
        message = i18n.t(translationKey);
        // If translation returns the key itself (not found), use fallback
        if (message === translationKey && fallbackKey) {
          message = i18n.t(fallbackKey);
        } else if (message === translationKey) {
          message = error.message;
        }
      } catch {
        message = fallbackKey ? i18n.t(fallbackKey) : error.message;
      }
    }
  } else {
    try {
      message = i18n.t(translationKey);
      if (message === translationKey && fallbackKey) {
        message = i18n.t(fallbackKey);
      } else if (message === translationKey) {
        message = String(error);
      }
    } catch {
      message = fallbackKey ? i18n.t(fallbackKey) : String(error);
    }
  }
  
  toast.error(message, { duration: 1777 });
};

