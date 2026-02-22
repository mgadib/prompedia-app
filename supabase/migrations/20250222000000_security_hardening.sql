-- Security hardening migration
-- REVOKE anon write operations, handle_new_user search_path, tags policy

-- ============================================
-- 1. REVOKE anon dari INSERT/UPDATE/DELETE
--    (SELECT tetap untuk public read via RLS)
-- ============================================
REVOKE INSERT, UPDATE, DELETE ON TABLE public.tags FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.prompts FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.prompt_contents FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.prompt_tags FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.users FROM anon;

-- Pastikan authenticated punya full access (RLS filter)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prompts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prompt_contents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prompt_tags TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.users TO authenticated;

-- ============================================
-- 2. REVOKE anon dari search_prompts (private data)
--    search_public_prompts & get_public_tag_counts tetap untuk anon
-- ============================================
REVOKE EXECUTE ON FUNCTION public.search_prompts(uuid, text, text, text, int, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_prompts(uuid, text, text, text, int, int) TO authenticated;

-- ============================================
-- 3. Tags insert - ganti auth.role() dengan auth.uid()
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert tags" ON public.tags;
CREATE POLICY "Authenticated insert tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 4. handle_new_user - SET search_path
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'email', split_part(NEW.email, '@', 1), 'user'),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
