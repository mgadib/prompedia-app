/**
 * Text utility functions for consistent string handling.
 */

const MAX_DESCRIPTION_LENGTH = 150;

/** Characters to strip from search/filter inputs to reduce injection risk */
const SEARCH_SANITIZE_REGEX = /[<>'"%;()&+]/g;

/** Characters to strip from tag filter input */
const TAG_SANITIZE_REGEX = /[<>'"%;()&+\\]/g;

/**
 * Truncate content to a maximum length for use as a description.
 * Appends "..." when truncated.
 */
export function truncateDescription(content: string): string {
  return content.length > MAX_DESCRIPTION_LENGTH
    ? `${content.substring(0, MAX_DESCRIPTION_LENGTH)}...`
    : content;
}

/**
 * Sanitize search/filter text before passing to RPC.
 * Strips characters that could affect query behavior.
 */
export function sanitizeSearchInput(value: string | null | undefined): string {
  if (value == null || typeof value !== 'string') return '';
  return value.replace(SEARCH_SANITIZE_REGEX, '').trim();
}

/**
 * Sanitize tag name/filter before passing to RPC.
 * Strips characters that could affect query behavior.
 */
export function sanitizeTagInput(value: string | null | undefined): string {
  if (value == null || typeof value !== 'string') return '';
  return value.replace(TAG_SANITIZE_REGEX, '').trim();
}
