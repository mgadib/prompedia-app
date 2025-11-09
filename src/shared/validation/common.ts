import { z } from 'zod';
import { VALIDATION } from '@/lib/constants';
import { getValidationMessage, getErrorMessage } from '@/lib/i18n-helpers';

/**
 * Common validation utilities and shared schemas
 * Used across multiple features
 */

// Common utility functions
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Memvalidasi data terhadap schema Zod dan melempar ValidationError jika gagal
 * @param schema - Schema Zod untuk validasi
 * @param data - Data yang akan divalidasi
 * @returns Data yang sudah divalidasi
 * @throws ValidationError jika validasi gagal
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      if (firstError) {
        throw new ValidationError(
          firstError.message,
          firstError.path.join('.'),
          firstError.code
        );
      }
    }
    throw error;
  }
}

/**
 * Memvalidasi data dengan aman dan mengembalikan hasil dengan informasi error
 * Tidak melempar error, melainkan mengembalikan object dengan status success/error
 * @param schema - Schema Zod untuk validasi
 * @param data - Data yang akan divalidasi
 * @returns Object dengan status success dan data/error
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const validData = validateData(schema, data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error };
    }
    return { 
      success: false, 
      error: new ValidationError(getErrorMessage('validation')) 
    };
  }
}

/**
 * Memvalidasi format email menggunakan regex
 * @param email - String email yang akan divalidasi
 * @returns true jika format email valid
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION.USER.EMAIL_REGEX.test(email);
}

/**
 * Memvalidasi kekuatan password berdasarkan panjang minimum
 * @param password - String password yang akan divalidasi
 * @returns true jika password memenuhi panjang minimum
 */
export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION.USER.PASSWORD_MIN_LENGTH;
}

/**
 * Menyucikan input string dengan trimming dan menghapus karakter berbahaya
 * Versi yang ditingkatkan dengan perlindungan komprehensif terhadap XSS dan injection attacks
 * @param input - String yang akan disucikan
 * @param maxLength - Panjang maksimum yang diizinkan (default: 50000)
 * @returns String yang sudah disucikan
 * @throws ValidationError jika input melebihi maxLength
 */
export function sanitizeString(input: string, maxLength: number = 50000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Menerapkan batas panjang SEBELUM pemrosesan untuk efisiensi
  if (input.length > maxLength) {
    throw new ValidationError(getValidationMessage('inputExceedsMaxLength', { maxLength }));
  }

  return input
    .trim()
    // Menghapus semua tag HTML untuk mencegah XSS
    .replace(/<[^>]*>/g, '')
    // Menghapus protocol javascript: untuk mencegah code injection
    .replace(/javascript:/gi, '')
    // Menghapus protocol data: untuk mencegah base64 exploits
    .replace(/data:/gi, '')
    // Menghapus event handlers (onclick, onerror, dll)
    .replace(/on\w+\s*=/gi, '')
    // Menghapus konten script tags secara eksplisit
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Normalisasi Unicode untuk mencegah homograph attacks
    .normalize('NFKC')
    // Menghapus null bytes yang bisa menyebabkan masalah
    .replace(/\0/g, '')
    // Menghapus karakter kontrol kecuali newlines dan tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Schema user (diperbarui untuk database minimalis)
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string()
    .min(1, getValidationMessage('usernameRequired'))
    .max(50, getValidationMessage('usernameTooLong', { max: 50 })),
  display_name: z.string()
    .min(1, getValidationMessage('displayNameRequired'))
    .max(100, getValidationMessage('displayNameTooLong', { max: 100 })),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

