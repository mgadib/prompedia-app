import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';

/**
 * Formats a date string or object according to the specified locale code.
 * Used to ensure consistent date formatting across the app.
 * 
 * @param date - The date to format (string or Date object)
 * @param localeCode - The locale code (e.g., 'en', 'id')
 * @param formatStr - Optional format string (defaults to 'dd MMM yyyy')
 * @returns Formatted date string
 */
export const formatDate = (
    date: string | Date | null | undefined,
    localeCode: string = 'id',
    formatStr: string = 'dd MMM yyyy'
): string => {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Invalid date check
    if (isNaN(dateObj.getTime())) return '';

    const localeMap: Record<string, any> = {
        'en': enUS,
        'id': id,
        // Add other locales here if needed
    };

    // Fallback to Indonesian if locale not found, or use the detected locale
    // Note: The app defaults to 'id' but we want to map correctly.
    // If localeCode is complex (e.g. 'en-US'), we might need to normalize it.
    // For now, simple matching is sufficient as we control the keys.
    const selectedLocale = localeMap[localeCode] || localeMap[localeCode.split('-')[0]] || id;

    return format(dateObj, formatStr, { locale: selectedLocale });
};
