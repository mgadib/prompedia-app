import i18n from './i18n';

/**
 * Get translated error message
 * Use this in non-React contexts (utilities, services, etc.)
 */
export const getErrorMessage = (key: string, options?: any): string => {
  return i18n.t(`errors:${key}`, options);
};

/**
 * Get translated success message
 * Use this in non-React contexts
 */
export const getSuccessMessage = (key: string, options?: any): string => {
  return i18n.t(`success:${key}`, options);
};

/**
 * Get translated common message
 * Use this in non-React contexts
 */
export const getCommonMessage = (key: string, options?: any): string => {
  return i18n.t(`common:${key}`, options);
};

