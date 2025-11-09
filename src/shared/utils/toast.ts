import { toast as sonnerToast } from 'sonner';
import { getErrorMessage, getSuccessMessage, getCommonMessage } from '@/lib/i18n-helpers';
import type { I18nOptions } from '@/shared/types/api';

/**
 * Standardized toast notification utilities
 * Consolidates toast patterns across the application
 */

export const toast = {
  /**
   * Show error toast
   */
  error: (message: string, options?: I18nOptions) => {
    return sonnerToast.error(getErrorMessage(message, options));
  },

  /**
   * Show success toast
   */
  success: (message: string, options?: I18nOptions) => {
    return sonnerToast.success(getSuccessMessage(message, options));
  },

  /**
   * Show info toast
   */
  info: (message: string, options?: I18nOptions) => {
    return sonnerToast.info(getCommonMessage(message, options));
  },

  /**
   * Show warning toast
   */
  warning: (message: string, options?: I18nOptions) => {
    return sonnerToast.warning(getCommonMessage(message, options));
  },

  /**
   * Show loading toast
   */
  loading: (message: string, options?: I18nOptions) => {
    return sonnerToast.loading(getCommonMessage(message, options));
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
    options?: I18nOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: getCommonMessage(loading, options),
      success: typeof success === 'function' 
        ? (data: T) => getCommonMessage(success(data), options)
        : getCommonMessage(success, options),
      error: typeof error === 'function'
        ? (err: unknown) => getErrorMessage(error(err), options)
        : getErrorMessage(error, options),
    });
  },
};

