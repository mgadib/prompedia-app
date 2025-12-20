-- Sync with Cloud Migration 20251219132432

-- Enable pg_trgm for GIN indexes
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";

-- Add missing GIN and Trigram indexes
CREATE INDEX IF NOT EXISTS idx_prompt_contents_body_trgm ON public.prompt_contents USING gin (body gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_title_search ON public.prompts USING gin (to_tsvector('english'::regconfig, title));
CREATE INDEX IF NOT EXISTS idx_prompts_title_trgm ON public.prompts USING gin (title gin_trgm_ops);

-- Add missing B-Tree indexes found in cloud
CREATE INDEX IF NOT EXISTS idx_prompts_public_created ON public.prompts USING btree (created_at DESC) WHERE (is_public = true);
CREATE INDEX IF NOT EXISTS idx_prompts_user_created ON public.prompts USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_user_public ON public.prompts USING btree (user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON public.prompts USING btree (updated_at DESC);

-- Add missing unique index on tags
CREATE UNIQUE INDEX IF NOT EXISTS tags_user_id_name_key ON public.tags USING btree (user_id, name);

-- Drop index present locally but absent in cloud (redundant / replaced by composite)
DROP INDEX IF EXISTS idx_prompts_is_public;
