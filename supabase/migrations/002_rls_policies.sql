-- Prompedia AI RLS Policies
-- Migration: 002_rls_policies
-- Description: Implements Row Level Security policies for data access control

-- ========================================
-- PROFILES POLICIES
-- ========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for new user registration)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable public read access for profiles (for displaying usernames in prompts)
CREATE POLICY "Anyone can view profiles" ON public.profiles
    FOR SELECT USING (true);

-- ========================================
-- PROMPTS POLICIES
-- ========================================

-- Users can view their own prompts
CREATE POLICY "Users can view own prompts" ON public.prompts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own prompts
CREATE POLICY "Users can insert own prompts" ON public.prompts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own prompts
CREATE POLICY "Users can update own prompts" ON public.prompts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own prompts
CREATE POLICY "Users can delete own prompts" ON public.prompts
    FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view public prompts
CREATE POLICY "Anyone can view public prompts" ON public.prompts
    FOR SELECT USING (is_public = true);

-- Authenticated users can view featured prompts
CREATE POLICY "Authenticated users can view featured prompts" ON public.prompts
    FOR SELECT USING (is_featured = true);

-- Users can view prompts they've forked (original_prompt_id references)
CREATE POLICY "Users can view forked prompts" ON public.prompts
    FOR SELECT USING (
        original_prompt_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.prompts p
            WHERE p.id = public.prompts.original_prompt_id
            AND (p.is_public = true OR p.user_id = auth.uid())
        )
    );

-- ========================================
-- TAGS POLICIES
-- ========================================

-- Anyone can view tags (for search and filtering)
CREATE POLICY "Anyone can view tags" ON public.tags
    FOR SELECT USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update tags they created (but not system tags)
CREATE POLICY "Users can update own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = created_by AND is_system = false);

-- Users can delete tags they created (but not system tags)
CREATE POLICY "Users can delete own tags" ON public.tags
    FOR DELETE USING (auth.uid() = created_by AND is_system = false);

-- System tags are read-only for everyone (including creators)
CREATE POLICY "System tags are read-only" ON public.tags
    FOR UPDATE USING (is_system = false);

-- ========================================
-- USER SESSIONS POLICIES
-- ========================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can view all sessions (for analytics)
CREATE POLICY "Service role can view all sessions" ON public.user_sessions
    FOR SELECT USING (current_setting('role') = 'service_role');

-- ========================================
-- REFERENCE DATA POLICIES (READ-ONLY)
-- ========================================

-- AI Models: Read-only for everyone (reference data)
CREATE POLICY "Anyone can view AI models" ON public.ai_models
    FOR SELECT USING (true);

-- Thinking Modes: Read-only for everyone (reference data)
CREATE POLICY "Anyone can view thinking modes" ON public.thinking_modes
    FOR SELECT USING (true);

-- ========================================
-- STORAGE POLICIES
-- ========================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-assets', 'prompt-assets', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prompt-assets bucket (private)
CREATE POLICY "Users can upload own assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'prompt-assets'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view own assets" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'prompt-assets'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'prompt-assets'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'prompt-assets'
        AND auth.role() = 'authenticated'
    );

-- Storage policies for avatars bucket (public read, authenticated write)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );
