import { z } from 'zod';
import { VALIDATION } from '@/lib/constants';
import { getValidationMessage } from '@/lib/i18n-helpers';

/**
 * Authentication validation schemas
 * Lazy loaded to reduce initial bundle size
 */

// Schema dasar untuk auth
export const emailSchema = z
  .string()
  .email(getValidationMessage('user.emailInvalid'))
  .min(1, getValidationMessage('emailRequired'));

export const passwordSchema = z
  .string()
  .min(VALIDATION.USER.PASSWORD_MIN_LENGTH, getValidationMessage('passwordMinLength', { min: VALIDATION.USER.PASSWORD_MIN_LENGTH }));

// Schema autentikasi
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: getValidationMessage('passwordMismatch'),
  path: ['confirmPassword'],
});

// Ekspor type untuk digunakan di tempat lain
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

