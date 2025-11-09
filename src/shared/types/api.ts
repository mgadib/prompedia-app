/**
 * Shared API response types
 * Used across all API interactions
 */

export interface ApiResponse<T = unknown> {
  data: T;
  error?: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface I18nOptions {
  [key: string]: string | number | boolean | null | undefined;
}

