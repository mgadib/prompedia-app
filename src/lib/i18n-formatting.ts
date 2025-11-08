import i18n from './i18n';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, id } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  en: enUS,
  'en-US': enUS,
  id: id,
  'id-ID': id,
};

/**
 * Get current locale for date-fns
 */
export const getDateLocale = (): Locale => {
  const currentLang = i18n.language;
  return localeMap[currentLang] || localeMap[currentLang.split('-')[0]] || enUS;
};

/**
 * Format date using current locale
 */
export const formatDate = (date: Date | string, formatStr: string = 'PP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getDateLocale();
  return format(dateObj, formatStr, { locale });
};

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getDateLocale();
  return formatDistanceToNow(dateObj, { addSuffix: true, locale });
};

/**
 * Format number using current locale
 */
export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  const currentLang = i18n.language;
  const locale = currentLang.split('-')[0];
  return new Intl.NumberFormat(locale, options).format(value);
};

/**
 * Format currency using current locale
 */
export const formatCurrency = (value: number, currency: string = 'USD', options?: Intl.NumberFormatOptions): string => {
  const currentLang = i18n.language;
  const locale = currentLang.split('-')[0];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
};

