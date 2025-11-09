import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES } from '@/lib/constants';

/**
 * Authentication validation schemas
 * Lazy loaded to reduce initial bundle size
 */

// Schema dasar untuk auth
export const emailSchema = z
  .string()
  .email(ERROR_MESSAGES.AUTH.LOGIN_FAILED)
  .min(1, 'Email wajib diisi');

export const passwordSchema = z
  .string()
  .min(VALIDATION.USER.PASSWORD_MIN_LENGTH, `Password minimal ${VALIDATION.USER.PASSWORD_MIN_LENGTH} karakter`);

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
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

// Ekspor type untuk digunakan di tempat lain
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

