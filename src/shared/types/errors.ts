/**
 * Shared error types
 * Standardized error handling across the application
 */

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  field?: string;
}

export interface ValidationError extends AppError {
  field: string;
  code: string;
}

export interface ServiceError extends AppError {
  service: string;
  operation: string;
}

export interface StorageError extends AppError {
  operation: string;
  key?: string;
}

export type ErrorHandler = (error: AppError) => void;

