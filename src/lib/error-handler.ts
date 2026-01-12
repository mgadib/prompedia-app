import { TFunction } from 'i18next';

/**
 * Standardized error handling utilities for Supabase operations.
 * Provides consistent error detection and user-friendly error messages.
 */

/**
 * Check if an error is a rate limit error (HTTP 429)
 */
export function isRateLimitError(error: unknown): boolean {
    if (error && typeof error === 'object') {
        // Check for status property
        if ('status' in error) {
            const status = (error as { status: number }).status;
            return status === 429;
        }
        // Check for message containing rate limit
        if ('message' in error) {
            const message = (error as { message: string }).message;
            return message.toLowerCase().includes('rate limit');
        }
    }
    return false;
}

/**
 * Handle Supabase errors and return user-friendly error messages.
 * 
 * @param error - The error object from Supabase
 * @param t - Translation function from i18next
 * @returns User-friendly error message
 */
export function handleSupabaseError(error: unknown, t: TFunction): string {
    if (!error) {
        return t('auth.error.generic', 'An error occurred');
    }

    // Handle rate limit errors
    if (isRateLimitError(error)) {
        return t('auth.error.rate_limited', 'Too many requests. Please try again later.');
    }

    // Handle Supabase Auth errors
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message: string }).message;
        
        // Map common Supabase errors to user-friendly messages
        if (message.includes('Invalid login credentials')) {
            return t('auth.error.invalid_credentials', 'Invalid email or password');
        }
        if (message.includes('User already registered')) {
            return t('auth.error.user_exists', 'An account with this email already exists');
        }
        if (message.includes('Email not confirmed')) {
            return t('auth.error.email_not_confirmed', 'Please confirm your email address');
        }
        
        // Return the error message as-is if no specific mapping
        return message;
    }

    // Fallback for unknown errors
    return t('auth.error.generic', 'An error occurred. Please try again.');
}

/**
 * Extract error message from unknown error type
 */
export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    return String(error || 'Unknown error');
}
