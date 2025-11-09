import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES } from '@/lib/constants';
import { sanitizeString } from '@/shared/validation/common';

/**
 * Prompt validation schemas
 * Lazy loaded to reduce initial bundle size
 */

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
}).refine(
  (data) => data.model || data.model_id, 
  { message: "Either model or model_id must be provided" }
).refine(
  (data) => data.mode || data.mode_id,
  { message: "Either mode or mode_id must be provided" }
);

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
    throw new Error('Prompt cannot be empty');
  }
  
  if (sanitized.length > VALIDATION.PROMPT.CONTENT_MAX_LENGTH) {
    throw new Error(`Prompt exceeds maximum length of ${VALIDATION.PROMPT.CONTENT_MAX_LENGTH}`);
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
  return promptTitleSchema.parse(sanitized);
}

/**
 * Memvalidasi dan menyucikan konten prompt
 * @param content - String konten yang akan divalidasi
 * @returns String konten yang sudah divalidasi dan disucikan
 * @throws ValidationError jika konten tidak valid
 */
export function validatePromptContent(content: string): string {
  const sanitized = sanitizeString(content);
  return promptContentSchema.parse(sanitized);
}

// Ekspor type untuk digunakan di tempat lain
export type PromptInput = z.infer<typeof promptSchema>;

