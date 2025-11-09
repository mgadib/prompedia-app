import i18n from './i18n';

/**
 * Get translated error message
 * Use this in non-React contexts (utilities, services, etc.)
 */
export const getErrorMessage = (key: string, options?: any): string => {
  return i18n.t(`errors:${key}`, options) as string;
};

/**
 * Get translated success message
 * Use this in non-React contexts
 */
export const getSuccessMessage = (key: string, options?: any): string => {
  return i18n.t(`success:${key}`, options) as string;
};

/**
 * Get translated common message
 * Use this in non-React contexts
 */
export const getCommonMessage = (key: string, options?: any): string => {
  return i18n.t(`common:${key}`, options) as string;
};

/**
 * Get translated validation message
 * Use this in validation schemas and validation utilities
 */
export const getValidationMessage = (key: string, options?: any): string => {
  return i18n.t(`validation:${key}`, options) as string;
};

/**
 * Get translated storage error message
 * Use this for storage-related errors
 */
export const getStorageErrorMessage = (key: string, options?: any): string => {
  return i18n.t(`errors:storage.${key}`, options) as string;
};

/**
 * Get translated service error message
 * Use this for service-related errors
 */
export const getServiceErrorMessage = (key: string, options?: any): string => {
  return i18n.t(`errors:service.${key}`, options) as string;
};

