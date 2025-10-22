-- =========================================
-- MIGRATION: Prompedia AI - Minimalist 3NF Schema
-- Description: Implements extreme minimalist database design
-- Date: October 22, 2025
-- =========================================

-- =========================================
-- BACKUP EXISTING TABLES (Safe Migration)
-- =========================================

-- Backup existing tables by renaming them
ALTER TABLE IF EXISTS public.profiles RENAME TO profiles_old;
ALTER TABLE IF EXISTS public.prompts RENAME TO prompts_old;
ALTER TABLE IF EXISTS public.tags RENAME TO tags_old;
ALTER TABLE IF EXISTS public.user_sessions RENAME TO user_sessions_old;
ALTER TABLE IF EXISTS public.ai_models RENAME TO ai_models_old;
ALTER TABLE IF EXISTS public.thinking_modes RENAME TO thinking_modes_old;

-- =========================================
-- CREATE NEW MINIMALIST SCHEMA
-- =========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum (if not exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================
-- CORE TABLES (Essential Business Logic)
-- =========================================

-- Users table (extends auth.users) - MINIMALIST
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    role user_role DEFAULT 'user',
    PRIMARY KEY (id)
);

-- Prompts table (main content) - MINIMALIST
CREATE TABLE public.prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    model TEXT,
    mode TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    original_prompt_id UUID REFERENCES public.prompts(id)
);

-- Tags table (system + user tags) - MINIMALIST
CREATE TABLE public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6b7280',
    is_system BOOLEAN DEFAULT FALSE
);

-- Prompt-Tag junction (many-to-many relationship)
CREATE TABLE public.prompt_tags (
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (prompt_id, tag_id)
);

-- =========================================
-- REFERENCE TABLES (Static Data) - MINIMALIST
-- =========================================

-- AI Models reference - SIMPLIFIED (no JSONB, no audit fields)
CREATE TABLE public.ai_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Text', 'Multimodal'))
);

-- Thinking modes reference - SIMPLIFIED (no JSONB, no redundant fields)
CREATE TABLE public.thinking_modes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL
);

-- =========================================
-- ANALYTICS TABLES (Optional) - SIMPLIFIED
-- =========================================

-- User sessions (simplified, no JSONB, no computed fields)
CREATE TABLE public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- =========================================
-- DATA MIGRATION FROM BACKUP TABLES
-- =========================================

-- Migrate user data (exclude JSONB preferences and audit fields)
INSERT INTO public.users (id, username, display_name, role)
SELECT
    id,
    username,
    display_name,
    role
FROM profiles_old
ON CONFLICT (id) DO NOTHING;

-- Migrate prompts (exclude JSONB, computed fields, audit fields)
INSERT INTO public.prompts (
    id, user_id, title, content, description, model, mode,
    color, is_public, is_featured, original_prompt_id
)
SELECT
    id, user_id, title, content, description, model, mode,
    color, is_public, is_featured, original_prompt_id
FROM prompts_old
ON CONFLICT (id) DO NOTHING;

-- Migrate tags (exclude computed fields, audit fields, created_by)
INSERT INTO public.tags (id, name, description, color, is_system)
SELECT
    id,
    name,
    description,
    color,
    is_system
FROM tags_old
ON CONFLICT (id) DO NOTHING;

-- Migrate user sessions (exclude JSONB session_data, computed duration)
INSERT INTO public.user_sessions (id, user_id, started_at, ended_at)
SELECT
    id,
    user_id,
    started_at,
    ended_at
FROM user_sessions_old
ON CONFLICT (id) DO NOTHING;

-- Migrate AI models (exclude JSONB capabilities, audit fields, is_active)
INSERT INTO public.ai_models (id, name, provider, type)
SELECT
    id,
    name,
    provider,
    type
FROM ai_models_old
ON CONFLICT (id) DO NOTHING;

-- Migrate thinking modes (exclude JSONB output_structure, redundant fields, audit fields)
INSERT INTO public.thinking_modes (id, name, icon, description, instructions)
SELECT
    id,
    name,
    icon,
    description,
    instructions
FROM thinking_modes_old
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- MIGRATE PROMPT-TAG RELATIONSHIPS
-- =========================================

-- Create tags from existing prompt tags array
INSERT INTO public.tags (name, description, color, is_system)
SELECT DISTINCT
    unnest(tags) as name,
    '' as description,
    '#6b7280' as color,
    false as is_system
FROM prompts_old
WHERE tags IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Create prompt-tag relationships from array data
INSERT INTO public.prompt_tags (prompt_id, tag_id)
SELECT p.id, t.id
FROM public.prompts p
CROSS JOIN LATERAL (
    SELECT id FROM public.tags
    WHERE name = ANY(p.old_tags)
) t;

-- Add temporary column to prompts for migration (will be dropped later)
ALTER TABLE public.prompts ADD COLUMN old_tags TEXT[];

-- Copy tags array data for migration
UPDATE public.prompts
SET old_tags = prompts_old.tags
FROM prompts_old
WHERE public.prompts.id = prompts_old.id;

-- =========================================
-- PERFORMANCE INDEXES
-- =========================================

-- Core performance indexes
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);

CREATE INDEX idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX idx_prompts_is_public ON public.prompts(is_public);
CREATE INDEX idx_prompts_is_featured ON public.prompts(is_featured);
CREATE INDEX idx_prompts_model ON public.prompts(model);
CREATE INDEX idx_prompts_mode ON public.prompts(mode);

CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_tags_is_system ON public.tags(is_system);

CREATE INDEX idx_prompt_tags_prompt_id ON public.prompt_tags(prompt_id);
CREATE INDEX idx_prompt_tags_tag_id ON public.prompt_tags(tag_id);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);

-- =========================================
-- ROW LEVEL SECURITY (Minimalist Policies)
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thinking_modes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Public prompts are viewable by everyone" ON public.prompts;
DROP POLICY IF EXISTS "Users can insert own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can update own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Users can delete own prompts" ON public.prompts;
DROP POLICY IF EXISTS "Everyone can view tags" ON public.tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update tags they created" ON public.tags;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Everyone can view ai models" ON public.ai_models;
DROP POLICY IF EXISTS "Everyone can view thinking modes" ON public.thinking_modes;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Prompts policies
CREATE POLICY "Public prompts are viewable by everyone" ON public.prompts
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own prompts" ON public.prompts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON public.prompts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON public.prompts
    FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Everyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update non-system tags" ON public.tags
    FOR UPDATE USING (is_system = false);

-- Prompt tags policies
CREATE POLICY "Everyone can view prompt tags" ON public.prompt_tags FOR SELECT USING (true);
CREATE POLICY "Users can manage tags for own prompts" ON public.prompt_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.prompts
            WHERE id = prompt_id AND user_id = auth.uid()
        )
    );

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reference data policies (read-only)
CREATE POLICY "Everyone can view AI models" ON public.ai_models FOR SELECT USING (true);
CREATE POLICY "Everyone can view thinking modes" ON public.thinking_modes FOR SELECT USING (true);

-- =========================================
-- FUNCTIONS & TRIGGERS
-- =========================================

-- Auto-create user profile function (updated for new schema)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, username, display_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'display_name'
    );
    RETURN NEW;
END;
$$;

-- Drop old triggers and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();

-- =========================================
-- VERIFICATION QUERIES (Remove after migration)
-- =========================================

-- Verification: Check migrated data counts
DO $$
DECLARE
    old_users_count INTEGER;
    new_users_count INTEGER;
    old_prompts_count INTEGER;
    new_prompts_count INTEGER;
    old_sessions_count INTEGER;
    new_sessions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_users_count FROM profiles_old;
    SELECT COUNT(*) INTO new_users_count FROM public.users;
    SELECT COUNT(*) INTO old_prompts_count FROM prompts_old;
    SELECT COUNT(*) INTO new_prompts_count FROM public.prompts;
    SELECT COUNT(*) INTO old_sessions_count FROM user_sessions_old;
    SELECT COUNT(*) INTO new_sessions_count FROM public.user_sessions;

    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE 'Users: % -> % (%.2f%%)', old_users_count, new_users_count,
        (new_users_count::FLOAT / GREATEST(old_users_count, 1)) * 100;
    RAISE NOTICE 'Prompts: % -> % (%.2f%%)', old_prompts_count, new_prompts_count,
        (new_prompts_count::FLOAT / GREATEST(old_prompts_count, 1)) * 100;
    RAISE NOTICE 'Sessions: % -> % (%.2f%%)', old_sessions_count, new_sessions_count,
        (new_sessions_count::FLOAT / GREATEST(old_sessions_count, 1)) * 100;
END $$;

-- =========================================
-- CLEANUP (Run manually after verification)
-- =========================================

-- Uncomment the following lines after successful verification:
-- DROP TABLE IF EXISTS profiles_old;
-- DROP TABLE IF EXISTS prompts_old;
-- DROP TABLE IF EXISTS tags_old;
-- DROP TABLE IF EXISTS user_sessions_old;
-- DROP TABLE IF EXISTS ai_models_old;
-- DROP TABLE IF EXISTS thinking_modes_old;
-- ALTER TABLE public.prompts DROP COLUMN IF EXISTS old_tags;

-- =========================================
-- MIGRATION COMPLETE
-- =========================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MINIMALIST 3NF MIGRATION COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'New schema is ready for use.';
    RAISE NOTICE 'Review verification results above.';
    RAISE NOTICE 'Run cleanup commands after testing.';
    RAISE NOTICE '========================================';
END $$;
