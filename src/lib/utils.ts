import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** UUID v4 validation for route params and IDs */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isValidUUID(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Strip markdown syntax to plain text for meta descriptions and snippets.
 * Removes headers, bold/italic, code blocks, links, lists, blockquotes.
 */
export function stripMarkdownToPlainText(markdown: string): string {
  if (!markdown?.trim()) return '';
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^>\s+/gm, ' ')
    .replace(/^[-*]\s+/gm, ' ')
    .replace(/^\d+\.\s+/gm, ' ')
    .replace(/^---+\s*$/gm, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

/**
 * Truncate plain text to maxLength at word boundary for meta description.
 */
export function truncateForMeta(text: string, maxLength = 155): string {
  if (!text?.trim()) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  return lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
}
