/**
 * Application Constants
 * Centralized configuration values following DRY principle
 */

// Application Configuration
export const APP_CONFIG = {
  NAME: 'Prompedia AI',
  DESCRIPTION: 'Prompt Engineering Laboratory',
  VERSION: '1.0.0',
  // Rate limiting configuration
  RATE_LIMITS: {
    GUEST_DAILY_LIMIT: 7,     // Guest users: 7 AI calls
    AUTH_DAILY_LIMIT: 27,     // Authenticated users: 27 AI calls per day
    RESET_HOUR_GMT7: 17,      // Reset at 00:00 GMT+7 (17:00 UTC)
  },
  TIMEZONE: 'Asia/Jakarta',   // GMT+7 timezone
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'prompedia_user',
  PROMPTS: 'prompedia_prompts',
  CURRENT_PROMPT: 'prompedia_current_prompt',
  PLAYGROUND_COUNT: 'prompedia_playground_count',
  GUEST_USAGE: 'prompedia_guest_usage',  // Track guest usage locally
  THEME: 'prompedia_theme',
  // Note: PREFERENCES removed - preferences field eliminated from database schema
} as const;

// UI Constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: {
    EXPANDED: 256, // 16rem
    COLLAPSED: 64,  // 4rem
  },
  DEBOUNCE_DELAY: 500, // Auto-save debounce delay in ms
  TOAST_DURATION: 3000, // Toast notification duration
  ANIMATION_DURATION: 300, // Standard animation duration
} as const;

// Validation Rules
export const VALIDATION = {
  PROMPT: {
    TITLE_MIN_LENGTH: 1,
    TITLE_MAX_LENGTH: 100,
    CONTENT_MAX_LENGTH: 50000,
    TAGS_MAX_COUNT: 10,
    TAG_MAX_LENGTH: 30,
  },
  USER: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 8,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Koneksi jaringan bermasalah. Silakan coba lagi.',
  UNAUTHORIZED: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
  NOT_FOUND: 'Data yang dicari tidak ditemukan.',
  VALIDATION: 'Data yang dimasukkan tidak valid.',
  GENERIC: 'Terjadi kesalahan yang tidak terduga.',
  PROMPT: {
    SAVE_FAILED: 'Gagal menyimpan prompt',
    DELETE_FAILED: 'Gagal menghapus prompt',
    LOAD_FAILED: 'Gagal memuat prompt',
    TITLE_REQUIRED: 'Judul prompt wajib diisi',
    TITLE_TOO_LONG: `Judul prompt maksimal ${VALIDATION.PROMPT.TITLE_MAX_LENGTH} karakter`,
    CONTENT_TOO_LONG: `Konten prompt maksimal ${VALIDATION.PROMPT.CONTENT_MAX_LENGTH} karakter`,
  },
  AUTH: {
    LOGIN_FAILED: 'Gagal masuk. Periksa email dan password Anda.',
    LOGOUT_FAILED: 'Gagal keluar dari akun.',
    SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROMPT: {
    SAVED: 'Prompt berhasil disimpan',
    DELETED: 'Prompt berhasil dihapus',
    COPIED: 'Prompt berhasil disalin',
    CREATED: 'Prompt berhasil dibuat',
  },
  AUTH: {
    LOGIN_SUCCESS: 'Berhasil masuk ke akun',
    LOGOUT_SUCCESS: 'Berhasil keluar dari akun',
  },
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_ANALYTICS: false,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_COLLABORATION: false,
  ENABLE_EXPORT: true,
  ENABLE_IMPORT: true,
} as const;

// Environment-specific constants
export const ENV = {
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  SITE_TITLE: import.meta.env.VITE_SITE_TITLE || 'Prompedia.app - Prompt Engineering Laboratory',
} as const;

// Type exports for better TypeScript support
export type StorageKey = keyof typeof STORAGE_KEYS;
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;