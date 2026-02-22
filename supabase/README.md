# Supabase

This folder contains versioned database migrations and project configuration for Prompedia.

## Migrations

- **20250129000000_baseline.sql** – Tables (`tags`, `prompts`, `prompt_contents`, `prompt_tags`, `users`), indexes, RLS policies, and trigger to sync `auth.users` to `public.users`.
- **20250129000001_search_functions.sql** – RPCs `search_prompts` and `search_public_prompts` for paginated search.
- **20250129000002_get_public_tag_counts.sql** – RPC `get_public_tag_counts` for server-side tag aggregation on public prompts.
- **20250222000000_security_hardening.sql** – REVOKE anon write operations, tags policy (auth.uid), handle_new_user search_path, REVOKE anon from search_prompts.
- **20250222000001_search_functions_hardening.sql** – search_prompts auth.uid() validation, pagination cap (max 100) for both search RPCs.

## Local development

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli).
2. From project root: `supabase start` (starts local Supabase and applies migrations).
3. Use the local URL and anon key in `.env` for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Applying migrations to a hosted project

- **Supabase Dashboard**: SQL Editor – run each migration file in order if you are setting up a new project.
- **Supabase CLI**: `supabase link --project-ref <ref>` then `supabase db push` to apply pending migrations.

## Rollback

Migrations are forward-only. To roll back, you must create a new migration that reverses the changes (e.g. drop functions, then tables in reverse order). Keep migrations small and reversible where possible.
