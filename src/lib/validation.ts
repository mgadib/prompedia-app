import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES } from './constants';

/**
 * Validation schemas and utilities
 * Centralized validation logic using Zod for type safety
 */

// Base schemas
export const emailSchema = z
  .string()
  .email(ERROR_MESSAGES.AUTH.LOGIN_FAILED)
  .min(1, 'Email wajib diisi');

export const passwordSchema = z
  .string()
  .min(VALIDATION.USER.PASSWORD_MIN_LENGTH, `Password minimal ${VALIDATION.USER.PASSWORD_MIN_LENGTH} karakter`);

// Prompt validation schemas
export const promptTitleSchema = z
  .string()
  .min(VALIDATION.PROMPT.TITLE_MIN_LENGTH, ERROR_MESSAGES.PROMPT.TITLE_REQUIRED)
  .max(VALIDATION.PROMPT.TITLE_MAX_LENGTH, ERROR_MESSAGES.PROMPT.TITLE_TOO_LONG)
  .trim();

export const promptContentSchema = z
  .string()
  .max(VALIDATION.PROMPT.CONTENT_MAX_LENGTH, ERROR_MESSAGES.PROMPT.CONTENT_TOO_LONG);

export const promptTagSchema = z
  .string()
  .max(VALIDATION.PROMPT.TAG_MAX_LENGTH, `Tag maksimal ${VALIDATION.PROMPT.TAG_MAX_LENGTH} karakter`)
  .trim();

export const promptTagsSchema = z
  .array(promptTagSchema)
  .max(VALIDATION.PROMPT.TAGS_MAX_COUNT, `Maksimal ${VALIDATION.PROMPT.TAGS_MAX_COUNT} tag`);

// Complete prompt schema (updated for minimalist database)
export const promptSchema = z.object({
  id: z.string().uuid().optional(),
  title: promptTitleSchema,
  content: promptContentSchema,
  model: z.string().min(1, 'Model wajib dipilih'),
  mode: z.enum(['meta-prompt', 'self-refine', 'chain-of-thought', 'self-consistency', 'chain-of-prompt', 'role-prompt', 'normal'], {
    errorMap: () => ({ message: 'Mode tidak valid' })
  }),
  color: z.string().default('#3b82f6'),
  is_public: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  description: z.string().nullable().optional(),
  original_prompt_id: z.string().uuid().nullable().optional(),
  user_id: z.string().optional(),
  // Note: tags are now handled via prompt_tags junction table
  // created_at and updated_at are not stored in the minimal schema
});

// Auth schemas
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

// User schema (updated for minimalist database)
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1, 'Username wajib diisi').max(50, 'Username terlalu panjang'),
  display_name: z.string().min(1, 'Nama tampilan wajib diisi').max(100, 'Nama terlalu panjang'),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
});

// Validation utility functions
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
 * Validates data against a Zod schema and throws ValidationError on failure
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.message,
        firstError.path.join('.'),
        firstError.code
      );
    }
    throw error;
  }
}

/**
 * Safely validates data and returns result with error information
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
      error: new ValidationError(ERROR_MESSAGES.VALIDATION) 
    };
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION.USER.EMAIL_REGEX.test(email);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= VALIDATION.USER.PASSWORD_MIN_LENGTH;
}

/**
 * Sanitizes string input by trimming and removing dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates and sanitizes prompt title
 */
export function validatePromptTitle(title: string): string {
  const sanitized = sanitizeString(title);
  return validateData(promptTitleSchema, sanitized);
}

/**
 * Validates and sanitizes prompt content
 */
export function validatePromptContent(content: string): string {
  const sanitized = sanitizeString(content);
  return validateData(promptContentSchema, sanitized);
}

// Type exports
export type PromptInput = z.infer<typeof promptSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;