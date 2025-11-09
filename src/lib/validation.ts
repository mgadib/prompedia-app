/**
 * @deprecated This file is being split by feature.
 * 
 * For prompt validation, use: @/features/prompts/validation/prompt-schemas
 * For auth validation, use: @/features/auth/validation/auth-schemas
 * For common utilities, use: @/shared/validation/common
 * 
 * This file is kept for backward compatibility and will be removed in a future version.
 */

// Re-export from new locations for backward compatibility
export { 
  validateData, 
  safeValidate, 
  sanitizeString,
  isValidEmail,
  isValidPassword,
  ValidationError,
  userProfileSchema,
  type UserProfile
} from '@/shared/validation/common';

export {
  promptSchema,
  promptTitleSchema,
  promptContentSchema,
  promptTagSchema,
  promptTagsSchema,
  validateAIPromptInput,
  validatePromptTitle,
  validatePromptContent,
  type PromptInput
} from '@/features/prompts/validation/prompt-schemas';

export {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput
} from '@/features/auth/validation/auth-schemas';
