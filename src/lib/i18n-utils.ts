/**
 * i18n Utility Functions
 * 
 * Utilities for validating and testing i18n translations
 */

import i18n from '@/i18n';

/**
 * Test pluralization with various count values
 * @param key Translation key (without plural suffix)
 * @param counts Array of count values to test
 * @returns Object with test results
 */
export function testPluralization(key: string, counts: number[] = [0, 1, 2, 100]) {
    const results: Record<number, string> = {};
    
    for (const count of counts) {
        try {
            const translation = i18n.t(key, { count });
            results[count] = translation;
        } catch (error) {
            results[count] = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    
    return results;
}

/**
 * Test interpolation with various values
 * @param key Translation key
 * @param testCases Array of interpolation objects to test
 * @returns Object with test results
 */
export function testInterpolation(key: string, testCases: Array<Record<string, unknown>>) {
    const results: Array<{ input: Record<string, unknown>; output: string; error?: string }> = [];
    
    for (const testCase of testCases) {
        try {
            const translation = i18n.t(key, testCase);
            results.push({ input: testCase, output: translation });
        } catch (error) {
            results.push({
                input: testCase,
                output: '',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    
    return results;
}

/**
 * Validate that all placeholders in a translation string are provided
 * @param translation Translation string
 * @param values Interpolation values
 * @returns Array of missing placeholder names
 */
export function validatePlaceholders(translation: string, values: Record<string, unknown>): string[] {
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = placeholderRegex.exec(translation)) !== null) {
        placeholders.push(match[1]);
    }
    
    const missing = placeholders.filter(p => !(p in values));
    return missing;
}

/**
 * Get all placeholder names from a translation string
 * @param translation Translation string
 * @returns Array of placeholder names
 */
export function extractPlaceholders(translation: string): string[] {
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    const placeholders: string[] = [];
    let match;
    
    while ((match = placeholderRegex.exec(translation)) !== null) {
        placeholders.push(match[1]);
    }
    
    return [...new Set(placeholders)]; // Remove duplicates
}

/**
 * Validate that a translation key exists
 * @param key Translation key
 * @returns true if key exists, false otherwise
 */
export function keyExists(key: string): boolean {
    try {
        const translation = i18n.t(key, { returnObjects: true });
        // If translation is the same as key, it means the key doesn't exist
        return translation !== key;
    } catch {
        return false;
    }
}

/**
 * Get all nested keys from a translation object
 * @param obj Translation object
 * @param prefix Prefix for nested keys
 * @returns Array of all keys (including nested)
 */
export function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys.push(...getAllKeys(obj[key] as Record<string, unknown>, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    
    return keys;
}

/**
 * Example usage for testing pluralization
 * 
 * // Test list.title with various counts
 * const results = testPluralization('list.title', [0, 1, 2, 100]);
 * // Expected output for English:
 * // {
 * //   0: "All Prompts (0)",
 * //   1: "All Prompt (1)",
 * //   2: "All Prompts (2)",
 * //   100: "All Prompts (100)"
 * // }
 * 
 * // Test interpolation
 * const interpolationResults = testInterpolation('list.showing', [
 *   { start: 1, end: 10, total: 50 },
 *   { start: 1, end: 1, total: 1 }
 * ]);
 * 
 * // Validate key exists
 * if (keyExists('list.title')) {
 *   // Key exists
 * }
 */
