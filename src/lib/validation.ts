import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES } from './constants';

/**
 * Schema validasi dan utilitas
 * Logika validasi terpusat menggunakan Zod untuk type safety
 */

// Schema dasar
export const emailSchema = z
  .string()
  .email(ERROR_MESSAGES.AUTH.LOGIN_FAILED)
  .min(1, 'Email wajib diisi');

export const passwordSchema = z
  .string()
  .min(VALIDATION.USER.PASSWORD_MIN_LENGTH, `Password minimal ${VALIDATION.USER.PASSWORD_MIN_LENGTH} karakter`);

// Schema validasi untuk prompt
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

// Schema prompt lengkap (diperbarui untuk database minimalis)
export const promptSchema = z.object({
  id: z.string().uuid().optional(),
  title: promptTitleSchema,
  content: promptContentSchema,
  
  // Mendukung field lama dan baru untuk backward compatibility
  model: z.string().optional(),
  model_id: z.string().optional(),
  mode: z.enum(['meta-prompt', 'thinking', 'normal']).optional().default('normal'),
  mode_id: z.string().optional(),
  
  color: z.string().default('#3b82f6'),
  is_public: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  description: z.string().nullable().optional(),
  original_prompt_id: z.string().uuid().nullable().optional(),
  user_id: z.string().optional(),
  // Catatan: tag sekarang ditangani melalui tabel prompt_tags (junction table)
  // created_at dan updated_at tidak disimpan dalam schema minimalis
}).refine(
  (data) => data.model || data.model_id, 
  { message: "Either model or model_id must be provided" }
).refine(
  (data) => data.mode || data.mode_id,
  { message: "Either mode or mode_id must be provided" }
);

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

// Schema user (diperbarui untuk database minimalis)
// Note: role field removed - user_roles table tidak digunakan di aplikasi
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1, 'Username wajib diisi').max(50, 'Username terlalu panjang'),
  display_name: z.string().min(1, 'Nama tampilan wajib diisi').max(100, 'Nama terlalu panjang'),
  // role field removed - tidak ada lagi di database
});

// Fungsi utilitas validasi
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
      error: new ValidationError(ERROR_MESSAGES.VALIDATION) 
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
    throw new ValidationError(`Input exceeds maximum length of ${maxLength}`);
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

/**
 * Memvalidasi dan menyucikan input prompt AI dengan keamanan yang ditingkatkan
 * Menggabungkan sanitization dan validasi khusus untuk input AI
 * @param prompt - String prompt yang akan divalidasi
 * @returns String prompt yang sudah divalidasi dan disucikan
 * @throws ValidationError jika prompt kosong atau melebihi batas panjang
 */
export function validateAIPromptInput(prompt: string): string {
  const sanitized = sanitizeString(prompt, VALIDATION.PROMPT.CONTENT_MAX_LENGTH);
  
  // Pengecekan tambahan khusus untuk input AI
  if (sanitized.length < 1) {
    throw new ValidationError('Prompt cannot be empty');
  }
  
  if (sanitized.length > VALIDATION.PROMPT.CONTENT_MAX_LENGTH) {
    throw new ValidationError(`Prompt exceeds maximum length of ${VALIDATION.PROMPT.CONTENT_MAX_LENGTH}`);
  }
  
  return sanitized;
}

/**
 * Memvalidasi dan menyucikan judul prompt
 * @param title - String judul yang akan divalidasi
 * @returns String judul yang sudah divalidasi dan disucikan
 * @throws ValidationError jika judul tidak valid
 */
export function validatePromptTitle(title: string): string {
  const sanitized = sanitizeString(title);
  return validateData(promptTitleSchema, sanitized);
}

/**
 * Memvalidasi dan menyucikan konten prompt
 * @param content - String konten yang akan divalidasi
 * @returns String konten yang sudah divalidasi dan disucikan
 * @throws ValidationError jika konten tidak valid
 */
export function validatePromptContent(content: string): string {
  const sanitized = sanitizeString(content);
  return validateData(promptContentSchema, sanitized);
}

// Ekspor type untuk digunakan di tempat lain
export type PromptInput = z.infer<typeof promptSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;