/**
 * Zod schemas for prompt and related payloads.
 * Used at boundaries (e.g. before calling repository/mutations) for runtime validation.
 */

import { z } from 'zod';

/** Prompt title: optional, max 255 chars (empty => derived from content) */
export const promptTitleSchema = z.string().max(255).trim();

/** Prompt content: required, max 100_000 chars (body) */
export const promptContentSchema = z.string().min(1, 'Content is required').max(100_000);

/** Tags input: comma-separated string, max 500 chars total */
export const tagsInputSchema = z.string().max(500);

/** Save prompt payload (create or update) */
export const savePromptSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: promptTitleSchema,
  content: promptContentSchema,
  tagsInput: tagsInputSchema,
  isPublic: z.boolean(),
  userId: z.string().uuid(),
});

/** Delete prompt payload */
export const deletePromptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export type SavePromptInput = z.infer<typeof savePromptSchema>;
export type DeletePromptInput = z.infer<typeof deletePromptSchema>;
