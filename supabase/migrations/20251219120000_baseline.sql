-- Baseline Migration: Consolidated Schema
-- Generated from audit of active database state
-- Date: 2025-12-19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Tables

CREATE TABLE public.users (
    id UUID NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    display_name TEXT
);

CREATE TABLE public.tags (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id)
);

CREATE TABLE public.prompts (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.prompt_contents (
    prompt_id UUID NOT NULL PRIMARY KEY REFERENCES public.prompts(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.prompt_tags (
    prompt_id UUID NOT NULL REFERENCES public.prompts(id),
    tag_id UUID NOT NULL REFERENCES public.tags(id),
    CONSTRAINT prompt_tags_pkey PRIMARY KEY (prompt_id, tag_id)
);

-- Indexes

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);
CREATE INDEX idx_users_username ON public.users USING btree (username);

CREATE UNIQUE INDEX tags_name_user_unique ON public.tags USING btree (name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX idx_tags_user_id ON public.tags USING btree (user_id);
CREATE INDEX idx_tags_name ON public.tags USING btree (name);
CREATE INDEX idx_tags_name_lower ON public.tags USING btree (lower(name));

CREATE INDEX idx_prompts_user_id ON public.prompts USING btree (user_id);
CREATE INDEX idx_prompts_is_public ON public.prompts USING btree (is_public);
CREATE INDEX idx_prompts_created_at ON public.prompts USING btree (created_at);
CREATE INDEX idx_prompts_user_updated ON public.prompts USING btree (user_id, updated_at DESC);
CREATE INDEX idx_prompts_public_id_desc ON public.prompts USING btree (is_public, id DESC) WHERE (is_public = true);
CREATE INDEX idx_prompts_user_id_desc ON public.prompts USING btree (user_id, id DESC) WHERE (user_id IS NOT NULL);

CREATE INDEX idx_prompt_tags_prompt_id ON public.prompt_tags USING btree (prompt_id);
CREATE INDEX idx_prompt_tags_tag_id ON public.prompt_tags USING btree (tag_id);
CREATE INDEX idx_prompt_tags_tag_prompt ON public.prompt_tags USING btree (tag_id, prompt_id);

-- Row Level Security & Policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Tags Policies
CREATE POLICY "Users can view all tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Users can insert their own tags" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON public.tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Prompts Policies
CREATE POLICY "Public prompts are viewable by everyone" ON public.prompts FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own private prompts" ON public.prompts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prompts" ON public.prompts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompts" ON public.prompts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompts" ON public.prompts FOR DELETE USING (auth.uid() = user_id);

-- Prompt Contents Policies
CREATE POLICY "Users can view content of public prompts or their own" ON public.prompt_contents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_contents.prompt_id AND (prompts.is_public = true OR prompts.user_id = auth.uid()))
);
CREATE POLICY "Users can insert content for their own prompts" ON public.prompt_contents FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_contents.prompt_id AND prompts.user_id = auth.uid())
);
CREATE POLICY "Users can update content for their own prompts" ON public.prompt_contents FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_contents.prompt_id AND prompts.user_id = auth.uid())
);
CREATE POLICY "Users can delete content for their own prompts" ON public.prompt_contents FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_contents.prompt_id AND prompts.user_id = auth.uid())
);

-- Prompt Tags Policies
CREATE POLICY "Users can view tags on public prompts or their own" ON public.prompt_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_tags.prompt_id AND (prompts.is_public = true OR prompts.user_id = auth.uid()))
);
CREATE POLICY "Users can insert tags for own prompts" ON public.prompt_tags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_tags.prompt_id AND prompts.user_id = auth.uid())
);
CREATE POLICY "Users can update tags for own prompts" ON public.prompt_tags FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_tags.prompt_id AND prompts.user_id = auth.uid())
);
CREATE POLICY "Users can delete tags for own prompts" ON public.prompt_tags FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.prompts WHERE prompts.id = prompt_tags.prompt_id AND prompts.user_id = auth.uid())
);
