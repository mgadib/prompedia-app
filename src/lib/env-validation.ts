import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid at runtime
 * Note: Supabase credentials are hardcoded in client.ts as per architecture decision
 */
const EnvSchema = z.object({
  MODE: z.enum(['development', 'production', 'test']),
  DEV: z.boolean(),
  PROD: z.boolean()
});

export type Env = z.infer<typeof EnvSchema>;

let validatedEnv: Env | null = null;

/**
 * Validates environment variables at startup
 * Call this at the entry point of your application
 * @throws Error if environment is invalid
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = EnvSchema.parse({
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD
    });

    if (import.meta.env.DEV) {
      console.log('✅ Environment validation passed');
    }
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      if (import.meta.env.DEV) {
        console.error('❌ Environment validation failed:', errorMessage);
      }
      
      throw new Error(`Invalid environment configuration: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 * Must call validateEnv() first
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    throw new Error('Environment not validated. Call validateEnv() first.');
  }
  return validatedEnv;
}


